import { z } from 'zod';

export const videoSchema = z.object({
    videoUrl: z.string().url({ message: "Invalid video URL" })
})
