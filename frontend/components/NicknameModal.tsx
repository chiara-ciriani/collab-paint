"use client";

import { useState, useEffect, useRef } from "react";

interface NicknameModalProps {
  initialNickname?: string;
  onConfirm: (nickname: string) => void;
  roomId: string;
}

export default function NicknameModal({ initialNickname = "", onConfirm, roomId }: NicknameModalProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNickname = nickname.trim();
    if (trimmedNickname) {
      onConfirm(trimmedNickname);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && nickname.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl" aria-hidden="true">
              🎨
            </span>
          </div>
          <h2 id="nickname-modal-title" className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            ¡Bienvenido a la sala!
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Sala: <span className="font-mono font-semibold text-purple-600">{roomId}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname-input" className="block text-sm font-semibold text-gray-700 mb-2">
              Elige tu nickname:
            </label>
            <input
              id="nickname-input"
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Artista123"
              maxLength={20}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg sm:text-xl font-semibold text-gray-900 placeholder-gray-400"
              aria-required="true"
              aria-describedby="nickname-hint"
            />
            <p id="nickname-hint" className="mt-1 text-xs text-gray-500">
              Máximo 20 caracteres
            </p>
          </div>

          <button
            type="submit"
            disabled={!nickname.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-base sm:text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            aria-label="Entrar a la sala"
          >
            Entrar a la sala
          </button>
        </form>
      </div>
    </div>
  );
}

