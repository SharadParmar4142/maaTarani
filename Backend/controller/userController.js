const asyncHandler = require("express-async-handler");
const { prisma } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

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
    };
};

//@desc Register a User with Company Details
//@route POST /api/user/register
//@access public

const registerUser = asyncHandler(async (req, res) => {
    const {
        // User Details
        name,
        phone,
        email,
        password,
        // Company Details
        companyName,
        companySize,
        yearOfEstablishment,
        gstNumber,
        panNumber,
        companyPhone
    } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !password) {
        res.status(400);
        throw new Error("All user fields are mandatory (name, phone, email, password)");
    }

    if (!companyName || !companySize || !yearOfEstablishment || !gstNumber) {
        res.status(400);
        throw new Error("All company fields are mandatory except PAN and company phone");
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
        res.status(400);
        throw new Error("Invalid email format");
    }

    if (!PHONE_REGEX.test(phone)) {
        res.status(400);
        throw new Error("Phone number must be 10 digits");
    }

    if (!GST_REGEX.test(gstNumber)) {
        res.status(400);
        throw new Error("Invalid GST number format");
    }

    if (panNumber) {
        if (!PAN_REGEX.test(panNumber)) {
            res.status(400);
            throw new Error("Invalid PAN number format");
        }
    }

    // Check if user already exists with email
    const userAvailableByEmail = await prisma.user.findUnique({
        where: { email }
    });

    if (userAvailableByEmail) {
        res.status(400);
        throw new Error("User with this email already exists");
    }

    // Check if user already exists with phone
    const userAvailableByPhone = await prisma.user.findUnique({
        where: { phone }
    });

    if (userAvailableByPhone) {
        res.status(400);
        throw new Error("User with this phone number already exists");
    }

    // Check if GST number already exists
    const gstExists = await prisma.company.findUnique({
        where: { gstNumber }
    });

    if (gstExists) {
        res.status(400);
        throw new Error("Company with this GST number already registered");
    }

    // Check if PAN number already exists (if provided)
    if (panNumber) {
        const panExists = await prisma.company.findFirst({
            where: { panNumber }
        });

        if (panExists) {
            res.status(400);
            throw new Error("Company with this PAN number already registered");
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with company in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
            data: {
                name,
                phone,
                email,
                password: hashedPassword,
                role: "USER",
            }
        });

        // Create company associated with user
        const company = await tx.company.create({
            data: {
                userId: user.id,
                companyName,
                companySize,
                yearOfEstablishment: parseInt(yearOfEstablishment),
                gstNumber,
                panNumber: panNumber || null,
                companyPhone: companyPhone || null,
            }
        });

        return { user, company };
    });

    console.log(`User created: ${result.user.name} with company: ${result.company.companyName}`);

    const accessToken = generateAccessToken(result.user);

    // Send response without password
    if (result.user) {
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: toPublicUser(result.user),
            company: toPublicCompany(result.company),
            accessToken,
        });
    } else {
        res.status(400);
        throw new Error("User data not valid");
    }
});

//@desc Login user
//@route POST /api/user/login
//@access public

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory");
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true }
    });

    if (!user) {
        res.status(401);
        throw new Error("Invalid email or password");
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
        const accessToken = generateAccessToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: toPublicUser(user),
            company: toPublicCompany(user.company),
            accessToken,
        });
    } else {
        res.status(401);
        throw new Error("Invalid email or password");
    }
});

//@desc Get current user info
//@route GET /api/user/current
//@access private

const registerAdmin = asyncHandler(async (req, res) => {
    const { name, phone, email, password, adminSignupKey } = req.body;

    if (!name || !phone || !email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory (name, phone, email, password)");
    }

    if (!EMAIL_REGEX.test(email)) {
        res.status(400);
        throw new Error("Invalid email format");
    }

    if (!PHONE_REGEX.test(phone)) {
        res.status(400);
        throw new Error("Phone number must be 10 digits");
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be at least 6 characters");
    }

    if (process.env.ADMIN_SIGNUP_KEY && adminSignupKey !== process.env.ADMIN_SIGNUP_KEY) {
        res.status(403);
        throw new Error("Invalid admin signup key");
    }

    const userAvailableByEmail = await prisma.user.findUnique({ where: { email } });
    if (userAvailableByEmail) {
        res.status(400);
        throw new Error("User with this email already exists");
    }

    const userAvailableByPhone = await prisma.user.findUnique({ where: { phone } });
    if (userAvailableByPhone) {
        res.status(400);
        throw new Error("User with this phone number already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name,
            phone,
            email,
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        user: toPublicUser(user),
        company: null,
        accessToken: generateAccessToken(user),
    });
});

