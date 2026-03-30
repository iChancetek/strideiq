import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getPineconeIndex } from "@/lib/pinecone";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // 1. Generate embedding for query
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message,
        });
        const embedding = embeddingResponse.data[0].embedding;

        // 2. Query Pinecone
        const index = getPineconeIndex();
        console.log("Querying Pinecone index: strideiq-9hr81y6");
        const queryResponse = await index.query({
            vector: embedding,
            topK: 3,
            includeMetadata: true,
        });

        const context = queryResponse.matches
            .map((match: any) => match.metadata?.text)
            .filter(Boolean)
            .join("\n\n");

        if (!context) {
          console.warn("No context found in Pinecone for message:", message);
        }

        // 3. Prompt GPT-5.3
        console.log("Calling GPT-5.3...");
        const completion = await openai.chat.completions.create({
            model: "gpt-5.3",
            messages: [
                {
                    role: "system",
                    content: `You are Chancellor, the official AI Assistant for StrideIQ Elite. 
                    Your goal is to answer questions about the platform accurately and politely using the provided context.
                    If the answer isn't in the context, say you don't know but offer to help with general fitness topics.
                    StrideIQ Tagline: Intelligent Movement. Agentic Performance.
                    
                    Context:
                    ${context || "No specific platform documentation found for this query."}`
                },
                { role: "user", content: message }
            ],
            temperature: 0.7,
        });

        return NextResponse.json({ response: completion.choices[0].message.content });

    } catch (error: any) {
        console.error("Chancellor API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
