const Complaint = require("../models/Complaint");

// @desc Create Complaint
// @route POST /api/complaint/create
const createComplaint = async (req, res) => {
  try {
    const {
      stbId,
      customerName,
      customerMobile,
      category,
      issueType,
      description,
      mediaUrl,
      preferredTime,
    } = req.body;

    if (!category || !description) {
      return res.status(400).json({ success: false, message: "Category and description are required" });
    }

    const complaint = await Complaint.create({
      stbId: stbId || "STB-UNKNOWN",
      customerName: customerName || "Customer",
      customerMobile: customerMobile || "",
      category,
      issueType: issueType || "",
      description,
      mediaUrl: mediaUrl || "",
      preferredTime: preferredTime || "Anytime",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Complaint registered successfully",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get All Complaints
// @route GET /api/complaint/all
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update Complaint Status
// @route POST /api/complaint/update/:id
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    Object.assign(complaint, patch);
    if (patch.status === "Resolved" && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date().toISOString();
    }
    if (patch.status === "Assigned" && !complaint.assignedAt) {
      complaint.assignedAt = new Date().toISOString();
    }

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  updateComplaintStatus,
};
