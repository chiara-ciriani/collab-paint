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
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO connection handler
io.on("connection", handleConnection);

// Start server
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
  logger.info({ port: PORT }, `Health check available at http://localhost:${PORT}/health`);
});


