"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Room page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 items-center justify-center p-8">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-white/50 max-w-md text-center space-y-6">
        <div className="text-6xl">😕</div>
        <h2 className="text-2xl font-bold text-gray-800">
          Algo salió mal
        </h2>
        <p className="text-gray-600">
          No pudimos cargar la sala. Por favor, intenta nuevamente.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
