const express = require("express");
const router = express.Router();
const {
  createProductRequest,
  getAllProductRequests,
  updateProductRequestStatus,
} = require("../controllers/productRequestController");

router.post("/product-request/create", createProductRequest);
router.get("/product-request/all", getAllProductRequests);
router.post("/product-request/update/:id", updateProductRequestStatus);

module.exports = router;
