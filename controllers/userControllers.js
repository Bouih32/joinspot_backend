const bcrypt = require("bcryptjs");
const prisma = require("../utils/client");
const { generateToken } = require("../middlewares/Authentication");

const registerUser = async (req, res) => {
  try {
    const { userName, fullName, email, password, city, categoryId } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).send({ message: "Email is already in use." });
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        userName,
        fullName,
        email,
        password: hashedPassword,
        city,
        categoryId,
      },
    });
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
      return res.status(401).send("Utilisateur non trouvé");
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).send("Mot de passe incorrect");
    }
    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 1000,
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
  res.send({ message: "logoed out successful" });
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
      data: tags.map((tagId) => ({
        userId: req.user.userId, // Ensure userId is correctly obtained
        tagId,
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

const deleteUserTagByTagId = async (req, res) => {
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
    res.status(200).json({ message: "User tag deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
  deleteUserTagByTagId,
};
