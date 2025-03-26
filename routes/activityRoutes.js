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
  getActivityByCategory,
  getActivityReservations,
  getMyActivities,
  getActivitiesBytags,
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
  handleWebhook,
  paymentIntent,
  getUserActivities,
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
router.post("/:activityId/save", authenticateToken, validateData, saveActivity);
router.post(
  "/:activityId/tags",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  addTagsToActivity
);

router.post("/:activityId/payment", authenticateToken, validateData, payment);
router.post(
  "/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  handleWebhook
);
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
router.get(
  "/my-activities",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  getMyActivities
);
router.get("/user/:id", getUserActivities);
router.get("/paymentIntent/:paymentIntentId", authenticateToken, paymentIntent);
router.get("/tickets", authenticateToken, validateData, getActivityTickets);
router.get(
  "/reservations",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  getActivityReservations
);
router.get("/tags", getActivitiesBytags);
router.get("/saved", authenticateToken, validateData, getSavedActivities);

router.get("/category/:id", validateData, getActivityByCategory);
router.get("/city/:cityId", getActivityByCity);
router.get("/:activityId", getActivityById);
router.get("/:activityId/reviews", getReviews);
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
  checkRole("ORGANISER"),
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
