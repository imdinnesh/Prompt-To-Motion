"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Copy,
  Share2,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type JobStatus = "pending" | "processing" | "completed" | "failed" | ""

interface GenerationHistory {
  id: string
  prompt: string
  videoUrl: string
  timestamp: Date
}

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<JobStatus>("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState<GenerationHistory[]>([])
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("animation-history")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setHistory(parsed)
      } catch (error) {
        console.error("Failed to parse history:", error)
      }
    }
  }, [])

  // Save to history when video is generated
  const saveToHistory = useCallback(
    (prompt: string, videoUrl: string) => {
      const newEntry: GenerationHistory = {
        id: Date.now().toString(),
        prompt,
        videoUrl,
        timestamp: new Date(),
      }
      const updatedHistory = [newEntry, ...history].slice(0, 10) // Keep last 10
      setHistory(updatedHistory)
      localStorage.setItem("animation-history", JSON.stringify(updatedHistory))
    },
    [history],
  )

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for your animation")
      return
    }

    setIsLoading(true)
    setStatus("pending")
    setVideoUrl(null)
    setError(null)
    setProgress(0)

    toast.info("Your animation request has been submitted.")

    const headers = new Headers()
    headers.append("Content-Type", "application/json")

    try {
      const response = await fetch("http://localhost:8000/api/v1/promt/send", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ prompt }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const jobId = result.jobId

      if (jobId) {
        listenToJobStatus(jobId)
      } else {
        throw new Error("No job ID returned")
      }
    } catch (error) {
      console.error("Request failed:", error)
      setError("Something went wrong while submitting your prompt. Please try again.")
      setIsLoading(false)
      setStatus("failed")
      toast.error("Failed to start generation process.")
    }
  }

  const listenToJobStatus = (jobId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`http://localhost:8000/api/v1/status/job/${jobId}`, {
      withCredentials: true,
    })
    eventSourceRef.current = eventSource

    eventSource.addEventListener("status", (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus(data.status)
        if (data.status === "pending") setProgress(10)
        else if (data.status === "ready_for_render") setProgress(25)
        else if (data.status === "rendering") setProgress(50)
        else if (data.status === "uploading") setProgress(75)
        toast.info(`Update: Animation is now ${data.status.replace("_", " ")}`)
      } catch (error) {
        console.error("Failed to parse status event:", error)
      }
    })

    eventSource.addEventListener("progress", (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress(data.progress || 50)
      } catch (error) {
        console.error("Failed to parse progress event:", error)
      }
    })

    eventSource.addEventListener("done", (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus("completed")
        setVideoUrl(data.video_url || null)
        setProgress(100)
        setIsLoading(false)
        eventSource.close()
        eventSourceRef.current = null
        if (data.video_url) {
          saveToHistory(prompt, data.video_url)
        }
        toast.success("Your mathematical animation is ready!")
      } catch (error) {
        console.error("Failed to parse done event:", error)
        setError("Failed to process completion data")
        setStatus("failed")
        setIsLoading(false)
      }
    })

    eventSource.addEventListener("error", (event) => {
      console.error("SSE Error:", event)
      setError("Connection lost during generation. Please try again.")
      setStatus("failed")
      setIsLoading(false)
      eventSource.close()
      eventSourceRef.current = null
      toast.error("An error occurred while processing your request.")
    })

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("EventSource connection was closed.")
      }
    }
  }

  const getStatusBadge = () => {
    const commonClasses = "text-xs"
    const badges = {
      pending: (
        <Badge variant="secondary" className={commonClasses}>
          <Clock className="w-3 h-3 mr-1.5" />
          Pending
        </Badge>
      ),
      processing: (
        <Badge variant="secondary" className={commonClasses}>
          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          Processing
        </Badge>
      ),
      completed: (
        <Badge variant="secondary" className={commonClasses}>
          <CheckCircle2 className="w-3 h-3 mr-1.5" />
          Completed
        </Badge>
      ),
      failed: (
        <Badge variant="destructive" className={commonClasses}>
          <XCircle className="w-3 h-3 mr-1.5" />
          Failed
        </Badge>
      ),
    }
    return status ? badges[status] : null
  }

  const copyVideoUrl = async () => {
    if (videoUrl) {
      try {
        await navigator.clipboard.writeText(videoUrl)
        toast.success("Video URL copied to clipboard.")
      } catch (error) {
        toast.error("Failed to copy URL.")
      }
    }
  }

  const downloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement("a")
      link.href = videoUrl
      link.download = `animation-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Download started.")
    }
  }

  const shareVideo = async () => {
    if (videoUrl && navigator.share) {
      try {
        await navigator.share({
          title: "Mathematical Animation",
          text: `Check out this mathematical animation: ${prompt}`,
          url: videoUrl,
        })
      } catch (error) {
        copyVideoUrl() // Fallback to copy
      }
    } else {
      copyVideoUrl() // Fallback to copy
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const retryGeneration = () => {
    if (prompt.trim()) {
      handleSubmit()
    }
  }

  const examplePrompts = [
    "A bouncing ball following a sine wave with trailing particles",
    "Visualization of the Mandelbrot set zooming into infinite detail",
    "3D rotation of a tesseract with rainbow color transitions",
    "Particles forming the shape of π symbol with mathematical equations",
    "Fibonacci spiral growing with golden ratio proportions",
    "Wave interference patterns creating beautiful geometric shapes",
  ]

  return (
    <TooltipProvider>
      <main className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-3xl mx-auto">
          <Card className="shadow-2xl shadow-primary/10">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border flex items-center justify-center bg-card">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tighter">
                      Mathematical Animation Generator
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground mt-1">
                      Describe a concept and watch it come to life with AI.
                    </CardDescription>
                  </div>
                </div>
                {status && getStatusBadge()}
              </div>
              {isLoading && (
                <div className="space-y-2 pt-6">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Generating your animation... {progress}%
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-8 pt-0">
              <Tabs defaultValue="create">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="create">Create</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-6">
                  <div className="space-y-4">
                    <Textarea
                      id="prompt"
                      placeholder="e.g., A visualization of the Lorenz attractor with a comet-like tail..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isLoading}
                      className="min-h-[120px] text-base"
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{prompt.length}/500</span>
                      <div className="flex gap-2">
                        {status === "failed" && (
                          <Button variant="outline" onClick={retryGeneration} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Retry
                          </Button>
                        )}
                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading || !prompt.trim()}
                          size="lg"
                          className="gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              Generate
                              <ArrowRight className="h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="examples" className="mt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-3">
                      Click an example to load it into the prompt editor.
                    </p>
                    {examplePrompts.map((p, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors flex items-start gap-3"
                        onClick={() => setPrompt(p)}
                      >
                        <Bot className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{p}</span>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {history.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">No History</p>
                        <p className="text-sm">Your past generations will appear here.</p>
                      </div>
                    ) : (
                      history.map((item) => (
                        <div key={item.id} className="p-3 rounded-md border flex items-center justify-between">
                          <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate text-sm">{item.prompt}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="ghost" size="sm" onClick={() => setPrompt(item.prompt)}>
                              Reuse
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setVideoUrl(item.videoUrl)}>
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              {error && (
                <Alert variant="destructive" className="mt-6">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Generation Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            {videoUrl && (
              <CardFooter className="flex flex-col items-start p-8 pt-0 space-y-4">
                <div className="w-full border-t pt-6">
                  <div className="flex items-center justify-between w-full mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Animation Ready
                    </h3>
                    <div className="flex gap-1">
                      {[
                        { icon: isPlaying ? Pause : Play, label: isPlaying ? "Pause" : "Play", action: togglePlayPause },
                        { icon: isMuted ? VolumeX : Volume2, label: isMuted ? "Unmute" : "Mute", action: toggleMute },
                        { icon: Download, label: "Download", action: downloadVideo },
                        { icon: Copy, label: "Copy URL", action: copyVideoUrl },
                        { icon: Share2, label: "Share", action: shareVideo },
                      ].map((btn, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={btn.action}>
                              <btn.icon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>{btn.label}</p></TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  <div className="w-full overflow-hidden rounded-lg border bg-black shadow-inner">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls={false} // Disable default controls for a cleaner look
                      autoPlay
                      loop
                      muted={isMuted}
                      className="w-full h-auto aspect-video"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </TooltipProvider>
  )
}