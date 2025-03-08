const prisma = require("../utils/client");
const { createNotification } = require("../utils/notification");

const createPost = async (req, res) => {
  try {
    const { bannerPic, description, categoryId } = req.body;
    const newPost = await prisma.post.create({
      data: {
        bannerPic,
        description,
        category: { connect: { categoryId: categoryId } },
        user: { connect: { userId: req.user.userId } },
      },
    });
    return res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
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
    const posts = await prisma.post.findMany({
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
      orderBy: { createdAt: "desc" },
    });
    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }
    return res.json({ message: "Posts fetched successfully", posts });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch posts", error: error.message });
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
        comments: {
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
    const post = await prisma.post.findFirst({
      where: { postId: req.params.postId },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const like = await prisma.likes.findFirst({
      where: {
        userId: req.user.userId,
        postId: req.params.postId,
      },
    });
    if (like) {
      return res
        .status(400)
        .json({ message: "You have already liked this post" });
    }
    await prisma.likes.create({
      data: { userId: req.user.userId, postId: req.params.postId },
    });
    return res.status(200).json({ message: "Post liked successfully" });
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
    const { comment } = req.body;
    const comments = await prisma.comment.create({
      data: {
        userId: req.user.userId,
        postId: req.params.postId,
        content: comment,
      },
    });
    return res
      .status(201)
      .json({ message: "Comment added successfully", comments });
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

const shareActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
      include: {
        category: true
      }
    });
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: {
        userName: true,
        avatar: true
      }
    });

    if (!activity) {
      return res.status(404).json({ 
        success: false,
        message: "Activity not found" 
      });
    }

    // Créer le post
    const post = await prisma.post.create({
      data: {
        description: `Partage de l'activité: ${activity.title}`,
        bannerPic: activity.coverPic,
        category: {
          connect: {
            categoryId: activity.categoryId
          }
        },
        user: {
          connect: {
            userId: req.user.userId
          }
        }
      }
    });

    // Créer l'entrée dans la table share
    const share = await prisma.share.create({
      data: {
        userId: req.user.userId,
        activityId: activityId,
        postId: post.postId
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true
          }
        },
        activity: true,
        post: true
      }
    });
    if (share) {
      await createNotification(
        req.user.userId,
        activity.userId,
        `${user.userName} a partagé une activité avec vous ${activity.title}`
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
      message: error.message
    });
  }
};

module.exports = {
  createPost,
  addTagToPost,
  getPosts,
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
};
