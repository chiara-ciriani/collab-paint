/**
 * Socket.IO client helper
 */

import { io, type Socket } from "socket.io-client";
import { config } from "./config";

/**
 * Create a Socket.IO client connection
 */
export function createSocket(): Socket {
  return io(config.backendUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    upgrade: true,
    rememberUpgrade: false,
  });
}

