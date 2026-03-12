import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type {
  TextUpdateEvent,
  UserJoinedEvent,
  UserLeftEvent,
  CursorMoveEvent,
  UserTypingEvent,
  ActiveUser,
} from "@/lib/types";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: ActiveUser[];
  remoteCursors: Record<string, CursorMoveEvent>;
  emitTextUpdate: (event: TextUpdateEvent) => void;
  emitTitleUpdate: (documentId: string, title: string, userId: string) => void;
  emitCursorMove: (documentId: string, userId: string, username: string, color: string, position: number) => void;
  emitTyping: (documentId: string, userId: string, username: string, color: string, isTyping: boolean) => void;
}

export function useSocket(
  documentId: string | undefined,
  userId: string,
  username: string,
  color: string,
  onTextUpdate?: (event: TextUpdateEvent) => void,
  onTitleUpdate?: (title: string) => void
): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorMoveEvent>>({});
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", () => setIsConnected(false));

    socket.on("document-users", (users: ActiveUser[]) => {
      setActiveUsers(users.filter((u) => u.userId !== userId));
    });

    socket.on("user-joined", (user: UserJoinedEvent) => {
      setActiveUsers((prev) => {
        if (prev.find((u) => u.userId === user.userId)) return prev;
        return [...prev, { userId: user.userId, username: user.username, color: user.color }];
      });
    });

    socket.on("user-left", ({ userId: leftId }: UserLeftEvent) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== leftId));
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[leftId];
        return next;
      });
    });

    socket.on("text-update", (event: TextUpdateEvent) => {
      if (event.userId !== userId && onTextUpdate) {
        onTextUpdate(event);
      }
    });

    socket.on("title-update", (event: { documentId: string; title: string; userId: string }) => {
      if (event.userId !== userId && onTitleUpdate) {
        onTitleUpdate(event.title);
      }
    });

    socket.on("cursor-move", (event: CursorMoveEvent) => {
      if (event.userId !== userId) {
        setRemoteCursors((prev) => ({ ...prev, [event.userId]: event }));
      }
    });

    socket.on("user-typing", (event: UserTypingEvent) => {
      if (event.userId === userId) return;
      setActiveUsers((prev) =>
        prev.map((u) =>
          u.userId === event.userId ? { ...u, isTyping: event.isTyping } : u
        )
      );
      // Auto-clear typing indicator after 2.5s
      if (event.isTyping) {
        if (typingTimeouts.current[event.userId]) {
          clearTimeout(typingTimeouts.current[event.userId]);
        }
        typingTimeouts.current[event.userId] = setTimeout(() => {
          setActiveUsers((prev) =>
            prev.map((u) =>
              u.userId === event.userId ? { ...u, isTyping: false } : u
            )
          );
        }, 2500);
      }
    });

    return () => {
      if (documentId) {
        socket.emit("leave-document", { documentId, userId });
      }
      socket.disconnect();
      Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Join document room when documentId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !documentId) return;
    socket.emit("join-document", { documentId, userId, username, color });
    return () => {
      socket.emit("leave-document", { documentId, userId });
    };
  }, [documentId, userId]);

  const emitTextUpdate = useCallback((event: TextUpdateEvent) => {
    socketRef.current?.emit("text-update", event);
  }, []);

  const emitTitleUpdate = useCallback((docId: string, title: string, uid: string) => {
    socketRef.current?.emit("title-update", { documentId: docId, title, userId: uid });
  }, []);

  const emitCursorMove = useCallback((docId: string, uid: string, uname: string, ucolor: string, position: number) => {
    socketRef.current?.emit("cursor-move", { documentId: docId, userId: uid, username: uname, color: ucolor, position });
  }, []);

  const emitTyping = useCallback((docId: string, uid: string, uname: string, ucolor: string, isTyping: boolean) => {
    socketRef.current?.emit("user-typing", { documentId: docId, userId: uid, username: uname, color: ucolor, isTyping });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
    remoteCursors,
    emitTextUpdate,
    emitTitleUpdate,
    emitCursorMove,
    emitTyping,
  };
}
