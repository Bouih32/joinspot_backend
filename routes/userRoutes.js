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
  UnfollowUser,
  forgotPswrd,
  resetForgotenPswrd,
  addCity,
  getCities,
  deleteCity,
  updateUserCity,
  repportUser,
  getRepportedUsers,
  checkRepport,
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
router.post("/add-city", authenticateToken, addCity);
router.post("/repport", authenticateToken, validateData, repportUser);
router.post("/repport/:repportId/check", authenticateToken, validateData, checkRepport);



router.get("/cities", authenticateToken, getCities);
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
router.get("/repported", authenticateToken, validateData, getRepportedUsers);
router.get(
  "/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getUserById
);

router.put("/change-password", authenticateToken, validateData, changePassword);
router.put("/update-cityuser", authenticateToken, updateUserCity);


router.patch("/edit-profil", authenticateToken, validateData, updateUserData);

router.delete("/unfollow", authenticateToken,validateData, UnfollowUser);
router.delete("/cities/:cityId", authenticateToken, deleteCity);
router.delete("/tags/:id", authenticateToken, deleteUserTagBytagName);


module.exports = router;
