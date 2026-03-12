export interface TextUpdateEvent {
  documentId: string;
  content: string;
  cursorPosition?: number;
  userId: string;
}

export interface TitleUpdateEvent {
  documentId: string;
  title: string;
  userId: string;
}

export interface CursorMoveEvent {
  documentId: string;
  userId: string;
  username: string;
  color: string;
  position: number;
  lineNumber?: number;
}

export interface UserTypingEvent {
  documentId: string;
  userId: string;
  username: string;
  color: string;
  isTyping: boolean;
}

export interface UserJoinedEvent {
  userId: string;
  username: string;
  color: string;
  documentId: string;
}

export interface UserLeftEvent {
  userId: string;
  documentId: string;
}

export interface JoinDocumentEvent {
  documentId: string;
  userId: string;
  username: string;
  color: string;
}

export interface ServerToClientEvents {
  "text-update": (event: TextUpdateEvent) => void;
  "title-update": (event: TitleUpdateEvent) => void;
  "user-joined": (event: UserJoinedEvent) => void;
  "user-left": (event: UserLeftEvent) => void;
  "document-users": (users: ActiveUser[]) => void;
  "cursor-move": (event: CursorMoveEvent) => void;
  "user-typing": (event: UserTypingEvent) => void;
}

export interface ClientToServerEvents {
  "text-update": (event: TextUpdateEvent) => void;
  "title-update": (event: TitleUpdateEvent) => void;
  "join-document": (event: JoinDocumentEvent) => void;
  "leave-document": (event: { documentId: string; userId: string }) => void;
  "cursor-move": (event: CursorMoveEvent) => void;
  "user-typing": (event: UserTypingEvent) => void;
}

export interface ActiveUser {
  userId: string;
  username: string;
  color: string;
}
