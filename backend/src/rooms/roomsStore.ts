import type { RoomState, Stroke, UserInRoom, Point } from "./types";

/**
 * In-memory store for rooms
 * In production, this would be replaced with Redis or a database
 */
class RoomsStore {
  private rooms: Map<string, RoomState> = new Map();

  /**
   * Get or create a room
   */
  getOrCreateRoom(roomId: string): RoomState {
    if (!this.rooms.has(roomId)) {
      const now = Date.now();
      this.rooms.set(roomId, {
        id: roomId,
        strokes: [],
        users: [],
        createdAt: now,
        lastActivityAt: now,
      });
    }
    return this.rooms.get(roomId)!;
  }

  /**
   * Get room by ID (returns null if doesn't exist)
   */
  getRoom(roomId: string): RoomState | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Add user to room
   */
  addUser(roomId: string, user: UserInRoom): void {
    const room = this.getOrCreateRoom(roomId);
    // Remove user if already exists (reconnection)
    room.users = room.users.filter((u) => u.socketId !== user.socketId);
    room.users.push(user);
    this.updateLastActivity(roomId);
  }

  /**
   * Remove user from room
   */
  removeUser(roomId: string, socketId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.users = room.users.filter((u) => u.socketId !== socketId);
    this.updateLastActivity(roomId);
  }

  /**
   * Add a new stroke to a room
   */
  addStroke(roomId: string, stroke: Stroke): void {
    const room = this.getOrCreateRoom(roomId);
    room.strokes.push(stroke);
    this.updateLastActivity(roomId);
  }

  /**
   * Update an existing stroke with new points
   */
  updateStroke(roomId: string, strokeId: string, points: Point[]): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    const stroke = room.strokes.find((s) => s.id === strokeId);
    if (stroke) {
      stroke.points = [...stroke.points, ...points];
      this.updateLastActivity(roomId);
    }
  }

  /**
   * Clear all strokes from a room
   */
  clearRoom(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.strokes = [];
    this.updateLastActivity(roomId);
  }

  /**
   * Get all users in a room
   */
  getUsersInRoom(roomId: string): UserInRoom[] {
    const room = this.getRoom(roomId);
    return room ? room.users : [];
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(roomId: string): void {
    const room = this.getRoom(roomId);
    if (room) {
      room.lastActivityAt = Date.now();
    }
  }

  /**
   * Get room state (for sending to clients)
   */
  getRoomState(roomId: string): RoomState | null {
    return this.getRoom(roomId);
  }

  /**
   * Delete a room (for cleanup of empty rooms)
   */
  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }
}

// Singleton instance
export const roomsStore = new RoomsStore();
