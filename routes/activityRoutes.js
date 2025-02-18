const express = require("express");
const router = express.Router();
const { createActivity, getActivities, getActivityById, deleteActivity} = require("../controllers/activityControllers");
const {checkRole} = require("../middlewares/Autorization");
const {authenticateToken} = require("../middlewares//auth");
const {validateData} = require("../utils/validation");

router.post("/add", authenticateToken, checkRole("ORGANISER"),validateData, createActivity);

router.get("/", authenticateToken,validateData, getActivities);
router.get("/:activityId", authenticateToken,validateData, getActivityById);

router.delete("/:activityId", authenticateToken, checkRole("ORGANISER","ADMIN"),validateData, deleteActivity);
module.exports = router;
