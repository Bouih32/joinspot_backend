const express = require("express");
const { isAuthenticated } = require("../middlewares/Authentication");
const router = express.Router();
const {
  loginUser,
  registerUser,
  getUserData,
  logOut,
  updateUserData,
  changePassword,
} = require("../controllers/userControllers");
const {
  loginValidation,
  registerValidation,
  validationandHandlerrors,
} = require("../utils/validation");

router.post("/register",registerValidation,validationandHandlerrors, registerUser);
router.post("/login",loginValidation,validationandHandlerrors, loginUser);
router.post("/logout",validationandHandlerrors, logOut);

router.get("/profil", isAuthenticated,validationandHandlerrors, getUserData);

router.put("/change-password", isAuthenticated,validationandHandlerrors, changePassword);

router.patch("/edit-profil", isAuthenticated,validationandHandlerrors, updateUserData);

module.exports = router;
