import { roomsStore } from "./roomsStore";
import type { RoomState, Stroke, UserInRoom, Point } from "./types";
import { EMPTY_ROOM_CLEANUP_DELAY_MS } from "../config";
import { logger } from "../logger";

export class RoomsService {
  /**
   * Join a user to a room
   * Returns the room state for the new user
   */
  joinRoom(roomId: string, user: UserInRoom): RoomState {
    roomsStore.addUser(roomId, user);
    const room = roomsStore.getRoom(roomId)!;
    return room;
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string, socketId: string): { userId: string | null } {
    const room = roomsStore.getRoom(roomId);
    if (!room) {
      return { userId: null };
    }

    const user = room.users.find((u) => u.socketId === socketId);
    const userId = user?.userId || null;

    if (user) {
      roomsStore.removeUser(roomId, socketId);
    }

    // Clean up empty rooms after inactivity period
    const updatedRoom = roomsStore.getRoom(roomId);
    if (updatedRoom && updatedRoom.users.length === 0) {
      const cleanupThreshold = Date.now() - EMPTY_ROOM_CLEANUP_DELAY_MS;
      if (updatedRoom.lastActivityAt < cleanupThreshold) {
        roomsStore.deleteRoom(roomId);
        logger.info({ category: "Room", roomId }, "Deleted empty room after inactivity period");
      }
    }

    return { userId };
  }

  /**
   * Start a new stroke
   */
  startStroke(
    roomId: string,
    strokeId: string,
    userId: string,
    color: string,
    thickness: number,
    startPoint: Point
  ): Stroke {
    const stroke: Stroke = {
      id: strokeId,
      userId,
      color,
      thickness,
      points: [startPoint],
      createdAt: Date.now(),
    };

    roomsStore.addStroke(roomId, stroke);
    return stroke;
  }

  /**
   * Update an existing stroke with new points
   */
  updateStroke(roomId: string, strokeId: string, points: Point[]): boolean {
    const room = roomsStore.getRoom(roomId);
    if (!room) {
      return false;
    }

    const stroke = room.strokes.find((s) => s.id === strokeId);
    if (!stroke) {
      return false;
    }

    roomsStore.updateStroke(roomId, strokeId, points);
    return true;
  }

  /**
   * Clear all strokes from a room
   */
  clearRoom(roomId: string): boolean {
    const room = roomsStore.getRoom(roomId);
    if (!room) {
      return false;
    }

    roomsStore.clearRoom(roomId);
    return true;
  }

  /**
   * Get room state for a client
   */
  getRoomStateForClient(roomId: string): RoomState | null {
    return roomsStore.getRoomState(roomId);
  }
}

export const roomsService = new RoomsService();
