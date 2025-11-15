import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStrokesState } from "./useStrokesState";
import type { Stroke } from "../types";

describe("useStrokesState", () => {
  const userId = "test-user";

  describe("startStroke", () => {
    it("should create a new stroke", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      let strokeId!: string;

      act(() => {
        strokeId = result.current.startStroke(
          { x: 0.5, y: 0.5 },
          "#000000",
          5
        );

        expect(strokeId).toBeDefined();
      });

      expect(result.current.currentStrokeId).toBe(strokeId);
      expect(result.current.strokes).toHaveLength(1);
      expect(result.current.strokes[0].userId).toBe(userId);
      expect(result.current.strokes[0].color).toBe("#000000");
      expect(result.current.strokes[0].thickness).toBe(5);
      expect(result.current.strokes[0].points).toEqual([{ x: 0.5, y: 0.5 }]);
    });
  });

  describe("updateStroke", () => {
    it("should add points to the current stroke", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.startStroke(
          { x: 0.5, y: 0.5 },
          "#000000",
          5
        );
      });

      act(() => {
        result.current.updateStroke({ x: 0.6, y: 0.6 });
      });

      expect(result.current.strokes[0].points).toHaveLength(2);
      expect(result.current.strokes[0].points[1]).toEqual({ x: 0.6, y: 0.6 });
    });

    it("should update a specific stroke by ID", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      let strokeId1: string;

      act(() => {
        strokeId1 = result.current.startStroke(
          { x: 0.5, y: 0.5 },
          "#000000",
          5
        );
        result.current.startStroke(
          { x: 0.1, y: 0.1 },
          "#FF0000",
          3
        );
      });

      act(() => {
        result.current.updateStroke({ x: 0.7, y: 0.7 }, strokeId1);
      });

      expect(result.current.strokes).toHaveLength(2);
      expect(result.current.strokes[0].points).toHaveLength(2);
      expect(result.current.strokes[1].points).toHaveLength(1);
    });

    it("should not update if no current stroke and no strokeId provided", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.updateStroke({ x: 0.5, y: 0.5 });
      });

      expect(result.current.strokes).toHaveLength(0);
    });
  });

  describe("endStroke", () => {
    it("should clear currentStrokeId", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.startStroke({ x: 0.5, y: 0.5 }, "#000000", 5);
      });

      expect(result.current.currentStrokeId).toBeDefined();

      act(() => {
        result.current.endStroke();
      });

      expect(result.current.currentStrokeId).toBeNull();
    });
  });

  describe("clearStrokes", () => {
    it("should remove all strokes and clear currentStrokeId", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.startStroke({ x: 0.5, y: 0.5 }, "#000000", 5);
        result.current.startStroke({ x: 0.6, y: 0.6 }, "#FF0000", 3);
      });

      expect(result.current.strokes).toHaveLength(2);

      act(() => {
        result.current.clearStrokes();
      });

      expect(result.current.strokes).toHaveLength(0);
      expect(result.current.currentStrokeId).toBeNull();
    });
  });

  describe("applyRoomState", () => {
    it("should replace all strokes with server strokes", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.startStroke({ x: 0.5, y: 0.5 }, "#000000", 5);
      });

      const serverStrokes: Stroke[] = [
        {
          id: "server-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          points: [{ x: 0.1, y: 0.1 }],
          createdAt: Date.now(),
        },
        {
          id: "server-stroke-2",
          userId: "another-user",
          color: "#00FF00",
          thickness: 2,
          points: [{ x: 0.2, y: 0.2 }],
          createdAt: Date.now(),
        },
      ];

      act(() => {
        result.current.applyRoomState(serverStrokes);
      });

      expect(result.current.strokes).toHaveLength(2);
      expect(result.current.strokes).toEqual(serverStrokes);
      expect(result.current.currentStrokeId).toBeNull();
    });
  });

  describe("applyStrokeStarted", () => {
    it("should add a new stroke from another user", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          startPoint: { x: 0.5, y: 0.5 },
        });
      });

      expect(result.current.strokes).toHaveLength(1);
      expect(result.current.strokes[0].id).toBe("remote-stroke-1");
      expect(result.current.strokes[0].userId).toBe("other-user");
      expect(result.current.strokes[0].points).toEqual([{ x: 0.5, y: 0.5 }]);
    });

    it("should not add duplicate strokes", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          startPoint: { x: 0.5, y: 0.5 },
        });
      });

      act(() => {
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          startPoint: { x: 0.5, y: 0.5 },
        });
      });

      expect(result.current.strokes).toHaveLength(1);
    });
  });

  describe("applyStrokeUpdated", () => {
    it("should append points to an existing stroke", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          startPoint: { x: 0.5, y: 0.5 },
        });
      });

      act(() => {
        result.current.applyStrokeUpdated({
          strokeId: "remote-stroke-1",
          points: [
            { x: 0.6, y: 0.6 },
            { x: 0.7, y: 0.7 },
          ],
        });
      });

      expect(result.current.strokes[0].points).toHaveLength(3);
      expect(result.current.strokes[0].points[1]).toEqual({ x: 0.6, y: 0.6 });
      expect(result.current.strokes[0].points[2]).toEqual({ x: 0.7, y: 0.7 });
    });

    it("should not update non-existent stroke", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.applyStrokeUpdated({
          strokeId: "non-existent",
          points: [{ x: 0.5, y: 0.5 }],
        });
      });

      expect(result.current.strokes).toHaveLength(0);
    });
  });

  describe("applyStrokeEnded", () => {
    it("should clear currentStrokeId if it matches", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      let strokeId!: string;

      act(() => {
        strokeId = result.current.startStroke(
          { x: 0.5, y: 0.5 },
          "#000000",
          5
        );
      });

      act(() => {
        result.current.applyStrokeEnded({ strokeId });
      });

      expect(result.current.currentStrokeId).toBeNull();
    });

    it("should not clear currentStrokeId if it doesn't match", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      let strokeId!: string;

      act(() => {
        strokeId = result.current.startStroke(
          { x: 0.5, y: 0.5 },
          "#000000",
          5
        );
      });

      act(() => {
        result.current.applyStrokeEnded({ strokeId: "different-id" });
      });

      expect(result.current.currentStrokeId).toBe(strokeId);
    });
  });

  describe("applyCanvasCleared", () => {
    it("should clear all strokes", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.startStroke({ x: 0.5, y: 0.5 }, "#000000", 5);
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          startPoint: { x: 0.1, y: 0.1 },
        });
      });

      expect(result.current.strokes).toHaveLength(2);

      act(() => {
        result.current.applyCanvasCleared();
      });

      expect(result.current.strokes).toHaveLength(0);
      expect(result.current.currentStrokeId).toBeNull();
    });
  });

  describe("deleteUserStrokes", () => {
    it("should delete all strokes from a specific user", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.startStroke({ x: 0.5, y: 0.5 }, "#000000", 5);
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          startPoint: { x: 0.1, y: 0.1 },
        });
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-2",
          userId: "other-user",
          color: "#00FF00",
          thickness: 2,
          startPoint: { x: 0.2, y: 0.2 },
        });
      });

      expect(result.current.strokes).toHaveLength(3);

      act(() => {
        result.current.deleteUserStrokes("other-user");
      });

      expect(result.current.strokes).toHaveLength(1);
      expect(result.current.strokes[0].userId).toBe(userId);
    });

    it("should clear currentStrokeId if current stroke is deleted", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.startStroke(
          { x: 0.5, y: 0.5 },
          "#000000",
          5
        );
      });

      act(() => {
        result.current.deleteUserStrokes(userId);
      });

      expect(result.current.currentStrokeId).toBeNull();
      expect(result.current.strokes).toHaveLength(0);
    });
  });

  describe("applyUserStrokesDeleted", () => {
    it("should delete strokes from a specific user", () => {
      const { result } = renderHook(() => useStrokesState({ userId }));

      act(() => {
        result.current.applyStrokeStarted({
          strokeId: "remote-stroke-1",
          userId: "other-user",
          color: "#FF0000",
          thickness: 3,
          startPoint: { x: 0.1, y: 0.1 },
        });
      });

      act(() => {
        result.current.applyUserStrokesDeleted("other-user");
      });

      expect(result.current.strokes).toHaveLength(0);
    });
  });
});
