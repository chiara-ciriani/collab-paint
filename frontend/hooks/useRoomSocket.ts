"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { createSocket } from "@/lib/socket";
import { generateUserId } from "@/lib/constants";
import type {
  RoomStatePayload,
  StrokeStartedPayload,
  StrokeUpdatedPayload,
  StrokeEndedPayload,
  CanvasClearedPayload,
  UserStrokesDeletedPayload,
  ErrorPayload,
} from "@/types/serverToClientTypes";
import type {
  JoinRoomPayload,
  StartStrokePayload,
  UpdateStrokePayload,
  EndStrokePayload,
  ClearCanvasPayload,
  DeleteUserStrokesPayload,
} from "@/types/clientToServerTypes";

import type {
  UserJoinedPayload,
  UserLeftPayload,
  CursorMovePayload as ServerCursorMovePayload,
} from "@/types/serverToClientTypes";
import type {
  CursorMovePayload as ClientCursorMovePayload,
} from "@/types/clientToServerTypes";
import type { Point } from "@/types";

interface UseRoomSocketOptions {
  roomId: string;
  userId?: string;
  displayName?: string;
  onRoomState?: (state: RoomStatePayload) => void;
  onStrokeStarted?: (payload: StrokeStartedPayload) => void;
  onStrokeUpdated?: (payload: StrokeUpdatedPayload) => void;
  onStrokeEnded?: (payload: StrokeEndedPayload) => void;
  onCanvasCleared?: (payload: CanvasClearedPayload) => void;
  onUserJoined?: (payload: UserJoinedPayload) => void;
  onUserLeft?: (payload: UserLeftPayload) => void;
  onCursorMove?: (payload: ServerCursorMovePayload) => void;
  onUserStrokesDeleted?: (payload: UserStrokesDeletedPayload) => void;
  onError?: (error: ErrorPayload) => void;
}

interface UseRoomSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  roomState: RoomStatePayload | null;
  joinRoom: (roomId: string, userId?: string, displayName?: string) => void;
  emitStrokeStart: (payload: Omit<StartStrokePayload, "roomId">) => void;
  emitStrokeUpdate: (payload: Omit<UpdateStrokePayload, "roomId">) => void;
  emitStrokeEnd: (payload: Omit<EndStrokePayload, "roomId">) => void;
  emitClearCanvas: (userId?: string) => void;
  emitCursorMove: (position: Point, color?: string) => void;
  emitDeleteUserStrokes: (userId: string) => void;
}

/**
 * Custom hook to manage Socket.IO connection for a room
 */
