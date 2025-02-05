const express = require("express");
const router = express.Router();
const {getAllCategories,getCategoryById,getDeletedCategories,createCategory,updateCategory,deleteCategory,restoreCategory,addTag,getTags,getTagsByCategory,getTagById,updateTag,getDeletedTags,restoreTag,deleteTag} = require("../controllers/categoryContollers");

// category
router.post("/add", createCategory)
router.get("/", getAllCategories)
router.get("/deleted", getDeletedCategories)
router.get("/:id", getCategoryById)
router.patch("/:id",  updateCategory)
router.delete("/:id", deleteCategory)
router.patch("/restore/:id", restoreCategory)

// Tags
router.post("/add-tag", addTag)
router.get("/tags", getTags)
router.get("/:id/tags", getTagsByCategory)
router.get("/tags/:id", getTagById)
router.get("/tags/deleted", getDeletedTags)
router.patch("/tags/:id", updateTag)
router.patch("/tags/restore/:id", restoreTag)
router.delete("/tags/:id", deleteTag)


module.exports = router;