const currentUser = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { company: true },
    });

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        success: true,
        user: toPublicUser(user),
        company: toPublicCompany(user.company),
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const {
        name,
        phone,
        email,
        companyName,
        companySize,
        yearOfEstablishment,
        gstNumber,
        panNumber,
        companyPhone,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { company: true },
    });

    if (!existingUser) {
        res.status(404);
        throw new Error("User not found");
    }

    const nextEmail = typeof email === "string" ? email.trim() : existingUser.email;
    const nextPhone = typeof phone === "string" ? phone.trim() : existingUser.phone;

    if (!EMAIL_REGEX.test(nextEmail)) {
        res.status(400);
        throw new Error("Invalid email format");
    }

    if (!PHONE_REGEX.test(nextPhone)) {
        res.status(400);
        throw new Error("Phone number must be 10 digits");
    }

    if (nextEmail !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({ where: { email: nextEmail } });
        if (emailExists) {
            res.status(400);
            throw new Error("User with this email already exists");
        }
    }

    if (nextPhone !== existingUser.phone) {
        const phoneExists = await prisma.user.findUnique({ where: { phone: nextPhone } });
        if (phoneExists) {
            res.status(400);
            throw new Error("User with this phone number already exists");
        }
    }

    let normalizedPan = typeof panNumber === "string" ? panNumber.trim().toUpperCase() : undefined;
    if (normalizedPan === "") {
        normalizedPan = null;
    }
    if (normalizedPan && !PAN_REGEX.test(normalizedPan)) {
        res.status(400);
        throw new Error("Invalid PAN number format");
    }

    let normalizedGst = typeof gstNumber === "string" ? gstNumber.trim().toUpperCase() : undefined;
    if (normalizedGst && !GST_REGEX.test(normalizedGst)) {
        res.status(400);
        throw new Error("Invalid GST number format");
    }

    const updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: req.user.id },
            data: {
                name: typeof name === "string" && name.trim() ? name.trim() : existingUser.name,
                phone: nextPhone,
                email: nextEmail,
            },
        });

        let company = existingUser.company;
        const hasCompanyInput =
            companyName !== undefined ||
            companySize !== undefined ||
            yearOfEstablishment !== undefined ||
            gstNumber !== undefined ||
            panNumber !== undefined ||
            companyPhone !== undefined;

        if (hasCompanyInput && user.role === "USER") {
            const nextCompanyName = typeof companyName === "string" && companyName.trim() ? companyName.trim() : existingUser.company?.companyName;
            const nextCompanySize = typeof companySize === "string" && companySize.trim() ? companySize.trim() : existingUser.company?.companySize;
            const nextYearRaw = yearOfEstablishment !== undefined ? Number(yearOfEstablishment) : existingUser.company?.yearOfEstablishment;
            const nextYear = Number.isFinite(nextYearRaw) ? Number(nextYearRaw) : null;
            const nextGst = normalizedGst || existingUser.company?.gstNumber;
            const nextPan = normalizedPan !== undefined ? normalizedPan : existingUser.company?.panNumber;
            const nextCompanyPhone =
                companyPhone !== undefined
                    ? (typeof companyPhone === "string" && companyPhone.trim() ? companyPhone.trim() : null)
                    : existingUser.company?.companyPhone;

            if (!nextCompanyName || !nextCompanySize || !nextYear || !nextGst) {
                res.status(400);
                throw new Error("Company name, size, year of establishment and GST are required");
            }

            if (existingUser.company && nextGst !== existingUser.company.gstNumber) {
                const gstExists = await tx.company.findUnique({ where: { gstNumber: nextGst } });
                if (gstExists) {
                    res.status(400);
                    throw new Error("Company with this GST number already registered");
                }
            }

            if (nextPan) {
                const panExists = await tx.company.findFirst({
                    where: {
                        panNumber: nextPan,
                        userId: { not: req.user.id },
                    },
                });
                if (panExists) {
                    res.status(400);
                    throw new Error("Company with this PAN number already registered");
                }
            }

            if (existingUser.company) {
                company = await tx.company.update({
                    where: { userId: req.user.id },
                    data: {
                        companyName: nextCompanyName,
                        companySize: nextCompanySize,
                        yearOfEstablishment: nextYear,
                        gstNumber: nextGst,
                        panNumber: nextPan || null,
                        companyPhone: nextCompanyPhone || null,
                    },
                });
            } else {
                company = await tx.company.create({
                    data: {
                        userId: req.user.id,
                        companyName: nextCompanyName,
                        companySize: nextCompanySize,
                        yearOfEstablishment: nextYear,
                        gstNumber: nextGst,
                        panNumber: nextPan || null,
                        companyPhone: nextCompanyPhone || null,
                    },
                });
            }
        }

        return { user, company };
    });

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: toPublicUser(updated.user),
        company: toPublicCompany(updated.company),
    });
});

module.exports = { registerUser, registerAdmin, loginUser, currentUser, updateProfile };
