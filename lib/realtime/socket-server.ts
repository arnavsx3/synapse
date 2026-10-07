import type { Server as HttpServer } from "node:http";
import Redis from "ioredis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { ClientToServerEvents, ServerToClientEvents } from "./events";

type SocketData = Record<string, never>;

function getRedisUrl() {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("Missing REDIS_URL");
  }

  return url;
}

export function registerSocketServer(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    object,
    SocketData
  >(httpServer, {
    path: "/socket.io",
  });
  const pubClient = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 1,
  });

  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    socket.join("synapse");
    console.log("Joined room: synapse");
  });

  return io;
}
