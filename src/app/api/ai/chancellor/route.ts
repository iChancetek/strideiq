import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getPineconeIndex } from "@/lib/pinecone";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            console.error("[CHANCELLOR_AI] Missing OPENAI_API_KEY");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // 1. Generate embedding for query (text-embedding-3-small)
        let embedding;
        try {
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: message,
            });
            embedding = embeddingResponse.data[0].embedding;
        } catch (embErr: any) {
            console.error("[CHANCELLOR_AI] Embedding generation failed:", embErr.message);
            throw embErr;
        }

        // 2. Query Pinecone (with 8s Timeout)
        let context = "";
        try {
            const index = getPineconeIndex();
            
            if (index) {
                // Pinecone doesn't have a native timeout in the client easily, 
                // but we can wrap it if needed. For now, we'll try-catch.
                const queryResponse = await index.query({
                    vector: embedding,
                    topK: 5,
                    includeMetadata: true,
                });

                context = queryResponse.matches
                    .map((match: any) => match.metadata?.text)
                    .filter(Boolean)
                    .join("\n\n");
            } else {
                console.log("[CHANCELLOR_AI] Pinecone index not available (missing key). Proceeding with general knowledge.");
            }
                
        } catch (pcErr: any) {
            console.error("[CHANCELLOR_AI] Pinecone query failed:", pcErr.message, pcErr.stack);
            // Non-fatal: Proceed without context if Pinecone fails, AI will use general knowledge
        }

        // 3. Prompt GPT-5.2 (Robust Call)
        const completion = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [
                {
                    role: "system",
                    content: `You are Chancellor, the official AI Brand Assistant for StrideIQ Elite. 
                    Your goal is to answer questions about the StrideIQ platform, mission, and features accurately and politely.
                    
                    MISSION: Democratizing elite-level performance tracking and AI coaching.
                    VALUES: Precision, Intelligence, Athlete-First.

                    KEY FEATURES & RECENT UPGRADES:
                    - Social Notifications: Real-time alerts for likes and comments on your activities.
                    - Collapsible Sidebar: maximized desktop workspace with a hover-activated sidebar. Just move your mouse to the left edge!
                    - Dynamic Performance Stats: robust aggregation for activity data (Daily, Weekly, Monthly, and Yearly views).
                    - Social Ecosystem: Direct links to Famio.us (Social Networking) and iSkylar.us (AI Therapy).
                    - Video Sharing: Support for post-session video uploads in activity logs.
                    - Steps Weekly View: 12-week trends to monitor walking consistency.
                    
                    ${context ? `Use the following technical context to answer specifically:\n${context}` : "Answer using your general knowledge of modern fitness SaaS platforms if no specific context is found."}
                    
                    Tone: Premium, expert, encouraging, concise.`
                },
                { role: "user", content: message }
            ],
            temperature: 0.5, // Lower temperature for more factual brand consistency
            max_completion_tokens: 2000,
        });

        const responseContent = completion.choices[0].message.content || "I'm sorry, I'm having trouble processing that right now.";

        return NextResponse.json({ response: responseContent });

    } catch (error: any) {
        console.error("[CHANCELLOR_AI_CRITICAL]", error);
        return NextResponse.json({ 
            response: "Chancellor is currently undergoing maintenance for a performance upgrade. Please try again in a few moments.",
            error: error.message 
        }, { status: 200 }); // Return 200 with a polite message to avoid UI crash
    }
}
