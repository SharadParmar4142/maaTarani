const express = require("express");
const validateToken = require("../middleware/validateToken");
const requireRole = require("../middleware/requireRole");
const {
  allocateTrucksToPurchaseOrder,
  getPurchaseOrderTruckSummary,
  getTruckSummariesForOrders,
  updateTruckStatus,
  submitUserReceivingReport,
  finalizeUserReceivingOrder,
  setTruckDeliveredItems,
} = require("../controller/truckController");

const router = express.Router();

router.post("/summaries", validateToken, requireRole("ADMIN", "USER", "company"), getTruckSummariesForOrders);
router.get("/:purchaseOrderId", validateToken, requireRole("ADMIN", "USER", "company"), getPurchaseOrderTruckSummary);

router.post("/:purchaseOrderId/allocate", validateToken, requireRole("ADMIN", "company"), allocateTrucksToPurchaseOrder);
router.patch("/:purchaseOrderId/:truckId/status", validateToken, requireRole("ADMIN", "company"), updateTruckStatus);
router.patch("/:purchaseOrderId/:truckId/receiving", validateToken, requireRole("USER"), submitUserReceivingReport);
router.post("/:purchaseOrderId/receiving/finalize", validateToken, requireRole("ADMIN", "USER", "company"), finalizeUserReceivingOrder);
router.put("/:purchaseOrderId/:truckId/delivered-items", validateToken, requireRole("ADMIN", "company"), setTruckDeliveredItems);

module.exports = router;
