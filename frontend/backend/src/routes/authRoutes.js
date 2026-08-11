const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp, getUserProfile } = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/profile/:mobile", getUserProfile);

module.exports = router;

