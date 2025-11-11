"use client";

import { useState, useCallback } from "react";
import type { Point, Stroke } from "@/types";
import { generateStrokeId } from "@/lib/constants";

interface UseStrokesStateOptions {
  userId: string;
}

interface UseStrokesStateReturn {
  strokes: Stroke[];
  currentStrokeId: string | null;
  startStroke: (point: Point, color: string, thickness: number) => void;
  updateStroke: (point: Point) => void;
  endStroke: () => void;
  clearStrokes: () => void;
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
    (point: Point, color: string, thickness: number) => {
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
    },
    [userId]
  );

  const updateStroke = useCallback(
    (point: Point) => {
      if (!currentStrokeId) return;

      setStrokes((prev) =>
        prev.map((stroke) =>
          stroke.id === currentStrokeId
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

  return {
    strokes,
    currentStrokeId,
    startStroke,
    updateStroke,
    endStroke,
    clearStrokes,
  };
}

