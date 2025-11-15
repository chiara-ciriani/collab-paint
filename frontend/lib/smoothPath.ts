/**
 * Path smoothing utilities using quadratic curves
 */

import type { Point } from "@/types";

/**
 * Draw a smooth path using quadratic curves
 * Uses quadratic curves with midpoints as control points for smooth, natural-looking strokes
 */
export function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  canvasWidth: number,
  canvasHeight: number
): void {
  if (points.length === 0) return;
  if (points.length === 1) {
    const p = points[0];
    ctx.moveTo(p.x * canvasWidth, p.y * canvasHeight);
    return;
  }

  const firstPoint = points[0];
  ctx.moveTo(firstPoint.x * canvasWidth, firstPoint.y * canvasHeight);

  if (points.length === 2) {
    const secondPoint = points[1];
    ctx.lineTo(secondPoint.x * canvasWidth, secondPoint.y * canvasHeight);
    return;
  }

  // For 3+ points, use quadratic curves for smoothing
  // Algorithm: draw curves from midpoint to midpoint, using actual points as control points
  // This creates smooth curves that approximate the original path
  
  let prevMidX = (firstPoint.x + points[1].x) / 2;
  let prevMidY = (firstPoint.y + points[1].y) / 2;
  
  ctx.lineTo(prevMidX * canvasWidth, prevMidY * canvasHeight);
  
  for (let i = 1; i < points.length - 1; i++) {
    const currentPoint = points[i];
    const nextPoint = points[i + 1];
    
    const nextMidX = (currentPoint.x + nextPoint.x) / 2;
    const nextMidY = (currentPoint.y + nextPoint.y) / 2;
    
    ctx.quadraticCurveTo(
      currentPoint.x * canvasWidth,
      currentPoint.y * canvasHeight,
      nextMidX * canvasWidth,
      nextMidY * canvasHeight
    );
    
    prevMidX = nextMidX;
    prevMidY = nextMidY;
  }
  
  const lastPoint = points[points.length - 1];
  ctx.quadraticCurveTo(
    points[points.length - 2].x * canvasWidth,
    points[points.length - 2].y * canvasHeight,
    lastPoint.x * canvasWidth,
    lastPoint.y * canvasHeight
  );
}
