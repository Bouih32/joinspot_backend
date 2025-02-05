const prisma = require("../utils/client");

// Categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
      },
    });
    if (categories.length === 0) {
      return res.status(404).json({ message: "No deleted categories found" });
    }
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { categoryId: String(id) },
    });
    if (!category) {
      res.status(404).json({ message: "Category not found" });
    } else {
      res
        .status(200)
        .json({ message: "Category retrieved successfully", data: category });
    }
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
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

    res.status(200).json({
      message: "Deleted categories retrieved successfully",
      data: categories,
    });
  } catch (err) {
    console.error("Error retrieving deleted categories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const existedcategory = await prisma.category.findUnique({
      where: { name:name },
    });
    if (existedcategory) {
      return res.status(400).json({ message: "Category already exists" });
    };
    const category = await prisma.category.create({ data: { name, icon } });
    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { categoryId: String(id) },
    });
    if (!category) {
      res.status(404).json({ message: "Category not found" });
    }
    const updates = req.body;
    const updatedCategory = await prisma.category.update({
      where: { categoryId: String(id) },
      data: updates,
    });
    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { 
        categoryId: String(id),
      },
    });
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      }
    const categorydeleted = await prisma.category.findUnique({
      where: { 
        categoryId: String(id),
        deletedAt: {not: null}
      },
    });
    if (categorydeleted) {
      res.status(200).json({ message: "This Category already deleted" });
    }
    const tags = await prisma.tag.findMany({
      where: { categoryId: String(id) },
    });
    if (tags.length > 0) {
      return res.status(400).json({ message: "Cannot delete category with associated tags" });
    }
    await prisma.category.update({
      where: {
        categoryId: String(id),
      },
      data: {
        deletedAt: new Date(),
      },
    });
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: {
        categoryId: String(id),
        deletedAt: { not: null },
      },
    });
    if (!category) {
      res.status(404).json({ message: "Category not found in deleted state" });
    }
    await prisma.category.update({
      where: {
        categoryId: String(id),
      },
      data: {
        deletedAt: null,
      },
    });
    res.status(200).json({ message: "Category restored" });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};
// Tags
const addTag = async (req, res) => {
  try {
    const { name, color, categoryId } = req.body;
    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        categoryId,
      },
    });
    const existedTag = await prisma.tag.findUnique({
      where: {name: name},
    });
    if (existedTag) {
      res.status(400).json({ message: "Tag already exists" });
    }
    res.status(200).json({ message: "Tag added successfully", data: tag });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add tag", error: error.message });
  }
};

const getTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        deletedAt: null,
      },
    });
    res
      .status(200)
      .json({ message: "Tags retrieved successfully", data: tags });
  } catch (error) {
    res
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
    if (!tags) {
      res.status(404).json({ message: "Tags not found" });
    }
    res
      .status(200)
      .json({ message: "Tags retrieved successfully", data: tags });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve tags", error: error.message });
  }
};

const getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({
      where: {
        tagId: String(id),
      },
    });
    if (!tag) {
      res.status(404).json({ message: "Tag not found" });
    }
    res.status(200).json({ message: "Tag retrieved successfully", data: tag });
  } catch (error) {
    res
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
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({ where: { tagId: String(id) } });
    if (!tag) {
      res.status(404).json({ message: "tag not found" });
    }
    const updates = req.body;
    const updatedtag = await prisma.tag.update({
      where: { tagId: String(id) },
      data: updates,
    });
    res
      .status(200)
      .json({ message: "Tag updated successfully", data: updatedtag });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update tag", error: error.message });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({ where: { tagId: String(id) } });
    if (!tag) {
      res.status(404).json({ message: "tag not found" });
    }
    await prisma.tag.update({
      where: {
        tagId: String(id),
      },
      data: {
        deletedAt: new Date(),
      },
    });
    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete tag", error: error.message });
  }
};

const restoreTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({ where: { tagId: String(id) } });
    if (!tag) {
      res.status(404).json({ message: "tag not found" });
    }
    await prisma.tag.update({
      where: {
        tagId: String(id),
      },
      data: {
        deletedAt: null,
      },
    });
    res.status(200).json({ message: "Tag restored successfully" });
  } catch (error) {
    res
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
