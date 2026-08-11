const Operator = require("../models/Operator");
const User = require("../models/User");
const RechargeRequest = require("../models/RechargeRequest");
const Product = require("../models/Product");
const Complaint = require("../models/Complaint");

// @desc Add Operator
// @route POST /api/admin/operator/add
const addOperator = async (req, res) => {
  try {
    const { mobileNumber, name, stbBoxName, portalLink } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ message: "Operator mobile number is required" });
    }

    const cleanMobile = mobileNumber.trim().toLowerCase();
    let operator = await Operator.findOne({ mobileNumber: cleanMobile });

    if (operator) {
      operator.isActive = true;
      if (name) operator.name = name;
      if (stbBoxName) operator.stbBoxName = stbBoxName;
      if (portalLink !== undefined) operator.portalLink = portalLink;
      await operator.save();
    } else {
      operator = await Operator.create({
        mobileNumber: cleanMobile,
        name: name || "Operator",
        stbBoxName: stbBoxName || "SCV",
        portalLink: portalLink || "",
        isActive: true,
      });
    }

    // Also sync User collection in MongoDB
    try {
      let userDoc = await User.findOne({ mobileNumber: cleanMobile });
      if (userDoc) {
        userDoc.role = "operator";
        if (name) userDoc.name = name;
        await userDoc.save();
      } else {
        await User.create({
          mobileNumber: cleanMobile,
          name: name || "Operator",
          role: "operator",
          stbId: `OP-${cleanMobile.slice(-6)}`,
        });
      }
    } catch (e) {
      console.warn("User doc sync warning for operator:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Operator added/activated successfully",
      operator,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// @desc Get Operators
// @route GET /api/admin/operators
const getOperators = async (req, res) => {
  try {
    const operators = await Operator.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: operators.length, operators });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Operator Active Status
// @route POST /api/admin/operator/toggle
const toggleOperator = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ message: "Operator mobile number is required" });
    }

    const operator = await Operator.findOne({ mobileNumber: mobileNumber.trim() });
    if (!operator) {
      return res.status(404).json({ success: false, message: "Operator not found" });
    }

    operator.isActive = !operator.isActive;
    await operator.save();

    return res.status(200).json({
      success: true,
      message: `Operator ${operator.isActive ? "activated" : "deactivated"} successfully`,
      operator,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Remove Operator
// @route DELETE /api/admin/operator/:id
const removeOperator = async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith("op-")) {
      await Operator.deleteMany({ id });
    } else {
      await Operator.findByIdAndDelete(id);
    }
    return res.status(200).json({ success: true, message: "Operator removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc View Customers List
// @route GET /api/admin/customers
const getCustomers = async (req, res) => {
  try {
    const customers = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: customers.length, customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc View All Recharges
// @route GET /api/admin/recharges
const getRecharges = async (req, res) => {
  try {
    const recharges = await RechargeRequest.find()
      .populate("userId", "name mobileNumber stbId")
      .populate("planId", "name price validity")
      .sort({ requestTime: -1 });
    return res.status(200).json({ success: true, count: recharges.length, recharges });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete Recharge
// @route DELETE /api/admin/recharge/:id
const deleteRecharge = async (req, res) => {
  try {
    const { id } = req.params;
    await RechargeRequest.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Recharge record deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add Product
// @route POST /api/admin/product/add
const addProduct = async (req, res) => {
  try {
    const { name, price, description, availableStock } = req.body;
    const product = await Product.create({ name, price, description, availableStock });
    return res.status(201).json({ success: true, message: "Product created", product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update Product
// @route PUT /api/admin/product/update/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ success: true, message: "Product updated", product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete Product
// @route DELETE /api/admin/product/delete/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc View Complaints
// @route GET /api/admin/complaints
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("userId", "name mobileNumber stbId")
      .populate("assignedOperator", "name mobileNumber")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc System Reset (Clear Recharges, Products, Complaints)
// @route DELETE /api/admin/clear-all
const clearAllData = async (req, res) => {
  try {
    await RechargeRequest.deleteMany({});
    await Product.deleteMany({});
    await Complaint.deleteMany({});

    return res.status(200).json({
      success: true,
      message: "SYSTEM RESET COMPLETE: Cleared all recharge requests, products, and complaints.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addOperator,
  getOperators,
  toggleOperator,
  removeOperator,
  getCustomers,
  getRecharges,
  deleteRecharge,
  addProduct,
  updateProduct,
  deleteProduct,
  getComplaints,
  clearAllData,
};
