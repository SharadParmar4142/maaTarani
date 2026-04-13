const asyncHandler = require("express-async-handler");
const { prisma, cleanupLegacyTruckData } = require("../config/dbConfig");
const {
  PO_STATUS_FOR_TRUCK_ALLOCATION,
  PO_STATUSES_FOR_TRUCK_ALLOCATION,
  TRUCK_STATUSES,
  TRUCK_NUMBER_REGEX,
  canTransitionTruckStatus,
  getNextTruckStatus,
} = require("../utils/truckTrackingConstants");
const { PO_STATUSES } = require("../utils/poStatusTransitions");

function normalizeTruckNumber(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function assertPOAccess(purchaseOrder, user) {
  if (!purchaseOrder) {
    return { ok: false, code: 404, message: "Purchase order not found" };
  }

  if (user.role === "ADMIN") {
    return { ok: true };
  }

  if (purchaseOrder.userId !== user.id) {
    return { ok: false, code: 403, message: "Access denied" };
  }

  return { ok: true };
}

function buildSummary(purchaseOrder, trucks) {
  const lineItems = purchaseOrder.lineItems || [];
  const lineItemById = new Map(lineItems.map((item) => [item.id, item]));

  const deliveredByLineItem = new Map();
  for (const item of lineItems) {
    deliveredByLineItem.set(item.id, 0);
  }

  for (const truck of trucks) {
    for (const item of truck.deliveredItems || []) {
      const current = deliveredByLineItem.get(item.lineItemId) || 0;
      deliveredByLineItem.set(item.lineItemId, current + Number(item.quantity || 0));
    }
  }

  const remainingByItem = lineItems.map((lineItem) => {
    const ordered = Number(lineItem.quantity || 0);
    const delivered = Number(deliveredByLineItem.get(lineItem.id) || 0);
    const remaining = Math.max(ordered - delivered, 0);

    return {
      lineItemId: lineItem.id,
      description: lineItem.description,
      orderedQuantity: ordered,
      deliveredQuantity: Number(delivered.toFixed(3)),
      remainingQuantity: Number(remaining.toFixed(3)),
    };
  });

  const remainingTotalQuantity = remainingByItem.reduce((sum, item) => sum + item.remainingQuantity, 0);
  const receivingPendingTruckCount = trucks.filter(
    (truck) => truck.status === TRUCK_STATUSES.DELIVERED && truck.userReceivingUpdatedAt == null
  ).length;
  const receivingCompletedTruckCount = trucks.filter((truck) => truck.userReceivingUpdatedAt != null).length;
  const canFinalizeReceiving =
    trucks.length > 0 &&
    receivingPendingTruckCount === 0 &&
    receivingCompletedTruckCount === trucks.length &&
    remainingTotalQuantity === 0;

  return {
    purchaseOrderId: purchaseOrder.id,
    purchaseOrderStatus: purchaseOrder.status,
    canAllocateTrucks: PO_STATUSES_FOR_TRUCK_ALLOCATION.includes(purchaseOrder.status),
    truckCount: trucks.length,
    receivingPendingTruckCount,
    receivingCompletedTruckCount,
    canFinalizeReceiving,
    trucks: trucks.map((truck) => ({
      id: truck.id,
      truckNumber: truck.truckNumber,
      status: truck.status,
      materialLineItemId: truck.lineItemId,
      materialDescription: lineItemById.get(truck.lineItemId)?.description || "",
      nextStatus: getNextTruckStatus(truck.status),
      userShortageQuantity: truck.userShortageQuantity ?? null,
      userReceivingNote: truck.userReceivingNote ?? null,
      userReceivingUpdatedAt: truck.userReceivingUpdatedAt ?? null,
      userReceivingUpdatedById: truck.userReceivingUpdatedById ?? null,
      effectiveReceivedQuantity:
        (truck.deliveredItems || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0) -
        Number(truck.userShortageQuantity || 0),
      deliveredItems: (truck.deliveredItems || []).map((item) => ({
        lineItemId: item.lineItemId,
        description: item.lineItem?.description || lineItemById.get(item.lineItemId)?.description || "",
        quantity: item.quantity,
      })),
      createdAt: truck.createdAt,
      updatedAt: truck.updatedAt,
    })),
    remainingByItem,
    remainingTotalQuantity: Number(remainingTotalQuantity.toFixed(3)),
  };
}

async function fetchPurchaseOrderWithTruckContext(purchaseOrderId) {
  return prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: {
      lineItems: {
        orderBy: { id: "asc" },
      },
      trucks: {
        include: {
          deliveredItems: {
            include: {
              lineItem: {
                select: {
                  id: true,
                  description: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

async function queryPurchaseOrdersWithTruckSummary(whereClause) {
  const runQuery = () =>
    prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        lineItems: {
          orderBy: { id: "asc" },
        },
        trucks: {
          include: {
            deliveredItems: {
              include: {
                lineItem: {
                  select: {
                    id: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  try {
    return await runQuery();
  } catch (error) {
    const errorText = String(error?.message || "").toLowerCase();
    const isLegacyNullDataIssue =
      errorText.includes("lineitemid") &&
      (errorText.includes("null") || errorText.includes("non-nullable"));

    if (!isLegacyNullDataIssue) {
      throw error;
    }

    await cleanupLegacyTruckData();
    return runQuery();
  }
}

const allocateTrucksToPurchaseOrder = asyncHandler(async (req, res) => {
  const { purchaseOrderId } = req.params;
  const { truckCount, allocations } = req.body;

  if (!Array.isArray(allocations) || allocations.length === 0) {
    res.status(400);
    throw new Error("allocations is required and must be a non-empty array");
  }

  const normalizedAllocations = allocations.map((entry) => ({
    truckNumber: normalizeTruckNumber(entry?.truckNumber),
    lineItemId: String(entry?.lineItemId || "").trim(),
  }));

  const normalizedNumbers = normalizedAllocations.map((entry) => entry.truckNumber);
  const invalidNumbers = normalizedNumbers.filter((value) => !TRUCK_NUMBER_REGEX.test(value));

  if (invalidNumbers.length > 0) {
    res.status(400);
    throw new Error(`Invalid truck number format: ${invalidNumbers.join(", ")}. Expected format like MH02AC2111`);
  }

  const uniqueNumbers = [...new Set(normalizedNumbers)];
  if (uniqueNumbers.length !== normalizedNumbers.length) {
    res.status(400);
    throw new Error("Duplicate truck numbers are not allowed in the same allocation request");
  }

  if (Number.isFinite(Number(truckCount)) && Number(truckCount) !== normalizedAllocations.length) {
    res.status(400);
    throw new Error("truckCount does not match the number of allocations provided");
  }

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: {
      lineItems: true,
      trucks: true,
    },
  });

  const access = assertPOAccess(purchaseOrder, req.user);
  if (!access.ok) {
    res.status(access.code);
    throw new Error(access.message);
  }

  if (!PO_STATUSES_FOR_TRUCK_ALLOCATION.includes(purchaseOrder.status)) {
    res.status(400);
    throw new Error(
      `Trucks can be allocated only when PO is in ${PO_STATUS_FOR_TRUCK_ALLOCATION} (UnderLoading) or SHIPPING (Delivered) stage`
    );
  }

  const existingTruckSet = new Set((purchaseOrder.trucks || []).map((truck) => truck.truckNumber));
  const duplicatesWithExisting = uniqueNumbers.filter((number) => existingTruckSet.has(number));

  if (duplicatesWithExisting.length > 0) {
    res.status(400);
    throw new Error(`These truck numbers are already allocated: ${duplicatesWithExisting.join(", ")}`);
  }

  const poLineItemIdSet = new Set((purchaseOrder.lineItems || []).map((lineItem) => lineItem.id));
  const invalidLineItems = normalizedAllocations.filter((entry) => !poLineItemIdSet.has(entry.lineItemId));

  if (invalidLineItems.length > 0) {
    res.status(400);
    throw new Error("Each truck must be assigned a valid PO material (line item)");
  }

  const createdTrucks = await prisma.$transaction(
    normalizedAllocations.map((entry) =>
      prisma.truckAllocation.create({
        data: {
          purchaseOrderId,
          truckNumber: entry.truckNumber,
          lineItemId: entry.lineItemId,
          status: TRUCK_STATUSES.UNDER_LOADING,
        },
      })
    )
  );

  const withContext = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);
  const summary = buildSummary(withContext, withContext.trucks || []);

  res.status(201).json({
    success: true,
    message: `${createdTrucks.length} truck(s) allocated successfully`,
    data: summary,
  });
});

const getPurchaseOrderTruckSummary = asyncHandler(async (req, res) => {
  const { purchaseOrderId } = req.params;

  const purchaseOrder = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);

  const access = assertPOAccess(purchaseOrder, req.user);
  if (!access.ok) {
    res.status(access.code);
    throw new Error(access.message);
  }

  const summary = buildSummary(purchaseOrder, purchaseOrder.trucks || []);

  res.status(200).json({
    success: true,
    data: summary,
  });
});

const getTruckSummariesForOrders = asyncHandler(async (req, res) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(200).json({ success: true, data: {} });
  }

  const uniqueOrderIds = [...new Set(orderIds.map((id) => String(id).trim()).filter(Boolean))];

  const purchaseOrders = await queryPurchaseOrdersWithTruckSummary({
    id: { in: uniqueOrderIds },
    ...(req.user.role === "USER" ? { userId: req.user.id } : {}),
  });

  const summaryByOrderId = {};
  for (const po of purchaseOrders) {
    summaryByOrderId[po.id] = buildSummary(po, po.trucks || []);
  }

  res.status(200).json({
    success: true,
    data: summaryByOrderId,
  });
});

const updateTruckStatus = asyncHandler(async (req, res) => {
  const { purchaseOrderId, truckId } = req.params;
  const { status } = req.body;

  if (!Object.values(TRUCK_STATUSES).includes(status)) {
    res.status(400);
    throw new Error("Invalid truck status. Allowed: UNDER_LOADING, DISPATCHED, DELIVERED, RECEIVING");
  }

  if (status === TRUCK_STATUSES.RECEIVING) {
    res.status(400);
    throw new Error("Truck can be moved to RECEIVING only by user after submitting shortage form");
  }

  const purchaseOrder = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);

  const access = assertPOAccess(purchaseOrder, req.user);
  if (!access.ok) {
    res.status(access.code);
    throw new Error(access.message);
  }

  const truck = (purchaseOrder.trucks || []).find((item) => item.id === truckId);
  if (!truck) {
    res.status(404);
    throw new Error("Truck allocation not found");
  }

  if (!canTransitionTruckStatus(truck.status, status)) {
    res.status(400);
    throw new Error(`Invalid truck status transition from ${truck.status} to ${status}`);
  }

  if (status === TRUCK_STATUSES.RECEIVING && (truck.deliveredItems || []).length === 0) {
    res.status(400);
    throw new Error("Delivered item quantities must be specified before moving truck to RECEIVING");
  }

  const tx = [
    prisma.truckAllocation.update({
      where: { id: truckId },
      data: { status },
    }),
  ];

  if (status === TRUCK_STATUSES.DELIVERED) {
    tx.push(
      prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: PO_STATUSES.SHIPPING },
      })
    );
  }

  await prisma.$transaction(tx);

  const refreshedPO = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);
  const summary = buildSummary(refreshedPO, refreshedPO.trucks || []);

  res.status(200).json({
    success: true,
    message: "Truck status updated",
    data: summary,
  });
});

const submitUserReceivingReport = asyncHandler(async (req, res) => {
  const { purchaseOrderId, truckId } = req.params;
  const { shortageQuantity, receivingNote } = req.body;

  const normalizedShortage = Number(shortageQuantity || 0);
  if (!Number.isFinite(normalizedShortage) || normalizedShortage < 0) {
    res.status(400);
    throw new Error("shortageQuantity is required and must be >= 0");
  }

  const purchaseOrder = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);
  const access = assertPOAccess(purchaseOrder, req.user);
  if (!access.ok) {
    res.status(access.code);
    throw new Error(access.message);
  }

  const truck = (purchaseOrder.trucks || []).find((item) => item.id === truckId);
  if (!truck) {
    res.status(404);
    throw new Error("Truck allocation not found");
  }

  if (truck.status !== TRUCK_STATUSES.DELIVERED) {
    res.status(400);
    throw new Error("Receiving form can be submitted only when truck status is DELIVERED");
  }

  const deliveredQuantity = (truck.deliveredItems || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if (deliveredQuantity <= 0) {
    res.status(400);
    throw new Error("Delivered quantity is not available for this truck");
  }

  if (normalizedShortage > deliveredQuantity) {
    res.status(400);
    throw new Error(`shortageQuantity cannot exceed delivered quantity (${deliveredQuantity})`);
  }

  await prisma.$transaction([
    prisma.truckAllocation.update({
      where: { id: truckId },
      data: {
        status: TRUCK_STATUSES.RECEIVING,
        userShortageQuantity: normalizedShortage,
        userReceivingNote:
          typeof receivingNote === "string" ? receivingNote.trim() || null : truck.userReceivingNote || null,
        userReceivingUpdatedAt: new Date(),
        userReceivingUpdatedById: req.user.id,
      },
    }),
  ]);

  const refreshedPO = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);
  const summary = buildSummary(refreshedPO, refreshedPO.trucks || []);

  res.status(200).json({
    success: true,
    message: "Receiving details submitted successfully",
    data: summary,
  });
});

const finalizeUserReceivingOrder = asyncHandler(async (req, res) => {
  const { purchaseOrderId } = req.params;

  const purchaseOrder = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);
  const access = assertPOAccess(purchaseOrder, req.user);
  if (!access.ok) {
    res.status(access.code);
    throw new Error(access.message);
  }

  const summary = buildSummary(purchaseOrder, purchaseOrder.trucks || []);

  if (!summary.canFinalizeReceiving) {
    res.status(400);
    throw new Error(
      "Receiving can be finalized only when every truck has submitted receiving details and no quantity remains"
    );
  }

  await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      status: PO_STATUSES.FINAL_DELIVERY,
    },
  });

  const refreshedPO = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);
  const refreshedSummary = buildSummary(refreshedPO, refreshedPO.trucks || []);

  res.status(200).json({
    success: true,
    message: "Receiving finalized successfully",
    data: refreshedSummary,
  });
});

