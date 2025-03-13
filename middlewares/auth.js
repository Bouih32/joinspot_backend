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

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized user" });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
};

module.exports = {
  generateAcessToken,
  authenticateToken,
  optionalAuthenticateToken,
};
