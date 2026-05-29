const express = require("express");
const validateToken = require("../middleware/validateToken");
const requireRole = require("../middleware/requireRole");
const {
  registerCompany,
  getCompanyDashboard,
  updateCompanyProfile,
  claimPurchaseOrder,
  changePassword,
} = require("../controller/companyController");

const router = express.Router();

router.post("/register", registerCompany);
router.get("/dashboard", validateToken, requireRole("company"), getCompanyDashboard);
router.put("/profile", validateToken, requireRole("company"), updateCompanyProfile);
router.post("/change-password", validateToken, requireRole("company"), changePassword);
router.post("/purchase-orders/:purchaseOrderId/claim", validateToken, requireRole("company"), claimPurchaseOrder);

module.exports = router;