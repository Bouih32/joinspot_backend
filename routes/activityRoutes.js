const express = require("express");
const router = express.Router();
const {
  createActivity,
  getActivities,
  getActivityById,
  deleteActivity,
  addTagsToActivity,
  deleteActivityTagBytagName,
  reserveActivity,
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
} = require("../controllers/activityControllers");
const { checkRole } = require("../middlewares/Autorization");
const { authenticateToken } = require("../middlewares//auth");
const { validateData } = require("../utils/validation");

//POST
router.post(
  "/add",
  authenticateToken,
  checkRole("ORGANISER"),
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
router.post(
  "/:activityId/reserve",
  authenticateToken,
  validateData,
  reserveActivity
);
router.post("/:activityId/review", authenticateToken, validateData, addReview);
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
router.get("/", authenticateToken, validateData, getActivities);
router.get(
  "/my-activities",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  getMyActivities
);
router.get("/tickets", authenticateToken, validateData, getActivityTickets);
router.get(
  "/reservations",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  getActivityReservations
);
router.get("/tags", authenticateToken, validateData, getActivitiesBytags);
router.get("/saved", authenticateToken, validateData, getSavedActivities);
router.get(
  "/repported",
  authenticateToken,
  checkRole("ADMIN"),
  validateData,
  getRepportedActivities
);
router.get(
  "/category/:id",
  authenticateToken,
  validateData,
  getActivityByCategory
);
router.get("/city/:cityId", authenticateToken, validateData, getActivityByCity);
router.get("/:activityId", authenticateToken, validateData, getActivityById);
router.get("/:activityId/reviews", authenticateToken, validateData, getReviews);


// PUT
router.put(
  "/:activityId/reviews/:reviewId",
  authenticateToken,
  validateData,
  updateReview
);

// DELETE
router.delete(
  "/:activityId/tags",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  deleteActivityTagBytagName
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
router.delete(
  "/:activityId/reviews/:reviewId",
  authenticateToken,
  validateData,
  deleteReview
);
module.exports = router;
