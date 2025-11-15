/**
 * Rate limiting middleware for Socket.IO events
 * Prevents spam and abuse by limiting event frequency per socket
 */

import type { Socket } from "socket.io";
import { logger } from "../logger";

interface RateLimitConfig {
  maxEvents: number;
  windowMs: number;
}

interface SocketRateLimit {
  eventCounts: Map<string, number[]>;
  lastCleanup: number;
}

const socketRateLimits = new Map<string, SocketRateLimit>();

// Rate limit configurations per event type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "stroke:update": { maxEvents: 60, windowMs: 1000 }, // 60 updates per second
  "cursor:move": { maxEvents: 20, windowMs: 1000 }, // 20 moves per second
  "stroke:start": { maxEvents: 10, windowMs: 1000 }, // 10 starts per second
  "stroke:end": { maxEvents: 10, windowMs: 1000 }, // 10 ends per second
  "canvas:clear": { maxEvents: 2, windowMs: 5000 }, // 2 clears per 5 seconds
  "strokes:delete:user": { maxEvents: 5, windowMs: 1000 }, // 5 deletes per second
};

const CLEANUP_INTERVAL_MS = 60000; // Clean up old entries every minute

/**
 * Clean up old rate limit entries
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  for (const [socketId, rateLimit] of socketRateLimits.entries()) {
    if (now - rateLimit.lastCleanup > CLEANUP_INTERVAL_MS) {
      // Remove old timestamps
      for (const [eventType, timestamps] of rateLimit.eventCounts.entries()) {
        const config = RATE_LIMITS[eventType];
        if (config) {
          const cutoff = now - config.windowMs;
          const filtered = timestamps.filter((ts) => ts > cutoff);
          if (filtered.length === 0) {
            rateLimit.eventCounts.delete(eventType);
          } else {
            rateLimit.eventCounts.set(eventType, filtered);
          }
        }
      }
      rateLimit.lastCleanup = now;

      // Remove socket entry if no events tracked
      if (rateLimit.eventCounts.size === 0) {
        socketRateLimits.delete(socketId);
      }
    }
  }
}

/**
 * Check if an event should be rate limited
 * Returns true if the event should be allowed, false if it should be blocked
 */
export function checkRateLimit(socket: Socket, eventType: string): boolean {
  const config = RATE_LIMITS[eventType];
  if (!config) {
    // No rate limit configured for this event type
    return true;
  }

  const socketId = socket.id;
  const now = Date.now();

  // Get or create rate limit entry for this socket
  let rateLimit = socketRateLimits.get(socketId);
  if (!rateLimit) {
    rateLimit = {
      eventCounts: new Map(),
      lastCleanup: now,
    };
    socketRateLimits.set(socketId, rateLimit);
  }

  // Get timestamps for this event type
  const timestamps = rateLimit.eventCounts.get(eventType) || [];
  const cutoff = now - config.windowMs;
  const recentTimestamps = timestamps.filter((ts) => ts > cutoff);

  // Check if limit exceeded
  if (recentTimestamps.length >= config.maxEvents) {
    logger.warn(
      {
        category: "RateLimit",
        socketId,
        eventType,
        count: recentTimestamps.length,
        maxEvents: config.maxEvents,
      },
      "Rate limit exceeded"
    );
    return false;
  }

  // Add current timestamp
  recentTimestamps.push(now);
  rateLimit.eventCounts.set(eventType, recentTimestamps);

  // Periodic cleanup
  if (now - rateLimit.lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanupOldEntries();
  }

  return true;
}

/**
 * Clean up rate limit data for a disconnected socket
 */
export function cleanupSocketRateLimit(socketId: string): void {
  socketRateLimits.delete(socketId);
}

