"use client";

import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./events";

declare global {
  var __synapseSocket:
    | Socket<ServerToClientEvents, ClientToServerEvents>
    | undefined;
}

export function getRealtimeSocket() {
  if (!globalThis.__synapseSocket) {
    globalThis.__synapseSocket = io({
      path: "/socket.io",
      autoConnect: false,
      withCredentials: true,
    });
  }

  return globalThis.__synapseSocket;
}
