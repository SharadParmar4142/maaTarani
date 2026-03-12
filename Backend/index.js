const express = require("express");
const dotenv = require("dotenv").config();
const errorHandler = require("./middleware/errorHandler");
const { connectDb } = require("./config/dbConfig");
const cors = require("cors");

// Connect to database
connectDb();

const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/purchaseorder", require("./routes/poRoutes"));

// Health check route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "MAA TARINI ENTERPRISES API is running",
        version: "1.0.0",
    });
});

// Error handler middleware (should be last)
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
