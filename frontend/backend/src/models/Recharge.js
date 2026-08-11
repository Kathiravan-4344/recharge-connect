const mongoose = require("mongoose");

const rechargeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      required: false,
    },
    stbId: {
      type: String,
      required: true,
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
    operatorMobile: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Plan",
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      default: "Success",
    },
    status: {
      type: String,
      default: "Pending",
    },
    requestTime: {
      type: Date,
      default: Date.now,
    },
    approvedTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Recharge || mongoose.model("Recharge", rechargeSchema);
