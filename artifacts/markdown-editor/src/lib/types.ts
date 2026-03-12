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

export interface UserJoinedEvent {
  userId: string;
  username: string;
  color: string;
  documentId?: string;
}

export interface UserLeftEvent {
  userId: string;
  documentId?: string;
}

export interface JoinDocumentEvent {
  documentId: string;
  userId: string;
  username: string;
  color: string;
}

export interface CursorMoveEvent {
  documentId: string;
  userId: string;
  username: string;
  color: string;
  position: number;
}

export interface UserTypingEvent {
  documentId: string;
  userId: string;
  username: string;
  color: string;
  isTyping: boolean;
}

export interface ActiveUser {
  userId: string;
  username: string;
  color: string;
  isTyping?: boolean;
}

export type EditorTheme = "default-dark" | "dracula" | "solarized" | "high-contrast";

export const EDITOR_THEMES: Record<EditorTheme, { label: string; bg: string; text: string; caret: string; selection: string }> = {
  "default-dark": {
    label: "Default Dark",
    bg: "#1e1e2e",
    text: "#cdd6f4",
    caret: "#89b4fa",
    selection: "rgba(137,180,250,0.2)",
  },
  dracula: {
    label: "Dracula",
    bg: "#282a36",
    text: "#f8f8f2",
    caret: "#ff79c6",
    selection: "rgba(255,121,198,0.2)",
  },
  solarized: {
    label: "Solarized",
    bg: "#002b36",
    text: "#839496",
    caret: "#268bd2",
    selection: "rgba(38,139,210,0.2)",
  },
  "high-contrast": {
    label: "High Contrast",
    bg: "#000000",
    text: "#ffffff",
    caret: "#ffff00",
    selection: "rgba(255,255,0,0.3)",
  },
};

export const USER_COLORS = [
  "#f38ba8", "#a6e3a1", "#89b4fa", "#fab387",
  "#cba6f7", "#94e2d5", "#f9e2af", "#89dceb",
];

export function generateUserId(): string {
  return `user-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateUsername(): string {
  const adjectives = ["swift", "bold", "calm", "bright", "clever", "eager"];
  const nouns = ["fox", "hawk", "wolf", "bear", "lynx", "deer"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}`;
}

export function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}
