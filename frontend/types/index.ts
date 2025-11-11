export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  userId: string;
  color: string;
  thickness: number;
  points: Point[];
  createdAt: number;
}

