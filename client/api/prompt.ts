import { ENDPOINTS } from "@/lib/constants";

export const submitPrompt = async (prompt: string): Promise<{ jobId: string }> => {
    const response = await fetch(ENDPOINTS.submitPrompt, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred." }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};