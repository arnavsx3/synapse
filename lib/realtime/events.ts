export const REALTIME_EVENTS = {
  WORKSPACE_CHANGED: "workspace:changed",
  PROJECT_CHANGED: "project:changed",
  NOTE_CHANGED: "note:changed",
  CHAT_CHANGED: "chat:changed",
  CHAT_MESSAGE_CREATED: "chat:message:created",
} as const;

export type ChangeAction = "created" | "updated" | "deleted";

export type WorkspaceChangedPayload = {
  action: ChangeAction;
  workspaceId: string;
  occurredAt: string;
};

export type ProjectChangedPayload = {
  action: ChangeAction;
  workspaceId: string;
  projectId: string;
  occurredAt: string;
};

export type NoteChangedPayload = {
  action: ChangeAction;
  workspaceId: string;
  noteId: string;
  projectId: string | null;
  occurredAt: string;
};

export type ChatChangedPayload = {
  action: ChangeAction;
  workspaceId: string;
  chatId: string;
  occurredAt: string;
};

export type ChatMessageCreatedPayload = {
  workspaceId: string;
  chatId: string;
  messageId: string;
  role: "user" | "assistant";
  occurredAt: string;
};

export interface ServerToClientEvents {
  [REALTIME_EVENTS.WORKSPACE_CHANGED]: (
    payload: WorkspaceChangedPayload,
  ) => void;
  [REALTIME_EVENTS.PROJECT_CHANGED]: (payload: ProjectChangedPayload) => void;
  [REALTIME_EVENTS.NOTE_CHANGED]: (payload: NoteChangedPayload) => void;
  [REALTIME_EVENTS.CHAT_CHANGED]: (payload: ChatChangedPayload) => void;
  [REALTIME_EVENTS.CHAT_MESSAGE_CREATED]: (
    payload: ChatMessageCreatedPayload,
  ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientToServerEvents {}

export function getUserRoom(userId: string) {
  return `user:${userId}`;
}
