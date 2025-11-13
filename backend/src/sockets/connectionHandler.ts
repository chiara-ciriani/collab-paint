import type { Socket } from "socket.io";
import { roomsService } from "../rooms/roomsService";
import { logger } from "../logger";
import {
  validateJoinRoomPayload,
  validateStartStrokePayload,
  validateUpdateStrokePayload,
  validateEndStrokePayload,
  validateClearCanvasPayload,
  validateCursorMovePayload,
  validateDeleteUserStrokesPayload,
} from "./validators";
import type {
  ErrorPayload,
  RoomStatePayload,
  StrokeStartedPayload,
  StrokeUpdatedPayload,
  StrokeEndedPayload,
  CanvasClearedPayload,
  UserJoinedPayload,
  UserLeftPayload,
  CursorMovePayload,
  UserStrokesDeletedPayload,
} from "./serverToClientTypes";

/**
 * Emit error to socket with structured payload
 */
function emitError(socket: Socket, message: string, code?: string): void {
  const errorPayload: ErrorPayload = { message, code };
  socket.emit("error", errorPayload);
}

/**
 * Handle socket connection and events
 */
export function handleConnection(socket: Socket): void {
  logger.info({ category: "Socket", socketId: socket.id }, "Client connected");

  // Handle room join
  socket.on("room:join", (payload: unknown) => {
    const validation = validateJoinRoomPayload(payload);
    if (!validation.valid) {
      logger.warn({ category: "Room", socketId: socket.id, error: validation.error }, "Invalid join payload");
      emitError(socket, validation.error, "INVALID_PAYLOAD");
      return;
    }

    try {
      const { roomId, userId, displayName } = validation.data;

      logger.info({ category: "Room", roomId, userId, socketId: socket.id }, "User joining room");

      const roomState = roomsService.joinRoom(roomId, {
        socketId: socket.id,
        userId,
        displayName,
        joinedAt: Date.now(),
      });

      socket.join(roomId);

      socket.data.roomId = roomId;

      // Send current room state to the new user
      const roomStatePayload: RoomStatePayload = {
        roomId,
        strokes: roomState.strokes.map((s) => ({
          id: s.id,
          userId: s.userId,
          color: s.color,
          thickness: s.thickness,
          points: s.points,
          createdAt: s.createdAt,
        })),
        users: roomState.users.map((u) => ({
          userId: u.userId,
          displayName: u.displayName,
        })),
      };
      socket.emit("room:state", roomStatePayload);

      // Notify other users in the room
      const userJoinedPayload: UserJoinedPayload = {
        userId,
        displayName,
      };
      socket.to(roomId).emit("user:joined", userJoinedPayload);

      logger.info({ category: "Room", roomId, userId }, "User successfully joined room");
    } catch (error) {
      logger.error({ category: "Room", socketId: socket.id, err: error }, "Error joining room");
      emitError(socket, "Failed to join room", "JOIN_ERROR");
    }
  });

  // Handle stroke start
  socket.on("stroke:start", (payload: unknown) => {
    const validation = validateStartStrokePayload(payload);
    if (!validation.valid) {
      logger.warn({ category: "Stroke", socketId: socket.id, error: validation.error }, "Invalid start payload");
      emitError(socket, validation.error, "INVALID_PAYLOAD");
      return;
    }

    try {
      const { roomId, strokeId, userId, color, thickness, startPoint } = validation.data;

      logger.info({ category: "Stroke", roomId, strokeId, userId }, "Stroke started");

      const stroke = roomsService.startStroke(roomId, strokeId, userId, color, thickness, startPoint);

      // Broadcast to all users in the room (excluding sender)
      const strokeStartedPayload: StrokeStartedPayload = {
        strokeId,
        userId,
        color,
        thickness,
        startPoint,
      };
      socket.to(roomId).emit("stroke:started", strokeStartedPayload);
    } catch (error) {
      logger.error({ category: "Stroke", socketId: socket.id, err: error }, "Error starting stroke");
      emitError(socket, "Failed to start stroke", "STROKE_START_ERROR");
    }
  });

  // Handle stroke update
  socket.on("stroke:update", (payload: unknown) => {
    const validation = validateUpdateStrokePayload(payload);
    if (!validation.valid) {
      logger.warn({ category: "Stroke", socketId: socket.id, error: validation.error }, "Invalid update payload");
      emitError(socket, validation.error, "INVALID_PAYLOAD");
      return;
    }

    try {
      const { roomId, strokeId, points } = validation.data;

      const success = roomsService.updateStroke(roomId, strokeId, points);
      if (!success) {
        logger.warn({ category: "Stroke", roomId, strokeId }, "Stroke not found for update");
        emitError(socket, "Stroke not found", "STROKE_NOT_FOUND");
        return;
      }

      // Broadcast to all users in the room (excluding sender)
      const strokeUpdatedPayload: StrokeUpdatedPayload = {
        strokeId,
        points,
      };
      socket.to(roomId).emit("stroke:updated", strokeUpdatedPayload);
    } catch (error) {
      logger.error({ category: "Stroke", socketId: socket.id, err: error }, "Error updating stroke");
      emitError(socket, "Failed to update stroke", "STROKE_UPDATE_ERROR");
    }
  });

  // Handle stroke end
  socket.on("stroke:end", (payload: unknown) => {
    const validation = validateEndStrokePayload(payload);
    if (!validation.valid) {
      logger.warn({ category: "Stroke", socketId: socket.id, error: validation.error }, "Invalid end payload");
      emitError(socket, validation.error, "INVALID_PAYLOAD");
      return;
    }

    try {
      const { roomId, strokeId } = validation.data;

      logger.info({ category: "Stroke", roomId, strokeId }, "Stroke ended");

      // Broadcast to all users in the room (excluding sender)
      const strokeEndedPayload: StrokeEndedPayload = {
        strokeId,
      };
      socket.to(roomId).emit("stroke:ended", strokeEndedPayload);
    } catch (error) {
      logger.error({ category: "Stroke", socketId: socket.id, err: error }, "Error ending stroke");
      emitError(socket, "Failed to end stroke", "STROKE_END_ERROR");
    }
  });

  // Handle canvas clear
  socket.on("canvas:clear", (payload: unknown) => {
    const validation = validateClearCanvasPayload(payload);
    if (!validation.valid) {
      logger.warn({ category: "Canvas", socketId: socket.id, error: validation.error }, "Invalid clear payload");
      emitError(socket, validation.error, "INVALID_PAYLOAD");
      return;
    }

    try {
      const { roomId, userId } = validation.data;

      logger.info({ category: "Canvas", roomId, clearedBy: userId || "unknown" }, "Canvas cleared");

      const success = roomsService.clearRoom(roomId);
      if (!success) {
        logger.warn({ category: "Canvas", roomId }, "Room not found for clear");
        emitError(socket, "Room not found", "ROOM_NOT_FOUND");
        return;
      }

      // Broadcast to all users in the room (excluding sender)
      const canvasClearedPayload: CanvasClearedPayload = {
        roomId,
        clearedBy: userId,
      };
      socket.to(roomId).emit("canvas:cleared", canvasClearedPayload);
    } catch (error) {
      logger.error({ category: "Canvas", socketId: socket.id, err: error }, "Error clearing canvas");
      emitError(socket, "Failed to clear canvas", "CLEAR_ERROR");
    }
  });

  // Handle cursor move
  socket.on("cursor:move", (payload: unknown) => {
    const validation = validateCursorMovePayload(payload);
    if (!validation.valid) {
      logger.warn({ category: "Cursor", socketId: socket.id, error: validation.error }, "Invalid cursor move payload");
      return;
    }

    try {
      const { roomId, userId, position, color } = validation.data;

      const room = roomsService.getRoomStateForClient(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.userId === userId);
      if (!user) return;

      const userStroke = room.strokes.find((s) => s.userId === userId);
      const userColor = color || userStroke?.color || "#000000";

      // Broadcast cursor position to other users in the room
      const cursorMovePayload: CursorMovePayload = {
        userId,
        displayName: user.displayName,
        position,
        color: userColor,
      };
      socket.to(roomId).emit("cursor:move", cursorMovePayload);
    } catch (error) {
      logger.error({ category: "Cursor", socketId: socket.id, err: error }, "Error handling cursor move");
    }
  });

  // Handle delete user strokes
  socket.on("strokes:delete:user", (payload: unknown) => {
    const validation = validateDeleteUserStrokesPayload(payload);
    if (!validation.valid) {
      logger.warn({ category: "Strokes", socketId: socket.id, error: validation.error }, "Invalid delete user strokes payload");
      emitError(socket, validation.error, "INVALID_PAYLOAD");
      return;
    }

    try {
      const { roomId, userId } = validation.data;

      const room = roomsService.getRoomStateForClient(roomId);
      if (!room) {
        logger.warn({ category: "Strokes", roomId }, "Room not found for delete user strokes");
        emitError(socket, "Room not found", "ROOM_NOT_FOUND");
        return;
      }

      const success = roomsService.deleteUserStrokes(roomId, userId);
      if (!success) {
        logger.warn({ category: "Strokes", roomId, userId }, "Failed to delete user strokes");
        emitError(socket, "Failed to delete strokes", "DELETE_ERROR");
        return;
      }

      logger.info({ category: "Strokes", roomId, userId }, "User strokes deleted");

      // Broadcast to all users in the room (including sender)
      const userStrokesDeletedPayload: UserStrokesDeletedPayload = {
        userId,
      };
      socket.to(roomId).emit("strokes:deleted:user", userStrokesDeletedPayload);
      socket.emit("strokes:deleted:user", userStrokesDeletedPayload);
    } catch (error) {
      logger.error({ category: "Strokes", socketId: socket.id, err: error }, "Error deleting user strokes");
      emitError(socket, "Failed to delete strokes", "DELETE_ERROR");
    }
  });

  // Handle disconnect
  socket.on("disconnect", (reason: string) => {
    logger.info({ category: "Socket", socketId: socket.id, reason }, "Client disconnected");

    // Remove user from room if they were in one
    const roomId = socket.data.roomId as string | undefined;
    if (roomId) {
      const { userId } = roomsService.leaveRoom(roomId, socket.id);

      if (userId) {
        logger.info({ category: "Room", roomId, userId }, "User left room");

        // Notify other users
        const userLeftPayload: UserLeftPayload = {
          userId,
        };
        socket.to(roomId).emit("user:left", userLeftPayload);
      }
    }
  });
}
