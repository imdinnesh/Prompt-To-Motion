import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  GEMINI_API_KEY:z.string().min(1, { message: 'GEMINI_API_KEY is required' }),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  parsedEnv.error.errors.forEach((error) => {
    console.error(`Invalid environment variable: ${error.path.join('.')} - ${error.message}`);
  })
  process.exit(1);
}

export const Config = parsedEnv.data;
