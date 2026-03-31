const express = require("express");
const validateToken = require("../middleware/validateToken");
const requireRole = require("../middleware/requireRole");
const {
  allocateTrucksToPurchaseOrder,
  getPurchaseOrderTruckSummary,
  getTruckSummariesForOrders,
  updateTruckStatus,
  setTruckDeliveredItems,
} = require("../controller/truckController");

const router = express.Router();

router.post("/summaries", validateToken, requireRole("ADMIN", "USER"), getTruckSummariesForOrders);
router.get("/:purchaseOrderId", validateToken, requireRole("ADMIN", "USER"), getPurchaseOrderTruckSummary);

router.post("/:purchaseOrderId/allocate", validateToken, requireRole("ADMIN"), allocateTrucksToPurchaseOrder);
router.patch("/:purchaseOrderId/:truckId/status", validateToken, requireRole("ADMIN"), updateTruckStatus);
router.put("/:purchaseOrderId/:truckId/delivered-items", validateToken, requireRole("ADMIN"), setTruckDeliveredItems);

module.exports = router;
