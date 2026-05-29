const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/dbConfig");
const { PO_STATUSES } = require("../utils/poStatusTransitions");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const generateAccessToken = (user) =>
  jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
});

const toPublicCompany = (company) => {
  if (!company) {
    return null;
  }

  return {
    id: company.id,
    companyName: company.companyName,
    companySize: company.companySize,
    yearOfEstablishment: company.yearOfEstablishment,
    gstNumber: company.gstNumber,
    panNumber: company.panNumber,
    companyPhone: company.companyPhone,
    companyLocation: company.companyLocation,
    deliverySpeedDays: company.deliverySpeedDays,
    serviceArea: company.serviceArea,
    about: company.about,
    materialOffers: company.materialOffers?.map((offer) => ({
      id: offer.id,
      materialName: offer.materialName,
      estimatedPrice: offer.estimatedPrice,
      deliverySpeedDays: offer.deliverySpeedDays,
      serviceArea: offer.serviceArea,
    })) || [],
  };
};



const registerCompany = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    password,
    companyName,
    companySize,
    yearOfEstablishment,
    gstNumber,
    panNumber,
    companyPhone,
    companyLocation,
    deliverySpeedDays,
    serviceArea,
    about,
  } = req.body;

  if (!name || !phone || !email || !password || !companyName || !companySize || !yearOfEstablishment || !gstNumber) {
    res.status(400);
    throw new Error("All user and company fields are mandatory");
  }

  if (!EMAIL_REGEX.test(email)) {
    res.status(400);
    throw new Error("Invalid email format");
  }

  if (!PHONE_REGEX.test(phone)) {
    res.status(400);
    throw new Error("Phone number must be 10 digits");
  }

  if (!GST_REGEX.test(String(gstNumber).trim().toUpperCase())) {
    res.status(400);
    throw new Error("Invalid GST number format");
  }

  const normalizedPan = panNumber ? String(panNumber).trim().toUpperCase() : null;
  if (normalizedPan && !PAN_REGEX.test(normalizedPan)) {
    res.status(400);
    throw new Error("Invalid PAN number format");
  }

  const parsedYear = Number(yearOfEstablishment);
  if (!Number.isFinite(parsedYear) || parsedYear < 1900) {
    res.status(400);
    throw new Error("Valid year of establishment is required");
  }

  const parsedDeliverySpeedDays = deliverySpeedDays === undefined || deliverySpeedDays === null || deliverySpeedDays === ""
    ? null
    : Number(deliverySpeedDays);

  if (parsedDeliverySpeedDays !== null && (!Number.isFinite(parsedDeliverySpeedDays) || parsedDeliverySpeedDays <= 0)) {
    res.status(400);
    throw new Error("Delivery speed days must be a positive number");
  }

  const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingUserByEmail) {
    res.status(400);
    throw new Error("User with this email already exists");
  }

  const existingUserByPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingUserByPhone) {
    res.status(400);
    throw new Error("User with this phone number already exists");
  }

  const existingCompanyByGst = await prisma.company.findUnique({ where: { gstNumber: String(gstNumber).trim().toUpperCase() } });
  if (existingCompanyByGst) {
    res.status(400);
    throw new Error("Company with this GST number already exists");
  }

  if (normalizedPan) {
    const existingCompanyByPan = await prisma.company.findFirst({ where: { panNumber: normalizedPan } });
    if (existingCompanyByPan) {
      res.status(400);
      throw new Error("Company with this PAN number already exists");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: String(email).trim().toLowerCase(),
        password: hashedPassword,
        role: "company",
      },
    });

    const company = await tx.company.create({
      data: {
        userId: user.id,
        companyName: String(companyName).trim(),
        companySize: String(companySize).trim(),
        yearOfEstablishment: parsedYear,
        gstNumber: String(gstNumber).trim().toUpperCase(),
        panNumber: normalizedPan,
        companyPhone: companyPhone ? String(companyPhone).trim() : null,
        companyLocation: companyLocation ? String(companyLocation).trim() : null,
        deliverySpeedDays: parsedDeliverySpeedDays,
        serviceArea: serviceArea ? String(serviceArea).trim() : null,
        about: about ? String(about).trim() : null,
      },
      include: {
        materialOffers: true,
      },
    });

    return { user, company };
  });

  res.status(201).json({
    success: true,
    message: "Company registered successfully",
    user: toPublicUser(result.user),
    company: toPublicCompany(result.company),
    accessToken: generateAccessToken(result.user),
  });
});

