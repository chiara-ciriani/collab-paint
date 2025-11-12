/**
 * Event payload types
 * Server → Client
 */

import type { Point } from "../rooms/types";

export interface RoomStatePayload {
  roomId: string;
  strokes: Array<{
    id: string;
    userId: string;
    color: string;
    thickness: number;
    points: Point[];
    createdAt: number;
  }>;
  users: Array<{
    userId: string;
    displayName?: string;
  }>;
}

export interface StrokeStartedPayload {
  strokeId: string;
  userId: string;
  color: string;
  thickness: number;
  startPoint: Point;
}

export interface StrokeUpdatedPayload {
  strokeId: string;
  points: Point[];
}

export interface StrokeEndedPayload {
  strokeId: string;
}

export interface CanvasClearedPayload {
  roomId: string;
  clearedBy?: string;
}

export interface UserJoinedPayload {
  userId: string;
  displayName?: string;
}

export interface UserLeftPayload {
  userId: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export interface CursorMovePayload {
  userId: string;
  displayName?: string;
  position: Point;
  color: string;
}

