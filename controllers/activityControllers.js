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
      cityId,
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
        user: {
          connect: {
            userId: req.user.userId
          }
        },
        category:{
          connect:{
            categoryId: user.categoryId,
          }
        },
        city: {
          connect: {
            cityId: cityId,
          },
        },
      },
    });
    return res
      .status(201)
      .json({ message: "Activity created successfully", activity });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to create activity", error: error.message });
  }
};

const getActivities = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        activityTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    if (activities.length == 0) {
      return res.status(404).json({ message: "No activities found" });
    }
    return res
      .status(200)
      .json({ message: "Activities fetched successfully", activities });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch activities", error: error.message });
  }
};

const getActivityById = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        activityTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    return res
      .status(200)
      .json({ message: "Activity fetched successfully", activity });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch activity", error: error.message });
  }
};

const getActivityByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const activities = await prisma.activity.findMany({
      where: {
        categoryId: id,
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        activityTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    if (activities.length == 0) {
      return res.status(404).json({ message: "No activities found" });
    }
    return res
      .status(200)
      .json({ message: "Activities fetched successfully", activities });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activities by category",
      error: error.message,
    });
  }
};

const getActivitiesBytags = async (req, res) => {
  try {
    const { tagIds } = req.body;
    const existingTags = await prisma.tag.findMany({
      where: {
        tagId: {
          in: tagIds,
        },
      },
    });
    if (existingTags.length === 0) {
      return res.status(400).json({ message: "Some tags do not exist" });
    }
    const activities = await prisma.activity.findMany({
      where: {
        activityTags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        activityTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    return res
      .status(200)
      .json({ message: "Activities fetched successfully", activities });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to fetch activities by tags",
      error: error.message,
    });
  }
};

const getActivityByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const activities = await prisma.activity.findMany({
      where: {
        cityId: cityId,
      },
    });
    if (activities.length === 0) {
      return res.status(404).json({ message: "No activities found" });
    }
    return res.status(200).json({ message: "Activities fetched successfully", activities });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activities by city",
      error: error.message,
    });
  }
};

const getMyActivities = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        activityTags: {
          include: {
            tag: {
              select: {
                tagName: true,
              },
            },
          },
        },
      },
    });
    if (activities.length === 0) {
      return res.status(404).json({ message: "No activities found" });
    }
    return res
      .status(200)
      .json({ message: "Activities fetched successfully", activities });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    } 
    await prisma.activity.update({
      where: { activityId },
      data: {
        deletedAt: new Date(),
      },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    return res
      .status(200)
      .json({ message: "Activity deleted successfully", activity });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete activity", error: error.message });
  }
};

const addTagsToActivity = async (req, res) => {
  try {
    const { tagIds } = req.body;
    console.log(tagIds, "tagids");
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        message: "Tags must be an array and not empty",
        received: req.body,
      });
    }

    const existingActivityTags = await prisma.activityTags.findMany({
      where: {
        activityId: req.params.activityId,
        tagId: { in: tagIds },
      },
    });

    if (existingActivityTags.length > 0) {
      return res.status(400).json({
        message: "Tags already exist",
      });
    }
    const newActivityTags = tagIds.filter(
      (id) => !existingActivityTags.some((tag) => tag.tagId === id)
    );
    const activityTags = await prisma.activityTags.createMany({
      data: newActivityTags.map((tagId) => ({
        activityId: req.params.activityId,
        tagId,
      })),
    });
    if (activityTags.length === 0) {
      return res.status(404).json({ message: "Tags not found" });
    }

    return res
      .status(200)
      .json({ message: "Tags added to activity", activityTags });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to add tags to activity",
      error: error.message,
    });
  }
};

const deleteActivityTagBytagName = async (req, res) => {
  try {
    const { tagIds } = req.body;
    if (!Array.isArray(tagIds)) {
      return res.status(400).json({ message: "Tags must be an array" });
    }

    const activityTags = await prisma.activityTags.findMany({
      where: {
        activityId: req.params.activityId,
        tagId: {
          in: tagIds,
        },
      },
    });
    if (activityTags.length === 0) {
      return res.status(404).json({ message: "Tags not found" });
    }
    await prisma.activityTags.deleteMany({
      where: {
        activityId: req.params.activityId,
        tagId: {
          in: tagIds,
        },
      },
    });
    return res
      .status(200)
      .json({ message: "Tags deleted from activity", activityTags });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
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

    return res.status(201).json({
      message: "Reservation successful",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reserve activity",
      error: error.message,
    });
  }
};

const getActivityTickets = async (req, res) => {
  try {
    const reservations = await prisma.ticket.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        activity: {
          select: {
            title: true,
            startTime: true,
            endTime: true,
            startDay: true,
            endDay: true,
            location: true,
            coverPic: true,
          },
        },
      },
    });
    if (reservations.length === 0) {
      return res.status(404).json({ message: "No reservations found" });
    }
    return res.status(200).json({
      message: "Activity reservations fetched successfully",
      reservations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activity reservations",
      error: error.message,
    });
  }
};

const getActivityReservations = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId: req.user.userId,
        // deletedAt: null
      },
    });
    const activityIds = activities.map((activity) => activity.activityId);
    if (activityIds.length === 0) {
      return res.status(404).json({ message: "No activities found" });
    }
    const reservations = await prisma.ticket.findMany({
      where: {
        activityId: {
          in: activityIds,
        },
      },
      include: {
        user: {
          select: {
            userName: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        activity: {
          select: {
            title: true,
            startDay: true,
            startTime: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (reservations.length === 0) {
      return res.status(404).json({ message: "No reservations found" });
    }
    return res.status(200).json({
      message: "reservations fetched successfully",
      reservations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activity reservations",
      error: error.message,
    });
  }
};

const saveActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
     const savedActivity = await prisma.saveAct.create({
      data: {
        userId: req.user.userId,
        activityId,
      },
    });
    return res.status(201).json({ message: "Activity saved successfully", savedActivity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to save activity",
      error: error.message,
    });
  }
}

const getSavedActivities = async (req, res) => {
  try {
    const savedActivities = await prisma.saveAct.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        activity: {
          select: {
            title: true,
            startTime: true,
            endTime: true,
            startDay: true,
            endDay: true,
            location: true,
            coverPic: true,
          },
        },
      },
    });
    if (savedActivities.length === 0) {
      return res.status(404).json({ message: "No saved activities found" });
    }
    return res.status(200).json({ message: "Saved activities fetched successfully", savedActivities });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch saved activities",
      error: error.message,
    });
  }
};


module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  getActivityByCategory,
  getActivitiesBytags,
  deleteActivity,
  addTagsToActivity,
  deleteActivityTagBytagName,
  reserveActivity,
  getActivityTickets,
  getActivityReservations,
  getMyActivities,
  getActivityByCity,
  saveActivity,
  getSavedActivities
};
