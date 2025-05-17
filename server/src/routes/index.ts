import { Router } from "express";
import { promtRouter } from "./promt";
const router=Router();

// promt router for receiving user promt 
router.use("/promt",promtRouter);


export default router;