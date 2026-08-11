const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    validity: {
      type: Number,
      required: true, // Validity in days
    },
    category: {
      type: String,
      enum: ["Monthly", "Channels", "Add-on"],
      default: "Monthly",
    },
    features: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
