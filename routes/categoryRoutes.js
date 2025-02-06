const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  getDeletedCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  addTag,
  getTags,
  getTagsByCategory,
  getTagById,
  updateTag,
  getDeletedTags,
  restoreTag,
  deleteTag,
} = require("../controllers/categoryContollers");

// post
router.post("/add", createCategory);
router.post("/add-tag", addTag);

// Get
router.get("/", getAllCategories);
router.get("/tags", getTags);
router.get("/deleted", getDeletedCategories);
router.get("/tags/deleted", getDeletedTags);
router.get("/:id/tags", getTagsByCategory);
router.get("/tags/:id", getTagById);
router.get("/:id", getCategoryById);

// Patch
router.patch("/:id", updateCategory);
router.patch("/tags/:id", updateTag);
router.patch("/restore/:id", restoreCategory);
router.patch("/tags/restore/:id", restoreTag);

// Delete
router.delete("/:id", deleteCategory);
router.delete("/tags/:id", deleteTag);

module.exports = router;
