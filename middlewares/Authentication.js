const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

const generateToken = (user) => {
  const token = jwt.sign(
    { userId: user.userId, email: user.email, password: user.password },
    SECRET,
    {
      expiresIn: "1h",
    }
  );
  return token;
};

const verifyToken = (token, res) => {
  try {
    const decoded = jwt.verify(token, SECRET);
    return { decoded, token };
  } catch (error) {
    return { error: "Invalid or expired token" };
  }
};

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Token invalide ou absent" });
  }

  const result = verifyToken(token, res);
  if (result.error) {
    return res.status(401).json(result);
  }

  req.user = result.decoded;
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  isAuthenticated,
};
