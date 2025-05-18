import { GoogleGenAI } from "@google/genai";
import { Config } from "../config/env";

const ai = new GoogleGenAI({
    apiKey:Config.GEMINI_API_KEY
})

export async function generateManimCode(prompt:string):Promise<string> {
    console.log("Function called with prompt:", prompt);
    const response=await ai.models.generateContent({
        model:"gemini-2.0-flash",
        contents:prompt
    })

    const text=response.text||"";
    return text;    
}


