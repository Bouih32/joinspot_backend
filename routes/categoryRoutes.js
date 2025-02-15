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
const {
  validationandHandlerrors,
} = require("../utils/validation");

// post
router.post("/add",validationandHandlerrors, createCategory);
router.post("/add-tag",validationandHandlerrors, addTag);

// Get
router.get("/", getAllCategories);
router.get("/tags", getTags);
router.get("/deleted", getDeletedCategories);
router.get("/tags/deleted", getDeletedTags);
router.get("/tags/:id", getTagById);
router.get("/:id/tags", getTagsByCategory);
router.get("/:id", getCategoryById);

// Patch
router.patch("/tags/:id", updateTag);
router.patch("/restore/:id", restoreCategory);
router.patch("/tags/restore/:id", restoreTag);
router.patch("/:id", updateCategory);

// Delete

router.delete("/tags/:id", deleteTag);
router.delete("/:id", deleteCategory);

module.exports = router;
