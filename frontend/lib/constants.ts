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

export const SHAPE_TYPES = ["circle", "rectangle", "line", "triangle"] as const;

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

/**
 * Convert a shape to stroke points
 */
export function shapeToPoints(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  type: "circle" | "rectangle" | "line" | "triangle",
  numPoints: number = 50
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];

  switch (type) {
    case "line":
      // Simple line: just start and end
      points.push(startPoint);
      points.push(endPoint);
      break;

    case "rectangle": {
      // Rectangle: 4 corners
      points.push(startPoint);
      points.push({ x: endPoint.x, y: startPoint.y });
      points.push(endPoint);
      points.push({ x: startPoint.x, y: endPoint.y });
      points.push(startPoint); // Close the rectangle
      break;
    }

    case "circle": {
      // Circle/Ellipse: generate points around the circumference
      const centerX = (startPoint.x + endPoint.x) / 2;
      const centerY = (startPoint.y + endPoint.y) / 2;
      const radiusX = Math.abs(endPoint.x - startPoint.x) / 2;
      const radiusY = Math.abs(endPoint.y - startPoint.y) / 2;

      // Use both radiusX and radiusY to create an ellipse that respects the drawn size
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        points.push({
          x: centerX + radiusX * Math.cos(angle),
          y: centerY + radiusY * Math.sin(angle),
        });
      }
      break;
    }

    case "triangle":
      // Triangle: 3 points forming a right triangle
      // startPoint is one corner, endPoint is the opposite corner
      // Third point is calculated to form a right triangle
      points.push(startPoint);
      points.push({ x: endPoint.x, y: startPoint.y });
      points.push(endPoint);
      points.push(startPoint);
      break;
  }

  return points;
}

/**
 * LocalStorage key for storing user nickname
 */
export const NICKNAME_STORAGE_KEY = "collaborative-paint-nickname";

