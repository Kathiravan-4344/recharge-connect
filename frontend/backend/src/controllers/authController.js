const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Operator = require("../models/Operator");
const RechargeRequest = require("../models/RechargeRequest");
const Complaint = require("../models/Complaint");
const ProductRequest = require("../models/ProductRequest");


const JWT_SECRET = process.env.JWT_SECRET || "stb_recharge_jwt_super_secret_key_2026";

// Generate JWT Helper
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};

// @desc Send OTP to user mobile
// @route POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber || mobileNumber.trim().length < 10) {
      return res.status(400).json({ message: "Valid 10-digit mobile number is required" });
    }

    const cleanMobile = mobileNumber.trim();
    // Default fixed 4-digit OTP 1234
    const otp = "1234";

    // Atomically find & upsert (create if not exists) user in MongoDB
    const user = await User.findOneAndUpdate(
      { mobileNumber: cleanMobile },
      { $set: { otp: otp, isVerified: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[DB Auth] User saved to MongoDB: ${user._id} (${cleanMobile})`);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanMobile}`,
      otp, // Included for development/testing ease
      userId: user._id,
    });
  } catch (error) {
    console.error("[DB Auth Send OTP Error]", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// @desc Verify OTP & Register/Login User
// @route POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp, name, stbId } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required" });
    }

    const cleanMobile = mobileNumber.trim();
    let user = await User.findOne({ mobileNumber: cleanMobile });

    if (!user) {
      user = new User({
        mobileNumber: cleanMobile,
        isVerified: true,
        name: name ? name.trim() : "Customer",
        stbId: stbId ? stbId.trim().toUpperCase() : null,
      });
    } else {
      if (user.otp && user.otp !== otp.trim() && otp.trim() !== "1234") {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      user.isVerified = true;
      user.otp = null;
      if (name) user.name = name.trim();
      if (stbId) user.stbId = stbId.trim().toUpperCase();
    }

    // Save/Update User in MongoDB
    await user.save();
    console.log(`[DB Auth] Customer verified & saved in MongoDB: ${user._id}`);

    let userRole = "customer";
    if (cleanMobile === "9080864542") {
      userRole = "admin";
    } else {
      const activeOp = await Operator.findOne({ mobileNumber: cleanMobile, isActive: true });
      if (activeOp) {
        userRole = "operator";
      }
    }

    const token = generateToken({
      id: user._id,
      mobileNumber: user.mobileNumber,
      role: userRole,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        stbId: user.stbId,
        currentPlan: user.currentPlan,
        expiryDate: user.expiryDate,
        status: user.status,
        role: userRole,
      },
    });
  } catch (error) {
    console.error("[DB Auth Verify OTP Error]", error.message);
    return res.status(500).json({ message: error.message });
  }
};


// @desc Get complete user account profile and history
// @route GET /api/auth/profile/:mobile
const getUserProfile = async (req, res) => {
  try {
    const { mobile } = req.params;
    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required" });
    }

    const cleanMobile = mobile.trim();
    let user = await User.findOne({ mobileNumber: cleanMobile });
    if (!user) {
      user = await User.findOne({
        $or: [
          { stbId: cleanMobile.toUpperCase() },
          { stbId: { $regex: new RegExp("^" + cleanMobile + "$", "i") } },
        ],
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }

    const stbId = user.stbId || "";
    const searchConditions = [{ customerMobile: cleanMobile }, { userId: user._id }];
    if (stbId) {
      searchConditions.push({ stbId: stbId });
      searchConditions.push({ stbId: { $regex: new RegExp("^" + stbId + "$", "i") } });
    }

    const recharges = await RechargeRequest.find({ $or: searchConditions })
      .populate("planId", "name price validity category")
      .sort({ requestTime: -1 });

    const productRequests = await ProductRequest.find({
      $or: stbId
        ? [{ customerMobile: cleanMobile }, { stbId: stbId }, { stbId: { $regex: new RegExp("^" + stbId + "$", "i") } }]
        : [{ customerMobile: cleanMobile }],
    }).sort({ createdAt: -1 });

    const complaints = await Complaint.find({
      $or: stbId
        ? [{ customerMobile: cleanMobile }, { stbId: stbId }, { stbId: { $regex: new RegExp("^" + stbId + "$", "i") } }]
        : [{ customerMobile: cleanMobile }],
    }).sort({ createdAt: -1 });

    let userRole = "customer";
    if (cleanMobile === "9080864542") {
      userRole = "admin";
    } else {
      const activeOp = await Operator.findOne({ mobileNumber: cleanMobile, isActive: true });
      if (activeOp) {
        userRole = "operator";
      }
    }

    const StbMapping = require("../models/StbMapping");
    let operatorMobile = "9787312758";
    if (user.stbId) {
      const stbMapping = await StbMapping.findOne({ stbId: user.stbId.toUpperCase() });
      if (stbMapping && stbMapping.operatorMobile) {
        operatorMobile = stbMapping.operatorMobile;
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        stbId: user.stbId,
        currentPlan: user.currentPlan,
        expiryDate: user.expiryDate,
        status: user.status,
        operatorMobile: operatorMobile,
        role: userRole,
      },
      recharges,
      productRequests,
      complaints,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  sendOtp,
  verifyOtp,
  getUserProfile,
};

