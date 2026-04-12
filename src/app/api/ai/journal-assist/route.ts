import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase/admin"; // Optional: if we want to log usage or verify user tier

const SYSTEM_PROMPT = `
You are an expert editor and writing assistant. Your goal is to help the user improve their journal entries while preserving their unique voice and authentic thoughts.
- **Grammar:** Fix grammatical errors, punctuation, and typos.
- **Tone:** Adjust the tone as requested (e.g., more positive, more reflective).
- **Expand:** Elaborate on the user's thoughts with relevant questions or deeper insights, but keep it grounded in their original idea.
- **Concise:** Simplify the text to be more direct.
Do not add conversational filler like "Here is the edited text". Just provide the improved text.
`;

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user
        await getAuth().verifyIdToken(idToken);

        const { text, command, tone } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API Key missing" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        let userPrompt = "";
        switch (command) {
            case "grammar":
                userPrompt = `Fix grammar and spelling in the following text:\n\n${text}`;
                break;
            case "expand":
                userPrompt = `Expand on this thought, adding depth and reflection:\n\n${text}`;
                break;
            case "concise":
                userPrompt = `Make this text more concise and clear:\n\n${text}`;
                break;
            case "tone":
                userPrompt = `Rewrite this text to have a ${tone || "neutral"} tone:\n\n${text}`;
                break;
            default:
                userPrompt = `Improve this text:\n\n${text}`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            max_completion_tokens: 1000,
        });

        const result = response.choices[0].message.content;

        return NextResponse.json({ result });

    } catch (error: any) {
        console.error("Journal AI Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
