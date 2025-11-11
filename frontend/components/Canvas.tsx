"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Point, Stroke } from "@/types";

interface CanvasProps {
  strokes: Stroke[];
  currentColor: string;
  currentThickness: number;
  onStrokeStart: (point: Point) => void;
  onStrokeMove: (point: Point) => void;
  onStrokeEnd: () => void;
}

export default function Canvas({
  strokes,
  currentColor,
  currentThickness,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  const getCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      return { x, y };
    },
    []
  );

  const drawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      const firstPoint = stroke.points[0];
      ctx.moveTo(firstPoint.x * canvas.width, firstPoint.y * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      }

      ctx.stroke();
    });

    if (currentStroke.length > 0) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentThickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      const firstPoint = currentStroke[0];
      ctx.moveTo(firstPoint.x * canvas.width, firstPoint.y * canvas.height);

      for (let i = 1; i < currentStroke.length; i++) {
        const point = currentStroke[i];
        ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      }

      ctx.stroke();
    }
  }, [strokes, currentStroke, currentColor, currentThickness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawStrokes();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [drawStrokes]);

  useEffect(() => {
    drawStrokes();
  }, [drawStrokes]);

  const handleStart = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const point = getCoordinates(e);
      if (!point) return;

      setIsDrawing(true);
      setCurrentStroke([point]);
      onStrokeStart(point);
    },
    [getCoordinates, onStrokeStart]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;

      const point = getCoordinates(e);
      if (!point) return;

      setCurrentStroke((prev) => [...prev, point]);
      onStrokeMove(point);
    },
    [isDrawing, getCoordinates, onStrokeMove]
  );

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setCurrentStroke([]);
    onStrokeEnd();
  }, [isDrawing, onStrokeEnd]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      className="w-full h-full cursor-crosshair touch-none"
      style={{ display: "block" }}
    />
  );
}

