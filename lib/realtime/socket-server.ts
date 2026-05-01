import type { Server as HttpServer } from "node:http";
import Redis from "ioredis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import {
  getUserFromCookieHeader,
  type AuthenticatedUser,
} from "../auth/session";
import {
  getUserRoom,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "./events";

type SocketData = {
  user: AuthenticatedUser;
};

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

  io.use(async (socket, next) => {
    try {
      const user = await getUserFromCookieHeader(socket.request.headers.cookie);

      if (!user) {
        next(new Error("Unauthorized"));
        return;
      }

      socket.data.user = user;
      next();
    } catch (error) {
      console.error("Socket auth error:", error);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(getUserRoom(socket.data.user.id));
  });

  return io;
}
