const express = require("express");
const router = express.Router();
const {
  getPlans,
  createRechargeRequest,
  getRechargeStatus,
  getPendingRecharges,
} = require("../controllers/rechargeController");

// Plans
router.get("/plans", getPlans);

// Support both /create and /recharge/create
router.post("/create", createRechargeRequest);
router.post("/recharge/create", createRechargeRequest);

// Status
router.get("/status/:id", getRechargeStatus);
router.get("/recharge/status/:id", getRechargeStatus);

// Pending
router.get("/pending", getPendingRecharges);
router.get("/recharge/pending", getPendingRecharges);

module.exports = router;
