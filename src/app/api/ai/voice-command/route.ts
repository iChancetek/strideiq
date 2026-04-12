"use server";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Readable } from "stream";

// Force Node.js runtime for FormData handling if needed, 
// but Next.js App Router API routes default to Node.js unless edge is specified.
// However, parsing FormData can be tricky. We'll use the native Request.formData().

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("OPENAI_API_KEY is missing");
            // During build, this might be hit if the file is executed, but we handle it gracefully.
            // At runtime, this returns an error to the client.
            return NextResponse.json({ error: "AI Configuration Error: Missing API Key" }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 1. Transcribe with Whisper
        // OpenAI expects a File-like object. 
        const arrayBuffer = await file.arrayBuffer();
        // We need to cast it or wrap it to match OpenAI's expected type if strict typing fails,
        // but 'openai' v4 supports Web File/Blob objects directly in many environments.
        // If it fails, we might need a workaround. Let's try direct pass first.

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: "en",
        });

        const text = transcription.text;
        console.log("Transcribed:", text);

        // 2. Determine Intent with GPT-4o
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are StrideIQ's Voice Command Agent.
                    Map the user's spoken command to one of the following JSON actions.
                    
                    Actions:
                    1. "start_session": { "type": "start_session", "params": { "mode": "run" | "walk" | "bike" } }
                       - Triggers: "start run", "let's go for a walk", "bike ride", "start tracking"
                    
                    2. "logout": { "type": "logout", "params": {} }
                       - Triggers: "log out", "sign out"
                    
                    3. "navigate": { "type": "navigate", "params": { "path": string } }
                       - Triggers: "go to journal", "open settings", "show friends", "leaderboard"
                       - Paths: "/dashboard/journal", "/dashboard/settings", "/dashboard/friends", "/dashboard/leaderboard", "/dashboard/fasting"

                    4. "unknown": { "type": "unknown", "params": { "message": string } }
                       - Use this if the intent is unclear. The message should be a polite reply like "I didn't catch that."

                    Return ONLY the JSON object. Do not wrap in markdown.`
                },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const actionJson = completion.choices[0].message.content;
        const action = actionJson ? JSON.parse(actionJson) : { type: "unknown", params: { message: "Parsing error" } };

        return NextResponse.json({ text, action });

    } catch (error: any) {
        console.error("Voice API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
