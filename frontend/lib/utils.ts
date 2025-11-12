/**
 * Utility functions
 */

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Get room URL from room ID
 */
export function getRoomUrl(roomId: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.origin}/room/${roomId}`;
}

/**
 * Generate a consistent color for a user based on their userId
 */
export function getUserColor(userId: string): string {
  // Generate a hash from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Get a short display name from userId
 */
export function getDisplayName(userId: string, displayName?: string): string {
  if (displayName) return displayName;
  const match = userId.match(/[a-z0-9]+$/i);
  return match ? match[0].substring(0, 6) : userId.substring(0, 6);
}

