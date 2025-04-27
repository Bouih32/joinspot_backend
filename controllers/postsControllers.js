const prisma = require("../utils/client");
const { createNotification } = require("../utils/notification");

const createPost = async (req, res) => {
  try {
    const { bannerPic, description, categoryId, tags } = req.body;
    const newPost = await prisma.post.create({
      data: {
        bannerPic,
        description,
        category: { connect: { categoryId: categoryId } },
        user: { connect: { userId: req.user.userId } },
      },
    });

    const tagsArray = tags.split("-");

    await Promise.all(
      tagsArray.map((tag) =>
        prisma.postTags.create({
          data: {
            post: {
              connect: {
                postId: newPost.postId,
              },
            },
            tag: {
              connect: {
                tagId: tag,
              },
            },
          },
        })
      )
    );
    return res.status(201).json({ message: "Post created successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to create post", error: error.message });
  }
};

const addTagToPost = async (req, res) => {
  try {
    const { tagIds } = req.body;
    console.log(tagIds, "tagids");
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        message: "Tags must be an array and not empty",
        received: req.body,
      });
    }

    const existingPostTags = await prisma.postTags.findMany({
      where: {
        postId: req.params.postId,
        tagId: { in: tagIds },
      },
    });

    if (existingPostTags.length > 0) {
      return res.status(400).json({
        message: "Tags already exist",
      });
    }
    const newPostTags = tagIds.filter(
      (id) => !existingPostTags.some((tag) => tag.tagId === id)
    );
    const postTags = await prisma.postTags.createMany({
      data: newPostTags.map((tagId) => ({
        postId: req.params.postId,
        tagId,
      })),
    });
    if (postTags.length === 0) {
      return res.status(404).json({ message: "Tags not found" });
    }

    return res
      .status(200)
      .json({ message: "Tags added to activity", postTags });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to add tags to activity",
      error: error.message,
    });
  }
};

