import Redis from "ioredis";
import { Config } from "../config/env";

// General-purpose Redis client (can be reused by BullMQ, app logic, etc.)
export const redis = new Redis({
  host: Config.REDIS_HOST,
  port: Config.REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Subscriber client (used only for subscribing to channels)
export const redisSubscriber = new Redis({
  host: Config.REDIS_HOST,
  port: Config.REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Publisher client (optional: for Pub/Sub publishing)
export const redisPublisher = new Redis({
  host: Config.REDIS_HOST,
  port: Config.REDIS_PORT,
  maxRetriesPerRequest: null,
});
