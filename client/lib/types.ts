// A comprehensive state for the entire generation process
export interface GenerationState {
  jobId: string | null;
  status: 'idle' | 'pending' | 'generating' | 'streaming_code' | 'completed' | 'failed';
  progress: number;
  error: string | null;
  videoUrl: string | null;
  code: string;
  prompt: string;
}

export interface GenerationHistory {
  id: string;
  prompt: string;
  videoUrl: string;
  timestamp: Date;
}