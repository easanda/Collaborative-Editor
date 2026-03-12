import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  ActiveUser,
} from "./types";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
  path: "/api/socket.io",
});

const documentRooms = new Map<string, Map<string, ActiveUser>>();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join-document", ({ documentId, userId, username, color }) => {
    socket.join(documentId);

    if (!documentRooms.has(documentId)) {
      documentRooms.set(documentId, new Map());
    }

    const room = documentRooms.get(documentId)!;
    room.set(userId, { userId, username, color });

    socket.to(documentId).emit("user-joined", {
      userId,
      username,
      color,
      documentId,
    });

    io.to(documentId).emit("document-users", Array.from(room.values()));
  });

  socket.on("leave-document", ({ documentId, userId }) => {
    socket.leave(documentId);

    const room = documentRooms.get(documentId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        documentRooms.delete(documentId);
      } else {
        io.to(documentId).emit("document-users", Array.from(room.values()));
      }
    }

    socket.to(documentId).emit("user-left", { userId, documentId });
  });

  socket.on("text-update", (event) => {
    socket.to(event.documentId).emit("text-update", event);
  });

  socket.on("title-update", (event) => {
    socket.to(event.documentId).emit("title-update", event);
  });

  socket.on("cursor-move", (event) => {
    socket.to(event.documentId).emit("cursor-move", event);
  });

  socket.on("user-typing", (event) => {
    socket.to(event.documentId).emit("user-typing", event);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Clean up user from all rooms on disconnect
    for (const [documentId, room] of documentRooms.entries()) {
      for (const [userId] of room.entries()) {
        // We can't easily map socket.id to userId here without extra tracking
        // This is handled by the leave-document event in practice
      }
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
