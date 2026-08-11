const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Operator = require("../models/Operator");

const JWT_SECRET = process.env.JWT_SECRET || "stb_recharge_jwt_super_secret_key_2026";

// Protect general user routes
const protectUser = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-otp");
      if (!req.user) {
        return res.status(401).json({ message: "User not found or token invalid" });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// Protect operator routes (Operator must exist & isActive = true)
const protectOperator = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const operator = await Operator.findOne({
        mobileNumber: decoded.mobileNumber,
        isActive: true,
      });

      if (!operator) {
        return res.status(403).json({ message: "Not Authorized: Operator inactive or not found" });
      }

      req.operator = operator;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// Protect admin routes (Mobile MUST be 9080864542)
const protectAdmin = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.mobileNumber !== "9080864542") {
        return res.status(403).json({ message: "Access Denied: Admin privileges required" });
      }
      req.adminMobile = decoded.mobileNumber;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

module.exports = {
  protectUser,
  protectOperator,
  protectAdmin,
};
