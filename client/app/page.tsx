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

    toast.success("We're processing your mathematical animation request.")

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
    // Close existing connection if any
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

        // Update progress based on status
        if (data.status === "pending") setProgress(10)
        else if (data.status === "ready_for_render") setProgress(25)
        else if (data.status === "rendering") setProgress(50)
        else if (data.status === "uploading") setProgress(75)

        toast.info(`Animation is now ${data.status}`)
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

        toast.success("Your mathematical animation is ready to view.")
      } catch (error) {
        console.error("Failed to parse done event:", error)
        setError("Failed to process completion data")
        setStatus("failed")
        setIsLoading(false)
      }
    })

    eventSource.addEventListener("error", (event) => {
      console.error("SSE Error:", event)
      setError("Connection lost while processing. Please try again.")
      setStatus("failed")
      setIsLoading(false)
      eventSource.close()
      eventSourceRef.current = null
      toast.error("There was an error processing your request.")
    })

    // Handle connection errors
    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("EventSource connection closed")
      }
    }
  }

  const getStatusBadge = () => {
    const badges = {
      pending: (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
        >
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      ),
      processing: (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
        >
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      ),
      completed: (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      ),
      failed: (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300">
          <XCircle className="w-3 h-3 mr-1" />
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
        toast.success("Video URL copied to clipboard")
      } catch (error) {
        toast.error("Failed to copy URL")
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
      toast.success("Download started")
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
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Card */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Mathematical Animation Generator
                </CardTitle>
                {status && getStatusBadge()}
              </div>
              <CardDescription className="text-lg">
                Create stunning mathematical animations with AI-powered generation
              </CardDescription>

              {/* Progress Bar */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Generating your animation...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="create">Create Animation</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <label htmlFor="prompt" className="text-sm font-medium">
                      Describe your mathematical animation
                    </label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe the mathematical animation you want to create. Be specific about mathematical concepts, visual effects, and motion patterns..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isLoading}
                      className="min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{prompt.length}/500 characters</span>
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
                          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              Generate Animation
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="examples" className="mt-6">
                  <div className="grid gap-3">
                    <p className="text-sm text-muted-foreground mb-3">Click any example to use it as your prompt:</p>
                    {examplePrompts.map((examplePrompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start h-auto py-4 px-4 text-left hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => setPrompt(examplePrompt)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="flex-1">{examplePrompt}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No animations generated yet</p>
                        <p className="text-sm">Your generation history will appear here</p>
                      </div>
                    ) : (
                      history.map((item) => (
                        <Card key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium truncate">{item.prompt}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setPrompt(item.prompt)}>
                                Reuse
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setVideoUrl(item.videoUrl)}>
                                View
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            {videoUrl && (
              <CardFooter className="flex flex-col items-start pt-0 space-y-4">
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Your Animation
                  </h3>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={togglePlayPause}>
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPlaying ? "Pause" : "Play"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={toggleMute}>
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isMuted ? "Unmute" : "Mute"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={downloadVideo}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download video</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={copyVideoUrl}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy video URL</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={shareVideo}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share animation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-black shadow-lg">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    autoPlay
                    className="w-full h-auto"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </TooltipProvider>
  )
}
