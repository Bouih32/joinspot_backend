const { validationResult, check } = require("express-validator");

const validateData = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array()[0].msg });
  }
  next();
};

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

const categoryValidation = [
  check("categoryName")
    .notEmpty()
    .withMessage("Category must be at least 2 characters long")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Category must be at least 2 characters long"),
  check("icon")
    .notEmpty()
    .withMessage("icon must be at least 2 characters long")
    .isLength({ min: 2 })
    .withMessage("icon must be at least 2 characters long"),
];

module.exports = {
  loginValidation,
  registerValidation,
  categoryValidation,
  validateData,
};
