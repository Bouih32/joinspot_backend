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
            userId: req.user.userId,
          },
        },
        category: {
          connect: {
            categoryId: user.categoryId,
          },
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
    return res
      .status(200)
      .json({ message: "Activities fetched successfully", activities });
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
    return res
      .status(201)
      .json({ message: "Activity saved successfully", savedActivity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to save activity",
      error: error.message,
    });
  }
};

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
    return res.status(200).json({
      message: "Saved activities fetched successfully",
      savedActivities,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch saved activities",
      error: error.message,
    });
  }
};

const unSaveActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const savedActivity = await prisma.saveAct.findFirst({
      where: {
        userId: req.user.userId,
        activityId,
      },
    });
    if (!savedActivity) {
      return res.status(404).json({ message: "Saved activity not found" });
    }
    await prisma.saveAct.delete({
      where: {
        saveActId: savedActivity.saveActId,
      },
    });
    return res
      .status(200)
      .json({ message: "Saved activity deleted successfully", savedActivity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete saved activity",
      error: error.message,
    });
  }
};

const addReview = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { stars, comment } = req.body;
    const existedreview = await prisma.review.findFirst({
      where: {
        userId: req.user.userId,
        activityId,
      },
    });
    if (existedreview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this activity" });
    }
    const activity = await prisma.activity.findFirst({
      where: { activityId },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const review = await prisma.review.create({
      data: {
        userId: req.user.userId,
        activityId,
        stars,
        comment,
      },
    });
    return res
      .status(201)
      .json({ message: "Review added successfully", review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to add review",
      error: error.message,
    });
  }
};

const getReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        activityId: req.params.activityId,
      },
      select: {
        user: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        comment: true,
        stars: true,
      },
    });
    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }
    return res
      .status(200)
      .json({ message: "Reviews fetched successfully", reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const review = await prisma.review.findUnique({
      where: { reviewId },
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    const updatedReview = await prisma.review.update({
      where: { reviewId },
      data: { rating, comment },
    });
    return res
      .status(200)
      .json({ message: "Review updated successfully", updatedReview });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update review",
      error: error.message,
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await prisma.review.findFirst({
      where: { reviewId },
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    await prisma.review.delete({
      where: { reviewId },
    });
    return res
      .status(200)
      .json({ message: "Review deleted successfully", review });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to delete review", error: error.message });
  }
};

const repportActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { description } = req.body;
    const activity = await prisma.activity.findUnique({
      where: { activityId },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const existedRepport = await prisma.repportAct.findFirst({
      where: {
        userId: req.user.userId,
        activityId,
      },
    });
    if (existedRepport) {
      return res
        .status(400)
        .json({ message: "You have already reported this activity" });
    }
    await prisma.repportAct.create({
      data: {
        userId: req.user.userId,
        activityId,
        description,
        status: "pending",
      },
    });
    return res.status(201).json({ message: "Activity reported successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to report activity", error: error.message });
  }
};

const getRepportedActivities = async (req, res) => {
  try {
    const repportedActivities = await prisma.repportAct.findMany({
      include: {
        activity: {
          select: {
            title: true,
          },
        },
      },
    });
    if (repportedActivities.length === 0) {
      return res.status(404).json({ message: "No repported activities found" });
    }
    return res.status(200).json({
      message: "Repported activities fetched successfully",
      repportedActivities,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        message: "Failed to fetch repported activities",
        error: error.message,
      });
  }
};

const checkRepport = async (req, res) => {
  try {
    const { repportId } = req.params;
    const repport = await prisma.repportAct.findUnique({
      where: { repportId },
    });
    if (!repport) {
      return res.status(404).json({ message: "Repport not found" });
    }
    const updatedRepport = await prisma.repportAct.update({
      where: { repportId },
      data: { status: "checked" },
    });
    return res
      .status(200)
      .json({ message: "Repport checked successfully", updatedRepport });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to check repport", error: error.message });
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
  getSavedActivities,
  unSaveActivity,
  addReview,
  getReviews,
  updateReview,
  deleteReview,
  repportActivity,
  getRepportedActivities,
  checkRepport,
};
