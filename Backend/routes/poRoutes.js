const express = require('express');
const {
	createPurchaseOrder,
	updateGoogleSheet,
	checkDuplicatePurchaseOrder,
	getMyPurchaseOrders,
	getAdminDashboardOrders,
	updatePurchaseOrderStatus,
} = require("../controller/poController");
const validateToken = require("../middleware/validateToken");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.post("/", validateToken, requireRole("USER"), createPurchaseOrder);
router.post("/updateGoogleSheet", validateToken, requireRole("USER"), updateGoogleSheet);
router.post("/checkDuplicate", validateToken, requireRole("USER"), checkDuplicatePurchaseOrder);
router.get("/my", validateToken, requireRole("USER"), getMyPurchaseOrders);

router.get("/admin/dashboard", validateToken, requireRole("ADMIN"), getAdminDashboardOrders);
router.patch("/:id/status", validateToken, requireRole("ADMIN"), updatePurchaseOrderStatus);

module.exports = router;