const getPosts = async (req, res) => {
  try {
    const { category, search = "", page = 1, my, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filters = {
      ...(search && {
        OR: [
          { user: { userName: { contains: search, mode: "insensitive" } } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && { category: { categoryName: category } }),
      ...(my === "own" ? { userId: req.user.userId } : {}),
    };

    const data = await prisma.post.findMany({
      take: my !== "save" ? limit : undefined,
      skip: my !== "save" ? skip : undefined,
      orderBy: { createdAt: "desc" },
      where: filters,
      include: {
        category: {
          select: {
            categoryName: true,
          },
        },
        user: {
          select: {
            userName: true,
            avatar: true,
            userId: true,
          },
        },
        _count: {
          select: {
            comment: true,
          },
        },
        comment: {
          // <-- This gets the actual comments
          select: {
            content: true,
            createdAt: true,
            user: {
              // Commenter's info
              select: {
                userName: true,
                avatar: true,
                userId: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc", // You can order comments oldest to newest
          },
        },
        postTags: {
          select: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      return res.status(404).json({ message: "No posts found" });
    }

    return res.json({ data });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch posts", error: error.message });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        category: {
          select: {
            categoryName: true,
          },
        },
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comment: true,
            savePost: true,
          },
        },
        share: {
          include: {
            user: {
              select: {
                userName: true,
                avatar: true,
              },
            },
            activity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }
    return res.json({ message: "My posts fetched successfully", posts });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch my posts", error: error.message });
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const user = await prisma.post.findFirst({
      where: { userId: req.params.userId },
    });
    if (!user) {
      return res.status(400).json({ message: "User not provided" });
    }
    const posts = await prisma.post.findMany({
      where: {
        userId: req.params.userId,
      },
      include: {
        category: {
          select: {
            categoryName: true,
          },
        },
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comment: true,
            savePost: true,
          },
        },
        share: {
          include: {
            user: {
              select: {
                userName: true,
                avatar: true,
              },
            },
            activity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }
    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: {
        postId: req.params.id,
      },
      include: {
        category: {
          select: {
            categoryName: true,
          },
        },
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
        comment: {
          include: {
            user: {
              select: {
                userName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comment: true,
            share: true,
          },
        },
      },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.json({ message: "Post retrieved successfully", post });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch post", error: error.message });
  }
};

const getPostByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await prisma.post.findMany({
      where: {
        categoryId: id,
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    if (posts.length == 0) {
      return res.status(404).json({ message: "No post found" });
    }
    return res
      .status(200)
      .json({ message: "posts fetched successfully", posts });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch post by category",
      error: error.message,
    });
  }
};

const getPostBytags = async (req, res) => {
  try {
    const { tagIds } = req.body;
    const existingTags = await prisma.tag.findMany({
      where: {
        tagId: {
          in: tagIds,
        },
      },
    });
    if (existingTags.length === 0) {
      return res.status(400).json({ message: "Some tags do not exist" });
    }
    const posts = await prisma.post.findMany({
      where: {
        postTags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    return res
      .status(200)
      .json({ message: "post fetched successfully", posts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to fetch post by tags",
      error: error.message,
    });
  }
};

const getMyPost = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    if (posts.length === 0) {
      return res.status(404).json({ message: "No post found" });
    }
    return res
      .status(200)
      .json({ message: "post fetched successfully", posts });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch post",
      error: error.message,
    });
  }
};

const deletePostTag = async (req, res) => {
  try {
    const { tagIds } = req.body;
    if (!Array.isArray(tagIds)) {
      return res.status(400).json({ message: "Tags must be an array" });
    }

    const postTags = await prisma.postTags.findMany({
      where: {
        postId: req.params.postId,
        tagId: {
          in: tagIds,
        },
      },
    });
    if (postTags.length === 0) {
      return res.status(404).json({ message: "Tags not found" });
    }
    await prisma.postTags.deleteMany({
      where: {
        postId: req.params.postId,
        tagId: {
          in: tagIds,
        },
      },
    });
    return res
      .status(200)
      .json({ message: "Tags deleted from post", postTags });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to delete tags from post",
      error: error.message,
    });
  }
};

const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const postAndLike = await prisma.post.findFirst({
      where: { postId },
      include: {
        likes: {
          where: { userId },
          select: { likesId: true },
        },
      },
    });

    if (!postAndLike) {
      return res.status(404).json({ message: "Post not found" });
    }

    const hasLiked = postAndLike.likes.length > 0;

    if (hasLiked) {
      await prisma.$transaction([
        prisma.likes.delete({
          where: { likesId: postAndLike.likes[0].likesId },
        }),
        prisma.post.update({
          where: { postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.likes.create({
          data: { userId, postId },
        }),
        prisma.post.update({
          where: { postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
    }

    return res.status(200).json({ message: "Post liked successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to like post",
      error: error.message,
    });
  }
};

const getUserLikes = async (req, res) => {
  try {
    const likes = await prisma.likes.findMany({
      where: {
        userId: req.user.userId,
      },
    });
    if (!likes) {
      return res.status(404).json({ message: "No likes" });
    }

    const likeIds = likes.map((ele) => ele.likesId);

    return res
      .status(200)
      .json({ message: "Post liked successfully", likeIds });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to like post",
      error: error.message,
    });
  }
};

const unlikePost = async (req, res) => {
  try {
    const like = await prisma.likes.findFirst({
      where: {
        userId: req.user.userId,
        postId: req.params.postId,
      },
    });
    if (!like) {
      return res.status(404).json({ message: "You have not liked this post" });
    }
    await prisma.likes.delete({
      where: {
        likesId: like.likesId,
      },
    });
    return res.status(404).json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to unlike post",
      error: error.message,
    });
  }
};

const addcomment = async (req, res) => {
  try {
    const { content } = req.body;
    await prisma.comment.create({
      data: {
        userId: req.user.userId,
        postId: req.params.postId,
        content: content,
      },
    });
    return res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to add comment", error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await prisma.comment.findFirst({
      where: { commentId: commentId },
    });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    await prisma.comment.delete({
      where: { commentId: commentId },
    });
    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await prisma.post.findFirst({
      where: { postId },
    });
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }
    const savedPost = await prisma.savePost.create({
      data: {
        userId: req.user.userId,
        postId,
      },
    });
    return res
      .status(201)
      .json({ message: "post saved successfully", savedPost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to save activity",
      error: error.message,
    });
  }
};

const getSavedPost = async (req, res) => {
  try {
    const savedPost = await prisma.savePost.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        post: {
          include: {
            category: {
              select: {
                categoryName: true,
              },
            },
            user: {
              select: {
                userName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comment: true,
                share: true,
              },
            },
          },
        },
      },
    });
    if (savedPost.length === 0) {
      return res.status(404).json({ message: "No saved post found" });
    }
    return res.status(200).json({
      message: "Saved post fetched successfully",
      savedPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch saved posts",
      error: error.message,
    });
  }
};

const unSavePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const savedpost = await prisma.savePost.findFirst({
      where: {
        userId: req.user.userId,
        postId,
      },
    });
    if (!savedpost) {
      return res.status(404).json({ message: "Saved post not found" });
    }
    await prisma.savePost.delete({
      where: {
        savePostId: savedpost.savePostId,
      },
    });
    return res
      .status(200)
      .json({ message: "Saved post deleted successfully", savedpost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete saved post",
      error: error.message,
    });
  }
};

const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { postId },
      include: {
        user: {
          select: {
            userName: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post non trouvé",
      });
    }

    // Construire l'URL de base du frontend
    const baseUrl = process.env.FRONTEND_URL || "https://www.joinspots.com";
    const postUrl = `${baseUrl}/post/${postId}`;

    // Générer les liens de partage pour différents réseaux sociaux
    const shareLinks = {
      post_url: postUrl,
      social_links: {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          postUrl
        )}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          postUrl
        )}&text=${encodeURIComponent(
          `Découvrez ce post de ${post.user.userName} sur JoinSpots!`
        )}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          postUrl
        )}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Découvrez ce post sur JoinSpots: ${postUrl}`
        )}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(
          postUrl
        )}&text=${encodeURIComponent(
          `Découvrez ce post de ${post.user.userName} sur JoinSpots!`
        )}`,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Liens de partage générés avec succès",
      data: shareLinks,
    });
  } catch (error) {
    console.error("Erreur lors de la génération des liens de partage:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la génération des liens de partage",
      error: error.message,
    });
  }
};

