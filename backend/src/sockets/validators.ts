/**
 * Payload validation utilities
 */

import type {
  JoinRoomPayload,
  StartStrokePayload,
  UpdateStrokePayload,
  EndStrokePayload,
  ClearCanvasPayload,
  CursorMovePayload,
  DeleteUserStrokesPayload,
} from "./clientToServerTypes";

const MAX_POINTS_PER_UPDATE = 100;

/**
 * Validation result type
 */
type ValidationResult<T> = { valid: true; data: T } | { valid: false; error: string };

/**
 * Validate string is not empty
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Helper to validate multiple fields and return first error or success
 * After all validations pass, we can safely assert that the data is valid
 */
function validateFields<T>(
  validations: Array<{ check: boolean; error: string }>,
  buildData: () => T
): ValidationResult<T> {
  for (const { check, error } of validations) {
    if (!check) {
      return { valid: false, error };
    }
  }
  // All validations passed, safe to build data
  return { valid: true, data: buildData() };
}

/**
 * Validate room ID format (alphanumeric, 3-20 chars)
 */
function isValidRoomId(roomId: unknown): boolean {
  if (!isValidString(roomId)) return false;
  return /^[a-zA-Z0-9_-]{3,20}$/.test(roomId);
}

/**
 * Validate user ID format
 */
function isValidUserId(userId: unknown): boolean {
  if (!isValidString(userId)) return false;
  return userId.length >= 1 && userId.length <= 100;
}

/**
 * Validate color hex format
 */
function isValidColor(color: unknown): boolean {
  if (!isValidString(color)) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validate thickness (1-50)
 */
function isValidThickness(thickness: unknown): boolean {
  return typeof thickness === "number" && thickness >= 1 && thickness <= 50;
}

/**
 * Validate point coordinates (0-1)
 */
function isValidPoint(point: unknown): point is { x: number; y: number } {
  if (typeof point !== "object" || point === null) return false;
  const p = point as { x?: unknown; y?: unknown };
  return (
    typeof p.x === "number" &&
    typeof p.y === "number" &&
    p.x >= 0 &&
    p.x <= 1 &&
    p.y >= 0 &&
    p.y <= 1
  );
}

/**
 * Validate points array
 */
function isValidPointsArray(points: unknown): points is Array<{ x: number; y: number }> {
  if (!Array.isArray(points)) return false;
  if (points.length === 0) return false;
  if (points.length > MAX_POINTS_PER_UPDATE) return false;
  return points.every(isValidPoint);
}

/**
 * Validate join room payload
 */
export function validateJoinRoomPayload(payload: unknown): ValidationResult<JoinRoomPayload> {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, error: "Payload must be an object" };
  }

  const p = payload as Partial<JoinRoomPayload>;

  return validateFields(
    [
      { check: isValidRoomId(p.roomId), error: "Invalid roomId format" },
      { check: isValidUserId(p.userId), error: "Invalid userId format" },
      {
        check: p.displayName === undefined || isValidString(p.displayName),
        error: "displayName must be a string",
      },
    ],
    () => {
      return {
        roomId: p.roomId!,
        userId: p.userId!,
        displayName: p.displayName,
      };
    }
  );
}

/**
 * Validate start stroke payload
 */
export function validateStartStrokePayload(payload: unknown): ValidationResult<StartStrokePayload> {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, error: "Payload must be an object" };
  }

  const p = payload as Partial<StartStrokePayload>;

  return validateFields(
    [
      { check: isValidRoomId(p.roomId), error: "Invalid roomId format" },
      { check: isValidString(p.strokeId), error: "Invalid strokeId" },
      { check: isValidUserId(p.userId), error: "Invalid userId format" },
      { check: isValidColor(p.color), error: "Invalid color format (must be hex #RRGGBB)" },
      { check: isValidThickness(p.thickness), error: "Invalid thickness (must be 1-50)" },
      { check: isValidPoint(p.startPoint), error: "Invalid startPoint coordinates" },
    ],
    () => {
      return {
        roomId: p.roomId!,
        strokeId: p.strokeId!,
        userId: p.userId!,
        color: p.color!,
        thickness: p.thickness!,
        startPoint: p.startPoint!,
      };
    }
  );
}

/**
 * Validate update stroke payload
 */
export function validateUpdateStrokePayload(payload: unknown): ValidationResult<UpdateStrokePayload> {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, error: "Payload must be an object" };
  }

  const p = payload as Partial<UpdateStrokePayload>;

  return validateFields(
    [
      { check: isValidRoomId(p.roomId), error: "Invalid roomId format" },
      { check: isValidString(p.strokeId), error: "Invalid strokeId" },
      {
        check: isValidPointsArray(p.points),
        error: `Invalid points array (must be 1-${MAX_POINTS_PER_UPDATE} valid points)`,
      },
    ],
    () => {
      return {
        roomId: p.roomId!,
        strokeId: p.strokeId!,
        points: p.points!,
      };
    }
  );
}

/**
 * Validate end stroke payload
 */
export function validateEndStrokePayload(payload: unknown): ValidationResult<EndStrokePayload> {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, error: "Payload must be an object" };
  }

  const p = payload as Partial<EndStrokePayload>;

  return validateFields(
    [
      { check: isValidRoomId(p.roomId), error: "Invalid roomId format" },
      { check: isValidString(p.strokeId), error: "Invalid strokeId" },
    ],
    () => {
      return {
        roomId: p.roomId!,
        strokeId: p.strokeId!,
      };
    }
  );
}

/**
 * Validate clear canvas payload
 */
export function validateClearCanvasPayload(payload: unknown): ValidationResult<ClearCanvasPayload> {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, error: "Payload must be an object" };
  }

  const p = payload as Partial<ClearCanvasPayload>;

  return validateFields(
    [
      { check: isValidRoomId(p.roomId), error: "Invalid roomId format" },
      {
        check: p.userId === undefined || isValidUserId(p.userId),
        error: "Invalid userId format",
      },
    ],
    () => {
      return {
        roomId: p.roomId!,
        userId: p.userId,
      };
    }
  );
}

/**
 * Validate cursor move payload
 */
export function validateCursorMovePayload(payload: unknown): ValidationResult<CursorMovePayload> {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, error: "Payload must be an object" };
  }

  const p = payload as Partial<CursorMovePayload>;

  return validateFields(
    [
      { check: isValidRoomId(p.roomId), error: "Invalid roomId format" },
      { check: isValidUserId(p.userId), error: "Invalid userId format" },
      { check: isValidPoint(p.position), error: "Invalid position coordinates" },
      {
        check: p.color === undefined || isValidColor(p.color),
        error: "Invalid color format",
      },
    ],
    () => {
      return {
        roomId: p.roomId!,
        userId: p.userId!,
        position: p.position!,
        color: p.color,
      };
    }
  );
}

/**
 * Validate delete user strokes payload
 */
export function validateDeleteUserStrokesPayload(payload: unknown): ValidationResult<DeleteUserStrokesPayload> {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, error: "Payload must be an object" };
  }

  const p = payload as Partial<DeleteUserStrokesPayload>;

  return validateFields(
    [
      { check: isValidRoomId(p.roomId), error: "Invalid roomId format" },
      { check: isValidUserId(p.userId), error: "Invalid userId format" },
    ],
    () => {
      return {
        roomId: p.roomId!,
        userId: p.userId!,
      };
    }
  );
}
