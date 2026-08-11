const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    stbId: {
      type: String,
      default: "STB-UNKNOWN",
    },
    customerName: {
      type: String,
      default: "Customer",
    },
    customerMobile: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      default: "General Issues",
    },
    issueType: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      required: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    preferredTime: {
      type: String,
      default: "Anytime",
    },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Resolved"],
      default: "Pending",
    },
    technicianName: {
      type: String,
      default: "",
    },
    technicianMobile: {
      type: String,
      default: "",
    },
    assignedAt: {
      type: String,
      default: "",
    },
    expectedArrival: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
