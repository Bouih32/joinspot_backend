const bcrypt = require("bcryptjs");
const prisma = require("../utils/client");
const { generateAcessToken } = require("../middlewares/auth");
const crypto = require("crypto");
const { createNotification } = require("../utils/notification");

const nodemailer = require("nodemailer");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const registerUser = async (req, res) => {
  try {
    const {
      username,
      fullName,
      email,
      city,
      role,
      password,
      proveBy,
      categoryName,
      degreeName,
      schoolName,
      year,
      frontPic,
      justification,
      justificationPic,
      idFrontPic,
      idBackPic,
    } = req.body;

    const [existingUser, isCity, isCategory] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.city.findUnique({ where: { cityName: city } }),
      categoryName
        ? prisma.category.findUnique({ where: { categoryName } })
        : null,
    ]);

    if (existingUser)
      return res.status(400).send({ message: "Email is already in use." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const bgs = await prisma.background.findMany({});
    const userBg = bgs.filter((ele) => ele.type === "VISITOR")[
      Math.floor(Math.random() * bgs.length)
    ];

    const newUser = await prisma.user.create({
      data: {
        userName: username,
        fullName,
        email,
        cityId: isCity.cityId,
        deletedAt: null,
        password: hashedPassword,
        categoryId: role === "organiser" ? isCategory.categoryId : null,
        idFrontPic: role === "organiser" ? idFrontPic : null,
        idBackPic: role === "organiser" ? idBackPic : null,
        bgId: userBg.bgId,
      },
    });

    if (role === "organiser") {
      await prisma.degree.create({
        data: {
          userId: newUser.userId,
          degreeName: proveBy === "degree" ? degreeName : null,
          school: proveBy === "degree" ? schoolName : null,
          year: proveBy === "degree" ? Number(year) : null,
          frontPic: proveBy === "degree" ? frontPic : null,
          justification: proveBy === "business" ? justification : null,
          justificationPic: proveBy === "business" ? justificationPic : null,
        },
      });
    }
    return res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).send({ message: "Uncorect password" });
    }

    if (user.deletedAt !== null) {
      return res.status(403).send({ message: "You are baned" });
    }

    const token = generateAcessToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });
    res.cookie("token", token, {
      httpOnly: isProduction,
      secure: isProduction, // Only require HTTPS in production
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: isProduction ? ".joinspots.com" : undefined, // Don't set domain for localhost
      path: "/",
    });

    return res.status(200).json({ message: "Login successful!", user, token });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur interne du serveur", error: error.message });
  }
};

