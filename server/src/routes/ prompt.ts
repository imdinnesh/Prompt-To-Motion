import { Router } from "express";
import { promptSchema } from "../schema/promptSchema";

export const promptRouter = Router();

promptRouter.post("/send", (req, res) => {
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

    res.status(200).json({
        message: "Prompt received",
        status: "success",
        data: { prompt },
    });
    return;
});
