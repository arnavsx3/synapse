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
  userId: string,
  payload: WorkspaceChangedPayload,
) {
  emitToUser(userId, REALTIME_EVENTS.WORKSPACE_CHANGED, payload);
}

export function emitProjectChanged(
  userId: string,
  payload: ProjectChangedPayload,
) {
  emitToUser(userId, REALTIME_EVENTS.PROJECT_CHANGED, payload);
}

export function emitNoteChanged(userId: string, payload: NoteChangedPayload) {
  emitToUser(userId, REALTIME_EVENTS.NOTE_CHANGED, payload);
}

export function emitChatChanged(userId: string, payload: ChatChangedPayload) {
  emitToUser(userId, REALTIME_EVENTS.CHAT_CHANGED, payload);
}

export function emitChatMessageCreated(
  userId: string,
  payload: ChatMessageCreatedPayload,
) {
  emitToUser(userId, REALTIME_EVENTS.CHAT_MESSAGE_CREATED, payload);
}
