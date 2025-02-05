const express = require("express");
const router = express.Router();
const {getAllCategories,getCategoryById,getDeletedCategories,createCategory,updateCategory,deleteCategory,addTag} = require("../controllers/categoryContollers");

router.post("/add", createCategory)
router.post("/add-tag/:id", addTag)
router.get("/", getAllCategories)
router.get("/deleted", getDeletedCategories)
router.get("/:id", getCategoryById)
router.patch("/:id",  updateCategory)
router.delete("/:id", deleteCategory)
module.exports = router;
