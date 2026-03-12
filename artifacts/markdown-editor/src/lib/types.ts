// Shared Types for Socket.IO Events
export interface TextUpdateEvent {
  documentId: string;
  content: string;
  cursorPosition?: number;
}

export interface UserJoinedEvent {
  userId: string;
  username: string;
  color: string;
}

export interface UserLeftEvent {
  userId: string;
}

export interface JoinDocumentEvent {
  documentId: string;
  username: string;
}
