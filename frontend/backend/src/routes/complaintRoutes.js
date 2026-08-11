const express = require("express");
const router = express.Router();
const {
  createComplaint,
  getAllComplaints,
  updateComplaintStatus,
} = require("../controllers/complaintController");

router.post("/create", createComplaint);
router.get("/all", getAllComplaints);
router.post("/update/:id", updateComplaintStatus);

module.exports = router;
