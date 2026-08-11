const ProductRequest = require("../models/ProductRequest");

// @desc Create Product Request
// @route POST /api/product-request/create
const createProductRequest = async (req, res) => {
  try {
    const {
      stbId,
      customerName,
      customerMobile,
      productId,
      productName,
      category,
      quantity,
      unitPrice,
      totalAmount,
      description,
      imageUrl,
    } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({ success: false, message: "productId and productName are required" });
    }

    const request = await ProductRequest.create({
      stbId: stbId || "STB-UNKNOWN",
      customerName: customerName || "Customer",
      customerMobile: customerMobile || "",
      productId,
      productName,
      category: category || "accessory",
      quantity: quantity || 1,
      unitPrice: unitPrice || 0,
      totalAmount: totalAmount || (unitPrice || 0) * (quantity || 1),
      description: description || "",
      imageUrl: imageUrl || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Product request created successfully",
      productRequest: request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get All Product Requests
// @route GET /api/product-request/all
const getAllProductRequests = async (req, res) => {
  try {
    const requests = await ProductRequest.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update Product Request Status
// @route POST /api/product-request/update/:id
const updateProductRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;

    const request = await ProductRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Product request not found" });
    }

    Object.assign(request, patch);
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Product request updated successfully",
      productRequest: request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProductRequest,
  getAllProductRequests,
  updateProductRequestStatus,
};
