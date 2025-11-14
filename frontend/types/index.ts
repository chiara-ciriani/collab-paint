export interface Point {
  x: number;
  y: number;
}

export type DrawingMode = "freehand" | "shape";
export type ShapeType = "circle" | "rectangle" | "line" | "triangle";

export interface Stroke {
  id: string;
  userId: string;
  color: string;
  thickness: number;
  points: Point[];
  createdAt: number;
}

export interface Shape {
  id: string;
  userId: string;
  color: string;
  thickness: number;
  type: ShapeType;
  startPoint: Point;
  endPoint: Point;
  createdAt: number;
}

