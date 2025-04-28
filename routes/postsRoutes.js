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
  deletePost,
} = require("../controllers/postsControllers");
const { checkRole } = require("../middlewares/Autorization");
const {
  authenticateToken,
  optionalAuthenticateToken,
} = require("../middlewares/auth");
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
router.get("/", optionalAuthenticateToken, getPosts);
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
router.delete("/:postId/tags", authenticateToken, deletePostTag);
router.delete("/:postId/delete", authenticateToken, deletePost);
router.delete("/:postId/unsave", authenticateToken, unSavePost);
router.delete("/:postId/unlike", authenticateToken, unlikePost);
router.delete(
  "/:postId/comment/:commentId",
  authenticateToken,
  validateData,
  deleteComment
);

module.exports = router;
