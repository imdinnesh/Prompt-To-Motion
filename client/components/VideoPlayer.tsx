"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Pause, Volume2, VolumeX, Download, Copy, Share2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface VideoPlayerProps {
    videoUrl: string;
    prompt: string;
}

export const VideoPlayer = ({ videoUrl, prompt }: VideoPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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


    return (
        <TooltipProvider>
            <div className="w-full border-t pt-6 mt-6">
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
                        controls={false}
                        autoPlay
                        loop
                        muted={isMuted}
                        className="w-full h-auto aspect-video"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </TooltipProvider>
    );
};