const express = require("express");
const router = express.Router();
const { createActivity, getActivities, getActivityById, deleteActivity,addTagsToActivity,deleteActivityTagBytagName,reserveActivity,getActivityReservations} = require("../controllers/activityControllers");
const {checkRole} = require("../middlewares/Autorization");
const {authenticateToken} = require("../middlewares//auth");
const {validateData} = require("../utils/validation");

router.post("/add", authenticateToken, checkRole("ORGANISER"),validateData, createActivity);
router.post("/:activityId/tags", authenticateToken, checkRole("ORGANISER"),validateData, addTagsToActivity);
router.post("/:activityId/reserve", authenticateToken, validateData, reserveActivity);

router.get("/", authenticateToken,validateData, getActivities);
router.get("/reservations", authenticateToken,validateData, getActivityReservations);
router.get("/:activityId", authenticateToken,validateData, getActivityById);

router.delete("/:activityId/tags", authenticateToken, checkRole("ORGANISER"),validateData, deleteActivityTagBytagName);
router.delete("/:activityId", authenticateToken, checkRole("ORGANISER","ADMIN"),validateData, deleteActivity);
module.exports = router;
