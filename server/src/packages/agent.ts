// FILE: src/packages/agent.ts
import { GoogleGenerativeAI, Content } from "@google/generative-ai"; // <-- Correct package name
import { Config } from "../config/env";
import { redisPublisher } from "../store/redis";

// It's better to initialize the client once and reuse it.
const genAI = new GoogleGenerativeAI(Config.GEMINI_API_KEY);

// 1. Define the core System Instruction and a "Few-Shot" example
const MANIM_SYSTEM_INSTRUCTION = `You are a world-class expert in Manim, a Python library for mathematical animations.
Your sole purpose is to generate clean, complete, and directly runnable Python code for Manim animations based on a user's prompt.

**CRITICAL OUTPUT RULES:**
1.  **CODE ONLY:** You will only return Python code. Nothing else.
2.  **NO CONVERSATION:** Do not provide any explanation, introduction, or concluding remarks.
3.  **NO MARKDOWN:** Do not wrap the code in markdown fences like \`\`\`python or \`\`\`.
4.  **COMPLETE SCRIPT:** The code must be a complete, runnable script that includes 'from manim import *'.
5.  **CLASS STRUCTURE:** The code must define a single class that inherits from a Manim Scene (e.g., 'class MyAnimation(Scene):'). The class name should be descriptive and in PascalCase.
6.  **CONSTRUCT METHOD:** The class must implement the 'construct(self)' method where the animation logic resides.
7.  **VALID MANIM:** All code within 'construct' must use valid Manim methods and objects.
`;

const MANIM_FEW_SHOT_EXAMPLE: Content[] = [
    {
        role: "user",
        parts: [{ text: "Create an animation of a blue circle transforming into a red square." }],
    },
    {
        role: "model",
        parts: [{
            text: `from manim import *

class CircleToSquare(Scene):
    def construct(self):
        circle = Circle(color=BLUE)
        circle.set_fill(BLUE, opacity=0.5)
        square = Square(color=RED)
        square.set_fill(RED, opacity=0.5)
        
        self.play(Create(circle))
        self.wait(1)
        self.play(Transform(circle, square))
        self.wait(1)
        self.play(FadeOut(circle))
`
        }],
    },
];

export async function generateManimCodeStream(prompt: string, jobId: string): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        systemInstruction: MANIM_SYSTEM_INSTRUCTION,
    });

    const resultStream = await model.generateContentStream({
        contents: [
            ...MANIM_FEW_SHOT_EXAMPLE,
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ]
    });

    let fullCode = "";

    for await (const chunk of resultStream.stream) {
        const text = chunk.text();
        if (text) {
            fullCode += text;

            // Publish chunk to Redis Pub/Sub
            await redisPublisher.publish(`job:${jobId}:stream`, text);
        }
    }

    return fullCode.trim();
}