const setTruckDeliveredItems = asyncHandler(async (req, res) => {
  const { purchaseOrderId, truckId } = req.params;
  const { quantity } = req.body;

  const normalizedQuantity = Number(quantity || 0);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    res.status(400);
    throw new Error("quantity is required and must be greater than 0");
  }

  const purchaseOrder = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);

  const access = assertPOAccess(purchaseOrder, req.user);
  if (!access.ok) {
    res.status(access.code);
    throw new Error(access.message);
  }

  const truck = (purchaseOrder.trucks || []).find((item) => item.id === truckId);
  if (!truck) {
    res.status(404);
    throw new Error("Truck allocation not found");
  }

  if (truck.status !== TRUCK_STATUSES.DELIVERED) {
    res.status(400);
    throw new Error("Delivered item quantities can be set only when truck status is DELIVERED");
  }

  const lineItemMap = new Map((purchaseOrder.lineItems || []).map((lineItem) => [lineItem.id, lineItem]));
  const assignedLineItem = lineItemMap.get(truck.lineItemId);
  if (!assignedLineItem) {
    res.status(400);
    throw new Error("Assigned truck material is invalid for this purchase order");
  }

  const deliveredFromOtherTrucks = new Map();
  for (const poTruck of purchaseOrder.trucks || []) {
    if (poTruck.id === truckId) {
      continue;
    }

    for (const deliveredItem of poTruck.deliveredItems || []) {
      const current = deliveredFromOtherTrucks.get(deliveredItem.lineItemId) || 0;
      deliveredFromOtherTrucks.set(deliveredItem.lineItemId, current + Number(deliveredItem.quantity || 0));
    }
  }

  const otherDelivered = deliveredFromOtherTrucks.get(truck.lineItemId) || 0;
  const totalAfterUpdate = otherDelivered + normalizedQuantity;

  if (totalAfterUpdate > Number(assignedLineItem.quantity || 0)) {
    res.status(400);
    throw new Error(
      `Delivered quantity for ${assignedLineItem.description} exceeds ordered quantity. Ordered: ${assignedLineItem.quantity}, attempted: ${totalAfterUpdate}`
    );
  }

  await prisma.$transaction([
    prisma.truckDeliveredItem.deleteMany({
      where: {
        truckAllocationId: truckId,
      },
    }),
    prisma.truckDeliveredItem.create({
      data: {
        truckAllocationId: truckId,
        lineItemId: truck.lineItemId,
        quantity: normalizedQuantity,
      },
    }),
  ]);

  const refreshedPO = await fetchPurchaseOrderWithTruckContext(purchaseOrderId);
  const summary = buildSummary(refreshedPO, refreshedPO.trucks || []);

  res.status(200).json({
    success: true,
    message: "Truck delivered quantities updated",
    data: summary,
  });
});

module.exports = {
  allocateTrucksToPurchaseOrder,
  getPurchaseOrderTruckSummary,
  getTruckSummariesForOrders,
  updateTruckStatus,
  submitUserReceivingReport,
  finalizeUserReceivingOrder,
  setTruckDeliveredItems,
};
