/**
 * Socket.IO event payload types
 * Client → Server
 */

import type { Point } from "./index";

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
  displayName?: string;
}

export interface StartStrokePayload {
  roomId: string;
  strokeId: string;
  userId: string;
  color: string;
  thickness: number;
  startPoint: Point;
}

export interface UpdateStrokePayload {
  roomId: string;
  strokeId: string;
  points: Point[];
}

export interface EndStrokePayload {
  roomId: string;
  strokeId: string;
}

export interface ClearCanvasPayload {
  roomId: string;
  userId?: string;
}

export interface CursorMovePayload {
  roomId: string;
  userId: string;
  position: Point;
  color?: string; // Current drawing color
}

