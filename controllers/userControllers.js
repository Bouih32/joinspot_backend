const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/primsaClient");
const SECRET = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
  const { fullname, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser)
    return res.status(400).send({ message: "Email is already in use." });

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      fullname,
      email,
      password: hashedPassword,
    },
  });

  res.status(201).json({ message: "User registered successfully!" });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).send({ message: "User not found" });

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword)
    return res.status(401).send({ message: "Unvalid Password" });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.fullname },
    SECRET,
    {
      expiresIn: "1h",
    }
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 1000,
  });
  res.status(200).json({ message: "Login successful!" });
};

const getUserData = async (req, res) => {
  const { id } = req.user;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).send({ message: "No such user" });
  } else {
    try {
      return res.status(200).send({ message: "success", name: user.fullname });
    } catch (error) {
      return res.status(500).send({ message: "Something Went wrong" });
    }
  }
};

const logOut = (req, res) => {
  res.clearCookie("token");
  res.status(200).send({ message: "logoed out successful" });
};

module.exports = {
  loginUser,
  registerUser,
  getUserData,
  logOut,
};
