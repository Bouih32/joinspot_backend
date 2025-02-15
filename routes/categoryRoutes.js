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
const { validateData, categoryValidation } = require("../utils/validation");
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
router.post("/add-tag", validateData, addTag);

// Get
router.get("/", getAllCategories);
router.get("/tags", getTags);
router.get("/deleted", getDeletedCategories);
router.get("/tags/deleted", getDeletedTags);
router.get("/tags/:id", getTagById);
router.get("/:id/tags", getTagsByCategory);
router.get("/:id", getCategoryById);

// Patch
router.patch("/tags/:id", authenticateToken, checkRole("ADMIN"), updateTag);
router.patch(
  "/restore/:id",
  authenticateToken,
  checkRole("ADMIN"),
  restoreCategory
);
router.patch(
  "/tags/restore/:id",
  authenticateToken,
  checkRole("ADMIN"),
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

router.delete("/tags/:id", authenticateToken, checkRole("ADMIN"), deleteTag);
router.delete("/:id", authenticateToken, checkRole("ADMIN"), deleteCategory);

module.exports = router;
