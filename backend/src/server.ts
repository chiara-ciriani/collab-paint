import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleConnection } from "./sockets/connectionHandler";
import { MAX_PAYLOAD_SIZE } from "./config";
import { logger } from "./logger";

const app = express();
const httpServer = createServer(app);

// CORS configuration for Socket.IO
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: MAX_PAYLOAD_SIZE,
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Readiness check endpoint
app.get("/ready", (_req, res) => {
  // Check if server is ready to accept connections
  // In production, we need to check database connections, etc.
  res.json({ 
    status: "ready",
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO connection handler
io.on("connection", handleConnection);

// Graceful shutdown handler
let isShuttingDown = false;

function gracefulShutdown(signal: string): void {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info({ signal }, "Received shutdown signal, starting graceful shutdown");

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info({ signal }, "HTTP server closed");

    // Close Socket.IO server
    io.close(() => {
      logger.info({ signal }, "Socket.IO server closed");
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error({ signal }, "Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
  logger.info({ port: PORT }, `Health check available at http://localhost:${PORT}/health`);
  logger.info({ port: PORT }, `Readiness check available at http://localhost:${PORT}/ready`);
});


