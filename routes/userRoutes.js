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
  getMessageDetails,
  deleteMessage,
  getUserRevenue,
  getActiveActivities,
  getJoined,
  markAsUsed,
  getUserProfile,
  getUserFollowing,
  upgradeRequest,
  getStatusUpdate,
  getAdminStats,
  getAdminRevenue,
  banUser,
  getAdminActivities,
  updateBank,
  getUserBank,
  seenNotifications,
  getUserPayments,
} = require("../controllers/userControllers");
const {
  loginValidation,
  registerValidation,
  validateData,
  infoValidation,
  updateValidation,
  pswrdValidation,
  socialsValidation,
  messageValidation,
  followValidation,
  supportValidation,
  bankValidation,
} = require("../utils/validation");

// authentication
router.post(
  "/support",
  supportValidation,
  validateData,
  optionalAuthenticateToken,
  supports
);
router.post("/register", registerValidation, validateData, registerUser);
router.post("/login", loginValidation, validateData, loginUser);
router.post("/logout", authenticateToken, logOut);
router.post("/forgot", forgotPswrd);
router.post("/reset", resetForgotenPswrd);
// userTag
router.post("/tags", authenticateToken, addTagsToUser);
// userFollow
router.post(
  "/follow",
  authenticateToken,
  followValidation,
  validateData,
  followUser
);
router.post("/add-city", addCity);
router.post("/repport", authenticateToken, validateData, repportUser);
router.post(
  "/repport/:repportId/check",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  checkRepport
);
router.post(
  "/send-message",
  authenticateToken,
  messageValidation,
  validateData,
  sendMessage
);

router.post("/profile/upgrade", authenticateToken, upgradeRequest);

router.get("/cities", getCities);
// user data
router.get("/tags", authenticateToken, getUserTags);
router.get("/bank", authenticateToken, getUserBank);
router.get("/profile", authenticateToken, getUserData);
router.get("/profile/header", authenticateToken, getProfileData);
router.get(
  "/admin/payments",
  authenticateToken,
  checkRole("ADMIN"),
  getUserPayments
);
router.get(
  "/admin/header",
  authenticateToken,
  checkRole("ADMIN"),
  getAdminStats
);

router.get(
  "/admin/revenue",
  authenticateToken,
  checkRole("ADMIN"),
  getAdminRevenue
);
router.get("/profile/ticket", authenticateToken, getUserTickets);
router.get("/profile/revenue", authenticateToken, getUserRevenue);
router.get("/profile/active", authenticateToken, getActiveActivities);
router.get(
  "/admin/active",
  authenticateToken,
  checkRole("ADMIN"),
  getAdminActivities
);
router.get("/profile/joined", authenticateToken, getJoined);
router.get("/profile/upgrade-status", authenticateToken, getStatusUpdate);
router.get("/profile/:userId", getUserProfile);

router.get(
  "/followers",
  authenticateToken,
  validateData,
  getFollowersAndFollowing
);

router.get("/following", authenticateToken, getUserFollowing);

router.get(
  "/repported",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getRepportedUsers
);
router.get("/messages", authenticateToken, getMessages);
router.get("/notifications", authenticateToken, getNotifications);
router.get("/messages/:toId", authenticateToken, getMessagesByUser);

router.get(
  "/messages/details/:messageId",
  authenticateToken,
  getMessageDetails
);
router.get("/unread-messages", authenticateToken, getUnreadMessages);

router.get("/users", authenticateToken, checkRole("ADMIN"), getAllUsers);
router.get("/deleted", authenticateToken, checkRole("ADMIN"), getDeletedUsers);
router.get("/degrees", authenticateToken, checkRole("ADMIN"), RequestDegrees);
router.get(
  "/:id",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getUserById
);
router.patch("/ban/:userId", authenticateToken, checkRole("ADMIN"), banUser);
router.patch("/messages/:messageId/read", authenticateToken, markAsRead);
router.patch("/messages/:messageId/delete", authenticateToken, deleteMessage);
router.patch("/notifications", authenticateToken, seenNotifications);
router.patch("/ticket/:ticketId/used", authenticateToken, markAsUsed);

router.patch(
  "/change-password",
  authenticateToken,
  pswrdValidation,
  validateData,
  changePassword
);
router.put("/update-cityuser", authenticateToken, updateUserCity);
router.patch(
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

router.patch(
  "/edit-profil/bank",
  authenticateToken,
  bankValidation,
  validateData,
  updateBank
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
