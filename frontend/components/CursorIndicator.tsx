"use client";

import { getDisplayName } from "@/lib/utils";

interface CursorIndicatorProps {
  userId: string;
  displayName?: string;
  position: { x: number; y: number };
  color: string;
}

export default function CursorIndicator({
  userId,
  displayName,
  position,
  color,
}: CursorIndicatorProps) {
  const name = getDisplayName(userId, displayName);

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg"
        style={{
          backgroundColor: color,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute mt-2 px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg whitespace-nowrap"
        style={{
          backgroundColor: color,
          transform: "translateX(-50%)",
        }}
      >
        {name}
      </div>
    </div>
  );
}
