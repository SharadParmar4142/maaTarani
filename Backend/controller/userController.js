const express = require("express");
const asyncHandler = require("express-async-handler");
const { prisma } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv").config();

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400);
        throw new Error("Invalid email format");
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        res.status(400);
        throw new Error("Phone number must be 10 digits");
    }

    // Validate GST format (15 characters alphanumeric)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
        res.status(400);
        throw new Error("Invalid GST number format");
    }

    // Validate PAN format if provided (10 characters alphanumeric)
    if (panNumber) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panNumber)) {
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

    // Generate JWT token
    const accessToken = jwt.sign(
        {
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
            },
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    // Send response without password
    if (result.user) {
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: result.user.id,
                name: result.user.name,
                phone: result.user.phone,
                email: result.user.email,
            },
            company: {
                id: result.company.id,
                companyName: result.company.companyName,
                companySize: result.company.companySize,
                yearOfEstablishment: result.company.yearOfEstablishment,
                gstNumber: result.company.gstNumber,
                panNumber: result.company.panNumber,
                companyPhone: result.company.companyPhone,
            },
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
        const accessToken = jwt.sign(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
            },
            company: user.company ? {
                id: user.company.id,
                companyName: user.company.companyName,
                companySize: user.company.companySize,
                yearOfEstablishment: user.company.yearOfEstablishment,
                gstNumber: user.company.gstNumber,
                panNumber: user.company.panNumber,
                companyPhone: user.company.companyPhone,
            } : null,
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

const currentUser = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { company: true },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true,
            company: true,
            password: false, // Exclude password
        }
    });

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        success: true,
        user,
    });
});

module.exports = { registerUser, loginUser, currentUser };
