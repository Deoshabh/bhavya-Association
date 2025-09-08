// Combined Production Server
// Serves both API routes and frontend React app

// Load environment variables (now running from backend directory)
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");

// Import backend app (without auto-starting its server)
const backendApp = require("./app");

const app = express();
const port = process.env.PORT || 5000;

// Container-friendly logging
console.log("🚀 BHAVYA Combined Server Starting...");
console.log(`🔗 Port: ${port}`);
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

// Check build directory exists
const buildPath = path.join(__dirname, "..", "frontend", "build");
const indexPath = path.join(buildPath, "index.html");

console.log(`📁 Build Path: ${buildPath}`);
console.log(`📄 Index Path: ${indexPath}`);

// Check files existence
try {
  const buildExists = fs.existsSync(buildPath);
  const indexExists = fs.existsSync(indexPath);

  console.log(`📁 Build directory exists: ${buildExists}`);
  console.log(`📄 Index.html exists: ${indexExists}`);

  if (!buildExists) {
    console.error("❌ FATAL: Build directory missing");
    console.error("💡 Solution: Run npm run build before deployment");
    process.exit(1);
  }

  if (!indexExists) {
    console.error("❌ FATAL: index.html missing");
    console.error("💡 Solution: Ensure build completed successfully");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ FATAL: Error checking files:", error.message);
  process.exit(1);
}

// Simple CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Health check - IMPORTANT for container orchestration
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: port,
    uptime: process.uptime(),
    service: "bhavya-combined-server",
  });
});

// Mount backend API routes under /api
app.use("/api", backendApp);

// Serve static files from build directory
app.use(
  express.static(buildPath, {
    maxAge: "1d",
    index: false, // We'll handle index.html manually
  })
);

// Handle all routes - SPA fallback with proper meta tag serving
app.get("*", (req, res) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Set proper headers for social media crawlers
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Read the index.html file and serve it
  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error(
        `❌ Error reading index.html for ${req.path}:`,
        err.message
      );
      return res.status(500).send(`
        <h1>BHAVYA - Server Error</h1>
        <p>Could not serve the requested page</p>
        <p>Error: ${err.message}</p>
        <p>Path: ${req.path}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `);
    }

    // For social media crawlers, ensure they get the full HTML
    const userAgent = req.get("User-Agent") || "";
    const isSocialCrawler =
      /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|SkypeUriPreview|GoogleBot|bingbot|Slackbot|developers\.google\.com/i.test(
        userAgent
      );

    if (isSocialCrawler) {
      console.log(
        `🤖 Social crawler detected: ${userAgent.substring(0, 50)}... for ${
          req.path
        }`
      );

      // Add cache headers for crawlers
      res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutes cache for crawlers
    }

    // Send the HTML content
    res.send(data);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.message);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`📛 ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error("💀 Forced exit after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Prevent crashes from unhandled errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  process.exit(1);
});

// Start server
const server = app
  .listen(port, "0.0.0.0", () => {
    console.log(`✅ Combined server successfully started on port ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
    console.log(`🌐 Application: http://localhost:${port}`);
    console.log(`🔌 API: http://localhost:${port}/api`);
    console.log("🎯 Server is ready to accept connections");
  })
  .on("error", (err) => {
    console.error("❌ Server failed to start:", err.message);

    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is already in use`);
      console.error("💡 Solution: Change PORT environment variable");
    } else if (err.code === "EACCES") {
      console.error(`❌ Permission denied for port ${port}`);
      console.error(
        "💡 Solution: Use port > 1024 or run with proper permissions"
      );
    }

    process.exit(1);
  });

// Keep process alive
process.stdin.resume();
