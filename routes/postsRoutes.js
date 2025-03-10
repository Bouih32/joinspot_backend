const express = require("express");
const router = express.Router();
const {
    createPost,
    addTagToPost,
    getPosts,
    getMyPosts,
    getPostsByUser,
    getPostById,
    getPostByCategory,
    getPostBytags,
    getMyPost,
    deletePostTag,
    savePost,
    getSavedPost,
    unSavePost,
    likePost,
    unlikePost,
    addcomment,
    deleteComment,
    shareActivity,
    repportPost,
    getrepportedPost,
    checkrepportedPost,
    sharePost
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
router.post(
  "/:activityId/share",
  authenticateToken,
  validateData,
  shareActivity
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
router.post("/:postId/repport",
  authenticateToken,
    validateData,
    repportPost
  );
router.post("/:postId/like",
    authenticateToken,
    validateData,
    likePost
  );
router.post("/:postId/comment",
    authenticateToken,
    validateData,
    addcomment
  )
  router.post("repport/:postId/checkRepport",
    authenticateToken,
    checkRole("ADMIN"),
    validateData,
    checkrepportedPost
  )
// GET
router.get("/",
    authenticateToken,
    validateData,
    getPosts
  );
router.get("/myPosts",
    authenticateToken,
    validateData,
    getMyPosts
  );
router.get("/user/:userId",
    authenticateToken,
    validateData,
    getPostsByUser
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
router.get('/:postId/share', authenticateToken, sharePost);
router.get('/repport', authenticateToken, checkRole("ADMIN"), getrepportedPost);

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
router.delete("/:postId/comment/:commentId",
    authenticateToken,
    validateData,
    deleteComment
  )

module.exports = router;
