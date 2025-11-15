"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Canvas, { type CanvasHandle } from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import UsersList from "@/components/UsersList";
import CursorIndicator from "@/components/CursorIndicator";
import NicknameModal from "@/components/NicknameModal";
import { useStrokesState } from "@/hooks/useStrokesState";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { DEFAULT_COLOR, DEFAULT_THICKNESS, generateUserId, NICKNAME_STORAGE_KEY, shapeToPoints } from "@/lib/constants";
import { config } from "@/lib/config";
import { copyToClipboard, getRoomUrl } from "@/lib/utils";
import { throttle } from "@/lib/throttle";
import type { Stroke, Point, DrawingMode, ShapeType } from "@/types";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const router = useRouter();
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [currentThickness, setCurrentThickness] = useState(DEFAULT_THICKNESS);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("freehand");
  const [shapeType, setShapeType] = useState<ShapeType>("circle");
  const [userId] = useState(() => generateUserId());
  const canvasRef = useRef<CanvasHandle>(null);
  
  // Batching for stroke updates - accumulate points and send in batches
  const pendingPointsRef = useRef<Map<string, Point[]>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showNicknameModal, setShowNicknameModal] = useState(true);
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsClient(true);
      setShowNicknameModal(true);
      setDisplayName(undefined);
    }, 0);
  }, []);
  const [users, setUsers] = useState<Array<{ userId: string; displayName?: string }>>([]);
  const activeDrawersRef = useRef<Set<string>>(new Set());
  const [activeDrawers, setActiveDrawers] = useState<Set<string>>(new Set());
  const [cursors, setCursors] = useState<Map<string, { position: Point; displayName?: string; color: string }>>(new Map());

  const {
    strokes,
    currentStrokeId,
    startStroke,
    updateStroke,
    endStroke,
    clearStrokes,
    deleteUserStrokes,
    applyRoomState,
    applyStrokeStarted,
    applyStrokeUpdated,
    applyStrokeEnded,
    applyCanvasCleared,
    applyUserStrokesDeleted,
  } = useStrokesState({
    userId,
  });

  // Handle room state from server - initialize strokes and users
  const handleRoomState = useCallback(
    (state: { roomId: string; strokes: Stroke[]; users: Array<{ userId: string; displayName?: string }> }) => {
      applyRoomState(state.strokes);
      setUsers(state.users);
    },
    [applyRoomState]
  );

  // Handle stroke events from server
  const handleStrokeStarted = useCallback(
    (payload: { strokeId: string; userId: string; color: string; thickness: number; startPoint: { x: number; y: number } }) => {
      activeDrawersRef.current.add(payload.userId);
      setActiveDrawers(new Set(activeDrawersRef.current));
      
      // Only apply if it's from another user
      if (payload.userId !== userId) {
        applyStrokeStarted(payload);
        
        const user = users.find((u) => u.userId === payload.userId);
        setCursors((prev) => {
          const next = new Map(prev);
          next.set(payload.userId, {
            position: payload.startPoint,
            displayName: user?.displayName,
            color: payload.color,
          });
          return next;
        });
        
        const existingTimeout = cursorTimeoutsRef.current.get(payload.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          cursorTimeoutsRef.current.delete(payload.userId);
        }
      }
    },
    [userId, applyStrokeStarted, users]
  );

  const handleStrokeUpdated = useCallback(
    (payload: { strokeId: string; points: { x: number; y: number }[] }) => {
      applyStrokeUpdated(payload);
      
      if (payload.points.length > 0) {
        const lastPoint = payload.points[payload.points.length - 1];
        const stroke = strokes.find((s) => s.id === payload.strokeId);
        
        if (stroke && stroke.userId !== userId) {
          const user = users.find((u) => u.userId === stroke.userId);
          setCursors((prev) => {
            const next = new Map(prev);
            const existing = next.get(stroke.userId);
            next.set(stroke.userId, {
              position: lastPoint,
              displayName: user?.displayName || existing?.displayName,
              color: stroke.color,
            });
            return next;
          });
          
          const existingTimeout = cursorTimeoutsRef.current.get(stroke.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            cursorTimeoutsRef.current.delete(stroke.userId);
          }
        }
      }
    },
    [applyStrokeUpdated, strokes, userId, users]
  );

  const handleStrokeEnded = useCallback(
    (payload: { strokeId: string }) => {
      applyStrokeEnded(payload);

      const stroke = strokes.find((s) => s.id === payload.strokeId);
      if (stroke) {
        activeDrawersRef.current.delete(stroke.userId);
        setActiveDrawers(new Set(activeDrawersRef.current));
        
        if (stroke.userId !== userId) {
          const existingTimeout = cursorTimeoutsRef.current.get(stroke.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          const timeout = setTimeout(() => {
            setCursors((prev) => {
              const next = new Map(prev);
              next.delete(stroke.userId);
              return next;
            });
            cursorTimeoutsRef.current.delete(stroke.userId);
          }, config.cursorTimeoutMs);
          
          cursorTimeoutsRef.current.set(stroke.userId, timeout);
        }
      }
    },
    [applyStrokeEnded, strokes, userId]
  );

  const handleCanvasCleared = useCallback(() => {
    applyCanvasCleared();
    // Clear all active drawers
    activeDrawersRef.current.clear();
    setActiveDrawers(new Set());
  }, [applyCanvasCleared]);

  const handleUserJoined = useCallback(
    (payload: { userId: string; displayName?: string }) => {
      setUsers((prev) => {
        if (prev.some((u) => u.userId === payload.userId)) {
          return prev;
        }
        return [...prev, payload];
      });
    },
    []
  );

  const handleUserLeft = useCallback((payload: { userId: string }) => {
    setUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
    activeDrawersRef.current.delete(payload.userId);
    setActiveDrawers(new Set(activeDrawersRef.current));

    setCursors((prev) => {
      const next = new Map(prev);
      next.delete(payload.userId);
      return next;
    });
  }, []);

  const cursorTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleCursorMove = useCallback(
    (payload: { userId: string; displayName?: string; position: Point; color: string }) => {
      // Only show cursor for other users
      if (payload.userId !== userId) {
        // Clear existing timeout for this user
        const existingTimeout = cursorTimeoutsRef.current.get(payload.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        setCursors((prev) => {
          const next = new Map(prev);
          next.set(payload.userId, {
            position: payload.position,
            displayName: payload.displayName,
            color: payload.color,
          });
          return next;
        });

        const isDrawing = activeDrawersRef.current.has(payload.userId);
        
        if (!isDrawing) {
          const timeout = setTimeout(() => {
            setCursors((prev) => {
              const next = new Map(prev);
              next.delete(payload.userId);
              return next;
            });
            cursorTimeoutsRef.current.delete(payload.userId);
          }, config.cursorTimeoutMs);

          cursorTimeoutsRef.current.set(payload.userId, timeout);
        }
      }
    },
    [userId]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = cursorTimeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const handleSocketError = useCallback((error: { message: string; code?: string }) => {
    toast.error(`Error de conexión: ${error.message}`);
  }, []);

  // Socket connection
  const handleUserStrokesDeleted = useCallback(
    (payload: { userId: string }) => {
      applyUserStrokesDeleted(payload.userId);
      activeDrawersRef.current.delete(payload.userId);
      setActiveDrawers(new Set(activeDrawersRef.current));
    },
    [applyUserStrokesDeleted]
  );

  const { isConnected, joinRoom, emitStrokeStart, emitStrokeUpdate, emitStrokeEnd, emitClearCanvas, emitCursorMove, emitDeleteUserStrokes } = useRoomSocket({
    roomId,
    userId,
    displayName: displayName || undefined,
    onRoomState: handleRoomState,
    onStrokeStarted: handleStrokeStarted,
    onStrokeUpdated: handleStrokeUpdated,
    onStrokeEnded: handleStrokeEnded,
    onCanvasCleared: handleCanvasCleared,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onCursorMove: handleCursorMove,
    onUserStrokesDeleted: handleUserStrokesDeleted,
    onError: handleSocketError,
  });

  useEffect(() => {
    if (displayName && isConnected) {
      joinRoom(roomId, userId, displayName);
    }
  }, [displayName, isConnected, roomId, userId, joinRoom]);

  const handleStrokeStart = useCallback(
    (point: { x: number; y: number }) => {
      const strokeId = startStroke(point, currentColor, currentThickness);
      
      activeDrawersRef.current.add(userId);
      setActiveDrawers(new Set(activeDrawersRef.current));
      
      pendingPointsRef.current.delete(strokeId);
      
      // Emit to server for other users
      emitStrokeStart({
        strokeId,
        userId,
        color: currentColor,
        thickness: currentThickness,
        startPoint: point,
      });
    },
    [startStroke, currentColor, currentThickness, userId, emitStrokeStart]
  );
  
  // Flush pending points for a stroke
  const flushPendingPoints = useCallback(
    (strokeId: string) => {
      const pendingPoints = pendingPointsRef.current.get(strokeId);
      if (!pendingPoints || pendingPoints.length === 0) return;
      
      // Send all accumulated points in one batch
      emitStrokeUpdate({
        strokeId,
        points: pendingPoints,
      });
      
      // Clear the pending points
      pendingPointsRef.current.delete(strokeId);
    },
    [emitStrokeUpdate]
  );
  
  // Throttled function to send batched points
  const sendBatchedPoints = useCallback(
    (strokeId: string, point: Point) => {
      // Add point to batch
      const pending = pendingPointsRef.current.get(strokeId) || [];
      pending.push(point);
      pendingPointsRef.current.set(strokeId, pending);
      
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      if (pending.length >= 10) {
        flushPendingPoints(strokeId);
      } else {
        batchTimeoutRef.current = setTimeout(() => {
          flushPendingPoints(strokeId);
          batchTimeoutRef.current = null;
        }, 16); // ~60fps
      }
    },
    [flushPendingPoints]
  );
  
  // Throttled cursor move (only update every 50ms to reduce network traffic)
  const throttledCursorMove = useRef(
    throttle((point: Point, color: string) => {
      emitCursorMove(point, color);
    }, 50)
  ).current;

  const handleClear = useCallback(() => {
    if (
      window.confirm("¿Estás seguro de que quieres limpiar el lienzo?")
    ) {
      // Clear local state immediately
      clearStrokes();
      
      // Emit to server for other users
      emitClearCanvas(userId);
    }
  }, [clearStrokes, emitClearCanvas, userId]);

  const handleDeleteMyStrokes = useCallback(() => {
    deleteUserStrokes(userId);
    emitDeleteUserStrokes(userId);
    activeDrawersRef.current.delete(userId);
    setActiveDrawers(new Set(activeDrawersRef.current));
  }, [deleteUserStrokes, emitDeleteUserStrokes, userId]);

  const handleExport = useCallback(() => {
    canvasRef.current?.exportAsImage();
    toast.success("¡Dibujo exportado!");
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = getRoomUrl(roomId);
    const success = await copyToClipboard(url);
    if (success) {
      toast.success("¡Link copiado al portapapeles!");
    } else {
      toast.error("Error al copiar el link. Por favor, cópialo manualmente.");
    }
  }, [roomId]);

  const handleNicknameConfirm = useCallback((nickname: string) => {
    const trimmedNickname = nickname.trim();
    if (trimmedNickname) {
      localStorage.setItem(NICKNAME_STORAGE_KEY, trimmedNickname);
      setDisplayName(trimmedNickname);
      setShowNicknameModal(false);
    }
  }, []);

  if (!isClient) {
    return null;
  }

  if (showNicknameModal || !displayName) {
    return (
      <NicknameModal
        initialNickname={displayName || ""}
        onConfirm={handleNicknameConfirm}
        roomId={roomId}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white/80 backdrop-blur-sm border-b-2 border-purple-200/50 shadow-md">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => router.push("/")}
            className="px-3 sm:px-4 py-2 text-purple-700 hover:bg-purple-100 rounded-xl transition-all font-medium text-sm sm:text-base hover:scale-105 active:scale-95 whitespace-nowrap"
            aria-label="Volver a la página principal"
          >
            ← <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-bold text-base sm:text-lg" aria-hidden="true">
                🎨
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-gray-800 truncate">Sala: {roomId}</h1>
              <p className="text-xs text-gray-500">
                {isConnected ? (
                  <span className="text-green-600">● Conectado</span>
                ) : (
                  <span className="text-gray-400">● Conectando...</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="hidden sm:block">
            <UsersList users={users} currentUserId={userId} activeDrawers={activeDrawers} />
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 sm:px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm sm:text-base hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
            aria-label="Copiar link de la sala"
          >
            <span className="hidden sm:inline">📋 Copiar link</span>
            <span className="sm:hidden">📋</span>
          </button>
        </div>
      </header>

       <Toolbar
         currentColor={currentColor}
         currentThickness={currentThickness}
         drawingMode={drawingMode}
         shapeType={shapeType}
         onColorChange={setCurrentColor}
         onThicknessChange={setCurrentThickness}
         onDrawingModeChange={setDrawingMode}
         onShapeTypeChange={setShapeType}
         onClear={handleClear}
         onDeleteMyStrokes={handleDeleteMyStrokes}
         onExport={handleExport}
       />

      <div className="flex-1 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.1) 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
            aria-hidden="true"
          />
        </div>
        <div className="relative z-10 w-full h-full">
          <Canvas
            ref={canvasRef}
            strokes={strokes}
            currentColor={currentColor}
            currentThickness={currentThickness}
            drawingMode={drawingMode}
            shapeType={shapeType}
            onStrokeStart={handleStrokeStart}
            onStrokeMove={(point) => {
              if (drawingMode === "freehand") {
                // Update local state immediately for instant feedback
                updateStroke(point);
                
                if (currentStrokeId) {
                  throttledCursorMove(point, currentColor);
                  
                  sendBatchedPoints(currentStrokeId, point);
                }
              } else {
                throttledCursorMove(point, currentColor);
              }
            }}
            onStrokeEnd={(shapeData) => {
              if (drawingMode === "freehand") {
                if (currentStrokeId) {
                  flushPendingPoints(currentStrokeId);
                  
                  emitStrokeEnd({
                    strokeId: currentStrokeId,
                  });
                }
                
                endStroke();
                
                activeDrawersRef.current.delete(userId);
                setActiveDrawers(new Set(activeDrawersRef.current));
                
                setCursors((prev) => {
                  const next = new Map(prev);
                  next.delete(userId);
                  return next;
                });
              } else if (shapeData) {
                const shapePoints = shapeToPoints(
                  shapeData.startPoint,
                  shapeData.endPoint,
                  shapeData.type
                );

                if (shapePoints.length > 0) {
                  const strokeId = startStroke(shapePoints[0], currentColor, currentThickness);
                  
                  const remainingPoints = shapePoints.slice(1);
                  for (let i = 0; i < remainingPoints.length; i++) {
                    updateStroke(remainingPoints[i], strokeId);
                  }

                  emitStrokeStart({
                    strokeId,
                    userId,
                    color: currentColor,
                    thickness: currentThickness,
                    startPoint: shapePoints[0],
                  });

                  if (remainingPoints.length > 0) {
                    emitStrokeUpdate({
                      strokeId,
                      points: remainingPoints,
                    });
                  }

                  endStroke();
                  emitStrokeEnd({
                    strokeId,
                  });
                }
                
                activeDrawersRef.current.delete(userId);
                setActiveDrawers(new Set(activeDrawersRef.current));
                
                setCursors((prev) => {
                  const next = new Map(prev);
                  next.delete(userId);
                  return next;
                });
              }
            }}
          />
          {Array.from(cursors.entries()).map(([cursorUserId, cursorData]) => {
            const user = users.find((u) => u.userId === cursorUserId);
            return (
              <CursorIndicator
                key={cursorUserId}
                userId={cursorUserId}
                displayName={user?.displayName || cursorData.displayName}
                position={cursorData.position}
                color={cursorData.color}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
