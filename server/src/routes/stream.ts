import { Router } from "express";
import Redis from "ioredis";
import { Config } from "../config/env";

export const streamRouter = Router();

streamRouter.get("/job/:jobId", async (req, res) => {
    const jobId = req.params.jobId;

    if (!jobId || typeof jobId !== "string") {
        res.status(400).send("Missing jobId");
        return;
    }

    const redisKey = `job:${jobId}:stream`;

    const subscriber = new Redis({
        host: Config.REDIS_HOST,
        port: Config.REDIS_PORT,
        maxRetriesPerRequest: null,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    await subscriber.subscribe(redisKey);

    subscriber.on("message", (channel, message) => {
        if (channel === redisKey) {
            res.write(`data: ${message}\n\n`);
        }
    });

    req.on("close", async () => {
        await subscriber.unsubscribe(redisKey);
        await subscriber.quit();
        res.end();
    });
});
