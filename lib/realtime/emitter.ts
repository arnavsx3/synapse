import Redis from "ioredis";
import { Emitter } from "@socket.io/redis-emitter";
import {
  REALTIME_EVENTS,
  getAppRoom,
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

function emitToApp<EventPayload>(
  eventName: string,
  payload: EventPayload,
) {
  try {
    getEmitter().to(getAppRoom()).emit(eventName, payload);
  } catch (error) {
    console.error(`Realtime emit failed for ${eventName}:`, error);
  }
}

export function emitWorkspaceChanged(
  payload: WorkspaceChangedPayload,
) {
  emitToApp(REALTIME_EVENTS.WORKSPACE_CHANGED, payload);
}

export function emitProjectChanged(
  payload: ProjectChangedPayload,
) {
  emitToApp(REALTIME_EVENTS.PROJECT_CHANGED, payload);
}

export function emitNoteChanged(
  payload: NoteChangedPayload,
) {
  emitToApp(REALTIME_EVENTS.NOTE_CHANGED, payload);
}

export function emitChatChanged(
  payload: ChatChangedPayload,
) {
  emitToApp(REALTIME_EVENTS.CHAT_CHANGED, payload);
}

export function emitChatMessageCreated(
  payload: ChatMessageCreatedPayload,
) {
  emitToApp(REALTIME_EVENTS.CHAT_MESSAGE_CREATED, payload);
}
