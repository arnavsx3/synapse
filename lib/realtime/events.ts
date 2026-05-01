export const REALTIME_EVENTS = {
  PROJECT_CHANGED: "project:changed",
  NOTE_CHANGED: "note:changed",
  CHAT_CHANGED: "chat:changed",
  CHAT_MESSAGE_CREATED: "chat:message:created",
} as const;

export type ChangeAction = "created" | "updated" | "deleted";

export type ProjectChangedPayload = {
  action: ChangeAction;
  projectId: string;
  occurredAt: string;
};

export type NoteChangedPayload = {
  action: ChangeAction;
  noteId: string;
  projectId: string | null;
  occurredAt: string;
};

export type ChatChangedPayload = {
  action: ChangeAction;
  chatId: string;
  occurredAt: string;
};

export type ChatMessageCreatedPayload = {
  chatId: string;
  messageId: string;
  role: "user" | "assistant";
  occurredAt: string;
};

export interface ServerToClientEvents {
  [REALTIME_EVENTS.PROJECT_CHANGED]: (payload: ProjectChangedPayload) => void;
  [REALTIME_EVENTS.NOTE_CHANGED]: (payload: NoteChangedPayload) => void;
  [REALTIME_EVENTS.CHAT_CHANGED]: (payload: ChatChangedPayload) => void;
  [REALTIME_EVENTS.CHAT_MESSAGE_CREATED]: (
    payload: ChatMessageCreatedPayload,
  ) => void;
}

export interface ClientToServerEvents {}

export function getUserRoom(userId: string) {
  return `user:${userId}`;
}