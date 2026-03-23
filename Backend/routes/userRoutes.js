const express = require("express");
const router = express.Router();
const {
    registerUser,
    registerAdmin,
    loginUser,
    currentUser,
    updateProfile,
} = require("../controller/userController");
const validateToken = require("../middleware/validateToken");

// Public routes
router.post("/register", registerUser);
router.post("/admin/register", registerAdmin);
router.post("/login", loginUser);

// Protected routes
router.get("/current", validateToken, currentUser);
router.put("/profile", validateToken, updateProfile);

module.exports = router;
