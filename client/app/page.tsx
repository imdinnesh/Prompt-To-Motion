"use client";

import { useEffect, useState } from "react";

type JobStatus = "pending" | "processing" | "completed" | "failed" | "";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<JobStatus>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setStatus("");
    setVideoUrl(null);
    setError(null);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    try {
      const response = await fetch("http://localhost:8000/api/v1/promt/send", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ prompt }),
        credentials: "include",
      });

      const result = await response.json();
      const jobId = result.jobId;
      if (jobId) {
        listenToJobStatus(jobId);
      } else {
        throw new Error("No job ID returned");
      }
    } catch (error) {
      console.error("Request failed:", error);
      setError("Something went wrong while submitting your prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  const listenToJobStatus = (jobId: string) => {
    const eventSource = new EventSource(`http://localhost:8000/api/v1/status/job/${jobId}`, {
      withCredentials: true,
    });

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
    });

    eventSource.addEventListener("done", (event) => {
      const data = JSON.parse(event.data);
      setStatus("completed");
      setVideoUrl(data.video_url || null);
      eventSource.close();
    });

    eventSource.addEventListener("error", (event) => {
      console.error("SSE Error:", event);
      setError("Something went wrong while listening for job updates.");
      setStatus("failed");
      eventSource.close();
    });
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Write your prompt to generate beautiful mathematical animations
      </h1>

      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
        Prompt
      </label>
      <input
        type="text"
        name="prompt"
        id="prompt"
        className="mt-1 mb-4 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g. a bouncing ball"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isLoading}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || !prompt.trim()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>

      {status && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Job Status: {status}</h2>
        </div>
      )}

      {videoUrl && (
        <div className="mt-4">
          <p className="mb-2">Your video is ready:</p>
          <video
            src={videoUrl}
            controls
            autoPlay
            style={{ maxWidth: "100%", borderRadius: "8px" }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </main>
  );
}
