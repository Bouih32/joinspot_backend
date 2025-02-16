const bcrypt = require("bcryptjs");
const prisma = require("../utils/client");
const { generateAcessToken } = require("../middlewares/auth");

const registerUser = async (req, res) => {
  try {
    const {
      userName,
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
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).send({ message: "Email is already in use." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        userName,
        fullName,
        email,
        city,
        role: String(role).toUpperCase(),
        password: hashedPassword,
        categoryName: role === "organiser" ? categoryName : null,
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
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res
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
      id: user.id,
      email: user.email,
      role: user.role,
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Login successful!", user, token });
  } catch (error) {
    console.error(error);
    res
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
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error getting profil:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
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
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
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
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error server", error: error.message });
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
    res.status(200).json({ users: users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
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
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
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
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// management UserTags
const addTagsToUser = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      return res
        .status(400)
        .json({ message: "tags must be an array", received: req.body });
    }
    const userTags = await prisma.userTags.createMany({
      data: tags.map((tagName) => ({
        userId: req.user.userId, // Ensure userId is correctly obtained
        tagName,
      })),
    });
    res.status(200).json({ message: "Tags added", userTags });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getUserTags = async (req, res) => {
  try {
    const userTags = await prisma.userTags.findMany({
      where: {
        userId: req.user.userId,
      },
      select: {
        tag: {
          select: {
            name: true, // Fetch only the tag names
          },
        },
      },
    });
    const tagNames = userTags.map((userTag) => userTag.tag.name); // Extract names
    res.status(200).json({ message: "User tags fetched", tags: tagNames });
  } catch (error) {
    console.error(error);
    res
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
    res.status(200).json({ message: "User tag deleted successfully" });
  } catch (error) {
    console.error(error);
    res
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
    res.status(201).json({ message: "Follow-up successful.", follow });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
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
    res.status(200).json({
      followersCount: followers.length,
      followers: followers.map((f) => f.follower),
      followingCount: following.length,
      following: following.map((f) => f.following),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const nodemailer = require("nodemailer");

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.GMAIL_KEY,
  },
});

// Controller function to send email
const sendEmail = async (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.MY_EMAIL,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully", info });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
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
  sendEmail,
};
