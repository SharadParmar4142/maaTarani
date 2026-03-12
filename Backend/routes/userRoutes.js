const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    currentUser,
} = require("../controller/userController");
const validateToken = require("../middleware/validateToken");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/current", validateToken, currentUser);

module.exports = router;
