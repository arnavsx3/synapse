import Redis from "ioredis";

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
  });
}

export function createWorkerConnection() {
  return new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
  });
}
