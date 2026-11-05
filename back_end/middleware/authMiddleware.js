const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticate(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("role active");
    if (!user || user.active === false) {
      return res.status(401).json({ message: "This account is unavailable. Sign in again or contact support." });
    }
    req.user = { id: user.id, role: user.role };
    return next();
  } catch (error) {
    if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError" && error.name !== "CastError") {
      return next(error);
    }
    return res.status(401).json({ message: "The session is invalid or expired." });
  }
}

module.exports = authenticate;
