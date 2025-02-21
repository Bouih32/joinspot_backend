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
} = require("../controllers/activityControllers");
const { checkRole } = require("../middlewares/Autorization");
const { authenticateToken } = require("../middlewares//auth");
const { validateData } = require("../utils/validation");

router.post(
  "/add",
  authenticateToken,
  checkRole("ORGANISER"),
  validateData,
  createActivity
);
router.post(
  "/:activityId/save",
  authenticateToken,
  validateData,
  saveActivity
);
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
router.get(
  "/saved",
  authenticateToken,
  validateData,
  getSavedActivities
);
router.get(
  "/category/:id",
  authenticateToken,
  validateData,
  getActivityByCategory
);
router.get("/city/:cityId", authenticateToken, validateData, getActivityByCity);
router.get("/:activityId", authenticateToken, validateData, getActivityById);

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
module.exports = router;
