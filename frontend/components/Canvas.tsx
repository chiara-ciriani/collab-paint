"use client";

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import type { Point, Stroke, DrawingMode, ShapeType } from "@/types";
import { drawSmoothPath } from "@/lib/smoothPath";

interface CanvasProps {
  strokes: Stroke[];
  currentColor: string;
  currentThickness: number;
  drawingMode: DrawingMode;
  shapeType?: ShapeType;
  onStrokeStart: (point: Point) => void;
  onStrokeMove: (point: Point) => void;
  onStrokeEnd: (shapeData?: { startPoint: Point; endPoint: Point; type: ShapeType }) => void;
}

export interface CanvasHandle {
  exportAsImage: () => void;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  {
    strokes,
    currentColor,
    currentThickness,
    drawingMode,
    shapeType = "circle",
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);
  const [shapeEndPoint, setShapeEndPoint] = useState<Point | null>(null);

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

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, start: Point, end: Point, type: ShapeType) => {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentThickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startX = start.x * canvas.width;
      const startY = start.y * canvas.height;
      const endX = end.x * canvas.width;
      const endY = end.y * canvas.height;

      ctx.beginPath();

      switch (type) {
        case "circle": {
          const centerX = (startX + endX) / 2;
          const centerY = (startY + endY) / 2;
          const radiusX = Math.abs(endX - startX) / 2;
          const radiusY = Math.abs(endY - startY) / 2;

          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          break;
        }
        case "rectangle": {
          const width = endX - startX;
          const height = endY - startY;
          ctx.rect(startX, startY, width, height);
          break;
        }
        case "line":
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          break;
        case "triangle":
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, startY);
          ctx.lineTo(endX, endY);
          ctx.closePath();
          break;
      }

      ctx.stroke();
    },
    [currentColor, currentThickness]
  );

  const drawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      strokes.forEach((stroke) => {
        if (stroke.points.length === 0) return;

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.thickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        if (stroke.points.length > 0) {
          // Only apply smoothing to freehand strokes (not shapes)
          // Shapes have specific point counts: rectangle=5, triangle=4, line=2, circle=50
          const isShape = stroke.points.length === 2 || // line
                         stroke.points.length === 4 || // triangle
                         stroke.points.length === 5 || // rectangle
                         stroke.points.length === 50; // circle
          
          if (isShape) {
            // Draw shapes without smoothing (they already have correct geometry)
            const firstPoint = stroke.points[0];
            ctx.moveTo(firstPoint.x * canvas.width, firstPoint.y * canvas.height);

            for (let i = 1; i < stroke.points.length; i++) {
              const point = stroke.points[i];
              ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
            }
            
            if (stroke.points.length === 50) {
              ctx.closePath();
            }
          } else {
            // Use smooth path drawing for freehand strokes
            drawSmoothPath(ctx, stroke.points, canvas.width, canvas.height);
          }
        }

        ctx.stroke();
      });

      if (drawingMode === "freehand" && currentStroke.length > 0) {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentThickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        // Use smooth path drawing for better visual quality
        drawSmoothPath(ctx, currentStroke, canvas.width, canvas.height);
        ctx.stroke();
      }

      if (drawingMode === "shape" && shapeStartPoint && shapeEndPoint) {
        drawShape(ctx, canvas, shapeStartPoint, shapeEndPoint, shapeType);
      }
    });
  }, [strokes, currentStroke, currentColor, currentThickness, drawingMode, shapeStartPoint, shapeEndPoint, shapeType, drawShape]);

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

      if (drawingMode === "freehand") {
        setCurrentStroke([point]);
        onStrokeStart(point);
      } else {
        setShapeStartPoint(point);
        setShapeEndPoint(point);
      }
    },
    [getCoordinates, onStrokeStart, drawingMode]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;

      const point = getCoordinates(e);
      if (!point) return;

      if (drawingMode === "freehand") {
        setCurrentStroke((prev) => [...prev, point]);
        onStrokeMove(point);
      } else {
        setShapeEndPoint(point);
      }
    },
    [isDrawing, getCoordinates, onStrokeMove, drawingMode]
  );

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (drawingMode === "freehand") {
      setCurrentStroke([]);
      onStrokeEnd();
    } else {
      if (shapeStartPoint && shapeEndPoint) {
        onStrokeEnd({
          startPoint: shapeStartPoint,
          endPoint: shapeEndPoint,
          type: shapeType,
        });
      }
      setShapeStartPoint(null);
      setShapeEndPoint(null);
    }
  }, [isDrawing, onStrokeEnd, drawingMode, shapeStartPoint, shapeEndPoint, shapeType]);

  useImperativeHandle(ref, () => ({
    exportAsImage: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = `collaborative-paint-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  }));

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
});

export default Canvas;

