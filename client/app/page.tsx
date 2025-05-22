"use client"

import { useState } from "react"
import { ArrowRight, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Sparkles, Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"



type JobStatus = "pending" | "processing" | "completed" | "failed" | ""

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<JobStatus>("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleSubmit = async () => {
    setIsLoading(true)
    setStatus("")
    setVideoUrl(null)
    setError(null)
    setProgress(0)

    // toast({
    //   title: "Generation started",
    //   description: "We're processing your mathematical animation request.",
    // })

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

      const result = await response.json()
      const jobId = result.jobId
      if (jobId) {
        listenToJobStatus(jobId)
      } else {
        throw new Error("No job ID returned")
      }
    } catch (error) {
      console.error("Request failed:", error)
      setError("Something went wrong while submitting your prompt.")
      setIsLoading(false)

      // toast({
      //   title: "Error",
      //   description: "Failed to start generation process.",
      //   variant: "destructive",
      // })
      toast.error("Failed to start generation process.")
    }
  }

  const listenToJobStatus = (jobId: string) => {
    const eventSource = new EventSource(`http://localhost:8000/api/v1/status/job/${jobId}`, {
      withCredentials: true,
    })

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data)
      setStatus(data.status)

      // Update progress based on status
      if (data.status === "pending") setProgress(25)
      if (data.status === "processing") setProgress(75)

      // toast({
      //   title: "Status update",
      //   description: `Animation is now ${data.status}`,
      // })
      toast.info(`Animation is now ${data.status}`)
    })

    eventSource.addEventListener("done", (event) => {
      const data = JSON.parse(event.data)
      setStatus("completed")
      setProgress(100)
      setVideoUrl(data.video_url || null)
      setIsLoading(false)
      eventSource.close()

      // toast({
      //   title: "Success!",
      //   description: "Your mathematical animation is ready to view.",
      //   variant: "success",
      // })
      toast.success("Your mathematical animation is ready to view.")
    })

    eventSource.addEventListener("error", (event) => {
      console.error("SSE Error:", event)
      setError("Something went wrong while listening for job updates.")
      setStatus("failed")
      setProgress(0)
      setIsLoading(false)
      eventSource.close()

      // toast({
      //   title: "Generation failed",
      //   description: "There was an error processing your request.",
      //   variant: "destructive",
      // })
      toast.error("There was an error processing your request.")
    })
  }

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "processing":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Preparing your animation..."
      case "processing":
        return "Generating mathematical animation..."
      case "completed":
        return "Your animation is ready!"
      case "failed":
        return "Generation failed"
      default:
        return ""
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  const copyVideoUrl = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl)
      // toast({
      //   title: "Copied!",
      //   description: "Video URL copied to clipboard",
      // })
      toast.success("Video URL copied to clipboard")
    }
  }

  const examplePrompts = [
    "A bouncing ball following a sine wave",
    "Visualization of the Mandelbrot set zooming in",
    "3D rotation of a cube with changing colors",
    "Particles forming the shape of π symbol",
  ]

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-500" />
                Mathematical Animation Generator
              </CardTitle>
              {status && getStatusBadge()}
            </div>
            <CardDescription>Create beautiful mathematical animations with AI</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create Animation</TabsTrigger>
                <TabsTrigger value="examples">Example Prompts</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium">
                    Your Prompt
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      id="prompt"
                      placeholder="Describe the mathematical animation you want"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={handleSubmit} disabled={isLoading || !prompt.trim()} className="gap-1">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating
                            </>
                          ) : (
                            <>
                              Generate
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate your mathematical animation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="mt-4">
                <div className="grid gap-2">
                  {examplePrompts.map((examplePrompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => setPrompt(examplePrompt)}
                    >
                      {examplePrompt}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {(status || isLoading) && (
              <div className="space-y-3 mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium">{getStatusText()}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          {videoUrl && (
            <CardFooter className="flex flex-col items-start pt-0">
              <div className="flex items-center justify-between w-full mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Animation Result
                </h3>
                <div className="flex gap-2">
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
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share animation</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-black">
                <video src={videoUrl} controls autoPlay className="w-full h-auto">
                  Your browser does not support the video tag.
                </video>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>
    </TooltipProvider>
  )
}
