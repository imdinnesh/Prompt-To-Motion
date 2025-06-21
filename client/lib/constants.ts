export const API_BASE_URL = "http://localhost:8000/api/v1";

export const ENDPOINTS = {
  submitPrompt: `${API_BASE_URL}/promt/send`,
  jobStatus: (jobId: string) => `${API_BASE_URL}/status/job/${jobId}`,
  streamCode: (jobId: string) => `${API_BASE_URL}/stream/job/${jobId}`,
};