export function useRoomSocket({
  roomId,
  userId: providedUserId,
  displayName,
  onRoomState,
  onStrokeStarted,
  onStrokeUpdated,
  onStrokeEnded,
  onCanvasCleared,
  onUserJoined,
  onUserLeft,
  onCursorMove,
  onUserStrokesDeleted,
  onError,
}: UseRoomSocketOptions): UseRoomSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string>(providedUserId || generateUserId());
  const displayNameRef = useRef<string | undefined>(displayName);
  const hasJoinedRef = useRef(false);
  
  useEffect(() => {
    if (providedUserId) {
      userIdRef.current = providedUserId;
    }
    displayNameRef.current = displayName;
  }, [providedUserId, displayName]);

  const callbacksRef = useRef({
    onRoomState,
    onStrokeStarted,
    onStrokeUpdated,
    onStrokeEnded,
    onCanvasCleared,
    onUserJoined,
    onUserLeft,
    onCursorMove,
    onUserStrokesDeleted,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onRoomState,
      onStrokeStarted,
      onStrokeUpdated,
      onStrokeEnded,
      onCanvasCleared,
      onUserJoined,
      onUserLeft,
      onCursorMove,
      onUserStrokesDeleted,
      onError,
    };
  }, [onRoomState, onStrokeStarted, onStrokeUpdated, onStrokeEnded, onCanvasCleared, onUserJoined, onUserLeft, onCursorMove, onUserStrokesDeleted, onError]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = createSocket();

    const handleConnect = () => {
      setIsConnected(true);
      hasJoinedRef.current = false; 
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      hasJoinedRef.current = false;
    };

    const handleRoomState = (payload: RoomStatePayload) => {
      setRoomState(payload);
      callbacksRef.current.onRoomState?.(payload);
    };

    const handleStrokeStarted = (payload: StrokeStartedPayload) => {
      callbacksRef.current.onStrokeStarted?.(payload);
    };

    const handleStrokeUpdated = (payload: StrokeUpdatedPayload) => {
      callbacksRef.current.onStrokeUpdated?.(payload);
    };

    const handleStrokeEnded = (payload: StrokeEndedPayload) => {
      callbacksRef.current.onStrokeEnded?.(payload);
    };

    const handleCanvasCleared = (payload: CanvasClearedPayload) => {
      callbacksRef.current.onCanvasCleared?.(payload);
    };

    const handleError = (payload: ErrorPayload) => {
      console.error("[Socket] Error:", payload);
      callbacksRef.current.onError?.(payload);
    };

    const handleUserJoined = (payload: UserJoinedPayload) => {
      callbacksRef.current.onUserJoined?.(payload);
    };

    const handleUserLeft = (payload: UserLeftPayload) => {
      callbacksRef.current.onUserLeft?.(payload);
    };

    const handleCursorMove = (payload: ServerCursorMovePayload) => {
      callbacksRef.current.onCursorMove?.(payload);
    };

    // Register event listeners
    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("room:state", handleRoomState);
    newSocket.on("stroke:started", handleStrokeStarted);
    newSocket.on("stroke:updated", handleStrokeUpdated);
    newSocket.on("stroke:ended", handleStrokeEnded);
    newSocket.on("canvas:cleared", handleCanvasCleared);
    newSocket.on("user:joined", handleUserJoined);
    newSocket.on("user:left", handleUserLeft);
    newSocket.on("cursor:move", handleCursorMove);
    
    const handleUserStrokesDeleted = (payload: UserStrokesDeletedPayload) => {
      callbacksRef.current.onUserStrokesDeleted?.(payload);
    };
    newSocket.on("strokes:deleted:user", handleUserStrokesDeleted);
    
    newSocket.on("error", handleError);

    socketRef.current = newSocket;
    
    // Update state asynchronously to avoid cascading renders
    // Using setTimeout to defer state update until after render
    setTimeout(() => {
      setSocket(newSocket);
    }, 0);

    // Cleanup: remove all listeners and close socket
    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("room:state", handleRoomState);
      newSocket.off("stroke:started", handleStrokeStarted);
      newSocket.off("stroke:updated", handleStrokeUpdated);
      newSocket.off("stroke:ended", handleStrokeEnded);
      newSocket.off("canvas:cleared", handleCanvasCleared);
      newSocket.off("user:joined", handleUserJoined);
      newSocket.off("user:left", handleUserLeft);
      newSocket.off("cursor:move", handleCursorMove);
      newSocket.off("strokes:deleted:user", handleUserStrokesDeleted);
      newSocket.off("error", handleError);
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  // Join room when socket is connected
  const joinRoom = useCallback(
    (targetRoomId: string, userId?: string, displayName?: string) => {
      const socket = socketRef.current;
      if (!socket || !isConnected || hasJoinedRef.current) return;

      const finalUserId = userId || userIdRef.current;
      const payload: JoinRoomPayload = {
        roomId: targetRoomId,
        userId: finalUserId,
        displayName,
      };

      socket.emit("room:join", payload);
      hasJoinedRef.current = true;
    },
    [isConnected]
  );

  const emitStrokeStart = useCallback(
    (payload: Omit<StartStrokePayload, "roomId">) => {
      const socket = socketRef.current;
      if (!socket || !isConnected) return;

      const fullPayload: StartStrokePayload = {
        ...payload,
        roomId,
      };

      socket.emit("stroke:start", fullPayload);
    },
    [isConnected, roomId]
  );

  const emitStrokeUpdate = useCallback(
    (payload: Omit<UpdateStrokePayload, "roomId">) => {
      const socket = socketRef.current;
      if (!socket || !isConnected) return;

      const fullPayload: UpdateStrokePayload = {
        ...payload,
        roomId,
      };

      socket.emit("stroke:update", fullPayload);
    },
    [isConnected, roomId]
  );

  const emitStrokeEnd = useCallback(
    (payload: Omit<EndStrokePayload, "roomId">) => {
      const socket = socketRef.current;
      if (!socket || !isConnected) return;

      const fullPayload: EndStrokePayload = {
        ...payload,
        roomId,
      };

      socket.emit("stroke:end", fullPayload);
    },
    [isConnected, roomId]
  );

  const emitClearCanvas = useCallback(
    (userId?: string) => {
      const socket = socketRef.current;
      if (!socket || !isConnected) return;

      const payload: ClearCanvasPayload = {
        roomId,
        userId,
      };

      socket.emit("canvas:clear", payload);
    },
    [isConnected, roomId]
  );

  const emitCursorMove = useCallback(
    (position: Point, color?: string) => {
      const socket = socketRef.current;
      if (!socket || !isConnected) return;

      const payload: ClientCursorMovePayload = {
        roomId,
        userId: userIdRef.current,
        position,
        color,
      };

      socket.emit("cursor:move", payload);
    },
    [isConnected, roomId]
  );

  const emitDeleteUserStrokes = useCallback(
    (targetUserId: string) => {
      const socket = socketRef.current;
      if (!socket || !isConnected) return;

      const payload: DeleteUserStrokesPayload = {
        roomId,
        userId: targetUserId,
      };

      socket.emit("strokes:delete:user", payload);
    },
    [isConnected, roomId]
  );

  // Auto-join when socket connects
  useEffect(() => {
    if (socket && isConnected && !hasJoinedRef.current) {
      joinRoom(roomId, userIdRef.current, displayNameRef.current);
    }
  }, [socket, isConnected, roomId, joinRoom]);

  return {
    socket,
    isConnected,
    roomState,
    joinRoom,
    emitStrokeStart,
    emitStrokeUpdate,
    emitStrokeEnd,
    emitClearCanvas,
    emitCursorMove,
    emitDeleteUserStrokes,
  };
}
