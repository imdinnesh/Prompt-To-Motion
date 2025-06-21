import { Worker } from "bullmq";
import { redis } from "../store/redis";
import { QUEUE_NAME } from "../queue";
import { generateManimCodeStream } from "../packages/agent";

const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { prompt } = job.data;

        await job.updateProgress(10);

        if (!job.id) {
            throw new Error("Job ID is undefined");
        }
        const code = await generateManimCodeStream(prompt, job.id as string);

        // Save final code and status
        await redis.set(`job:${job.id}:status`, "ready_for_render");
        await redis.set(`job:${job.id}:code`, code);
    },
    {
        connection: redis,
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
    const jobKey = `job:${job?.id}`;
    await redis.set(`${jobKey}:status`, "failed");
    console.error(`Job ${job?.id} failed:`, err);
});
