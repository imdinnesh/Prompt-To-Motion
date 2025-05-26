import { Router } from "express";
import { videoSchema } from "../schema/videoSchema";

export const videoRouter = Router();

videoRouter.delete("/delete-video",async(req,res)=>{
    const parsedData=videoSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid data",
            status: "error",
            error: parsedData.error.format().videoUrl?._errors || ["Invalid input"],
        });
        return;
    }

    const { videoUrl } = parsedData.data;
    // logic to delete the video from storage

    res.status(200).json({
        status: "success",
        message: "Video deleted successfully",
    });
    return;
})