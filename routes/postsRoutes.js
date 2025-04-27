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
  sharePost,
  getUserLikes,
} = require("../controllers/postsControllers");
const { checkRole } = require("../middlewares/Autorization");
const { authenticateToken } = require("../middlewares/auth");
const {
  validateData,
  addPostValidation,
  commentValidation,
} = require("../utils/validation");

// POST
router.post(
  "/add",
  authenticateToken,
  addPostValidation,
  validateData,
  createPost
);
router.post(
  "/:activityId/share",
  authenticateToken,
  validateData,
  shareActivity
);
router.post("/:postId/addTag", authenticateToken, validateData, addTagToPost);
router.post("/:postId/save", authenticateToken, validateData, savePost);
router.post("/:postId/repport", authenticateToken, validateData, repportPost);
router.post("/:postId/like", authenticateToken, likePost);
router.post(
  "/:postId/comment",
  authenticateToken,
  commentValidation,
  validateData,
  addcomment
);
router.post(
  "repport/:postId/checkRepport",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  checkrepportedPost
);
// GET
router.get("/", authenticateToken, getPosts);
router.get("/myPosts", authenticateToken, getMyPosts);
router.get("/user/:userId", authenticateToken, getPostsByUser);
router.get("/tags", authenticateToken, getPostBytags);
router.get("/myPosts", authenticateToken, getMyPost);
router.get("/likes", authenticateToken, getUserLikes);
router.get("/savedPosts", authenticateToken, getSavedPost);
router.get("/category/:id", authenticateToken, getPostByCategory);

router.get("/:postId/share", authenticateToken, sharePost);
router.get("/repport", authenticateToken, checkRole("ADMIN"), getrepportedPost);
router.get("/:id", authenticateToken, getPostById);

// DELETE
router.delete("/:postId/tags", authenticateToken, validateData, deletePostTag);
router.delete("/:postId/unsave", authenticateToken, validateData, unSavePost);
router.delete("/:postId/unlike", authenticateToken, validateData, unlikePost);
router.delete(
  "/:postId/comment/:commentId",
  authenticateToken,
  validateData,
  deleteComment
);

module.exports = router;
