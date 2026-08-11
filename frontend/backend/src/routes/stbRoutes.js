const express = require("express");
const router = express.Router();
const {
  validateStb,
  mapStb,
  getOperatorStbs,
  updateStbMapping,
  deleteStbMapping,
} = require("../controllers/stbController");

router.post("/validate", validateStb);
router.post("/map", mapStb);
router.get("/operator/:operatorMobile", getOperatorStbs);
router.put("/map/:id", updateStbMapping);
router.delete("/map/:id", deleteStbMapping);

module.exports = router;
