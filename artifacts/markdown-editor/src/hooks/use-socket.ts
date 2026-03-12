import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { TextUpdateEvent, UserJoinedEvent, UserLeftEvent, JoinDocumentEvent } from '@/lib/types';

export function useSocket(documentId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserJoinedEvent[]>([]);

  useEffect(() => {
    // Connect to the same origin using the /api/socket.io path
    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));

    socket.on('user-joined', (user: UserJoinedEvent) => {
      setActiveUsers((prev) => {
        if (prev.find((u) => u.userId === user.userId)) return prev;
        return [...prev, user];
      });
    });

    socket.on('user-left', ({ userId }: UserLeftEvent) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // If we have a documentId, automatically join its room
    if (documentId) {
      socket.emit('join-document', {
        documentId,
        username: `User-${Math.floor(Math.random() * 1000)}`
      } as JoinDocumentEvent);
    }

    return () => {
      socket.disconnect();
    };
  }, [documentId]);

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
  };
}
