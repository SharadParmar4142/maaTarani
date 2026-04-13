const asyncHandler = require("express-async-handler");
const { prisma } = require("../config/dbConfig");
const { google } = require("googleapis");
const {
  PO_STATUSES,
  IN_PROGRESS_STATUSES,
  getAllowedNextStatuses,
  canTransitionStatus,
} = require("../utils/poStatusTransitions");
const {
  PO_STATUS_FOR_TRUCK_ALLOCATION,
  TRUCK_STATUSES,
} = require("../utils/truckTrackingConstants");

const TRUCK_STATUS_ORDER = {
  [TRUCK_STATUSES.UNDER_LOADING]: 1,
  [TRUCK_STATUSES.DISPATCHED]: 2,
  [TRUCK_STATUSES.DELIVERED]: 3,
  [TRUCK_STATUSES.RECEIVING]: 4,
};

const REQUIRED_TRUCK_STATUS_BY_PO_TARGET = {
  [PO_STATUSES.SORTING]: TRUCK_STATUSES.DISPATCHED,
  [PO_STATUSES.SHIPPING]: TRUCK_STATUSES.DELIVERED,
  [PO_STATUSES.FINAL_DELIVERY]: TRUCK_STATUSES.RECEIVING,
};

function hasReachedTruckStatus(currentStatus, requiredStatus) {
  return (TRUCK_STATUS_ORDER[currentStatus] || 0) >= (TRUCK_STATUS_ORDER[requiredStatus] || 0);
}

