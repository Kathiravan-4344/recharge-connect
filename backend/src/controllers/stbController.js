const StbMapping = require("../models/StbMapping");
const User = require("../models/User");

// @desc Validate STB ID (Must be mapped and approved by an Operator)
// @route POST /api/stb/validate
const validateStb = async (req, res) => {
  try {
    const { stbId } = req.body;
    if (!stbId || typeof stbId !== "string" || stbId.trim().length < 4) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Invalid STB ID format. STB ID must be at least 4 characters.",
      });
    }

    const cleanStbId = stbId.trim().toUpperCase();

    // Check StbMapping collection first
    const mapping = await StbMapping.findOne({ stbId: cleanStbId });
    if (mapping) {
      if (!mapping.isApproved || mapping.status === "Blocked") {
        return res.status(403).json({
          success: false,
          valid: false,
          message: "STB ID is currently inactive or blocked. Please contact your operator.",
        });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        stbId: cleanStbId,
        customerName: mapping.customerName || "STB Subscriber",
        customerMobile: mapping.customerMobile || "",
        operatorMobile: mapping.operatorMobile,
        operatorName: mapping.operatorName,
        currentPlan: mapping.currentPlan || "Basic Tamil Pack Monthly Rs 220",
        expiryDate: mapping.expiryDate,
      });
    }

    // Secondary Check: Existing registered User with this STB ID
    const existingUser = await User.findOne({ stbId: cleanStbId });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        valid: true,
        stbId: cleanStbId,
        customerName: existingUser.name || "STB Subscriber",
        customerMobile: existingUser.mobileNumber || "",
        currentPlan: existingUser.currentPlan || "Basic Tamil Pack Monthly Rs 220",
        expiryDate: existingUser.expiryDate,
      });
    }

    // STB ID is not mapped or registered with any operator
    return res.status(404).json({
      success: false,
      valid: false,
      message: "STB ID is not registered with any operator. Please contact your local operator to register your STB ID.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add or update STB ID mapping for an operator
// @route POST /api/stb/map
const mapStb = async (req, res) => {
  try {
    const {
      stbId,
      operatorMobile,
      operatorName,
      customerName,
      customerMobile,
      currentPlan,
      expiryDate,
      isApproved,
    } = req.body;

    if (!stbId || !operatorMobile) {
      return res.status(400).json({
        success: false,
        message: "STB ID and Operator Mobile Number are required",
      });
    }

    const cleanStbId = stbId.trim().toUpperCase();
    const cleanOpMobile = operatorMobile.trim();

    let mapping = await StbMapping.findOne({ stbId: cleanStbId });

    if (mapping) {
      mapping.operatorMobile = cleanOpMobile;
      if (operatorName) mapping.operatorName = operatorName.trim();
      if (customerName) mapping.customerName = customerName.trim();
      if (customerMobile) mapping.customerMobile = customerMobile.trim();
      if (currentPlan) mapping.currentPlan = currentPlan.trim();
      if (expiryDate) mapping.expiryDate = new Date(expiryDate);
      if (typeof isApproved === "boolean") mapping.isApproved = isApproved;
      await mapping.save();
    } else {
      mapping = await StbMapping.create({
        stbId: cleanStbId,
        operatorMobile: cleanOpMobile,
        operatorName: operatorName ? operatorName.trim() : "Operator",
        customerName: customerName ? customerName.trim() : "Customer",
        customerMobile: customerMobile ? customerMobile.trim() : "",
        currentPlan: currentPlan ? currentPlan.trim() : "Basic Tamil Pack Monthly Rs 220",
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isApproved: typeof isApproved === "boolean" ? isApproved : true,
        status: "Approved",
      });
    }

    return res.status(200).json({
      success: true,
      message: "STB ID mapped successfully",
      mapping,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get STBs mapped to a specific operator
// @route GET /api/stb/operator/:operatorMobile
const getOperatorStbs = async (req, res) => {
  try {
    const { operatorMobile } = req.params;
    if (!operatorMobile) {
      return res.status(400).json({ success: false, message: "Operator Mobile is required" });
    }

    const cleanOpMobile = operatorMobile.trim();
    // Super admin 9080864542 sees all STBs, other operators see their own
    let mappings = [];
    if (cleanOpMobile === "9080864542") {
      mappings = await StbMapping.find().sort({ createdAt: -1 });
    } else {
      mappings = await StbMapping.find({ operatorMobile: cleanOpMobile }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: mappings.length,
      mappings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update STB ID mapping
// @route PUT /api/stb/map/:id
const updateStbMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;

    const mapping = await StbMapping.findById(id);
    if (!mapping) {
      return res.status(404).json({ success: false, message: "STB Mapping not found" });
    }

    if (patch.customerName) mapping.customerName = patch.customerName.trim();
    if (patch.customerMobile) mapping.customerMobile = patch.customerMobile.trim();
    if (patch.currentPlan) mapping.currentPlan = patch.currentPlan.trim();
    if (patch.expiryDate) mapping.expiryDate = new Date(patch.expiryDate);
    if (typeof patch.isApproved === "boolean") mapping.isApproved = patch.isApproved;
    if (patch.status) mapping.status = patch.status;

    await mapping.save();

    return res.status(200).json({
      success: true,
      message: "STB Mapping updated successfully",
      mapping,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete STB ID mapping
// @route DELETE /api/stb/map/:id
const deleteStbMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = await StbMapping.findByIdAndDelete(id);
    if (!mapping) {
      return res.status(404).json({ success: false, message: "STB Mapping not found" });
    }

    return res.status(200).json({
      success: true,
      message: "STB Mapping deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  validateStb,
  mapStb,
  getOperatorStbs,
  updateStbMapping,
  deleteStbMapping,
};
