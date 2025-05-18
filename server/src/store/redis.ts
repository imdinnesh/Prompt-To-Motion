import {Redis} from "ioredis";
import { Config } from "../config/env";

export const redis=new Redis({
    host:Config.REDIS_HOST,
    port:Config.REDIS_PORT
})

