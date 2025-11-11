/**
 * Application configuration
 * Uses environment variables with fallbacks for development
 */

export const config = {
  backendUrl:
    process.env.BACKEND_URL || "http://localhost:3001",
} as const;

