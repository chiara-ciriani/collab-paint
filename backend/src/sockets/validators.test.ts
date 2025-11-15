import { describe, it, expect } from "vitest";
import {
  validateJoinRoomPayload,
  validateStartStrokePayload,
  validateUpdateStrokePayload,
  validateEndStrokePayload,
  validateClearCanvasPayload,
  validateCursorMovePayload,
  validateDeleteUserStrokesPayload,
} from "./validators";

describe("validators", () => {
  describe("validateJoinRoomPayload", () => {
    it("should validate a valid payload", () => {
      const payload = {
        roomId: "room123",
        userId: "user1",
        displayName: "Test User",
      };

      const result = validateJoinRoomPayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(payload);
      }
    });

    it("should validate payload without displayName", () => {
      const payload = {
        roomId: "room123",
        userId: "user1",
      };

      const result = validateJoinRoomPayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.displayName).toBeUndefined();
      }
    });

    it("should reject invalid roomId", () => {
      const payload = {
        roomId: "ab", // Too short
        userId: "user1",
      };

      const result = validateJoinRoomPayload(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("roomId");
      }
    });

    it("should reject empty userId", () => {
      const payload = {
        roomId: "room123",
        userId: "",
      };

      const result = validateJoinRoomPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("should reject non-object payload", () => {
      const result = validateJoinRoomPayload(null);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("object");
      }
    });
  });

  describe("validateStartStrokePayload", () => {
    it("should validate a valid payload", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        userId: "user1",
        color: "#FF0000",
        thickness: 5,
        startPoint: { x: 0.5, y: 0.5 },
      };

      const result = validateStartStrokePayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(payload);
      }
    });

    it("should reject invalid color format", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        userId: "user1",
        color: "red", // Invalid format
        thickness: 5,
        startPoint: { x: 0.5, y: 0.5 },
      };

      const result = validateStartStrokePayload(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("color");
      }
    });

    it("should reject invalid thickness", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        userId: "user1",
        color: "#FF0000",
        thickness: 100, // Out of range
        startPoint: { x: 0.5, y: 0.5 },
      };

      const result = validateStartStrokePayload(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("thickness");
      }
    });

    it("should reject invalid startPoint coordinates", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        userId: "user1",
        color: "#FF0000",
        thickness: 5,
        startPoint: { x: 1.5, y: 0.5 }, // Out of range
      };

      const result = validateStartStrokePayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateUpdateStrokePayload", () => {
    it("should validate a valid payload", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        points: [
          { x: 0.5, y: 0.5 },
          { x: 0.6, y: 0.6 },
        ],
      };

      const result = validateUpdateStrokePayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(payload);
      }
    });

    it("should reject empty points array", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        points: [],
      };

      const result = validateUpdateStrokePayload(payload);
      expect(result.valid).toBe(false);
    });

    it("should reject too many points", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        points: Array(101).fill({ x: 0.5, y: 0.5 }), // More than 100
      };

      const result = validateUpdateStrokePayload(payload);
      expect(result.valid).toBe(false);
    });

    it("should reject invalid point coordinates", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
        points: [{ x: 1.5, y: 0.5 }], // Out of range
      };

      const result = validateUpdateStrokePayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateEndStrokePayload", () => {
    it("should validate a valid payload", () => {
      const payload = {
        roomId: "room123",
        strokeId: "stroke1",
      };

      const result = validateEndStrokePayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(payload);
      }
    });

    it("should reject missing strokeId", () => {
      const payload = {
        roomId: "room123",
      };

      const result = validateEndStrokePayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateClearCanvasPayload", () => {
    it("should validate a valid payload with userId", () => {
      const payload = {
        roomId: "room123",
        userId: "user1",
      };

      const result = validateClearCanvasPayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(payload);
      }
    });

    it("should validate a valid payload without userId", () => {
      const payload = {
        roomId: "room123",
      };

      const result = validateClearCanvasPayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.userId).toBeUndefined();
      }
    });

    it("should reject invalid roomId", () => {
      const payload = {
        roomId: "ab",
      };

      const result = validateClearCanvasPayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateCursorMovePayload", () => {
    it("should validate a valid payload", () => {
      const payload = {
        roomId: "room123",
        userId: "user1",
        position: { x: 0.5, y: 0.5 },
        color: "#FF0000",
      };

      const result = validateCursorMovePayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(payload);
      }
    });

    it("should validate payload without color", () => {
      const payload = {
        roomId: "room123",
        userId: "user1",
        position: { x: 0.5, y: 0.5 },
      };

      const result = validateCursorMovePayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.color).toBeUndefined();
      }
    });

    it("should reject invalid position coordinates", () => {
      const payload = {
        roomId: "room123",
        userId: "user1",
        position: { x: 1.5, y: 0.5 },
      };

      const result = validateCursorMovePayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateDeleteUserStrokesPayload", () => {
    it("should validate a valid payload", () => {
      const payload = {
        roomId: "room123",
        userId: "user1",
      };

      const result = validateDeleteUserStrokesPayload(payload);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(payload);
      }
    });

    it("should reject missing userId", () => {
      const payload = {
        roomId: "room123",
      };

      const result = validateDeleteUserStrokesPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("should reject invalid roomId", () => {
      const payload = {
        roomId: "ab",
        userId: "user1",
      };

      const result = validateDeleteUserStrokesPayload(payload);
      expect(result.valid).toBe(false);
    });
  });
});

