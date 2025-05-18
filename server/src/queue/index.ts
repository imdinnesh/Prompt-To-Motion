import { Queue } from "bullmq";
import { redis } from "../store/redis";

export const QUEUE_NAME='prompt-generation' 
export const promptQueue=new Queue(QUEUE_NAME,{
    connection:redis
})

