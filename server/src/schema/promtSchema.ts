import { z } from 'zod';

export const promptSchema = z.object({
  prompt: z.string().nonempty({ message: "Prompt is required" }),
});