const getProfileData = async (req, res) => {
  try {
    const { userId } = req.user;

    const userData = await prisma.user.findUnique({
      where: { userId },
      select: {
        userName: true,
        avatar: true,
        background: { select: { link: true } },
      },
    });

    const activities = await prisma.activity.count({ where: { userId } });
    const activeActivities = await prisma.activity.count({
      where: {
        userId: userId,
        endDay: { gte: new Date() },
      },
    });
    const followers = await prisma.follow.count({
      where: { followingId: userId },
    });

    const joinedActivitiesNum = await prisma.ticket.findMany({
      where: { activity: { userId } },
      select: {
        quantity: true,
        activity: {
          select: { price: true },
        },
      },
    });

    const totalRevenue = joinedActivitiesNum.reduce((acc, ticket) => {
      const quantity = ticket.quantity ?? 0;
      const price = ticket.activity?.price ?? 0;
      return acc + quantity * price;
    }, 0);

    const joinedNum = joinedActivitiesNum.reduce(
      (acc, ticket) => acc + (ticket.quantity ?? 0),
      0
    );

    const following = await prisma.follow.count({
      where: { followerId: userId },
    });

    return res.status(200).json({
      message: "data recieved successfully",
      data: {
        user: userData,
        activityNumber: activities,
        followersNum: followers,
        followingNum: following,
        totalRevenue: totalRevenue,
        activeActivities: activeActivities,
        joinedNum: joinedNum,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error server",
      error: error.message,
    });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const activities = await prisma.activity.count();
    const joinedActivitiesNum = await prisma.ticket.findMany({
      select: {
        quantity: true,
        activity: {
          select: { price: true },
        },
      },
    });

    const totalRevenue = joinedActivitiesNum.reduce((acc, ticket) => {
      const quantity = ticket.quantity ?? 0;
      const price = ticket.activity?.price ?? 0;
      return acc + quantity * price * 0.2;
    }, 0);

    const usersNum = await prisma.user.count();

    return res.status(200).json({
      message: "data recieved successfully",
      data: {
        totalRevenue: totalRevenue,
        activeActivities: activities,
        joinedNum: usersNum,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error server",
      error: error.message,
    });
  }
};

const RequestDegrees = async (req, res) => {
  try {
    const degrees = await prisma.degree.findMany({
      where: { status: "PENDING" },
      select: {
        degreeId: true,
        degreeName: true,
        school: true,
        year: true,
        frontPic: true,
        backPic: true,
        justification: true,
        justificationPic: true,

        user: {
          select: {
            userId: true,
            email: true,
            userName: true,
            avatar: true,
            idBackPic: true,
            idFrontPic: true,
            category: { select: { categoryName: true } },
          },
        },
      },
    });
    if (!degrees) {
      return res.status(404).json({ message: "No degrees found" });
    }
    return res.status(200).json({ degrees });
  } catch (error) {
    console.error("Error getting degrees:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const ChangeRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === role) {
      return res.status(400).json({ message: "User already has this role" });
    }
    await prisma.user.update({
      where: { userId },
      data: { role },
    });
    return res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error changing role:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getStatusUpdate = async (req, res) => {
  try {
    const { userId } = req.user.userId;
    const status = await prisma.degree.findFirst({
      where: { userId, status: "PENDING" },
      select: { status: true },
    });

    return res.status(200).json({ message: "upgrade status", status });
  } catch (error) {
    console.error("Error changing role:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getUserTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.userId },
      include: {
        activity: {
          select: {
            location: true,
            seat: true,
            title: true,
            price: true,
            endDay: true,
            startDay: true,
            user: {
              select: { userName: true }, // Select the owner's name
            },
            category: { select: { categoryName: true } },
            city: { select: { cityName: true } },
          },
        },
      },
    });

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    };

    const strucuredData = tickets.map((ele) => ({
      activityId: ele.activityId,
      category: ele.activity.category.categoryName,
      seats: ele.activity.seat,
      location: ele.activity.location,
      city: ele.activity.city.cityName,
      organizer: ele.activity.user.userName,
      code: ele.code,
      quantity: ele.quantity,
      title: ele.activity.title,
      date: formatDate(ele.activity.startDay),
      ended: Date.now() > new Date(ele.activity.endDay),
      totalPaid: ele.quantity * ele.activity.price,
      ticketDate: formatDate(ele.createdAt),
    }));
    return res
      .status(200)
      .json({ message: "recieved successfully", strucuredData });
  } catch (error) {
    console.error("Error :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getJoined = async (req, res) => {
  try {
    const { userId } = req.user;
    const tickets = await prisma.ticket.findMany({
      where: { activity: { userId } },
      select: {
        ticketId: true,
        code: true,
        quantity: true,
        used: true,
        user: {
          select: {
            userId: true,
            avatar: true,
            userName: true,
          },
        },

        activity: {
          select: {
            title: true,
            price: true,
          },
        },
      },
    });

    if (!tickets) return res.status(404).json({ message: "No tickets found" });

    const strucuredData = tickets.map((ele) => ({
      avatar: ele.user.avatar,
      userName: ele.user.userName,
      id: ele.ticketId,
      payed: ele.activity.price * ele.quantity,
      quantity: ele.quantity,
      code: ele.code,
      used: ele.used,
      title: ele.activity.title,
      userId: ele.user.userId,
    }));
    return res
      .status(200)
      .json({ message: "recieved successfully", strucuredData });
  } catch (error) {
    console.error("Error :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getUserData = async (req, res) => {
  try {
    const userFull = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
      include: { city: { select: { cityName: true } } },
    });

    const userSocials = await prisma.socials.findMany({
      where: { userId: req.user.userId },
    });
    if (!userFull) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...user } = userFull;
    const userData = { ...user, userSocials };
    return res.status(200).json({ user: userData });
  } catch (error) {
    console.error("Error getting profil:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await prisma.user.findFirst({
      where: { userId },
      select: {
        userName: true,
        role: true,
        avatar: true,
        background: { select: { link: true } },
        bio: true,
        city: { select: { cityName: true } },
        socials: {
          select: { link: true, platform: true },
        },
      },
    });

    const tags = await prisma.userTags.findMany({
      where: { userId },
      select: {
        tag: {
          select: { tagName: true },
        },
      },
    });

    const activities = await prisma.activity.count({ where: { userId } });

    const followers = await prisma.follow.count({
      where: { followingId: userId },
    });

    const following = await prisma.follow.count({
      where: { followerId: userId },
    });

    return res.status(200).json({
      message: "data recieved successfully",
      data: {
        user: userData,
        activityNumber: activities,
        followersNum: followers,
        followingNum: following,
        tags: tags.map((ele) => ele.tag.tagName),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error server",
      error: error.message,
    });
  }
};

const getActiveActivities = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId: req.user.userId,
        endDay: { gte: new Date() },
      },
      select: {
        deletedAt: true,
        title: true,
        price: true,
        endDay: true,
        ticket: {
          select: {
            quantity: true,
          },
        },
      },
    });

    // Process the data to compute total revenue per activity
    const activeActivities = activities.map((activity) => ({
      deletedAt: activity.deletedAt,
      title: activity.title,
      endDay: activity.endDay,
      totalTickets: activity.ticket.reduce(
        (sum, ticket) => sum + ticket.quantity,
        0
      ),
      totalRevenue:
        activity.ticket.reduce((sum, ticket) => sum + ticket.quantity, 0) *
        (activity.price || 0),
    }));

    if (!activeActivities) {
      return res.status(404).json({ message: "no active activitiesfound" });
    }

    return res.status(200).json({ activeActivities });
  } catch (error) {
    console.error("Error getting profil:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getAdminActivities = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      select: {
        activityId: true,
        title: true,
        price: true,
        endDay: true,
        deletedAt: true,
        ticket: {
          select: {
            quantity: true,
          },
        },
      },
    });

    // Process the data to compute total revenue per activity
    const activeActivities = activities.map((activity) => ({
      deletedAt: activity.deletedAt,
      activityId: activity.activityId,
      title: activity.title,
      endDay: activity.endDay,
      totalTickets: activity.ticket.reduce(
        (sum, ticket) => sum + ticket.quantity,
        0
      ),
      totalRevenue:
        activity.ticket.reduce((sum, ticket) => sum + ticket.quantity, 0) *
        (activity.price || 0),
    }));

    if (!activeActivities) {
      return res.status(404).json({ message: "no active activitiesfound" });
    }

    return res.status(200).json({ activeActivities });
  } catch (error) {
    console.error("Error getting profil:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getUserRevenue = async (req, res) => {
  try {
    const tickets = await prisma.ticket.groupBy({
      by: ["activityId"],
      _sum: {
        quantity: true,
      },
      where: {
        activity: { userId: req.user.userId },
      },
    });

    const activityRevenue = await Promise.all(
      tickets.map(async (ticket) => {
        const activity = await prisma.activity.findUnique({
          where: { activityId: ticket.activityId },
          select: { title: true, price: true },
        });

        return {
          title: activity?.title,
          totalRevenue: (activity?.price || 0) * (ticket._sum.quantity || 0),
        };
      })
    );

    if (!tickets) {
      return res.status(404).json({ message: "No tickets found" });
    }

    return res.status(200).json({ activityRevenue });
  } catch (error) {
    console.error("Error getting profil:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getAdminRevenue = async (req, res) => {
  try {
    const tickets = await prisma.ticket.groupBy({
      by: ["activityId"],
      _sum: {
        quantity: true,
      },
    });

    const activityRevenue = await Promise.all(
      tickets.map(async (ticket) => {
        const activity = await prisma.activity.findUnique({
          where: { activityId: ticket.activityId },
          select: { title: true, price: true },
        });

        return {
          title: activity?.title,
          totalRevenue:
            (activity?.price * 0.2 || 0) * (ticket._sum.quantity || 0),
        };
      })
    );

    if (!tickets) {
      return res.status(404).json({ message: "No tickets found" });
    }

    return res.status(200).json({ activityRevenue });
  } catch (error) {
    console.error("Error getting profil:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const updateUserData = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const updates = req.body;
    if (updates.role)
      return res
        .status(404)
        .json({ message: "Vous ne pouvez pas modifier votre role" });
    if (updates.password)
      return res.status(404).json({
        message: "Vous pouvez changer votre mot de passe dans edit-password",
      });
    await prisma.user.update({
      where: {
        userId: req.user.userId,
      },
      data: updates,
    });

    return res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

const updateSocials = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const updates = req.body;

    await Promise.all(
      updates.map((ele) =>
        prisma.socials.upsert({
          where: {
            userId_platform: {
              userId: req.user.userId,
              platform: ele.platform, // Ensure platform is unique
            },
          },
          update: ele, // Update existing entry
          create: {
            userId: req.user.userId,
            ...ele, // Create new entry if not found
          },
        })
      )
    );

    return res.status(200).json({ message: "socials updated successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Password is incorrect " });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: {
        userId: req.user.userId,
      },
      data: { password: hashedPassword },
    });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error server", error: error.message });
  }
};

const logOut = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction, // Only require HTTPS in production
    sameSite: isProduction ? "none" : "lax",
    domain: isProduction ? ".joinspots.com" : undefined, // Don't set domain for localhost
    path: "/",
  });
  res.send({ message: "logged out successful" });
};

