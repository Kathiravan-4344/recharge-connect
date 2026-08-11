const mongoose = require("mongoose");

const stbMappingSchema = new mongoose.Schema(
  {
    stbId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    operatorMobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    operatorName: {
      type: String,
      default: "Operator",
      trim: true,
    },
    customerName: {
      type: String,
      default: "Customer",
      trim: true,
    },
    customerMobile: {
      type: String,
      default: "",
      trim: true,
    },
    currentPlan: {
      type: String,
      default: "Basic Tamil Pack Monthly Rs 220",
      trim: true,
    },
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Approved", "Pending", "Blocked"],
      default: "Approved",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StbMapping", stbMappingSchema);
