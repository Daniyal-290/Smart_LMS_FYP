const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===================================================
// protect
// ===================================================
// Verifies the JWT from the Authorization header and
// attaches the full user document to `req.user`.
// Usage: router.get("/secured", protect, handler);

const protect = async (req, res, next) => {
  let token;

  // Extract token from "Bearer <token>" header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized — no token provided" });
  }

  try {
    // Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized — user not found" });
    }

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Not authorized — invalid token" });
  }
};

// ===================================================
// authorizeRoles
// ===================================================
// Restricts access to users with specific roles.
// Usage: router.post("/", protect, authorizeRoles("Instructor"), handler);

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied — role '${req.user.role}' is not authorized`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