// User management
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        userName: true,
        avatar: true,
        deletedAt: true,
      },
    });
    if (users.length == 0)
      return res.status(404).json({ message: "No users found" });
    return res.status(200).json({ users: users });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users" });
  }
};

const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) return res.status(404).json({ message: "No users found" });

    await prisma.user.update({
      where: {
        userId: user.userId,
      },
      data: { deletedAt: !user.deletedAt ? new Date() : null },
    });

    await prisma.activity.updateMany({
      where: { userId },
      data: { deletedAt: !user.deletedAt ? new Date() : null },
    });

    return res.status(200).json({ message: "User baned seccessfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error baning users", error });
  }
};

const getDeletedUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
    });
    if (users.length == 0)
      return res.status(404).json({ message: "No users found" });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: {
        userId: id,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// management UserTags
const addTagsToUser = async (req, res) => {
  try {
    const tagIds = req.body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        message: "Tags must be an array and not empty",
        received: req.body,
      });
    }

    // Vérifier les doublons existants
    await prisma.userTags.deleteMany({
      where: {
        userId: req.user.userId,
      },
    });

    // Créer les nouvelles associations
    await prisma.userTags.createMany({
      data: tagIds.map((tagId) => ({
        userId: req.user.userId,
        tagId: tagId,
      })),
    });

    // Récupérer tous les tags de l'utilisateur

    return res.status(200).json({
      message: "Tags ajoutés avec succès",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

const getUserTags = async (req, res) => {
  try {
    const userTags = await prisma.userTags.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        tag: {
          select: {
            tagId: true,
            tagName: true,
            categoryId: true,
            deletedAt: true,
          },
        },
      },
    });

    if (userTags.length < 0) {
      return res.status(404).json({ message: "No tags found" });
    }

    const tags = userTags.map((userTag) => ({
      categoryId: userTag.tag.categoryId,
      tagId: userTag.tag.tagId,
      tagName: userTag.tag.tagName,
      deletedAt: userTag.tag.deletedAt,
    }));

    return res.status(200).json({
      message: "User tags fetched",
      tags,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const deleteUserTag = async (req, res) => {
  try {
    const userTag = await prisma.userTags.findFirst({
      where: {
        userId: req.user.userId,
        tagId: req.params.id,
      },
    });
    if (!userTag) {
      return res.status(400).json({ message: "Tag not found" });
    }
    await prisma.userTags.delete({
      where: {
        userTagsId: userTag.userTagsId,
      },
    });
    return res.status(200).json({ message: "User tag deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// UserFollow
const followUser = async (req, res) => {
  try {
    const { following } = req.body;
    if (req.user.userId === following) {
      return res.status(400).json({ message: "You can't follow yourself." });
    }

    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: req.user.userId,
        followingId: following,
      },
    });
    if (existingFollow) {
      await prisma.follow.delete({
        where: { followId: existingFollow.followId },
      });
      return res.status(201).json({ message: "unfollow successfull." });
    }
    await prisma.follow.create({
      data: {
        followerId: req.user.userId,
        followingId: following,
      },
    });
    const follower = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: { userName: true },
    });
    await createNotification(
      req.user.userId,
      following,
      `${follower.userName} just followed you`
    );
    return res.status(201).json({ message: "Follow-up successful." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getFollowersAndFollowing = async (req, res) => {
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: req.user.userId },
      include: { follower: { select: { userId: true, userName: true } } },
    });

    const following = await prisma.follow.findMany({
      where: { followerId: req.user.userId },
      include: { following: { select: { userId: true, userName: true } } },
    });

    return res.status(200).json({
      followersCount: followers.length,
      followers: followers.map((f) => f.follower),
      followingCount: following.length,
      following: following.map((f) => f.following),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const getUserFollowing = async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.userId },
      select: { following: { select: { userId: true } } },
    });

    return res
      .status(200)
      .json({ ids: following.map((ele) => ele.following.userId) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

const UnfollowUser = async (req, res) => {
  try {
    const { following } = req.body;
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: req.user.userId,
        followingId: following,
      },
    });
    if (!existingFollow) {
      return res.status(400).json({ message: "You don't follow this user." });
    }
    await prisma.follow.delete({
      where: { followId: existingFollow.followId },
    });
    res.status(200).json({ message: "Unfollow successful." });
  } catch (error) {
    console.error(error);
  }
};

const upgradeRequest = async (req, res) => {
  try {
    const {
      proveBy,
      categoryName,
      degreeName,
      schoolName,
      year,
      frontPic,
      justification,
      justificationPic,
      idFrontPic,
      idBackPic,
    } = req.body;

    const isCategory = prisma.category.findUnique({ where: { categoryName } });

    await prisma.user.update({
      where: { userId: req.user.userId },
      data: {
        categoryId: isCategory.categoryId,
        idFrontPic: idFrontPic,
        idBackPic: idBackPic,
      },
    });

    await prisma.degree.create({
      data: {
        userId: req.user.userId,
        degreeName: proveBy === "degree" ? degreeName : null,
        school: proveBy === "degree" ? schoolName : null,
        year: proveBy === "degree" ? Number(year) : null,
        frontPic: proveBy === "degree" ? frontPic : null,
        justification: proveBy === "business" ? justification : null,
        justificationPic: proveBy === "business" ? justificationPic : null,
      },
    });

    return res.status(200).json({ message: "resuest added successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// management City
const addCity = async (req, res) => {
  try {
    const { cityName, cover } = req.body;
    const existingCity = await prisma.city.findUnique({
      where: { cityName },
    });
    if (existingCity) {
      return res.status(400).json({ message: "City already exists" });
    }
    const city = await prisma.city.create({
      data: {
        cityName,
        cover,
      },
    });
    return res.status(200).json({ message: "City added successfully", city });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getCities = async (req, res) => {
  try {
    const cities = await prisma.city.findMany();
    return res.status(200).send({ message: "success", cities });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const deleteCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    await prisma.city.delete({ where: { cityId } });
    return res.status(200).json({ message: "City deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const updateUserCity = async (req, res) => {
  try {
    const { cityId } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await prisma.user.update({
      where: {
        userId: req.user.userId,
      },
      data: {
        cityId: cityId,
      },
    });
    const city = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
      include: {
        city: {
          select: {
            cityName: true,
          },
        },
      },
    });
    return res.status(200).json({ message: "City updated successfully", city });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const repportUser = async (req, res) => {
  try {
    const { repport_to, description } = req.body;
    const repport = await prisma.repportUser.findFirst({
      where: {
        repport_from: req.user.userId,
        repport_to: repport_to,
      },
    });
    if (repport) {
      return res
        .status(400)
        .json({ message: "You have already repported this user." });
    }
    await prisma.repportUser.create({
      data: {
        repport_from: req.user.userId,
        repport_to: repport_to,
        description,
        status: "pending",
      },
    });
    return res.status(200).json({ message: "User repported successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getRepportedUsers = async (req, res) => {
  try {
    const repportedUsers = await prisma.repportUser.findMany({
      where: { status: "pending" },
    });
    if (repportedUsers.length === 0) {
      return res.status(404).json({ message: "No repported users found" });
    }
    return res.status(200).json({ repportedUsers });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const checkRepport = async (req, res) => {
  try {
    const { repportId } = req.params;
    const repport = await prisma.repportUser.findFirst({
      where: {
        repportUserId: repportId,
      },
    });
    if (!repport) {
      return res.status(404).json({ message: "Repport not found" });
    }
    await prisma.repportUser.update({
      where: {
        repportUserId: repportId,
      },
      data: {
        status: "checked",
      },
    });
    return res.status(200).json({ message: "Repport checked successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { toId, content } = req.body;
    const toUser = await prisma.user.findUnique({
      where: { userId: toId },
    });
    if (!toUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const message = await prisma.message.create({
      data: {
        fromId: req.user.userId,
        toId,
        content: content,
        read: false,
        deletedAt: null,
      },
    });

    return res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        toId: req.user.userId,
      },
      select: {
        message_from: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        content: true,
        createdAt: true,
        deletedAt: true,
        messageId: true,
        read: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!messages) {
      return res.status(404).json({ message: "No messages found" });
    }
    return res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getMessageDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({
      where: {
        messageId,
      },
      select: {
        message_from: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        content: true,
        createdAt: true,
        messageId: true,
        read: true,
      },
    });
    if (!message) {
      return res.status(404).json({ message: "No message found" });
    }
    return res.status(200).json({ message });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getMessagesByUser = async (req, res) => {
  try {
    const receivedMessages = await prisma.message.findMany({
      where: {
        fromId: req.params.toId,
        toId: req.user.userId,
      },
      select: {
        message_from: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        content: true,
        createdAt: true,
        read: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const sentMessages = await prisma.message.findMany({
      where: {
        fromId: req.user.userId,
        toId: req.params.toId,
      },
      select: {
        message_from: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        content: true,
        createdAt: true,
        read: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const messages = [...receivedMessages, ...sentMessages];
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (!messages) {
      return res.status(404).json({ message: "No messages found" });
    }
    return res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({
      where: { messageId },
    });
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    await prisma.message.update({
      where: { messageId },
      data: { read: true },
    });
    return res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const markAsUsed = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { ticketId },
    });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await prisma.ticket.update({
      where: { ticketId },
      data: { used: !ticket.used },
    });

    return res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({
      where: { messageId },
    });
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    await prisma.message.update({
      where: { messageId },
      data: { deletedAt: new Date() },
    });
    return res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getUnreadMessages = async (req, res) => {
  try {
    const unreadMessages = await prisma.message.findMany({
      where: {
        toId: req.user.userId,
        read: false,
      },
    });
    return res.status(200).json({ unreadMessages });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notif = await prisma.notification.findMany({
      where: {
        toId: req.user.userId,
      },
      select: {
        notification_from: {
          select: {
            userName: true,
            avatar: true,
          },
        },
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!notif) {
      return res.status(404).json({ message: "No messages found" });
    }
    return res.status(200).json({ notif });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await prisma.notification.delete({ where: { notificationId } });
    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const supports = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    if (user) {
      await prisma.message.create({
        data: {
          fromId: user.userId,
          toId: admin.userId,
          content: `I am contacting support for :${subject}, ${message}`,
          read: false,
        },
      });

      return res.status(200).json({
        message: "Message envoyé avec succès",
      });
    } else {
      const emailContent = `
        <h2>Nouveau message de support</h2>
        <p><strong>De:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Téléphone:</strong> ${phone}</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `;

      await sendEmail(
        process.env.SUPPORT_EMAIL || admin.email,
        `Nouveau message de support: ${subject}`,
        emailContent
      );

      // Envoyer un email de confirmation à l'expéditeur
      const confirmationEmail = `
        <h2>Confirmation de réception</h2>
        <p>Cher(e) ${firstName} ${lastName},</p>
        <p>Nous avons bien reçu votre message concernant "${subject}".</p>
        <p>Notre équipe vous répondra dans les plus brefs délais.</p>
        <p>Cordialement,<br>L'équipe JoinSpots</p>
      `;

      await sendEmail(
        email,
        "Confirmation de réception de votre message",
        confirmationEmail
      );
    }
    return res.status(200).json({
      message: "Email envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur support:", error);
    return res.status(500).json({
      message: "Erreur lors de l'envoi du message",
      error: error.message,
    });
  }
};

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.GMAIL_KEY,
  },
});

// Controller function to send email
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: process.env.MY_EMAIL,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const forgotPswrd = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).send({ message: "No user found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.reset.create({
      data: {
        token: resetToken,
        expiresAt,
        userId: user.userId,
      },
    });

    const link = `${process.env.FRONTEND_URL}/reset/${resetToken}`;

    // Send reset email
    await sendEmail(
      user.email,
      "Password Reset Request", // subject
      `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p>`
    );

    return res
      .status(200)
      .send({ message: "Password reset link sent successfully!" });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res
      .status(500)
      .json({ message: "Failed to send reset email", error: error.message });
  }
};

const resetForgotenPswrd = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const resetToken = await prisma.reset.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { userId: resetToken.userId },
      data: { password: hashedPassword },
    });

    return res.status(200).send({ message: "Password reset seccessfully" });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res
      .status(500)
      .json({ message: "Failed to send reset email", error: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  RequestDegrees,
  ChangeRole,
  getUserData,
  logOut,
  updateUserData,
  changePassword,
  getAllUsers,
  getDeletedUsers,
  getUserById,
  addTagsToUser,
  getUserTags,
  deleteUserTag,
  followUser,
  getFollowersAndFollowing,
  UnfollowUser,
  forgotPswrd,
  resetForgotenPswrd,
  addCity,
  getCities,
  deleteCity,
  updateUserCity,
  repportUser,
  getRepportedUsers,
  checkRepport,
  sendMessage,
  getMessages,
  getMessagesByUser,
  markAsRead,
  getUnreadMessages,
  getNotifications,
  deleteNotification,
  supports,
  getProfileData,
  getUserTickets,
  updateSocials,
  getMessageDetails,
  deleteMessage,
  getUserRevenue,
  getActiveActivities,
  getUserProfile,
  getJoined,
  markAsUsed,
  getUserFollowing,
  upgradeRequest,
  getStatusUpdate,
  getAdminStats,
  getAdminRevenue,
  banUser,
  getAdminActivities,
};
