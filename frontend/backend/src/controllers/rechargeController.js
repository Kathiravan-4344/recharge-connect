const connectDB = require("../config/db");
const Plan = require("../models/Plan");
const RechargeRequest = require("../models/RechargeRequest");
const Recharge = require("../models/Recharge");
const StbMapping = require("../models/StbMapping");
const User = require("../models/User");

// Seed default plans helper
const DEFAULT_PLANS = [
  {
    name: "Basic Tamil Pack Monthly Rs 220",
    price: 220,
    validity: 30,
    category: "Monthly",
    features: ["150+ SD Channels", "Standard Definition", "1 STB"],
  },
  {
    name: "Basic Tamil Silver Pack Monthly Rs 240",
    price: 240,
    validity: 30,
    category: "Monthly",
    features: ["300+ HD Channels", "Full HD Quality", "OTT App bundle"],
  },
  {
    name: "Basic Tamil HD Packs Rs 300",
    price: 300,
    validity: 30,
    category: "Monthly",
    features: ["400+ Channels", "4K Quality", "Multi-room"],
  },
  {
    name: "Sports Pack Rs 49",
    price: 49,
    validity: 30,
    category: "Channels",
    features: ["Star Sports HD", "Sony Sports", "Willow Cricket"],
  },
  {
    name: "HD Movies Pack Rs 79",
    price: 79,
    validity: 30,
    category: "Channels",
    features: ["Star Movies HD", "&pictures HD", "Sony Pix"],
  },
];

