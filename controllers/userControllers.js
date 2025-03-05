const bcrypt = require("bcryptjs");
const prisma = require("../utils/client");
const { generateAcessToken } = require("../middlewares/auth");
const crypto = require("crypto");
const { createNotification } = require("../utils/notification");

const nodemailer = require("nodemailer");
require("dotenv").config();

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
    const token = generateAcessToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    return res.status(200).json({ message: "Login successful!", user, token });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur interne du serveur", error: error.message });
  }
};

const getUserData = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
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
    const updatedUser = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
    });
    return res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
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
  res.clearCookie("token", { secure: true, httpOnly: true });
  res.send({ message: "logged out successful" });
};

// User management
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    if (users.length == 0)
      return res.status(404).json({ message: "No users found" });
    return res.status(200).json({ users: users });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users" });
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
    const { tagIds } = req.body;
    console.log(tagIds, "tagids");
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        message: "Tags must be an array and not empty",
        received: req.body,
      });
    }

    // Vérifier les doublons existants
    const existingUserTags = await prisma.userTags.findMany({
      where: {
        userId: req.user.userId,
        tagId: { in: tagIds },
      },
    });

    // Filtrer les tags déjà associés
    const newTagIds = tagIds.filter(
      (id) => !existingUserTags.some((ut) => ut.tagId === id)
    );

    if (newTagIds.length === 0) {
      return res.status(400).json({
        message: "All selected tags are already associated with the user",
      });
    }

    // Vérifier l'existence des tags
    const existingTags = await prisma.tag.findMany({
      where: { tagId: { in: newTagIds } },
    });

    if (existingTags.length !== newTagIds.length) {
      const notFoundTags = newTagIds.filter(
        (id) => !existingTags.some((tag) => tag.tagId === id)
      );
      return res.status(400).json({
        message: "Some tags don't exist",
        notFound: notFoundTags,
      });
    }

    // Créer les nouvelles associations
    await prisma.userTags.createMany({
      data: newTagIds.map((tagId) => ({
        userId: req.user.userId,
        tagId: tagId,
      })),
    });

    // Récupérer tous les tags de l'utilisateur
    const userTags = await prisma.userTags.findMany({
      where: { userId: req.user.userId },
      include: {
        tag: {
          select: {
            tagId: true,
            tagName: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Tags ajoutés avec succès",
      tags: userTags.map((ut) => ({
        tagId: ut.tag.tagId,
        tagName: ut.tag.tagName,
      })),
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
          },
        },
      },
    });

    if (!userTags.length) {
      return res.status(404).json({ message: "No tags found" });
    }

    const tags = userTags.map((userTag) => ({
      id: userTag.tag.tagId,
      name: userTag.tag.tagName,
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

const deleteUserTagBytagName = async (req, res) => {
  try {
    const userTag = await prisma.userTags.findFirst({
      where: {
        userId: req.user.userId,
        tagName: req.params.id,
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
    console.log(following, "userid", req.user.userId);
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: req.user.userId,
        followingId: following,
      },
    });
    if (existingFollow) {
      return res.status(400).json({ message: "You already follow this user." });
    }
    const follow = await prisma.follow.create({
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
      `${follower.userName} a follow you`
    );
    return res.status(201).json({ message: "Follow-up successful.", follow });
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
    console.log(followers, following);
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
      },
    });
    const sender = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: { userName: true },
    });
    await createNotification(
      req.user.userId,
      toId,
      `${sender.userName} a send you a message ${toUser.userName}`
    );
    console.log(message, "message");
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
      orderBy: {
        createdAt: "asc",
      },
    });
    if (messages.length === 0) {
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
    if (messages.length === 0) {
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
    const notifications = await prisma.notification.findMany({
      where: { toId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ notifications });
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
      "enamto.bouih@gmail.com", // sender email
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
  getUserData,
  logOut,
  updateUserData,
  changePassword,
  getAllUsers,
  getDeletedUsers,
  getUserById,
  addTagsToUser,
  getUserTags,
  deleteUserTagBytagName,
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
};
