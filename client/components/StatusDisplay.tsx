import { Progress } from "@/components/ui/progress";

interface StatusDisplayProps {
  status: 'idle' | 'pending' | 'generating' | 'streaming_code' | 'completed' | 'failed';
  progress: number;
}

const statusMessages: Record<StatusDisplayProps['status'], string> = {
    idle: "",
    pending: "Submitting request...",
    generating: "Generating assets and rendering video...",
    streaming_code: "Generating code...",
    completed: "Generation complete!",
    failed: "Generation failed.",
}

export const StatusDisplay = ({ status, progress }: StatusDisplayProps) => {
  const isProcessing = status === 'pending' || status === 'generating' || status === 'streaming_code';
  if (!isProcessing) return null;

  return (
    <div className="space-y-2 pt-6 w-full">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-muted-foreground text-center">
        {statusMessages[status]} {progress > 0 && progress < 100 && `${Math.round(progress)}%`}
      </p>
    </div>
  );
};