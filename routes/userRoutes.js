const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth");
const {
  loginUser,
  registerUser,
  getUserData,
  logOut,
  updateProfile,
} = require("../controllers/userControllers");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logOut);

router.get("/profil", authenticateToken, getUserData);

router.patch("/edit-profile",authenticateToken, updateProfile);

module.exports = router;
