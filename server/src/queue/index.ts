import { Queue } from "bullmq";
import { redis } from "../store/redis";

export const queue_name='prompt-generation' 
export const queue=new Queue(queue_name,{
    connection:redis
})

