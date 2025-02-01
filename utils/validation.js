const { check } = require("express-validator");

const loginValidation = [
  check("email")
    .notEmpty()
    .withMessage("Email must be at least 2 characters long")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Email must be at least 2 characters long"),
  check("password")
    .notEmpty()
    .withMessage("Password must be at least 2 characters long")
    .isLength({ min: 2 })
    .withMessage("Password must be at least 2 characters long"),
];

const registerValidation = [
  ...loginValidation,
  check("fullname")
    .notEmpty()
    .withMessage("Fullname must be at least 2 characters long")
    .isLength({ min: 2 })
    .withMessage("Fullname must be at least 2 characters long"),
];

module.exports = {
  loginValidation,
  registerValidation,
};