// ===== Duplicate detection helpers =====
function toFixed2(num) {
  const n = Number(num || 0);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function normalizeLineItems(items) {
  return (items || [])
    .map((it) => ({
      description: String(it.description || "").trim(),
      quantity: toFixed2(it.quantity),
      rate: toFixed2(it.rate),
      gst: toFixed2(it.gst),
      amount: toFixed2(
        it.amount != null
          ? it.amount
          : toFixed2(it.quantity) * toFixed2(it.rate) * (1 + toFixed2(it.gst) / 100)
      ),
    }))
    .sort((a, b) => a.description.localeCompare(b.description));
}

function payloadToComparable(payload) {
  return {
    company: {
      name: String(payload.company?.name || "").trim(),
      address: String(payload.company?.address || "").trim(),
      cityStateZip: String(payload.company?.cityStateZip || "").trim(),
      country: String(payload.company?.country || "").trim(),
      contact: String(payload.company?.contact || "").trim(),
    },
    vendor: {
      name: String(payload.vendor?.name || "").trim(),
      address: String(payload.vendor?.address || "").trim(),
      cityStateZip: String(payload.vendor?.cityStateZip || "").trim(),
      country: String(payload.vendor?.country || "").trim(),
    },
    orderInfo: {
      poNumber: String(payload.orderInfo?.poNumber || "").trim(),
      orderDate: String(payload.orderInfo?.orderDate || "").trim(),
      deliveryDate: String(payload.orderInfo?.deliveryDate || "").trim(),
    },
    lineItems: normalizeLineItems(payload.lineItems),
    subTotal: toFixed2(payload.subTotal),
    total: toFixed2(payload.total),
  };
}

function dbOrderToComparable(po) {
  return {
    company: {
      name: String(po.companyName || "").trim(),
      address: String(po.companyAddress || "").trim(),
      cityStateZip: String(po.companyCityStateZip || "").trim(),
      country: String(po.companyCountry || "").trim(),
      contact: String(po.companyContact || "").trim(),
    },
    vendor: {
      name: String(po.vendorName || "").trim(),
      address: String(po.vendorAddress || "").trim(),
      cityStateZip: String(po.vendorCityStateZip || "").trim(),
      country: String(po.vendorCountry || "").trim(),
    },
    orderInfo: {
      poNumber: String(po.poNumber || "").trim(),
      orderDate: po.orderDate ? new Date(po.orderDate).toISOString().split("T")[0] : "",
      deliveryDate: po.deliveryDate ? new Date(po.deliveryDate).toISOString().split("T")[0] : "",
    },
    lineItems: normalizeLineItems(po.lineItems || []),
    subTotal: toFixed2(po.subTotal),
    total: toFixed2(po.total),
  };
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const createPurchaseOrder = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "User is not authorized" });
    }

    const { company, vendor, orderInfo, lineItems, subTotal, taxRate, taxAmount, total } = req.body;

    // Basic validation
    if (!company || !company.name || !company.address || !company.cityStateZip || !company.country) {
      return res.status(400).json({ success: false, message: "Company information is required: name, address, cityStateZip, country" });
    }
    
    if (!vendor || !vendor.name || !vendor.address || !vendor.cityStateZip || !vendor.country) {
      return res.status(400).json({ success: false, message: "Vendor information is required: name, address, cityStateZip, country" });
    }
    
    if (!orderInfo || !orderInfo.poNumber) {
      return res.status(400).json({ success: false, message: "PO number is required" });
    }
    
    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({ success: false, message: "At least one line item is required" });
    }
    
    // Validate line items (allow rate 0, require qty > 0)
    for (const [idx, item] of lineItems.entries()) {
      if (!item.description || String(item.description).trim().length === 0) {
        return res.status(400).json({ success: false, message: `Line item ${idx + 1}: description is required` });
      }
      const qty = Number(item.quantity);
      const rate = Number(item.rate);
      const gst = Number(item.gst || 0);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: `Line item ${idx + 1}: quantity must be > 0` });
      }
      if (!Number.isFinite(rate) || rate < 0) {
        return res.status(400).json({ success: false, message: `Line item ${idx + 1}: rate must be >= 0` });
      }
      if (!Number.isFinite(gst) || gst < 0) {
        return res.status(400).json({ success: false, message: `Line item ${idx + 1}: gst must be >= 0` });
      }
    }

    // Generate a unique reference ID for database management (numbers only)
    const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1000000)}`;

    const normalizedOrderDate = orderInfo.orderDate ? new Date(orderInfo.orderDate) : null;
    const normalizedDeliveryDate = orderInfo.deliveryDate ? new Date(orderInfo.deliveryDate) : null;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        uniqueId: uniqueId,
        userId: req.user.id,
        status: PO_STATUSES.PENDING,
        companyName: company.name,
        companyAddress: company.address,
        companyCityStateZip: company.cityStateZip,
        companyCountry: company.country,
        companyContact: company.contact || null,

        vendorName: vendor.name,
        vendorAddress: vendor.address,
        vendorCityStateZip: vendor.cityStateZip,
        vendorCountry: vendor.country,

        poNumber: orderInfo.poNumber,
        orderDate: normalizedOrderDate,
        deliveryDate: normalizedDeliveryDate,

        subTotal: subTotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,

        lineItems: {
          create: lineItems.map((item) => {
            const qty = Number(item.quantity) || 0;
            const rate = Number(item.rate) || 0;
            const gst = Number(item.gst) || 0;
            const amount = item.amount != null ? item.amount : qty * rate * (1 + gst / 100);
            return {
              description: item.description,
              quantity: qty,
              rate: rate,
              amount: amount,
              gst: gst,
            };
          }),
        },
      },
      include: {
        lineItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({ 
      success: true, 
      message: "Purchase order created successfully", 
      data: purchaseOrder,
      unique_id: uniqueId
    });
  } catch (error) {
    console.error("Error saving purchase order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const updateGoogleSheet = asyncHandler(async (req, res) => {
  try {
    const { company, vendor, orderInfo, lineItems, subTotal, gst, total, uniqueId } = req.body;

    if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
    }

    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } catch (parseError) {
      throw new Error(`Invalid GOOGLE_CREDENTIALS JSON format: ${parseError.message}`);
    }

    const privateKey = credentials.private_key.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEET_ID environment variable is not set");
    }

    // Generate unique_id if not provided (numbers only)
    const finalUniqueId = uniqueId || `${Date.now()}${Math.floor(Math.random() * 1000000)}`;

    const rows = lineItems.map((item) => [
      company.name,                    // A: Company Name
      company.address,                 // B: Company Address
      company.cityStateZip,            // C: Company City State Zip
      company.country,                 // D: Company Country
      vendor.name,                     // E: Vendor Name
      vendor.address,                  // F: Vendor Address
      vendor.cityStateZip,             // G: Vendor City State Zip
      vendor.country,                  // H: Vendor Country
      orderInfo.poNumber,              // I: PO Number
      orderInfo.orderDate,             // J: Order Date
      orderInfo.deliveryDate,          // K: Delivery Date
      total,                            // L: Total
      item.description,                // M: Item Description
      item.quantity,                   // N: Quantity
      item.rate,                       // O: Rate
      item.amount,                     // P: Amount
      item.gst,                        // Q: GST
      finalUniqueId,                   // R: Unique ID
    ]);

    // Add an empty row after the data for better spacing
    rows.push(Array(18).fill('')); // Empty row with same number of columns

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:R",
      valueInputOption: "USER_ENTERED",
      resource: { values: rows },
    });

    res.status(200).json({ success: true, message: "Google Sheet updated successfully", updatedRows: response.data.updates?.updatedRows || rows.length });
  } catch (error) {
    console.error("Error updating Google Sheet:", error);
    let errorMessage = error.message;
    if (error.message.includes("GOOGLE_CREDENTIALS")) {
      errorMessage = "Google API credentials issue. Please check GOOGLE_CREDENTIALS environment variable.";
    } else if (error.message.includes("GOOGLE_SHEET_ID")) {
      errorMessage = "Google Sheet ID missing. Please set GOOGLE_SHEET_ID environment variable.";
    } else if (error.message.includes("spreadsheet")) {
      errorMessage = "Cannot access Google Spreadsheet. Please check permissions and spreadsheet ID.";
    } else if (error.message.includes("quota")) {
      errorMessage = "Google Sheets API quota exceeded. Please try again later.";
    }
    res.status(500).json({ success: false, message: errorMessage, error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

const checkDuplicatePurchaseOrder = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "User is not authorized" });
    }

    const payload = req.body;
    const comparable = payloadToComparable(payload);

    const candidates = await prisma.purchaseOrder.findMany({
      where: {
        userId: req.user.id,
        poNumber: payload?.orderInfo?.poNumber || "",
        companyName: payload?.company?.name || "",
        vendorName: payload?.vendor?.name || "",
      },
      include: {
        lineItems: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    for (const po of candidates) {
      const compDb = dbOrderToComparable(po);
      if (deepEqual(comparable, compDb)) {
        return res.json({ exists: true, unique_id: po.uniqueId });
      }
    }

    return res.json({ exists: false });
  } catch (error) {
    console.error("Error checking duplicate PO:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const getMyPurchaseOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.purchaseOrder.findMany({
    where: { userId: req.user.id },
    include: {
      lineItems: true,
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    counts: {
      pending: orders.filter((order) => order.status === PO_STATUSES.PENDING).length,
      accepted: orders.filter((order) => order.status === PO_STATUSES.ACCEPTED).length,
      inProgress: orders.filter((order) => IN_PROGRESS_STATUSES.includes(order.status)).length,
      delivered: orders.filter((order) => [PO_STATUSES.SHIPPING, PO_STATUSES.FINAL_DELIVERY].includes(order.status)).length,
      receivingReceived: orders.filter((order) => order.status === PO_STATUSES.FINAL_DELIVERY).length,
      rejected: orders.filter((order) => order.status === PO_STATUSES.REJECTED).length,
      total: orders.length,
    },
    data: orders,
  });
});

const getAdminDashboardOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      lineItems: {
        orderBy: {
          id: "asc",
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = orders.filter((order) => order.status === PO_STATUSES.PENDING);
  const accepted = orders.filter((order) => order.status === PO_STATUSES.ACCEPTED);
  const inProgress = orders.filter((order) => IN_PROGRESS_STATUSES.includes(order.status));
  const delivered = orders.filter((order) => order.status === PO_STATUSES.SHIPPING);
  const receivingReceived = orders.filter((order) => order.status === PO_STATUSES.FINAL_DELIVERY);
  const rejected = orders.filter((order) => order.status === PO_STATUSES.REJECTED);

  res.status(200).json({
    success: true,
    counts: {
      pending: pending.length,
      accepted: accepted.length,
      inProgress: inProgress.length,
      delivered: delivered.length,
      receivingReceived: receivingReceived.length,
      rejected: rejected.length,
      total: orders.length,
    },
    data: {
      pending,
      accepted,
      inProgress,
      delivered,
      receivingReceived,
      rejected,
    },
  });
});

const updatePurchaseOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reviewNote } = req.body;

  if (!Object.values(PO_STATUSES).includes(status)) {
    res.status(400);
    throw new Error("Invalid status. Allowed: PENDING, ACCEPTED, PICKING, PACKING, SORTING, SHIPPING, FINAL_DELIVERY, REJECTED");
  }

  const existingOrder = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existingOrder) {
    res.status(404);
    throw new Error("Purchase order not found");
  }

  const allowedNextStatuses = getAllowedNextStatuses(existingOrder.status);
  const isSameStatus = existingOrder.status === status;
  const isAllowedTransition = canTransitionStatus(existingOrder.status, status);

  if (!isSameStatus && !isAllowedTransition) {
    res.status(400);
    throw new Error(
      `Invalid status transition from ${existingOrder.status} to ${status}. Allowed next: ${
        allowedNextStatuses.length > 0 ? allowedNextStatuses.join(", ") : "none"
      }`
    );
  }

  if (status === PO_STATUSES.FINAL_DELIVERY) {
    res.status(400);
    throw new Error("Admin cannot move order to Receiving Received directly. Use user receiving finalize flow.");
  }

  // PO cannot move past UnderLoading unless truck allocation/progress prerequisites are met.
  if (!isSameStatus) {
    const requiredTruckStatus = REQUIRED_TRUCK_STATUS_BY_PO_TARGET[status];

    if (requiredTruckStatus) {
      const trucks = await prisma.truckAllocation.findMany({
        where: { purchaseOrderId: id },
        select: {
          truckNumber: true,
          status: true,
        },
      });

      if (trucks.length === 0) {
        res.status(400);
        throw new Error(
          `Cannot move PO to ${status}. Allocate at least one truck while PO is in ${PO_STATUS_FOR_TRUCK_ALLOCATION} (UnderLoading).`
        );
      }

      const laggingTrucks = trucks.filter(
        (truck) => !hasReachedTruckStatus(truck.status, requiredTruckStatus)
      );

      if (laggingTrucks.length > 0) {
        const sampleTrucks = laggingTrucks
          .slice(0, 5)
          .map((truck) => `${truck.truckNumber} (${truck.status})`)
          .join(", ");

        res.status(400);
        throw new Error(
          `Cannot move PO to ${status}. All allocated trucks must be at least ${requiredTruckStatus}. Pending trucks: ${sampleTrucks}`
        );
      }
    }
  }

  const nextReviewNote =
    typeof reviewNote === "string"
      ? reviewNote.trim() || null
      : existingOrder.reviewNote || null;

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status,
      reviewNote: nextReviewNote,
      reviewedAt: status === PO_STATUSES.PENDING ? null : new Date(),
      reviewedById: status === PO_STATUSES.PENDING ? null : req.user.id,
    },
    include: {
      lineItems: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Purchase order status updated",
    data: updated,
  });
});

module.exports = {
  createPurchaseOrder,
  updateGoogleSheet,
  checkDuplicatePurchaseOrder,
  getMyPurchaseOrders,
  getAdminDashboardOrders,
  updatePurchaseOrderStatus,
};
