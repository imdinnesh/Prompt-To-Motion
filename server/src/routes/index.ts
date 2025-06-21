import { Router } from "express";
import { promptRouter } from "./ prompt";
import { statusRouter } from "./status";
import { videoRouter } from "./video";
import { streamRouter } from "./stream";
const router=Router();

// promt router for receiving user promt 
router.use("/promt",promptRouter);
router.use("/status", statusRouter);
router.use("/video",videoRouter)
router.use("/stream",streamRouter)

export default router;