"use server";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });
        const { text, targetLanguage } = await req.json();

        if (!text || !targetLanguage) {
            return NextResponse.json({ error: "Missing text or targetLanguage" }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-5.4-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an elite translation agent for StrideIQ. 
                    Translate the following user content into: ${targetLanguage}.
                    Maintain any formatting or tone. 
                    If the content is already in the target language, return it as is.
                    Return ONLY the translated text.`
                },
                { role: "user", content: text }
            ],
            temperature: 0.3,
            max_completion_tokens: 2000,
        });

        const translated = completion.choices[0].message.content;
        return NextResponse.json({ translated });

    } catch (error: any) {
        console.error("Translation API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