const getCompanyDashboard = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { userId: req.user.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      materialOffers: true,
    },
  });

  if (!company) {
    res.status(404);
    throw new Error("Company profile not found");
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      createdAt: {
        gte: company.createdAt,
      },
    },
    include: {
      lineItems: true,
      selectedCompany: {
        select: { id: true, companyName: true, companySize: true, companyLocation: true, companyPhone: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const claimedOrders = purchaseOrders.filter((order) => String(order.selectedCompanyId || "") === String(company.id));
  const receivingReceivedOrders = claimedOrders.filter((order) => order.status === PO_STATUSES.FINAL_DELIVERY);
  const availableOrders = purchaseOrders.filter((order) => !order.selectedCompanyId && order.status === PO_STATUSES.PENDING);

  res.status(200).json({
    success: true,
    data: {
      company: toPublicCompany(company),
      summary: {
        allOrders: purchaseOrders.length,
        availableOrders: availableOrders.length,
        claimedOrders: claimedOrders.length,
        receivingReceivedOrders: receivingReceivedOrders.length,
      },
      openOrders: purchaseOrders,
      allOrders: purchaseOrders,
      claimedOrders,
      receivingReceivedOrders,
    },
  });
});

const updateCompanyProfile = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { userId: req.user.id },
    include: { materialOffers: true },
  });

  if (!company) {
    res.status(404);
    throw new Error("Company profile not found");
  }

  const {
    companyName,
    companySize,
    companyPhone,
    companyLocation,
    deliverySpeedDays,
    serviceArea,
    about,
    offerings,
  } = req.body;

  const nextOfferings = Array.isArray(offerings)
    ? offerings
        .map((offering) => ({
          materialName: String(offering?.materialName || "").trim(),
          estimatedPrice: Number(offering?.estimatedPrice),
          deliverySpeedDays: Number(offering?.deliverySpeedDays),
          serviceArea: offering?.serviceArea ? String(offering.serviceArea).trim() : null,
        }))
        .filter(
          (offering) =>
            offering.materialName &&
            Number.isFinite(offering.estimatedPrice) &&
            offering.estimatedPrice >= 0 &&
            Number.isFinite(offering.deliverySpeedDays) &&
            offering.deliverySpeedDays > 0
        )
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    const nextCompany = await tx.company.update({
      where: { id: company.id },
      data: {
        companyName: typeof companyName === "string" && companyName.trim() ? companyName.trim() : company.companyName,
        companySize: typeof companySize === "string" && companySize.trim() ? companySize.trim() : company.companySize,
        companyPhone: companyPhone !== undefined ? (companyPhone ? String(companyPhone).trim() : null) : company.companyPhone,
        companyLocation: companyLocation !== undefined ? (companyLocation ? String(companyLocation).trim() : null) : company.companyLocation,
        deliverySpeedDays: deliverySpeedDays !== undefined ? Number(deliverySpeedDays) || null : company.deliverySpeedDays,
        serviceArea: serviceArea !== undefined ? (serviceArea ? String(serviceArea).trim() : null) : company.serviceArea,
        about: about !== undefined ? (about ? String(about).trim() : null) : company.about,
      },
    });

    if (nextOfferings.length > 0) {
      await tx.companyMaterialOffer.deleteMany({ where: { companyId: company.id } });
      await tx.companyMaterialOffer.createMany({
        data: nextOfferings.map((offering) => ({
          companyId: company.id,
          materialName: offering.materialName,
          estimatedPrice: offering.estimatedPrice,
          deliverySpeedDays: offering.deliverySpeedDays,
          serviceArea: offering.serviceArea,
        })),
      });
    }

    return tx.company.findUnique({
      where: { id: company.id },
      include: { materialOffers: true },
    });
  });

  res.status(200).json({
    success: true,
    message: "Company profile updated successfully",
    data: toPublicCompany(updated),
  });
});

const claimPurchaseOrder = asyncHandler(async (req, res) => {
  const { purchaseOrderId } = req.params;
  const { claimCode } = req.body;

  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  if (!company) {
    res.status(404);
    throw new Error("Company profile not found");
  }

  const purchaseOrder = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
  if (!purchaseOrder) {
    res.status(404);
    throw new Error("Purchase order not found");
  }

  if (String(purchaseOrder.uniqueId || "") !== String(claimCode || "").trim()) {
    res.status(400);
    throw new Error("Invalid PO code");
  }

  if (purchaseOrder.selectedCompanyId && String(purchaseOrder.selectedCompanyId) !== String(company.id)) {
    res.status(409);
    throw new Error("This purchase order has already been claimed by another company");
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      selectedCompanyId: company.id,
      status: "ACCEPTED",
      reviewedAt: new Date(),
      reviewedById: req.user.id,
    },
    include: {
      selectedCompany: {
        select: { id: true, companyName: true, companySize: true, companyLocation: true, companyPhone: true },
      },
      lineItems: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "Purchase order claimed successfully",
    data: updated,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error("Current password, new password, and confirmation are required");
  }

  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error("New password and confirmation do not match");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters long");
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedNewPassword },
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

module.exports = {
  registerCompany,
  getCompanyDashboard,
  updateCompanyProfile,
  claimPurchaseOrder,
  changePassword,
};