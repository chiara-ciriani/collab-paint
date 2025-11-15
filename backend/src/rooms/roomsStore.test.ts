import { describe, it, expect, beforeEach } from "vitest";
import { RoomsStore } from "./roomsStore";
import type { Stroke, UserInRoom, Point } from "./types";

// Create a new instance for each test to avoid state pollution
function createStore(): RoomsStore {
  return new RoomsStore();
}

describe("RoomsStore", () => {
  let store: RoomsStore;

  beforeEach(() => {
    store = createStore();
  });

  describe("getOrCreateRoom", () => {
    it("should create a new room if it doesn't exist", () => {
      const room = store.getOrCreateRoom("room1");

      expect(room).toBeDefined();
      expect(room.id).toBe("room1");
      expect(room.strokes).toEqual([]);
      expect(room.users).toEqual([]);
      expect(room.createdAt).toBeGreaterThan(0);
      expect(room.lastActivityAt).toBeGreaterThan(0);
    });

    it("should return existing room if it already exists", () => {
      const room1 = store.getOrCreateRoom("room1");
      const room2 = store.getOrCreateRoom("room1");

      expect(room1).toBe(room2);
      expect(room1.id).toBe("room1");
    });
  });

  describe("getRoom", () => {
    it("should return null for non-existent room", () => {
      const room = store.getRoom("nonexistent");
      expect(room).toBeNull();
    });

    it("should return existing room", () => {
      store.getOrCreateRoom("room1");
      const room = store.getRoom("room1");

      expect(room).toBeDefined();
      expect(room?.id).toBe("room1");
    });
  });

  describe("addUser", () => {
    it("should add a user to a room", () => {
      const user: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        displayName: "Test User",
        joinedAt: Date.now(),
      };

      store.addUser("room1", user);
      const room = store.getRoom("room1");

      expect(room?.users).toHaveLength(1);
      expect(room?.users[0]).toEqual(user);
    });

    it("should create room if it doesn't exist", () => {
      const user: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        joinedAt: Date.now(),
      };

      store.addUser("room1", user);
      const room = store.getRoom("room1");

      expect(room).toBeDefined();
      expect(room?.users).toHaveLength(1);
    });

    it("should replace user if same socketId already exists", () => {
      const user1: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        displayName: "User 1",
        joinedAt: Date.now(),
      };

      const user2: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        displayName: "User 1 Updated",
        joinedAt: Date.now() + 1000,
      };

      store.addUser("room1", user1);
      store.addUser("room1", user2);

      const room = store.getRoom("room1");
      expect(room?.users).toHaveLength(1);
      expect(room?.users[0].displayName).toBe("User 1 Updated");
    });

    it("should allow multiple users in the same room", () => {
      const user1: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        joinedAt: Date.now(),
      };

      const user2: UserInRoom = {
        socketId: "socket2",
        userId: "user2",
        joinedAt: Date.now(),
      };

      store.addUser("room1", user1);
      store.addUser("room1", user2);

      const room = store.getRoom("room1");
      expect(room?.users).toHaveLength(2);
    });
  });

  describe("removeUser", () => {
    it("should remove a user from a room", () => {
      const user: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        joinedAt: Date.now(),
      };

      store.addUser("room1", user);
      store.removeUser("room1", "socket1");

      const room = store.getRoom("room1");
      expect(room?.users).toHaveLength(0);
    });

    it("should not throw if room doesn't exist", () => {
      expect(() => {
        store.removeUser("nonexistent", "socket1");
      }).not.toThrow();
    });

    it("should not remove other users", () => {
      const user1: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        joinedAt: Date.now(),
      };

      const user2: UserInRoom = {
        socketId: "socket2",
        userId: "user2",
        joinedAt: Date.now(),
      };

      store.addUser("room1", user1);
      store.addUser("room1", user2);
      store.removeUser("room1", "socket1");

      const room = store.getRoom("room1");
      expect(room?.users).toHaveLength(1);
      expect(room?.users[0].socketId).toBe("socket2");
    });
  });

  describe("addStroke", () => {
    it("should add a stroke to a room", () => {
      const stroke: Stroke = {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      };

      store.addStroke("room1", stroke);
      const room = store.getRoom("room1");

      expect(room?.strokes).toHaveLength(1);
      expect(room?.strokes[0]).toEqual(stroke);
    });

    it("should create room if it doesn't exist", () => {
      const stroke: Stroke = {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      };

      store.addStroke("room1", stroke);
      const room = store.getRoom("room1");

      expect(room).toBeDefined();
      expect(room?.strokes).toHaveLength(1);
    });
  });

  describe("updateStroke", () => {
    it("should append points to an existing stroke", () => {
      const stroke: Stroke = {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      };

      store.addStroke("room1", stroke);

      const newPoints: Point[] = [
        { x: 0.6, y: 0.6 },
        { x: 0.7, y: 0.7 },
      ];

      store.updateStroke("room1", "stroke1", newPoints);
      const room = store.getRoom("room1");

      expect(room?.strokes[0].points).toHaveLength(3);
      expect(room?.strokes[0].points[1]).toEqual(newPoints[0]);
      expect(room?.strokes[0].points[2]).toEqual(newPoints[1]);
    });

    it("should not update if room doesn't exist", () => {
      const newPoints: Point[] = [{ x: 0.5, y: 0.5 }];
      store.updateStroke("nonexistent", "stroke1", newPoints);

      const room = store.getRoom("nonexistent");
      expect(room).toBeNull();
    });

    it("should not update if stroke doesn't exist", () => {
      store.getOrCreateRoom("room1");
      const newPoints: Point[] = [{ x: 0.5, y: 0.5 }];
      store.updateStroke("room1", "nonexistent", newPoints);

      const room = store.getRoom("room1");
      expect(room?.strokes).toHaveLength(0);
    });
  });

  describe("clearRoom", () => {
    it("should clear all strokes from a room", () => {
      const stroke1: Stroke = {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      };

      const stroke2: Stroke = {
        id: "stroke2",
        userId: "user2",
        color: "#FF0000",
        thickness: 3,
        points: [{ x: 0.6, y: 0.6 }],
        createdAt: Date.now(),
      };

      store.addStroke("room1", stroke1);
      store.addStroke("room1", stroke2);
      store.clearRoom("room1");

      const room = store.getRoom("room1");
      expect(room?.strokes).toHaveLength(0);
    });

    it("should not clear users", () => {
      const user: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        joinedAt: Date.now(),
      };

      store.addUser("room1", user);
      store.addStroke("room1", {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      });

      store.clearRoom("room1");

      const room = store.getRoom("room1");
      expect(room?.strokes).toHaveLength(0);
      expect(room?.users).toHaveLength(1);
    });

    it("should not throw if room doesn't exist", () => {
      expect(() => {
        store.clearRoom("nonexistent");
      }).not.toThrow();
    });
  });

  describe("deleteUserStrokes", () => {
    it("should delete all strokes from a specific user", () => {
      const stroke1: Stroke = {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      };

      const stroke2: Stroke = {
        id: "stroke2",
        userId: "user2",
        color: "#FF0000",
        thickness: 3,
        points: [{ x: 0.6, y: 0.6 }],
        createdAt: Date.now(),
      };

      const stroke3: Stroke = {
        id: "stroke3",
        userId: "user1",
        color: "#00FF00",
        thickness: 2,
        points: [{ x: 0.7, y: 0.7 }],
        createdAt: Date.now(),
      };

      store.addStroke("room1", stroke1);
      store.addStroke("room1", stroke2);
      store.addStroke("room1", stroke3);

      store.deleteUserStrokes("room1", "user1");

      const room = store.getRoom("room1");
      expect(room?.strokes).toHaveLength(1);
      expect(room?.strokes[0].userId).toBe("user2");
    });

    it("should not throw if room doesn't exist", () => {
      expect(() => {
        store.deleteUserStrokes("nonexistent", "user1");
      }).not.toThrow();
    });

    it("should not delete strokes from other users", () => {
      const stroke1: Stroke = {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      };

      const stroke2: Stroke = {
        id: "stroke2",
        userId: "user2",
        color: "#FF0000",
        thickness: 3,
        points: [{ x: 0.6, y: 0.6 }],
        createdAt: Date.now(),
      };

      store.addStroke("room1", stroke1);
      store.addStroke("room1", stroke2);

      store.deleteUserStrokes("room1", "user1");

      const room = store.getRoom("room1");
      expect(room?.strokes).toHaveLength(1);
      expect(room?.strokes[0].userId).toBe("user2");
    });
  });

  describe("getUsersInRoom", () => {
    it("should return empty array for non-existent room", () => {
      const users = store.getUsersInRoom("nonexistent");
      expect(users).toEqual([]);
    });

    it("should return all users in a room", () => {
      const user1: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        joinedAt: Date.now(),
      };

      const user2: UserInRoom = {
        socketId: "socket2",
        userId: "user2",
        joinedAt: Date.now(),
      };

      store.addUser("room1", user1);
      store.addUser("room1", user2);

      const users = store.getUsersInRoom("room1");
      expect(users).toHaveLength(2);
    });
  });

  describe("deleteRoom", () => {
    it("should delete a room", () => {
      store.getOrCreateRoom("room1");
      const deleted = store.deleteRoom("room1");

      expect(deleted).toBe(true);
      expect(store.getRoom("room1")).toBeNull();
    });

    it("should return false if room doesn't exist", () => {
      const deleted = store.deleteRoom("nonexistent");
      expect(deleted).toBe(false);
    });
  });

  describe("lastActivityAt", () => {
    it("should update lastActivityAt when adding a user", () => {
      const user: UserInRoom = {
        socketId: "socket1",
        userId: "user1",
        joinedAt: Date.now(),
      };

      const room1 = store.getOrCreateRoom("room1");
      const initialTime = room1.lastActivityAt;

      // Wait a bit to ensure time difference
      setTimeout(() => {
        store.addUser("room1", user);
        const room2 = store.getRoom("room1");
        expect(room2?.lastActivityAt).toBeGreaterThan(initialTime);
      }, 10);
    });

    it("should update lastActivityAt when adding a stroke", () => {
      const stroke: Stroke = {
        id: "stroke1",
        userId: "user1",
        color: "#000000",
        thickness: 5,
        points: [{ x: 0.5, y: 0.5 }],
        createdAt: Date.now(),
      };

      const room1 = store.getOrCreateRoom("room1");
      const initialTime = room1.lastActivityAt;

      setTimeout(() => {
        store.addStroke("room1", stroke);
        const room2 = store.getRoom("room1");
        expect(room2?.lastActivityAt).toBeGreaterThan(initialTime);
      }, 10);
    });
  });
});

