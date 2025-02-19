const prisma = require("../utils/client");

// Categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
    });
    if (categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }
    return res.status(200).json({ categories });
  } catch (err) {
    return res.status(500).json({ message: "Error", error: err.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { categoryId: id },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    } else {
      return res
        .status(200)
        .json({ message: "Category retrieved successfully", data: category });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

const getDeletedCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: { not: null },
      },
    });

    if (categories.length === 0) {
      return res.status(404).json({ message: "No deleted categories found" });
    }

    return res.status(200).json({
      message: "Deleted categories retrieved successfully",
      categories,
    });
  } catch (err) {
    console.error("Error retrieving deleted categories:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { categoryName, icon } = req.body;
    const existedcategory = await prisma.category.findUnique({
      where: { categoryName },
    });
    if (existedcategory) {
      return res.status(400).json({ message: "Category already exists" });
    }
    const category = await prisma.category.create({
      data: { categoryName, icon, deletedAt: null },
    });
    return res.status(201).json({ message: "Category created", category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, icon } = req.body;
    const category = await prisma.category.findUnique({
      where: { categoryId: id },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await prisma.category.update({
      where: { categoryId: id },
      data: { categoryName, icon },
    });
    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const tags = await prisma.tag.findMany({
      where: { categoryId: id },
    });

    await prisma.category.update({
      where: {
        categoryId: id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (tags.length > 0) {
      await Promise.all(
        tags.map((tag) =>
          prisma.tag.update({
            where: { tagId: tag.tagId },
            data: { deletedAt: new Date() },
          })
        )
      );
    }

    return res.status(200).send({ message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: {
        categoryId: id,
        deletedAt: { not: null },
      },
    });
    if (category === 0) {
      return res
        .status(404)
        .json({ message: "Category not found in deleted state" });
    }
    await prisma.category.update({
      where: {
        categoryId: id,
      },
      data: {
        deletedAt: null,
      },
    });

    await Promise.all(
      tags.map((tag) =>
        prisma.tag.update({
          where: { tagId: tag.tagId },
          data: { deletedAt: null },
        })
      )
    );
    return res.status(200).json({ message: "Category restored" });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};
// Tags
const addTag = async (req, res) => {
  try {
    const { tagName, categoryId } = req.body;
    const existedTag = await prisma.tag.findUnique({
      where: { tagName },
    });
    if (existedTag) {
      return res.status(400).json({ message: "Tag already exists" });
    }

    const category = await prisma.category.findUnique({
      where: { categoryId },
    });

    if (!category) {
      return res.status(404).json({ message: "Category does not exists" });
    }

    const tag = await prisma.tag.create({
      data: {
        tagName,
        categoryId,
        deletedAt: null,
      },
    });
    return res
      .status(200)
      .json({ message: "Tag added successfully", data: tag });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to add tag", error: error.message });
  }
};

const getTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { deletedAt: null },
    });

    if (tags.length === 0)
      return res.status(404).send({ message: "No tag found" });
    return res
      .status(200)
      .json({ message: "Tags retrieved successfully", data: tags });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to retrieve tags", error: error.message });
  }
};

const getTagsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const tags = await prisma.tag.findMany({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });
    if (tags.length ===0) {
      return res.status(404).json({ message: "Tags not found" });
    }
    return res
      .status(200)
      .json({ message: "Tags retrieved successfully", data: tags });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to retrieve tags", error: error.message });
  }
};

const getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({
      where: {
        tagId: id,
      },
    });
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }
    return res
      .status(200)
      .json({ message: "Tag retrieved successfully", data: tag });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to retrieve tag", error: error.message });
  }
};

const getDeletedTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        deletedAt: { not: null },
      },
    });
    if (tags.length === 0) {
      return res.status(404).json({ message: "No deleted tags found" });
    }
    res.status(200).json({
      message: "Deleted tags retrieved successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error retrieving deleted tags:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { tagName, categoryId } = req.body;
    const tag = await prisma.tag.findUnique({ where: { tagId: id } });
    if (!tag) {
      return res.status(404).json({ message: "tag not found" });
    }
    const updatedtag = await prisma.tag.update({
      where: { tagId: id },
      data: { tagName, categoryId },
    });
    return res
      .status(200)
      .json({ message: "Tag updated successfully", data: updatedtag });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update tag", error: error.message });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({ where: { tagId: id } });
    if (!tag) {
      return res.status(404).json({ message: "tag not found" });
    }
    await prisma.tag.update({
      where: {
        tagId: id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return res.status(200).json({ message: "Tag deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete tag", error: error.message });
  }
};

const restoreTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({ where: { tagId: id } });
    if (!tag) {
      return res.status(404).json({ message: "tag not found" });
    }
    await prisma.tag.update({
      where: {
        tagId: id,
      },
      data: {
        deletedAt: null,
      },
    });
    return res.status(200).json({ message: "Tag restored successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to restore tag", error: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getDeletedCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  addTag,
  getTags,
  getTagById,
  getTagsByCategory,
  getDeletedTags,
  updateTag,
  deleteTag,
  restoreTag,
};
