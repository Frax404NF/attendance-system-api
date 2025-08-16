const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { testConnection } = require("./src/config/database");
const { connectRedis } = require("./src/config/redis");

const authRoutes = require("./src/api/routes/auth");
const attendanceRoutes = require("./src/api/routes/attendance");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Startup function
async function startServer() {
  try {
    console.log("Starting Employee Attendance System...");

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }

    // Connect to Redis
    const redisConnected = await connectRedis();
    if (!redisConnected) {
      throw new Error("Redis connection failed");
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("API Endpoints:");
      console.log("  POST /api/auth/login");
      console.log("  POST /api/auth/logout");
      console.log("  POST /api/attendance/checkin");
      console.log("  POST /api/attendance/checkout");
      console.log("  GET  /api/attendance/current");
      console.log("  GET  /api/attendance/reports");
      console.log("  GET  /health");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down server...");
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
