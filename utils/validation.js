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
  check("fullName")
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

const tagValidation = [
  check("categoryId")
    .notEmpty()
    .withMessage("Category must be at least 2 characters long")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Category must be at least 2 characters long"),
  check("tagName")
    .notEmpty()
    .withMessage("Tag must be at least 2 characters long")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Tag must be at least 2 characters long"),
];

const addValidation = [
  check("coverPic").trim().notEmpty().withMessage("Cover picture is required"),
  check("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 50 })
    .withMessage("That's too long"),
  check("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  check("tags").trim().notEmpty().withMessage("Tags are required"),
  check("startTime").trim().notEmpty().withMessage("Time is required"),
  check("endTime").trim().notEmpty().withMessage("Time is required"),
  check("startDay").trim().notEmpty().withMessage("Start day is required"),
  check("endDay").trim().notEmpty().withMessage("End day is required"),
  check("seat").trim().notEmpty().withMessage("Seat is required"),
  check("price").trim().notEmpty().withMessage("Price is required"),
  check("location")
    .trim()
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("Location must be at least 3 characters"),
  check("cityId")
    .trim()
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("City ID must be at least 3 characters"),
];

const convertToISODate = (dateString) => {
  const [day, month, year] = dateString.split("/").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day)); // Ensure UTC time
  return date.toISOString();
};

const reviewValidation = [
  check("comment")
    .trim()
    .notEmpty()
    .withMessage("Please enter your comment")
    .isLength({ max: 100 })
    .withMessage("Heey! that's too long"),

  check("stars").trim().notEmpty().withMessage("Please enter your rating"),
];

module.exports = {
  loginValidation,
  registerValidation,
  categoryValidation,
  tagValidation,
  addValidation,
  reviewValidation,
  convertToISODate,
  validateData,
};
