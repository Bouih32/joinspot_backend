const express = require("express");
const router = express.Router();
const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  addTagsToActivity,
  deleteActivityTag,
  getActivityTickets,
  getActivityReservations,
  getActivityByCity,
  saveActivity,
  getSavedActivities,
  unSaveActivity,
  addReview,
  getReviews,
  updateReview,
  deleteReview,
  repportActivity,
  getRepportedActivities,
  checkRepport,
  payment,
  paymentIntent,
  getTicketById,
  getUserActivities,
  joinActivity,
  getTicketsByActivity,
} = require("../controllers/activityControllers");
const { checkRole } = require("../middlewares/Autorization");
const {
  authenticateToken,
  optionalAuthenticateToken,
} = require("../middlewares//auth");
const {
  validateData,
  addValidation,
  reviewValidation,
  joinValidation,
  editValidation,
} = require("../utils/validation");
const bodyParser = require("body-parser");

//POST
router.post(
  "/add",
  authenticateToken,
  checkRole("ORGANISER"),
  addValidation,
  validateData,
  createActivity
);

router.post(
  "/:activityId/join",
  authenticateToken,
  joinValidation,
  validateData,
  joinActivity
);
router.post("/paymentIntent/:paymentIntentId", paymentIntent);
router.post("/:activityId/save", authenticateToken, saveActivity);
router.post(
  "/:activityId/tags",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  addTagsToActivity
);

router.post("/:activityId/payment", authenticateToken, validateData, payment);
router.post(
  "/:activityId/review",
  authenticateToken,
  reviewValidation,
  validateData,
  addReview
);
router.post(
  "/:activityId/repport",
  authenticateToken,
  validateData,
  repportActivity
);
router.post(
  "/repport/:repportId/check",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  checkRepport
);

// GET
router.get("/", optionalAuthenticateToken, getActivities);
router.get("/user/:id", getUserActivities);
router.get("/tickets", authenticateToken, getActivityTickets);
router.get("/ticket/:ticketId", authenticateToken, getTicketById);

router.get(
  "/reservations",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  getActivityReservations
);
router.get("/saved", authenticateToken, validateData, getSavedActivities);
router.get("/city/:cityId", getActivityByCity);
router.get("/:activityId", getActivityById);
router.get("/:activityId/reviews", getReviews);
router.get("/:activityId/ticket", authenticateToken, getTicketsByActivity);
router.get(
  "/repported",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getRepportedActivities
);

// PUT

router.put("/reviews/:reviewId", authenticateToken, validateData, updateReview);

// PATCH
router.patch(
  "/:activityId/update",
  authenticateToken,
  editValidation,
  validateData,
  updateActivity
);

// DELETE
router.delete(
  "/reviews/:reviewId",
  authenticateToken,
  validateData,
  deleteReview
);
router.delete(
  "/:activityId/tags",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  deleteActivityTag
);
router.delete(
  "/:activityId/unsave",
  authenticateToken,
  validateData,
  unSaveActivity
);
router.delete(
  "/:activityId",
  authenticateToken,
  checkRole("ORGANISER", "ADMIN"),
  validateData,
  deleteActivity
);

module.exports = router;
