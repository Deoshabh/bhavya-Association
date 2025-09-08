require("dotenv").config(); // Load environment variables first
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const directoryRoutes = require("./routes/directory");
const usersRoutes = require("./routes/users");
const listingsRoutes = require("./routes/listings");
const adminRoutes = require("./routes/admin");
const newsRoutes = require("./routes/news");
const questionsRoutes = require("./routes/questions");
const answersRoutes = require("./routes/answers");
const referralRoutes = require("./routes/referrals");
const matrimonialRoutes = require("./routes/matrimonial");
const formsRoutes = require("./routes/forms");
const submissionsRoutes = require("./routes/submissions");
const validateUserSchema = require("./utils/validateUserSchema");
const requireDbConnection = require("./middleware/dbConnection");
const { verifyModels } = require("./utils/modelUtil");

// Create Express app
const app = express();

// Configure CORS with specific options
const corsOptions = {
  origin: ["https://bhavyasangh.com", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path} - Origin: ${req.headers.origin || "unknown"}`
  );
  next();
});

// Add a middleware to normalize duplicate /api prefixes in URL paths
app.use((req, res, next) => {
  // Check for duplicate /api prefixes in URL path
  if (req.path.includes("/api/api/")) {
    console.warn(`⚠️ Request with duplicate API prefix detected: ${req.path}`);
    // Normalize the path by replacing '/api/api/' with '/api/'
    const normalizedPath = req.path.replace("/api/api/", "/api/");
    console.warn(`Redirecting to normalized path: ${normalizedPath}`);

    // Redirect to the normalized path
    return res.redirect(307, normalizedPath);
  }
  next();
});

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Serve frontend build files (for production deployment)
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  const frontendBuildPath = path.join(__dirname, "..", "frontend", "build");

  // Serve static files from React build
  app.use(
    express.static(frontendBuildPath, {
      maxAge: "1d",
      index: false, // We'll handle index.html with our catch-all route
    })
  );

  console.log(`📂 Serving frontend from: ${frontendBuildPath}`);
}

// Simple health check endpoint for deployment monitoring
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Basic health check endpoint - doesn't require DB connection
app.get("/api/health", (req, res) => {
  // Check database connection status
  const { isDbConnected, getConnectionState } = require("./config/db");
  const connectionState = getConnectionState();

  res.json({
    status: "ok",
    message: "Server is running",
    database: {
      connected: isDbConnected(),
      connecting: connectionState.isConnecting,
      connectionError: connectionState.connectionError
        ? {
            name: connectionState.connectionError.name,
            message: connectionState.connectionError.message,
          }
        : null,
      uri: process.env.MONGODB_URI ? "Configured (hidden)" : "Not configured",
    },
    time: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || "development",
      hasJwtSecret: !!process.env.JWT_SECRET,
      port: process.env.PORT || 5000,
    },
  });
});

// Debug endpoint
app.get("/api/debug", (req, res) => {
  // Check database connection status
  const { isDbConnected, getConnectionState } = require("./config/db");
  const connectionState = getConnectionState();

  res.json({
    message: "Debug endpoint working",
    jwt_configured: !!process.env.JWT_SECRET,
    mongodb_configured: !!process.env.MONGODB_URI,
    mongodb_connected: isDbConnected(),
    mongodb_connecting: connectionState.isConnecting,
    server_time: new Date().toISOString(),
  });
});

// Apply DB connection middleware to all database-dependent routes
app.use("/api/auth", requireDbConnection, authRoutes);
app.use("/api/profile", requireDbConnection, profileRoutes);
app.use("/api/directory", requireDbConnection, directoryRoutes);
app.use("/api/users", requireDbConnection, usersRoutes);
app.use("/api/listings", requireDbConnection, listingsRoutes);
app.use("/api/admin", requireDbConnection, adminRoutes);
app.use("/api/news", requireDbConnection, newsRoutes);
app.use("/api/questions", requireDbConnection, questionsRoutes);
app.use("/api/answers", requireDbConnection, answersRoutes);
app.use("/api/referrals", requireDbConnection, referralRoutes);
app.use("/api/matrimonial", requireDbConnection, matrimonialRoutes);
app.use("/api/forms", requireDbConnection, formsRoutes);
app.use("/api/submissions", requireDbConnection, submissionsRoutes);

// Debug routes
if (process.env.NODE_ENV !== "production") {
  const debugUploadRoutes = require("./routes/debug-upload");
  app.use("/api/debug", debugUploadRoutes);
}

// Catch-all handler for frontend routes (must be after API routes)
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  const fs = require("fs");

  app.get("*", (req, res) => {
    // Skip API routes that weren't matched above
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    const indexPath = path.join(
      __dirname,
      "..",
      "frontend",
      "build",
      "index.html"
    );

    // Serve React app's index.html for all non-API routes
    fs.readFile(indexPath, "utf8", (err, data) => {
      if (err) {
        console.error(
          `❌ Error serving frontend for ${req.path}:`,
          err.message
        );
        return res.status(500).send(`
          <h1>BHAVYA - Server Error</h1>
          <p>Could not serve the requested page</p>
          <p>Path: ${req.path}</p>
        `);
      }

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(data);
    });
  });
}

// Initialize database connection before setting up routes
async function startServer() {
  try {
    // Connect to database first - will throw error if connection fails
    await connectDB();
    console.log("Database connection established successfully");

    // Set up a periodic connection check to ensure we stay connected
    setInterval(async () => {
      const { isDbConnected, ensureConnected } = require("./config/db");
      if (!isDbConnected()) {
        console.log(
          "Database connection check: Disconnected - attempting to reconnect..."
        );
        try {
          await ensureConnected();
          console.log("Database reconnection successful");
        } catch (err) {
          console.error(
            "Failed to reestablish database connection:",
            err.message
          );
        }
      }
    }, 30000); // Check every 30 seconds

    // Validate schema once database is connected
    if (process.env.NODE_ENV !== "test") {
      console.log("Validating user schema...");
      try {
        await validateUserSchema();
      } catch (schemaErr) {
        console.error("Schema validation error:", schemaErr);
        // Continue despite schema errors - they're not fatal
      }
    }

    // After connecting to database and registering all models
    verifyModels();

    // Start the server only after database is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    console.error("Application cannot start without database connection");

    if (process.env.NODE_ENV === "production") {
      process.exit(1); // Exit in production
    } else {
      console.log("Retrying database connection in 5 seconds...");
      setTimeout(() => startServer(), 5000); // Retry in development
    }
  }
}

// Start the server
startServer();

// Export app for testing purposes
module.exports = app;
