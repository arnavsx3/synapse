import Redis from "ioredis";
import { Emitter } from "@socket.io/redis-emitter";
import {
  REALTIME_EVENTS,
  getUserRoom,
  type WorkspaceChangedPayload,
  type ChatChangedPayload,
  type ChatMessageCreatedPayload,
  type NoteChangedPayload,
  type ProjectChangedPayload,
} from "./events";

let redis: Redis | null = null;
let emitter: Emitter | null = null;

function getRedisUrl() {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("Missing REDIS_URL");
  }

  return url;
}

function getRedisClient() {
  if (!redis) {
    redis = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 1,
    });
  }

  return redis;
}

function getEmitter() {
  if (!emitter) {
    emitter = new Emitter(getRedisClient());
  }

  return emitter;
}

function emitToUser<EventPayload>(
  userId: string,
  eventName: string,
  payload: EventPayload,
) {
  try {
    getEmitter().to(getUserRoom(userId)).emit(eventName, payload);
  } catch (error) {
    console.error(`Realtime emit failed for ${eventName}:`, error);
  }
}

export function emitWorkspaceChanged(
  userIdOrPayload: string | WorkspaceChangedPayload,
  legacyPayload?: WorkspaceChangedPayload,
) {
  emitToUser(
    "synapse",
    REALTIME_EVENTS.WORKSPACE_CHANGED,
    typeof userIdOrPayload === "string" ? legacyPayload! : userIdOrPayload,
  );
}

export function emitProjectChanged(
  userIdOrPayload: string | ProjectChangedPayload,
  legacyPayload?: ProjectChangedPayload,
) {
  emitToUser(
    "synapse",
    REALTIME_EVENTS.PROJECT_CHANGED,
    typeof userIdOrPayload === "string" ? legacyPayload! : userIdOrPayload,
  );
}

export function emitNoteChanged(
  userIdOrPayload: string | NoteChangedPayload,
  legacyPayload?: NoteChangedPayload,
) {
  emitToUser(
    "synapse",
    REALTIME_EVENTS.NOTE_CHANGED,
    typeof userIdOrPayload === "string" ? legacyPayload! : userIdOrPayload,
  );
}

export function emitChatChanged(
  userIdOrPayload: string | ChatChangedPayload,
  legacyPayload?: ChatChangedPayload,
) {
  emitToUser(
    "synapse",
    REALTIME_EVENTS.CHAT_CHANGED,
    typeof userIdOrPayload === "string" ? legacyPayload! : userIdOrPayload,
  );
}

export function emitChatMessageCreated(
  userIdOrPayload: string | ChatMessageCreatedPayload,
  legacyPayload?: ChatMessageCreatedPayload,
) {
  emitToUser(
    "synapse",
    REALTIME_EVENTS.CHAT_MESSAGE_CREATED,
    typeof userIdOrPayload === "string" ? legacyPayload! : userIdOrPayload,
  );
}
