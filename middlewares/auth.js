const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

const generateAcessToken = (user) => {
  const token = jwt.sign(
    { userId: user.userId, email: user.email, role: user.role },
    SECRET,
    {
      expiresIn: "7d",
    }
  );
  return token;
};

// const generateRefreshToken = (user) => {
//   const refreshToken = jwt.sign({ id: user.id }, SECRET, {
//     expiresIn: "7d",
//   });
//   return refreshToken;
// };

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(500).send({ message: "unautorised user" });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(500).send({ message: "Ooops, Something went wrong" });
    }

    req.user = user;
    next();
  });
};

module.exports = { generateAcessToken, authenticateToken };