// @desc Get all recharge plans
// @route GET /api/plans
const getPlans = async (req, res) => {
  try {
    let plans = await Plan.find();
    if (plans.length === 0) {
      plans = await Plan.insertMany(DEFAULT_PLANS);
    }
    return res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// In-memory atomic lock map to prevent parallel race conditions
const recentRechargeLocks = new Map();

// @desc Create Recharge Request (Strict Rule: Payment must be SUCCESS)
// @route POST /api/recharge/create and POST /recharge/create
const createRechargeRequest = async (req, res) => {
  try {
    console.log("API HIT:", req.body);

    await connectDB();

    const { userId, stbId, planId, planName, amount, paymentStatus, customerName, customerMobile } = req.body;

    const statusClean = paymentStatus ? String(paymentStatus).trim() : "Success";
    if (statusClean.toLowerCase() !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment not success",
      });
    }

    const cleanStbId = stbId ? String(stbId).trim().toUpperCase() : "STB-UNKNOWN";
    const cleanName = customerName ? String(customerName).trim() : "Customer";
    const cleanMobile = customerMobile ? String(customerMobile).trim() : "";
    const cleanAmount = Number(amount) || 240;

    console.log(`[Recharge API] Creating Recharge: STB=${cleanStbId}, Mobile=${cleanMobile}, Customer=${cleanName}, Amount=${cleanAmount}`);

    // Atomic In-Memory Concurrency Lock Check (Prevents parallel duplicate hits within 30 seconds)
    const cleanDigitsMobile = cleanMobile.replace(/\D/g, "").slice(-10);
    const cleanStbKey = cleanStbId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const lockKey = `${cleanStbKey || "NOSTB"}_${cleanDigitsMobile || "NOMOBILE"}`;
    const nowMs = Date.now();
    const lastHitTime = recentRechargeLocks.get(lockKey) || 0;

    if (nowMs - lastHitTime < 30000) {
      console.log(`[Recharge API Lock] Duplicate submission blocked for ${lockKey}`);
      let existingDoc = await Recharge.findOne({
        $or: [{ stbId: cleanStbId }, { customerMobile: cleanMobile }],
        status: "Pending",
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Recharge request already created",
        rechargeRequest: existingDoc || { stbId: cleanStbId, amount: cleanAmount, status: "Pending" },
      });
    }
    recentRechargeLocks.set(lockKey, nowMs);

    // 1. Find or resolve Plan
    let plan = null;
    if (planId && String(planId).match(/^[0-9a-fA-F]{24}$/)) {
      plan = await Plan.findById(planId);
    }
    if (!plan && planName) {
      plan = await Plan.findOne({ name: planName });
    }
    if (!plan) {
      plan = await Plan.findOne();
    }
    if (!plan) {
      try {
        let plans = await Plan.find();
        if (plans.length === 0) {
          plans = await Plan.insertMany(DEFAULT_PLANS);
        }
        plan = plans[0];
      } catch (e) {}
    }

    // 2. Find or resolve User
    let user = null;
    if (userId && String(userId).match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    }
    if (!user && cleanMobile) {
      user = await User.findOne({ mobileNumber: cleanMobile });
    }
    if (!user && cleanStbId && cleanStbId !== "STB-UNKNOWN") {
      user = await User.findOne({
        $or: [
          { stbId: cleanStbId },
          { stbId: { $regex: new RegExp("^" + cleanStbId + "$", "i") } },
        ],
      });
    }
    if (!user) {
      const mob = cleanMobile.length >= 10 ? cleanMobile : "9" + Date.now().toString().slice(-9);
      user = await User.findOne({ mobileNumber: mob });
      if (!user) {
        try {
          user = await User.create({
            mobileNumber: mob,
            name: cleanName,
            stbId: cleanStbId,
            role: "customer",
          });
        } catch (e) {
          user = (await User.findOne({ stbId: cleanStbId })) || (await User.findOne());
        }
      }
    }

    // 3. Look up STB Mapping or Operator to route to the specific Operator
    let mappedOperatorMobile = req.body.operatorMobile || "";
    if (!mappedOperatorMobile && cleanStbId && cleanStbId !== "STB-UNKNOWN") {
      const stbMapping = await StbMapping.findOne({
        stbId: { $regex: new RegExp("^" + cleanStbId + "$", "i") },
      });
      if (stbMapping && stbMapping.operatorMobile) {
        mappedOperatorMobile = stbMapping.operatorMobile.trim();
      }
    }
    if (!mappedOperatorMobile && cleanMobile) {
      const stbMappingByMob = await StbMapping.findOne({ customerMobile: cleanMobile });
      if (stbMappingByMob && stbMappingByMob.operatorMobile) {
        mappedOperatorMobile = stbMappingByMob.operatorMobile.trim();
      }
    }
    if (!mappedOperatorMobile) {
      const firstOp = await Operator.findOne({ isActive: true });
      if (firstOp && firstOp.mobileNumber) {
        mappedOperatorMobile = firstOp.mobileNumber.trim();
      }
    }

    // 4. Construct & Save new RechargeRequest document (stored in rechargerequests collection)
    const newRecharge = new RechargeRequest({
      userId: user?._id || userId || undefined,
      stbId: cleanStbId !== "STB-UNKNOWN" ? cleanStbId : user?.stbId || stbId || "1234567890",
      customerName: cleanName !== "Customer" ? cleanName : user?.name || "Customer",
      customerMobile: cleanMobile || user?.mobileNumber || "",
      operatorMobile: mappedOperatorMobile,
      planId: plan?._id || planId || undefined,
      amount: cleanAmount,
      paymentStatus: "Success",
      status: "Pending",
      requestTime: new Date(),
    });

    console.log("Saving new recharge request to rechargerequests collection:", newRecharge._id);
    try {
      await newRecharge.save();
      console.log("Saved successfully to rechargerequests:", newRecharge._id);
    } catch (saveErr) {
      console.log("ERROR saving recharge request:", saveErr);
      return res.status(500).json({ error: saveErr.message });
    }

    let populated = null;
    try {
      populated = await Recharge.findById(newRecharge._id)
        .populate("userId", "name mobileNumber stbId")
        .populate("planId", "name price validity category");
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: "Recharge request created",
      rechargeRequest: populated || newRecharge,
    });
  } catch (err) {
    console.log("ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

// @desc Get real-time status of recharge request
// @route GET /api/recharge/status/:id
const getRechargeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let request = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      request = await RechargeRequest.findById(id)
        .populate("userId", "name mobileNumber stbId")
        .populate("planId", "name price validity");
    }

    if (!request) {
      return res.status(404).json({ success: false, message: "Recharge request not found" });
    }

    const requestTimeMs = new Date(request.requestTime).getTime();
    const nowMs = Date.now();
    const elapsedMinutes = Math.floor((nowMs - requestTimeMs) / (1000 * 60));
    const countdownMinutesRemaining = Math.max(0, 45 - elapsedMinutes);
    const isOverdue = elapsedMinutes > 45 && request.status === "Pending";

    return res.status(200).json({
      success: true,
      id: request._id,
      stbId: request.stbId,
      amount: request.amount,
      paymentStatus: request.paymentStatus,
      status: request.status, // Pending | Approved | Rejected
      requestTime: request.requestTime,
      approvedTime: request.approvedTime,
      elapsedMinutes,
      countdownMinutesRemaining,
      isOverdue,
      plan: request.planId,
      user: request.userId,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all pending recharge requests for operator polling
// @route GET /api/recharge/pending
const getPendingRecharges = async (req, res) => {
  try {
    console.log("[Recharge API] Fetching all recharge requests for operator...");
    const recharges = await Recharge.find()
      .populate("userId", "name mobileNumber stbId")
      .populate("planId", "name price validity category")
      .sort({ createdAt: -1, requestTime: -1 });

    const rechargeRequests = await RechargeRequest.find()
      .populate("userId", "name mobileNumber stbId")
      .populate("planId", "name price validity category")
      .sort({ createdAt: -1, requestTime: -1 });

    const uniqueMap = new Map();
    for (const item of [...recharges, ...rechargeRequests]) {
      const key = String(item._id || item.id);
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }
    const requests = Array.from(uniqueMap.values());

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("[Recharge API Error]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlans,
  createRechargeRequest,
  getRechargeStatus,
  getPendingRecharges,
};

