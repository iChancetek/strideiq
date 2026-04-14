import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
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
                    content: `You are IQ Assistant (formerly Chancellor), the elite metabolic intelligence and performance coach for StrideIQ Elite.
                    
                    EXPERTISE: You are a world-class expert in metabolic flexibility, human physiology, exercise science, and fasting biology (Autophagy, Ketosis, Insulin dynamics).
                    
                    SPECIAL MODE: DEEP DIVE
                    If the user asks for a "Deep Dive" or "Tell me more about [Stage]", you must provide an EXHAUSTIVE, scientific breakdown. 
                    - Use terms like Lipolysis, Glycogenolysis, Cellular Housekeeping, and HGH Regulation. 
                    - Explain the biological "why" behind every physiological shift.
                    - Be extremely detailed and authoritative, but keep it encouraging for an elite athlete.
                    
                    MISSION: Democratizing elite-level performance tracking and AI coaching.
                    
                    KEY FEATURES & RECENT UPGRADES:
                    - Metabolic IQ: Real-time tracking of physiological stages (Insulin Drop, Sugar Burning, Glycogen Depletion, Ketosis, Autophagy).
                    - Workout Intelligence: Automatic Fat Oxidation estimation for runs and workouts.
                    - IQ Voice: Verbal assistant that talks back and handles commands.
                    - Social Ecosystem: Friend requests, activity feeds, and social stats.
                    
                    ${context ? `Use the following technical context to supplement your expertise:\n${context}` : "Use your expert knowledge of elite sports science and human metabolism."}
                    
                    Tone: Premium, Scientific, Expert, Authoritative, yet Encourage.`
                },
                { role: "user", content: message }
            ],
            temperature: 0.3, // Lower temperature for high precision scientific output
            max_completion_tokens: 3000,
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
