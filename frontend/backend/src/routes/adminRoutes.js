const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/authMiddleware");

// Routes
router.post("/operator/add", addOperator);
router.get("/operators", getOperators);
router.post("/operator/toggle", toggleOperator);
router.delete("/operator/:id", removeOperator);

router.get("/customers", getCustomers);
router.get("/recharges", getRecharges);
router.delete("/recharge/:id", deleteRecharge);

router.post("/product/add", addProduct);
router.put("/product/update/:id", updateProduct);
router.delete("/product/delete/:id", deleteProduct);

router.get("/complaints", getComplaints);
router.delete("/clear-all", clearAllData);

module.exports = router;
