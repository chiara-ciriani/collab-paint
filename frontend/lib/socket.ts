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
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity, // Keep trying to reconnect
    upgrade: true,
    rememberUpgrade: false,
    timeout: 20000,
  });
}

