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
  validateData,
  categoryValidation,
  tagValidation,
} = require("../utils/validation");
const { authenticateToken } = require("../middlewares/auth");
const { checkRole } = require("../middlewares/Autorization");

// post
router.post(
  "/add",
  authenticateToken,
  checkRole("ADMIN"),
  categoryValidation,
  validateData,
  createCategory
);
router.post(
  "/add-tag",
  authenticateToken,
  checkRole("ADMIN"),
  tagValidation,
  validateData,
  addTag
);

// Get
router.get("/", getAllCategories);
router.get(
  "/tags",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getTags
);
router.get(
  "/deleted",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getDeletedCategories
);
router.get(
  "/tags/deleted",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getDeletedTags
);
router.get(
  "/tags/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getTagById
);
router.get(
  "/:id/tags",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getTagsByCategory
);
router.get(
  "/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getCategoryById
);

// Patch

router.patch(
  "/tags/:id",
  authenticateToken,
  tagValidation,
  checkRole("ADMIN"),
  validateData,
  updateTag
);
router.patch(
  "/restore/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  restoreCategory
);
router.patch(
  "/tags/restore/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  restoreTag
);
router.patch(
  "/:id",
  authenticateToken,
  checkRole("ADMIN"),
  categoryValidation,
  validateData,
  updateCategory
);

// Delete

router.delete(
  "/delete/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  deleteCategory
);
router.delete(
  "/tags/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  deleteTag
);

module.exports = router;
