/**
 * Types for room management and drawing
 */

export interface Point {
  x: number; // Normalized coordinates (0-1)
  y: number; // Normalized coordinates (0-1)
}

export interface Stroke {
  id: string;
  userId: string;
  color: string;
  thickness: number;
  points: Point[];
  createdAt: number;
}

export interface UserInRoom {
  socketId: string;
  userId: string;
  displayName?: string;
  joinedAt: number;
}

export interface RoomState {
  id: string;
  strokes: Stroke[];
  users: UserInRoom[];
  createdAt: number;
  lastActivityAt: number;
}

