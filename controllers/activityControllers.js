const prisma = require("../utils/client");
const { createNotification } = require("../utils/notification");
const { stripe } = require("../config/stripe");
const { createTicket } = require("../utils/ticket");
const { convertToISODate } = require("../utils/validation");

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
      tags,
    } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const activity = await prisma.activity.create({
      data: {
        coverPic,
        title,
        description,
        startTime,
        endTime,
        location,
        startDay: convertToISODate(startDay),
        endDay: convertToISODate(endDay),
        seat: parseInt(seat),
        price: parseInt(price),
        score: 0,
        user: {
          connect: {
            userId: user.userId,
          },
        },
        category: {
          connect: {
            categoryId: user.categoryId,
          },
        },
        city: {
          connect: {
            cityId,
          },
        },
      },
    });

    const tagsArray = tags.split("-");

    await Promise.all(
      tagsArray.map((tag) =>
        prisma.activityTags.create({
          data: {
            activity: {
              connect: {
                activityId: activity.activityId,
              },
            },
            tag: {
              connect: {
                tagId: tag,
              },
            },
          },
        })
      )
    );
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
    const { seats, category, date, my, search, page = 1 } = req.query;
    let startDay = null;
    let endDay = null;

    if (date) {
      const [startDayStr, endDayStr] = date.split("_");

      if (startDayStr && endDayStr) {
        startDay = new Date(parseInt(startDayStr, 10));
        endDay = new Date(parseInt(endDayStr, 10));
      } else {
        return res
          .status(400)
          .json({ error: "Invalid date format. Expected startDay_endDay." });
      }
    }

    const numberToTake = 10;

    const filters = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && { category: { categoryName: category } }),
      ...(seats && { seat: { lt: parseInt(seats) } }),
      ...(my === "own" && { userId: req.user?.userId }),
      ...(startDay && {
        startDay: {
          gte: startDay,
        },
      }),
      endDay: {
        gt: new Date(), // Ensures endDay is greater than today
        ...(endDay && { lte: endDay }), // Retains existing endDay filter if provided
      },
    };

    const activities = await prisma.activity.findMany({
      where: filters,
      take: numberToTake,
      skip: (page - 1) * numberToTake,
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
        category: { select: { categoryName: true } },
        city: { select: { cityName: true } },
        ticket: { select: { quantity: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalActivities = await prisma.activity.count({ where: filters });
    const totalPages = Math.ceil(totalActivities / numberToTake);

    if (!activities) {
      return res.status(404).json({ message: "No activities found" });
    }

    return res.status(200).json({
      message: "Activities fetched successfully",
      activities: activities.map((activity) => ({
        ...activity,
        joined: activity.ticket.reduce(
          (sum, ticket) => sum + ticket.quantity,
          0
        ), // Sum all ticket quantities
      })),
      pages: totalPages,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch activities", error: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { description, coverPic, location } = req.body;
    const activity = await prisma.activity.findFirst({
      where: {
        activityId: req.params.activityId,
        userId: req.user.userId,
      },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    await prisma.activity.update({
      where: { activityId: req.params.activityId },
      data: {
        description,
        coverPic,
        location,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to update activity", error: error.message });
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
        category: { select: { categoryName: true } },
        city: { select: { cityName: true } },
        ticket: { select: { quantity: true } },
      },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json({
      message: "Activity fetched successfully",
      activity: {
        ...activity,
        joined: activity.ticket.reduce(
          (sum, ticket) => sum + ticket.quantity,
          0
        ),
      },
    });
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
      where: {
        activityId,
      },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
    });

    if (activity.userId !== req.user.userId && user.role !== "ADMIN") {
      return res.status(403).json({
        message: "You are not allowed to delete this activity",
      });
    }
    await prisma.activity.update({
      where: { activityId },
      data: {
        deletedAt: new Date(),
      },
    });
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

const deleteActivityTag = async (req, res) => {
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
    const { userId } = req.user;

    const activity = await prisma.activity.findFirst({
      where: { activityId },
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const existedreview = await prisma.review.findFirst({
      where: {
        userId,
        activityId,
      },
    });
    if (existedreview) {
      await prisma.review.delete({
        where: { reviewId: existedreview.reviewId },
      });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        activityId,
        stars: parseInt(stars),
        comment,
      },
    });

    const currentReviews = await prisma.review.findMany({
      where: { activityId },
      select: { stars: true },
    });

    if (currentReviews.length > 0) {
      const totalScore = currentReviews.reduce(
        (sum, review) => sum + review.stars,
        0
      );
      const averageScore = totalScore / currentReviews.length;

      // Round the average score to the nearest integer
      await prisma.activity.update({
        where: { activityId },
        data: {
          score: Math.round(averageScore), // Ensure score is passed as an integer
        },
      });
    }

    // const reviewer = await prisma.user.findUnique({
    //   where: { userId: req.user.userId },
    //   select: { userName: true },
    // });
    // await createNotification(
    //   userId,
    //   activity.user.userId,
    //   `${reviewer.userName} has reviewed your activity "${activity.title}"`
    // );
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
          },
        },
        comment: true,
        stars: true,
      },
    });
    if (!reviews) {
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

const getUserActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const activities = await prisma.activity.findMany({
      where: { userId: id },
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
        category: { select: { categoryName: true } },
        city: { select: { cityName: true } },
        ticket: { select: { quantity: true } },
      },
    });
    if (activities.length < 0)
      return res.status(404).json({ message: "Review not found" });
    return res
      .status(200)
      .json({ message: "Review updated successfully", activities });
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
    const review = await prisma.review.findFirst({
      where: {
        reviewId,
        userId: req.user.userId,
      },
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    const updatedReview = await prisma.review.update({
      where: {
        reviewId,
        userId: req.user.userId,
      },
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
      where: {
        reviewId,
        userId: req.user.userId,
      },
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    await prisma.review.delete({
      where: {
        reviewId,
        userId: req.user.userId,
      },
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
    return res.status(500).json({
      message: "Failed to fetch repported activities",
      error: error.message,
    });
  }
};

const checkRepport = async (req, res) => {
  try {
    const { repportId } = req.params;
    const repport = await prisma.repportAct.findFirst({
      where: { repportActId: repportId },
    });
    if (!repport) {
      return res.status(404).json({ message: "Repport not found" });
    }
    const updatedRepport = await prisma.repportAct.update({
      where: { repportActId: repportId },
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

const payment = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { quantity, currency, CardholderName, email, Country } = req.body;
    const userId = req.user.userId;

    if (!activityId || !quantity || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const activity = await prisma.activity.findUnique({
      where: { activityId },
    });

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    if (activity.seat < quantity) {
      return res.status(400).json({
        error: "Not enough seats available",
        availableSeats: activity.seat,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: activity.price * quantity * 100,
      currency,
      payment_method_types: ["card"],
      metadata: {
        activityId,
        userId,
        quantity,
        name: CardholderName,
        email,
        Country,
      },
    });
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Stripe payment error:", error);
    return res.status(500).json({
      error: "Payment processing failed",
      message: error.message,
    });
  }
};

const paymentIntent = async (req, res) => {
  try {
    const paymentIntentId = req.params.paymentIntentId;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const userId = paymentIntent.metadata.userId;
    const activityId = paymentIntent.metadata.activityId;
    const quantity = paymentIntent.metadata.quantity;
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        paymentIntentId,
      },
    });
    if (existingTicket) {
      return res.status(400).json({
        error: "Payment has already been processed for this intent",
      });
    }
    if (paymentIntent.status === "succeeded") {
      const ticket = await createTicket(
        userId,
        activityId,
        parseInt(quantity),
        paymentIntentId
      );
      console.log(
        `Création de ${quantity} tickets pour l'activité ${activityId} pour l'utilisateur ${userId}`
      );
      console.log(ticket);
      return res.status(200).json({ ticket,
        ticketId:ticket.ticketId
       });
    } else {
      return res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.error("Failed to retrieve payment intent:", error.message);
    return res.status(500).json({ message: "Failed to process payment" });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { ticketId },
    });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    return res.status(200).json({ ticket });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch ticket", error: error.message });
  }
}

const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erreur de vérification de signature webhook:", err.message);
    return res.status(400).send(`Erreur webhook: ${err.message}`);
  }

  // Traiter l'événement
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { userId, activityId, quantity } = paymentIntent.metadata;

    try {
      // Créer les tickets après que le paiement a réussi
      await createTicket(userId, activityId, parseInt(quantity));
      console.log(
        `Création de ${quantity} tickets pour l'activité ${activityId} pour l'utilisateur ${userId}`
      );
    } catch (error) {
      console.error("Erreur lors de la création des tickets:", error);
      // Considérez d'implémenter un mécanisme de réessai ou un système d'alerte ici
    }
  }
  // Renvoyer une réponse 200 pour confirmer la réception de l'événement
  res.status(200).json({ received: true });
};

module.exports = {
  createActivity,
  getActivities,
  updateActivity,
  getActivityById,
  getActivityByCategory,
  getActivitiesBytags,
  deleteActivity,
  addTagsToActivity,
  deleteActivityTag,
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
  payment,
  handleWebhook,
  paymentIntent,
  getTicketById,
  getUserActivities,
};
