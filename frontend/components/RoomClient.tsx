"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import { useStrokesState } from "@/hooks/useStrokesState";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { DEFAULT_COLOR, DEFAULT_THICKNESS, generateUserId } from "@/lib/constants";
import { copyToClipboard, getRoomUrl } from "@/lib/utils";
import type { Stroke } from "@/types";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const router = useRouter();
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [currentThickness, setCurrentThickness] = useState(DEFAULT_THICKNESS);
  const [userId] = useState(() => generateUserId());

  const {
    strokes,
    currentStrokeId,
    startStroke,
    updateStroke,
    endStroke,
    clearStrokes,
    applyRoomState,
    applyStrokeStarted,
    applyStrokeUpdated,
    applyStrokeEnded,
    applyCanvasCleared,
  } = useStrokesState({
    userId,
  });

  // Handle room state from server - initialize strokes
  const handleRoomState = useCallback(
    (state: { roomId: string; strokes: Stroke[]; users: Array<{ userId: string; displayName?: string }> }) => {
      applyRoomState(state.strokes);
    },
    [applyRoomState]
  );

  // Handle stroke events from server
  const handleStrokeStarted = useCallback(
    (payload: { strokeId: string; userId: string; color: string; thickness: number; startPoint: { x: number; y: number } }) => {
      // Only apply if it's from another user
      if (payload.userId !== userId) {
        applyStrokeStarted(payload);
      }
    },
    [userId, applyStrokeStarted]
  );

  const handleStrokeUpdated = useCallback(
    (payload: { strokeId: string; points: { x: number; y: number }[] }) => {
      applyStrokeUpdated(payload);
    },
    [applyStrokeUpdated]
  );

  const handleStrokeEnded = useCallback(
    (payload: { strokeId: string }) => {
      applyStrokeEnded(payload);
    },
    [applyStrokeEnded]
  );

  const handleCanvasCleared = useCallback(() => {
    applyCanvasCleared();
  }, [applyCanvasCleared]);

  const handleSocketError = useCallback((error: { message: string; code?: string }) => {
    toast.error(`Error de conexión: ${error.message}`);
  }, []);

  // Socket connection
  const { isConnected, emitStrokeStart, emitStrokeUpdate, emitStrokeEnd, emitClearCanvas } = useRoomSocket({
    roomId,
    onRoomState: handleRoomState,
    onStrokeStarted: handleStrokeStarted,
    onStrokeUpdated: handleStrokeUpdated,
    onStrokeEnded: handleStrokeEnded,
    onCanvasCleared: handleCanvasCleared,
    onError: handleSocketError,
  });

  const handleStrokeStart = useCallback(
    (point: { x: number; y: number }) => {
      const strokeId = startStroke(point, currentColor, currentThickness);
      
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

  const handleCopyLink = useCallback(async () => {
    const url = getRoomUrl(roomId);
    const success = await copyToClipboard(url);
    if (success) {
      toast.success("¡Link copiado al portapapeles!");
    } else {
      toast.error("Error al copiar el link. Por favor, cópialo manualmente.");
    }
  }, [roomId]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b-2 border-purple-200/50 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-purple-700 hover:bg-purple-100 rounded-xl transition-all font-medium hover:scale-105 active:scale-95"
            aria-label="Volver a la página principal"
          >
            ← Volver
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg" aria-hidden="true">
                🎨
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Sala: {roomId}</h1>
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
        <button
          onClick={handleCopyLink}
          className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          aria-label="Copiar link de la sala"
        >
          📋 Copiar link
        </button>
      </header>

      <Toolbar
        currentColor={currentColor}
        currentThickness={currentThickness}
        onColorChange={setCurrentColor}
        onThicknessChange={setCurrentThickness}
        onClear={handleClear}
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
            strokes={strokes}
            currentColor={currentColor}
            currentThickness={currentThickness}
            onStrokeStart={handleStrokeStart}
            onStrokeMove={(point) => {
              updateStroke(point);
              
              // Emit to server if we have an active stroke
              if (currentStrokeId) {
                emitStrokeUpdate({
                  strokeId: currentStrokeId,
                  points: [point],
                });
              }
            }}
            onStrokeEnd={() => {
              // Update local state
              endStroke();
              
              // Emit to server if we have an active stroke
              if (currentStrokeId) {
                emitStrokeEnd({
                  strokeId: currentStrokeId,
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