const repportPost = async (req, res) => {
  try {
    const { description } = req.body;
    const post = await prisma.post.findFirst({
      where: { postId: req.params.postId },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const existingRepport = await prisma.repportPost.findFirst({
      where: {
        userId: req.user.userId,
        postId: req.params.postId,
      },
    });
    if (existingRepport) {
      return res
        .status(400)
        .json({ message: "Activity report already submitted" });
    }
    const repportPost = await prisma.repportPost.create({
      data: {
        description,
        userId: req.user.userId,
        postId: req.params.postId,
        status: "pending",
      },
    });
    return res
      .status(201)
      .json({ message: "Rapport d'activité envoyé", repportPost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to report post",
      error: error.message,
    });
  }
};

const getrepportedPost = async (req, res) => {
  try {
    const repportsPost = await prisma.repportPost.findMany({
      include: {
        post: true,
      },
    });
    if (repportsPost.length === 0) {
      return res.status(404).json({ message: "No reports found" });
    }
    return res.status(200).json({
      message: "Reports fetched successfully",
      repportsPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch reports",
      error: error.message,
    });
  }
};

const checkrepportedPost = async (req, res) => {
  try {
    const repport = await prisma.repportPost.findFirst({
      where: {
        repportPostId: req.params.repportPostId,
        status: "repport",
      },
    });
    if (!repport) {
      return res.status(404).json({ message: "Report not found" });
    }
    await prisma.repportPost.update({
      where: {
        repportPostId: req.params.repportPostId,
      },
      data: {
        status: "checked",
      },
    });
    return res
      .status(200)
      .json({ message: "Report status updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update report status",
      error: error.message,
    });
  }
};

const shareActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { description } = req.body;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
      include: {
        category: true,
      },
    });
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: {
        userName: true,
        avatar: true,
      },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    const post = await prisma.post.create({
      data: {
        description: description,
        bannerPic: activity.coverPic,
        category: {
          connect: {
            categoryId: activity.categoryId,
          },
        },
        user: {
          connect: {
            userId: req.user.userId,
          },
        },
      },
    });

    const share = await prisma.share.create({
      data: {
        userId: req.user.userId,
        activityId: activityId,
        postId: post.postId,
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        activity: true,
        post: true,
      },
    });
    if (share) {
      await createNotification(
        req.user.userId,
        activity.userId,
        `${user.userName} shared your activity ${activity.title}`
      );
    }
    return res.status(201).json({
      success: true,
      message: "Activity shared successfully",
      share,
    });
  } catch (error) {
    console.error("Erreur lors du partage de l'activité:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du partage de l'activité",
      message: error.message,
    });
  }
};

module.exports = {
  createPost,
  addTagToPost,
  getPosts,
  getMyPosts,
  getPostsByUser,
  getPostById,
  getPostByCategory,
  getPostBytags,
  getMyPost,
  deletePostTag,
  savePost,
  getSavedPost,
  unSavePost,
  likePost,
  unlikePost,
  addcomment,
  deleteComment,
  shareActivity,
  repportPost,
  getrepportedPost,
  checkrepportedPost,
  sharePost,
  getUserLikes,
};
