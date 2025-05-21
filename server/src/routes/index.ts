import { Router } from "express";
import { promptRouter } from "./ prompt";
import { statusRouter } from "./status";
const router=Router();

// promt router for receiving user promt 
router.use("/promt",promptRouter);
router.use("/status", statusRouter);


export default router;