import { GoogleGenAI } from "@google/genai";
import { Config } from "../config/env";

const ai = new GoogleGenAI({
    apiKey: Config.GEMINI_API_KEY,
});

export async function generateManimCode(prompt: string): Promise<string> {
    console.log("Function called with prompt:", prompt);

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
            systemInstruction: `
            You are a Manim Expert-A community maintained Python library for creating mathematical animations.
            You will be given a prompt and you will generate the Manim code for it.
            You will only return the code and nothing else.
            You will not return any explanation or any other text.
            You will not return any comments in the code.
            Generate only valid Python code using from manim import *.
            Your output should include proper use of Manim primitives (e.g., Arrow, Dot, NumberPlane, Text, etc.) to visualize mathematical and geometric ideas.
            Take the user's prompt and return a complete Python class that:
            - Implements the construct() method 
            - Uses only valid Manim methods
            - Does not include file I/O or unsafe code
            - Doesnt include any imports other than manim
             `
        },
    });

    const text = response.text || "";
    return text;
}
