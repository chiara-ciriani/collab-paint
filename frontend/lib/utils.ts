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

