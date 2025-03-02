const express = require("express");
const router = express.Router();
const {
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
    unlikePost
  } = require("../controllers/postsControllers");
  const { checkRole } = require("../middlewares/Autorization");
  const { authenticateToken } = require("../middlewares/auth");
  const { validateData } = require("../utils/validation");

// POST
router.post("/createPost",
    authenticateToken,
    validateData,
    createPost
  );
  router.post("/:postId/addTag",
    authenticateToken,
    validateData,
    addTagToPost
  );
router.post("/:postId/save",
    authenticateToken,
    validateData,
    savePost
  );
router.post("/:postId/like",
    authenticateToken,
    validateData,
    likePost
  );

// GET
router.get("/",
    authenticateToken,
    validateData,
    getPosts
  );
router.get("/tags",
    authenticateToken,
    validateData,
    getPostBytags
  );
router.get("/myPosts",
    authenticateToken,
    validateData,
    getMyPost
  );
router.get("/savedPosts",
    authenticateToken,
    validateData,
    getSavedPost
  );
router.get("/category/:id",
    authenticateToken,
    validateData,
    getPostByCategory
  );
router.get("/:id",
    authenticateToken,
    validateData,
    getPostById
  );

// DELETE
router.delete("/:postId/tags",
    authenticateToken,
    validateData,
    deletePostTag
  );
router.delete("/:postId/unsave",
    authenticateToken,
    validateData,
    unSavePost
  );
router.delete("/:postId/unlike",
    authenticateToken,
    validateData,
    unlikePost
  );

module.exports = router;
