import { Router } from "express";
import { promptRouter } from "./ prompt";
import { statusRouter } from "./status";
import { videoRouter } from "./video";
const router=Router();

// promt router for receiving user promt 
router.use("/promt",promptRouter);
router.use("/status", statusRouter);
router.use("/video",videoRouter)


export default router;