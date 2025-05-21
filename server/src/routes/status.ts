import { Router } from "express";
import { redis } from "../store/redis";

export const statusRouter = Router();

statusRouter.get("/job/:jobId", async (req, res) => {
    const jobId = req.params.jobId;
    const redisKey = `job:${jobId}`;
    let lastStatus:string = "";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event:string, data:any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const interval = setInterval(async () => {
        try {
            const status = await redis.get(`${redisKey}:status`);
            if (!status || status === lastStatus) return;

            lastStatus = status;
            send("status", { status });

            if (status === "completed") {
                const url = await redis.get(`${redisKey}:output_imagekit_url`);
                send("done", { video_url: url });
                clearInterval(interval);
                res.end();
            }

            if (status === "failed") {
                send("error", { message: "Job failed" });
                clearInterval(interval);
                res.end();
            }
        } catch (err) {
            console.error("Redis error:", err);
            send("error", { message: "Server error" });
            clearInterval(interval);
            res.end();
        }
    }, 4000);

    req.on("close", () => {
        clearInterval(interval);
        res.end();
    });
})