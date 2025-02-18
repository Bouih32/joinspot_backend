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
    res.status(500).json({
      message: "Failed to add tags to activity",
      error: error.message,
    });
  }
};

const deleteActivityTagBytagName = async (req, res) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ message: "Tags must be an array" });
    }

    const activityTags = await prisma.activityTags.findMany({
      where: {
        activityId: req.params.activityId,
        tagName: {
          in: tags,
        },
      },
    });
    if (activityTags.length === 0) {
      return res.status(404).json({ message: "Tags not found" });
    }
    await prisma.activityTags.deleteMany({
      where: {
        activityId: req.params.activityId,
        tagName: {
          in: tags,
        },
      },
    });
    res
      .status(200)
      .json({ message: "Tags deleted from activity", activityTags: tags });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to delete tags from activity",
      error: error.message,
    });
  }
};

const reserveActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { quantity } = req.body;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    if (activity.seat < quantity) {
      return res.status(400).json({ message: "Not enough seats available" });
    }
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const ticket = await prisma.ticket.create({
      data: {
        userId: req.user.userId,
        activityId,
        code,
        quantity,
      },
    });

    await prisma.activity.update({
      where: { activityId },
      data: {
        seat: activity.seat - quantity,
      },
    });

    res.status(201).json({
      message: "Reservation successful",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reserve activity",
      error: error.message,
    });
  }
};

const getActivityReservations = async (req, res) => {
  try {
    const reservations = await prisma.ticket.findMany({
      where: {
        userId: req.user.userId,
      },
    });
    res.status(200).json({ message: "Activity reservations fetched successfully", reservations });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch activity reservations",
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
  deleteActivityTagBytagName,
  reserveActivity,
  getActivityReservations
};
