/**
 * Application constants
 */

export const DEFAULT_COLOR = "#000000";
export const DEFAULT_THICKNESS = 5;
export const MIN_THICKNESS = 1;
export const MAX_THICKNESS = 20;

export const PRESET_COLORS = [
  "#000000", // Black
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
] as const;

/**
 * Generate a random room ID
 */
export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Generate a random user ID
 */
export function generateUserId(): string {
  return `user-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique stroke ID
 */
export function generateStrokeId(): string {
  return `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

