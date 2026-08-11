const express = require("express");
const router = express.Router();
const {
  operatorLogin,
  getPendingRequests,
  approveRecharge,
  rejectRecharge,
} = require("../controllers/operatorController");

// Simple Test Route to verify operator API is active
router.get("/test", (req, res) => {
  res.status(200).send("WORKING BRO ✅");
});

// GET /api/operator/requests (Also handles alias paths / and /requests)
router.get(["/requests", "/"], getPendingRequests);

// Auth & Operator Action Routes
router.post("/login", operatorLogin);
router.post("/approve/:id", approveRecharge);
router.post("/reject/:id", rejectRecharge);

module.exports = router;

