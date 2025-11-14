"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRoomId } from "@/lib/constants";

export default function HomeClient() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <main className="relative z-10 flex flex-col items-center gap-6 sm:gap-10 p-4 sm:p-6 md:p-10 w-full max-w-lg">
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="inline-block">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-2 drop-shadow-lg">
              Collaborative Paint
            </h1>
            <div className="h-1 bg-white/30 rounded-full" />
          </div>
          <p className="text-base sm:text-lg md:text-xl text-white/90 font-medium drop-shadow-md px-4">
            Dibuja en tiempo real con otros usuarios
          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-white/50">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-3 sm:mb-4 shadow-lg">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Crear nueva sala
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Inicia una sesión de dibujo colaborativo
              </p>
            </div>
            <button
              onClick={handleCreateRoom}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-base sm:text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Crear una nueva sala de dibujo"
            >
              ✨ Crear sala
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-white/50">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-3 sm:mb-4 shadow-lg">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Unirse a una sala
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Ingresa el ID de la sala para unirte
              </p>
            </div>
            <div className="space-y-3">
              <label htmlFor="room-id-input" className="sr-only">
                ID de la sala
              </label>
              <input
                id="room-id-input"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                placeholder="Pega el ID de la sala aquí..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-800 placeholder-gray-400 font-medium"
                aria-label="ID de la sala a la que deseas unirte"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Unirse a la sala"
                aria-disabled={!roomId.trim()}
              >
                🎨 Unirse a la sala
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
