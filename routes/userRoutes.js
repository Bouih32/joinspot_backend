const express = require("express");
const {isAuthenticated} = require("../middlewares/Authentication")
const router = express.Router();
const {
  loginUser,
  registerUser,
  getUserData,
  logOut,
  updateUserData,
  changePassword
} = require("../controllers/userControllers");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logOut);

router.get("/profil",isAuthenticated, getUserData);

router.put("/change-password",isAuthenticated, changePassword);

router.patch("/edit-profil",isAuthenticated, updateUserData);


module.exports = router;
