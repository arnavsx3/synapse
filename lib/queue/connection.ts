import Redis from "ioredis";
import "dotenv/config"

function getRedisUrl() {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("Missing REDIS_URL");
  }

  return url;
}

export function createQueueConnection() {
  return new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy: () => null,
  });
}

export function createWorkerConnection() {
  return new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
  });
}
