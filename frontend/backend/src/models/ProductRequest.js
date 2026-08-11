const mongoose = require("mongoose");

const productRequestSchema = new mongoose.Schema(
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
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["accessory", "service"],
      default: "accessory",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Out for Delivery",
        "Installation Scheduled",
        "Completed",
        "Not Available",
      ],
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
    scheduledDate: {
      type: String,
      default: "",
    },
    operatorNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductRequest", productRequestSchema);
