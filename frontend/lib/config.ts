/**
 * Application configuration
 * Uses environment variables with fallbacks for development
 */

export const config = {
  backendUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
  cursorTimeoutMs:
    process.env.NEXT_PUBLIC_CURSOR_TIMEOUT_MS
      ? parseInt(process.env.NEXT_PUBLIC_CURSOR_TIMEOUT_MS, 10)
      : 2000, // Default: 2 seconds
} as const;

