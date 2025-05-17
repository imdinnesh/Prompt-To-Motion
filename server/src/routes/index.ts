import { Router } from "express";
import { promptRouter } from "./ prompt";
const router=Router();

// promt router for receiving user promt 
router.use("/promt",promptRouter);


export default router;