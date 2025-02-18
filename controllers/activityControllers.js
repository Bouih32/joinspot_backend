const prisma = require("../utils/client");

const createActivity = async (req, res) => {
  try {
    const {
      coverPic,
      title,
      description,
      startTime,
      endTime,
      location,
      startDay,
      endDay,
      seat,
      price,
    } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    const activity = await prisma.activity.create({
      data: {
        coverPic,
        title,
        description,
        startTime,
        endTime,
        location,
        startDay,
        endDay,
        seat,
        price,
        score: 0,
        userId: req.user.userId,
        categoryName: user.categoryName,
      },
    });
    res
      .status(201)
      .json({ message: "Activity created successfully", activity });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create activity", error: error.message });
  }
};

const getActivities = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany();
    if (!activities) {
      return res.status(404).json({ message: "No activities found" });
    }
    res
      .status(200)
      .json({ message: "Activities fetched successfully", activities });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch activities", error: error.message });
  }
};

const getActivityById = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res
      .status(200)
      .json({ message: "Activity fetched successfully", activity });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch activity", error: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await prisma.activity.update({
      where: { activityId },
      data: {
        deletedAt: new Date(),
      },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res
      .status(200)
      .json({ message: "Activity deleted successfully", activity });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete activity", error: error.message });
  }
};

const addTagsToActivity = async (req, res) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ message: "Tags must be an array" });
    }
    const activityTags = await prisma.activityTags.createMany({
      data: tags.map((tagName) => ({
        tagName,
        activityId: req.params.activityId,
      })),
    });
    res.status(200).json({ message: "Tags added to activity", activityTags });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to add tags to activity",
        error: error.message,
      });
  }
};

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  deleteActivity,
  addTagsToActivity,
};
