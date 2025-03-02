const prisma = require("../utils/client");

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
        .json({ message: "posts fetched successfully", activities });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch post by category",
        error: error.message,
      });
    }
  };

module.exports = {
  createPost,
  addTagToPost,
  getPosts,
  getPostById,
  getPostByCategory
};
