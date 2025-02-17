const express = require("express");
const { authenticateToken } = require("../middlewares/auth");
// const { isAuthenticated } = require("../middlewares/Authentication");
const { checkRole } = require("../middlewares/Autorization");
const router = express.Router();

const {
  loginUser,
  registerUser,
  getUserData,
  logOut,
  updateUserData,
  changePassword,
  getAllUsers,
  getDeletedUsers,
  getUserById,
  addTagsToUser,
  getUserTags,
  deleteUserTagBytagName,
  followUser,
  getFollowersAndFollowing,
  forgotPswrd,
  resetForgotenPswrd,
} = require("../controllers/userControllers");
const {
  loginValidation,
  registerValidation,
  validateData,
} = require("../utils/validation");

// authentication
router.post("/register", registerValidation, validateData, registerUser);
router.post("/login", loginValidation, validateData, loginUser);
router.post("/logout", authenticateToken, logOut);
router.post("/forgot", forgotPswrd);
router.post("/reset", resetForgotenPswrd);
// userTag
router.post("/tags", authenticateToken, addTagsToUser);
// userFollow
router.post("/follow", authenticateToken, validateData, followUser);

// user data
router.get("/tags", authenticateToken, getUserTags);
router.get("/profil", authenticateToken, validateData, getUserData);
router.get(
  "/followers",
  authenticateToken,
  validateData,
  getFollowersAndFollowing
);
router.get(
  "/users",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getAllUsers
);
router.get(
  "/deleted",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getDeletedUsers
);
router.get(
  "/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getUserById
);

router.put("/change-password", authenticateToken, validateData, changePassword);

router.patch("/edit-profil", authenticateToken, validateData, updateUserData);

router.delete("/tags/:id", authenticateToken, deleteUserTagBytagName);

module.exports = router;
