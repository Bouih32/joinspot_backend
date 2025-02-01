const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

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

module.exports = authenticateToken;
