const express = require("express");
const { isAuthenticated } = require("../middlewares/Authentication");
const {checkRole}= require("../middlewares/Autorization")
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
  deleteUserTagByTagId,
  followUser,
  getFollowersAndFollowing
} = require("../controllers/userControllers");
const {
  loginValidation,
  registerValidation,
  validationandHandlerrors,
} = require("../utils/validation");

// authentication
router.post("/register",registerValidation,validationandHandlerrors, registerUser);
router.post("/login",loginValidation,validationandHandlerrors, loginUser);
router.post("/logout",validationandHandlerrors, logOut);
// userTag
router.post("/tags",isAuthenticated,addTagsToUser)
// userFollow
router.post("/follow",isAuthenticated,validationandHandlerrors,followUser)

// user data
router.get("/tags",isAuthenticated,getUserTags)
router.get("/profil", isAuthenticated,validationandHandlerrors, getUserData);
router.get("/followers",isAuthenticated,validationandHandlerrors,getFollowersAndFollowing)
router.get("/users", isAuthenticated,checkRole("ADMIN"),validationandHandlerrors,getAllUsers)
router.get("/deleted", isAuthenticated,checkRole("ADMIN"),validationandHandlerrors,getDeletedUsers)
router.get("/:id", isAuthenticated,checkRole("ADMIN"),validationandHandlerrors,getUserById)

router.put("/change-password", isAuthenticated,validationandHandlerrors, changePassword);

router.patch("/edit-profil", isAuthenticated,validationandHandlerrors, updateUserData);

router.delete("/tags/:id",isAuthenticated,deleteUserTagByTagId)

module.exports = router;
