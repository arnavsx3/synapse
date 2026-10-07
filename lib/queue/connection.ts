import Redis from "ioredis";
import "dotenv/config";

function getRedisUrl(): string {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("Missing REDIS_URL");
  }

  return url;
}

const commonOptions = {
  connectionName: "synapse",
  connectTimeout: 5_000,
  enableReadyCheck: true,
  keepAlive: 10_000,
};

export function createQueueConnection() {
  return new Redis(getRedisUrl(), {
    ...commonOptions,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy: (attempt) => Math.min(attempt * 250, 2_000),
  });
}

export function createWorkerConnection() {
  return new Redis(getRedisUrl(), {
    ...commonOptions,
    maxRetriesPerRequest: null,
    retryStrategy: (attempt) => Math.min(attempt * 500, 5_000),
  });
}
