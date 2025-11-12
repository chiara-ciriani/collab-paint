"use client";

import { getUserColor, getDisplayName } from "@/lib/utils";

interface User {
  userId: string;
  displayName?: string;
}

interface UsersListProps {
  users: User[];
  currentUserId: string;
  activeDrawers?: Set<string>; // userIds that are currently drawing
}

export default function UsersList({ users, currentUserId, activeDrawers = new Set() }: UsersListProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-purple-200/50">
      <span className="text-xs font-medium text-gray-600">
        {users.length} {users.length === 1 ? "usuario" : "usuarios"}
      </span>
      <div className="flex items-center gap-1.5">
        {users.map((user) => {
          const isCurrentUser = user.userId === currentUserId;
          const isDrawing = activeDrawers.has(user.userId);
          const color = getUserColor(user.userId);
          const name = getDisplayName(user.userId, user.displayName);

          return (
            <div
              key={user.userId}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/80 border border-purple-200/50 shadow-sm"
              title={isCurrentUser ? `${name} (Tú)` : name}
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{
                  backgroundColor: color,
                  animation: isDrawing ? "pulse 1.5s ease-in-out infinite" : undefined,
                }}
              />
              <span className="text-xs font-medium text-gray-700">
                {isCurrentUser ? "Tú" : name}
              </span>
              {isDrawing && (
                <span className="text-xs text-gray-500 animate-pulse">✏️</span>
              )}
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
