const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      default: "9080864542",
      trim: true,
    },
    name: {
      type: String,
      default: "Super Admin (Kathiravan V)",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
