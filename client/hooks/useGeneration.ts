import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { GenerationState } from '@/lib/types';
import { ENDPOINTS } from '@/lib/constants';
import { submitPrompt } from '@/api/prompt';

const initialState: GenerationState = {
  jobId: null,
  status: 'idle',
  progress: 0,
  error: null,
  videoUrl: null,
  code: '',
  prompt: '',
};

export const useGeneration = () => {
  const [state, setState] = useState<GenerationState>(initialState);
  const statusEventSourceRef = useRef<EventSource | null>(null);
  const codeEventSourceRef = useRef<EventSource | null>(null);

  const cleanupEventSources = () => {
    statusEventSourceRef.current?.close();
    codeEventSourceRef.current?.close();
    statusEventSourceRef.current = null;
    codeEventSourceRef.current = null;
  };

  const startGeneration = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt.');
      return;
    }

    cleanupEventSources();
    setState({ ...initialState, status: 'pending', prompt });
    toast.info('Submitting your request...');

    try {
      const { jobId } = await submitPrompt(prompt);
      setState(prevState => ({ ...prevState, jobId, status: 'generating' }));

      // Start listening to both streams simultaneously
      listenToJobStatus(jobId);
      streamGeneratedCode(jobId);
    } catch (error: any) {
      console.error('Submission failed:', error);
      const errorMessage = error.message || 'Failed to start generation process.';
      setState(prevState => ({ ...prevState, status: 'failed', error: errorMessage }));
      toast.error(errorMessage);
    }
  }, []);

  const listenToJobStatus = (jobId: string) => {
    const eventSource = new EventSource(ENDPOINTS.jobStatus(jobId), { withCredentials: true });
    statusEventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      // General handler for different event types if they are not named
      try {
        const data = JSON.parse(event.data);
        if (data.status) {
          setState(prevState => ({ ...prevState, status: 'generating', progress: prevState.progress + 5 }));
          toast.info(`Status: ${data.status.replace('_', ' ')}`);
        }
      } catch (e) { console.error('Error parsing generic message', e); }
    };

    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setState(prevState => ({ ...prevState, progress: data.progress || prevState.progress }));
    });
    
    eventSource.addEventListener('done', (event) => {
      const data = JSON.parse(event.data);
      setState(prevState => ({
        ...prevState,
        status: 'completed',
        progress: 100,
        videoUrl: data.video_url || null,
      }));
      toast.success('Animation is ready!');
      cleanupEventSources(); // Close both streams on completion
    });

    eventSource.onerror = (err) => {
      console.error('Status SSE Error:', err);
      setState(prevState => ({ ...prevState, status: 'failed', error: 'A connection error occurred.' }));
      toast.error('Lost connection to the server.');
      cleanupEventSources();
    };
  };

  const streamGeneratedCode = (jobId: string) => {
    setState(prevState => ({ ...prevState, status: 'streaming_code', code: '' }));
    const eventSource = new EventSource(ENDPOINTS.streamCode(jobId), { withCredentials: true });
    codeEventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
        // Assuming the server sends code chunks as simple text data
        setState(prevState => ({ ...prevState, code: prevState.code + event.data }));
    };

    eventSource.onerror = (err) => {
        console.error('Code Stream SSE Error:', err);
        // This might not be a fatal error for the whole process, so we just log it.
        // If the stream closing is fatal, you could set status to 'failed'.
        eventSource.close();
    };
  };

  const reset = useCallback(() => {
    cleanupEventSources();
    setState(initialState);
  }, []);


  return { state, startGeneration, reset };
};