"use client";

import { useState, useEffect } from "react";
import { useGeneration } from "@/hooks/useGeneration";

// UI Components from shadcn/ui
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Icons from lucide-react
import {
  WandSparkles,
  Loader2,
  RefreshCw,
  XCircle,
  Plus,
  Copy,
  Check,
  FileCode,
  Video,
} from "lucide-react";

// Syntax Highlighting (New!)
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// --- Main Page Component ---
export default function HomePage() {
  const [promptInput, setPromptInput] = useState("");
  const { state, startGeneration, reset } = useGeneration();
  const { status, progress, error, videoUrl, code, prompt } = state;

  const isLoading = status === 'pending' || status === 'generating' || status === 'streaming_code';
  const isFinished = status === 'completed' || status === 'failed';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isLoading) return;
    startGeneration(promptInput);
  };

  const handleReset = () => {
    reset();
    setPromptInput("");
  };

  const handlePrimaryAction = () => {
    if (isFinished) {
      handleReset();
    } else {
      handleFormSubmit(new Event('submit') as any);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* --- Left Panel: Controls & Input --- */}
      <aside className="w-full max-w-sm flex-shrink-0 border-r border-border flex flex-col">
        <header className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WandSparkles className="h-6 w-6" />
            <h1 className="text-lg font-semibold tracking-tight">Mathemation AI</h1>
          </div>
        </header>

        <div className="p-6 flex-grow">
          <form onSubmit={handleFormSubmit} className="flex flex-col h-full gap-4">
            <label htmlFor="prompt" className="font-medium text-sm text-muted-foreground">
              Describe your animation concept
            </label>
            <Textarea
              id="prompt"
              placeholder="A sine wave transforming into a circle..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              disabled={isLoading}
              className="flex-grow text-base resize-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={10}
            />
          </form>
        </div>

        <footer className="p-6 border-t border-border mt-auto">
          <Button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isLoading || (!isFinished && !promptInput.trim())}
            size="lg"
            className="w-full h-12 text-md gap-2 bg-foreground text-background hover:bg-foreground/80"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isFinished ? (
              <>
                <Plus className="h-5 w-5" /> Create New
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </footer>
      </aside>

      {/* --- Right Panel: Output & Status --- */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="p-6 border-b border-border min-h-[81px]">
          {prompt && <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{prompt}</p>}
        </header>

        <div className="flex-grow p-6 lg:p-10">
          <div className="w-full max-w-4xl mx-auto h-full">
            {status === 'idle' && <WelcomeView />}
            {isLoading && <LoadingView status={status} progress={progress} code={code} />}
            {status === 'failed' && <ErrorView error={error ?? "Unknown error"} onRetry={() => startGeneration(prompt)} />}
            {status === 'completed' && videoUrl && <ResultsView videoUrl={videoUrl} code={code} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- View Components for Main Panel ---

const WelcomeView = () => (
  <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-xl">
    <div className="p-4 mb-4 border border-border rounded-full bg-card">
      <WandSparkles className="h-10 w-10 text-muted-foreground" />
    </div>
    <h2 className="text-2xl font-bold">
      Animation Awaits Your Command
    </h2>
    <p className="mt-2 max-w-md text-muted-foreground">
      Describe a concept in the side panel. Our AI will craft the Python code and render it into a video.
    </p>
  </div>
);

const LoadingView = ({ status, code }: { status: string; code: string; progress: number }) => {
  // We'll use the progress to fake the code streaming in for a better visual effect
  const codeToShow = code || " "; // Ensure it's not empty for the highlighter

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileCode className="h-5 w-5" />
        Generating Code...
      </h3>
      {code ? (
        <CodePreview code={codeToShow} />
      ) : (
        <Skeleton className="w-full h-64 rounded-lg" />
      )}
      {status === 'generating' && (
        <div className="pt-8">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Rendering Video...
          </h3>
          <Skeleton className="w-full h-64 rounded-lg mt-4" />
        </div>
      )}
    </div>
  );
};


const ErrorView = ({ error, onRetry }: { error: string; onRetry: () => void; }) => (
    <div className="flex items-center justify-center h-full">
      <Alert variant="destructive" className="max-w-lg bg-destructive/10 border-destructive/30">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="font-bold">Generation Failed</AlertTitle>
        <AlertDescription className="mt-2">{error}</AlertDescription>
        <div className="mt-6">
          <Button variant="destructive" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Generation
          </Button>
        </div>
      </Alert>
    </div>
);

const ResultsView = ({ videoUrl, code }: { videoUrl: string; code: string; }) => (
  <div className="space-y-12">
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Video className="h-5 w-5" />
        Generated Video
      </h3>
      <video src={videoUrl} controls autoPlay loop muted className="w-full rounded-lg border border-border" />
    </div>
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileCode className="h-5 w-5" />
        Generated Code
      </h3>
      <CodePreview code={code} />
    </div>
  </div>
);


// --- Advanced CodePreview Component ---
// This is now responsible for formatting, highlighting, and copying.

export function CodePreview({ code }: { code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
    });
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <div className="relative group">
      <SyntaxHighlighter
        language="python"
        style={coldarkDark}
        showLineNumbers
        wrapLongLines
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: '#0D1117', // A nice dark background
          border: '1px solid hsl(var(--border))',
          fontSize: '0.9rem'
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono), monospace',
          }
        }}
      >
        {String(code).replace(/\n$/, "")}
      </SyntaxHighlighter>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleCopy}
        className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20"
      >
        {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white" />}
      </Button>
    </div>
  );
}