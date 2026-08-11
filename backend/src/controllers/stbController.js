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

const VENKATESA_PERUMAL_STBS = [
  "8331000FEDA9",
  "8331000DE77D",
  "8331000F53AB",
  "8331000F69BF",
  "8331000DFCE3",
  "8331000EC1BC",
  "8331000FEF15",
  "8331000ED57D",
  "8331000EB422",
  "8331000EC1D7",
  "8331000EAFB7",
  "8331000EEC00",
  "8331000EB371",
  "8331000F0FA7",
  "8331000EEABA",
  "8331000EEA91",
  "8331000E0281",
  "8331000F01FD",
  "8331000DE885",
  "8331000F2EBA",
  "8331000DDFFE",
  "8331000F02B1",
  "8331000DFCBB",
  "8331000EF76F",
  "8331000F0FE2",
  "8331000DE84F",
  "8331000DF7B5",
  "8331000EAF21",
  "8331000F8B17",
  "8331000EB017",
  "8331000EC8AA",
  "8331000EF4A4",
  "8331000ECC2E",
  "8331000F01A6",
  "83310001012B1",
  "8331000DF7EA",
  "8331000F53AA",
  "8331000F6C58",
  "8331000DE77C",
  "8331000DE95A",
  "8331000F53DF",
  "8331000E5D53",
  "8331000EFDA5",
  "8331000EEDF1",
  "8331000EB00D",
  "8331000EEB59",
  "8331000EEA95",
  "8331000EB585",
  "8331000DF811",
  "8331000F8CB7",
  "8331000F8B62",
  "8331000F5B60",
  "8331000F5B73",
  "8331000DF805",
  "8331000F5B8F",
  "8331000F9D4C",
  "8331000F2E4E",
  "8331000EEDE9",
  "8331000DE951",
  "8331000E03D2",
  "8331000EB587",
  "8331000E5B80",
  "8331000E0406",
  "8331000EB8AA",
  "8331000EB5C5",
  "8331000F0418",
  "8331000F8B4F",
  "8331000F022D",
  "8331000EB6CD",
  "8331000E5D45",
  "8331000F6477",
  "8331000E5D10",
  "8331000FA019",
  "8331000EAD40",
  "8331000EC664",
  "8331000E5D9A",
  "8331000F2F60",
  "8331000EDBC7",
  "8331000ED36F",
  "8331000ECAA7",
  "8331000F11F3",
  "8331000F8C4F",
  "8331000EDE26",
  "8331000EAEDD",
  "8331000F2EFB",
  "8331000EB746",
  "8331000F6C73",
  "8331000DF81D",
  "8331000F0FE8",
  "8331000EF45A",
  "8331000F0512",
  "8331000EF6B1",
  "8331000EEC84",
  "8331000EF78A",
  "8331000EF75B",
  "8331000E5D8A",
  "8331000F5E6D",
  "8331000F4F18",
  "8331000F6C55",
  "8331000EE4ED",
];

const seedVenkatesaPerumal = async () => {
  try {
    const existing = await StbMapping.countDocuments({ operatorMobile: "9787312758" });
    if (existing < VENKATESA_PERUMAL_STBS.length) {
      for (const stbId of VENKATESA_PERUMAL_STBS) {
        const cleanStbId = stbId.trim().toUpperCase();
        await StbMapping.updateOne(
          { stbId: cleanStbId },
          {
            $setOnInsert: {
              stbId: cleanStbId,
              operatorMobile: "9787312758",
              operatorName: "VENKATESA PERUMAL",
              customerName: "Customer",
              customerMobile: "",
              currentPlan: "Basic Tamil Pack Monthly Rs 220",
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              isApproved: true,
              status: "Approved",
            },
          },
          { upsert: true }
        );
      }
    }
  } catch (err) {
    console.error("Error seeding Venkatesa STBs:", err);
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

    await seedVenkatesaPerumal();

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
