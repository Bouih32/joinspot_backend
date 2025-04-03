const express = require("express");
const {
  authenticateToken,
  optionalAuthenticateToken,
} = require("../middlewares/auth");
// const { isAuthenticated } = require("../middlewares/Authentication");
const { checkRole } = require("../middlewares/Autorization");
const router = express.Router();

const {
  loginUser,
  registerUser,
  RequestDegrees,
  ChangeRole,
  getUserData,
  logOut,
  updateUserData,
  changePassword,
  getAllUsers,
  getDeletedUsers,
  getUserById,
  addTagsToUser,
  getUserTags,
  deleteUserTag,
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
  sendMessage,
  getMessages,
  getMessagesByUser,
  markAsRead,
  getUnreadMessages,
  getNotifications,
  deleteNotification,
  supports,
  getProfileData,
  getUserTickets,
  updateSocials,
} = require("../controllers/userControllers");
const {
  loginValidation,
  registerValidation,
  validateData,
  infoValidation,
  updateValidation,
  pswrdValidation,
  socialsValidation,
} = require("../utils/validation");

// authentication
router.post("/support", optionalAuthenticateToken, supports);
router.post("/register", registerValidation, validateData, registerUser);
router.post("/login", loginValidation, validateData, loginUser);
router.post("/logout", authenticateToken, logOut);
router.post("/forgot", forgotPswrd);
router.post("/reset", resetForgotenPswrd);
// userTag
router.post("/tags", authenticateToken, addTagsToUser);
// userFollow
router.post("/follow", authenticateToken, validateData, followUser);
router.post("/add-city", addCity);
router.post("/repport", authenticateToken, validateData, repportUser);
router.post(
  "/repport/:repportId/check",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  checkRepport
);
router.post("/send-message", authenticateToken, validateData, sendMessage);

router.get("/cities", getCities);
// user data
router.get("/tags", authenticateToken, getUserTags);
router.get("/profile", authenticateToken, getUserData);
router.get("/profile/header", authenticateToken, getProfileData);
router.get("/profile/ticket", authenticateToken, getUserTickets);
router.get(
  "/followers",
  authenticateToken,
  validateData,
  getFollowersAndFollowing
);

router.get(
  "/repported",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getRepportedUsers
);
router.get("/messages", authenticateToken, getMessages);
router.get("/notifications", authenticateToken, getNotifications);
router.get(
  "/messages/:toId",
  authenticateToken,
  validateData,
  getMessagesByUser
);
router.get(
  "/unread-messages",
  authenticateToken,
  validateData,
  getUnreadMessages
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
  "/degrees",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  RequestDegrees
);
router.get(
  "/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getUserById
);
router.put(
  "/messages/:messageId/read",
  authenticateToken,
  validateData,
  markAsRead
);

router.patch(
  "/change-password",
  authenticateToken,
  pswrdValidation,
  validateData,
  changePassword
);
router.put("/update-cityuser", authenticateToken, updateUserCity);
router.put(
  "/ChangeRole",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  ChangeRole
);
router.patch(
  "/edit-profil",
  authenticateToken,
  updateValidation,
  validateData,
  updateUserData
);

router.patch(
  "/edit-profil/socials",
  authenticateToken,
  socialsValidation,
  validateData,
  updateSocials
);

router.delete("/unfollow", authenticateToken, validateData, UnfollowUser);
router.delete("/cities/:cityId", authenticateToken, deleteCity);
router.delete("/tags/:id", authenticateToken, deleteUserTag);
router.delete(
  "/notifications/:notificationId",
  authenticateToken,
  validateData,
  deleteNotification
);

module.exports = router;
