"use client";

import { useState, useCallback } from "react";
import type { Point, Stroke } from "@/types";
import { generateStrokeId } from "@/lib/constants";
import type {
  StrokeStartedPayload,
  StrokeUpdatedPayload,
  StrokeEndedPayload,
} from "@/types/serverToClientTypes";

interface UseStrokesStateOptions {
  userId: string;
}

interface UseStrokesStateReturn {
  strokes: Stroke[];
  currentStrokeId: string | null;
  startStroke: (point: Point, color: string, thickness: number) => string; // Returns strokeId
  updateStroke: (point: Point, strokeId?: string) => void; // strokeId is optional, uses currentStrokeId if not provided
  endStroke: () => void;
  clearStrokes: () => void;
  deleteUserStrokes: (targetUserId: string) => void;
  // Server event handlers
  applyRoomState: (strokes: Stroke[]) => void;
  applyStrokeStarted: (payload: StrokeStartedPayload) => void;
  applyStrokeUpdated: (payload: StrokeUpdatedPayload) => void;
  applyStrokeEnded: (payload: StrokeEndedPayload) => void;
  applyCanvasCleared: () => void;
  applyUserStrokesDeleted: (targetUserId: string) => void;
}

/**
 * Custom hook to manage strokes state
 * Encapsulates all stroke-related logic
 */
export function useStrokesState({
  userId,
}: UseStrokesStateOptions): UseStrokesStateReturn {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);

  const startStroke = useCallback(
    (point: Point, color: string, thickness: number): string => {
      const strokeId = generateStrokeId();
      setCurrentStrokeId(strokeId);

      const newStroke: Stroke = {
        id: strokeId,
        userId,
        color,
        thickness,
        points: [point],
        createdAt: Date.now(),
      };

      setStrokes((prev) => [...prev, newStroke]);
      return strokeId;
    },
    [userId]
  );

  const updateStroke = useCallback(
    (point: Point, strokeId?: string) => {
      const targetStrokeId = strokeId || currentStrokeId;
      if (!targetStrokeId) return;

      setStrokes((prev) =>
        prev.map((stroke) =>
          stroke.id === targetStrokeId
            ? { ...stroke, points: [...stroke.points, point] }
            : stroke
        )
      );
    },
    [currentStrokeId]
  );

  const endStroke = useCallback(() => {
    setCurrentStrokeId(null);
  }, []);

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    setCurrentStrokeId(null);
  }, []);

  // Server event handlers
  const applyRoomState = useCallback((serverStrokes: Stroke[]) => {
    setStrokes(serverStrokes);
    setCurrentStrokeId(null);
  }, []);

  const applyStrokeStarted = useCallback((payload: StrokeStartedPayload) => {
    // Only apply if it's not from current user
    setStrokes((prev) => {
      const exists = prev.some((s) => s.id === payload.strokeId);
      if (exists) return prev;

      const newStroke: Stroke = {
        id: payload.strokeId,
        userId: payload.userId,
        color: payload.color,
        thickness: payload.thickness,
        points: [payload.startPoint],
        createdAt: Date.now(),
      };

      return [...prev, newStroke];
    });
  }, []);

  const applyStrokeUpdated = useCallback((payload: StrokeUpdatedPayload) => {
    setStrokes((prev) =>
      prev.map((stroke) =>
        stroke.id === payload.strokeId
          ? { ...stroke, points: [...stroke.points, ...payload.points] }
          : stroke
      )
    );
  }, []);

  const applyStrokeEnded = useCallback((payload: StrokeEndedPayload) => {
    setCurrentStrokeId((prev) => (prev === payload.strokeId ? null : prev));
  }, []);

  const applyCanvasCleared = useCallback(() => {
    setStrokes([]);
    setCurrentStrokeId(null);
  }, []);

  const deleteUserStrokes = useCallback((targetUserId: string) => {
    setStrokes((prev) => {
      const filtered = prev.filter((stroke) => stroke.userId !== targetUserId);
      if (currentStrokeId) {
        const currentStroke = prev.find((s) => s.id === currentStrokeId);
        if (currentStroke && currentStroke.userId === targetUserId) {
          setCurrentStrokeId(null);
        }
      }
      return filtered;
    });
  }, [currentStrokeId]);

  const applyUserStrokesDeleted = useCallback((targetUserId: string) => {
    deleteUserStrokes(targetUserId);
  }, [deleteUserStrokes]);

  return {
    strokes,
    currentStrokeId,
    startStroke,
    updateStroke,
    endStroke,
    clearStrokes,
    applyRoomState,
    applyStrokeStarted,
    applyStrokeUpdated,
    applyStrokeEnded,
    applyCanvasCleared,
    deleteUserStrokes,
    applyUserStrokesDeleted,
  };
}
