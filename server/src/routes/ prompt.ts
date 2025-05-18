import { Router } from "express";
import { promptSchema } from "../schema/promptSchema";
import { promptQueue } from "../queue";

export const promptRouter = Router();

promptRouter.post("/send", async(req, res) => {
    const parsedData = promptSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid data",
            status: "error",
            error: parsedData.error.format().prompt?._errors || ["Invalid input"],
        });
        return;
    }

    const { prompt } = parsedData.data;
    
    const job = await promptQueue.add('generate', { prompt });

  res.status(202).json({
    status: "queued",
    message: "Prompt received. Generating Manim animation code...",
    jobId: job.id,
  });
    return;
});
