import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "placeholder",
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const INDEX_NAME = "strideiq-9hr81y6";

const PLATFORM_DATA = [
    {
        id: "hero",
        text: "StrideIQ is the world's first Agentic Fitness System, powered by a swarm of intelligent, autonomous agents working in harmony to optimize health. It features real-time coaching and predictive recovery.",
    },
    {
        id: "active-performance",
        text: "Active Performance tracking includes multi-sport modes for running, walking, biking, and HIIT. It provides live telemetry for pace, distance, heart rate zones, and calorie burn, along with step dynamics for stride count and cadence.",
    },
    {
        id: "intelligent-training",
        text: "Intelligent Training features adaptive plans (8-16 weeks) for various race distances, an AI Coach providing real-time audio cues and post-workout analysis, and progress analytics for training load and consistency.",
    },
    {
        id: "wellness-recovery",
        text: "Wellness and Recovery tools include a Guided Meditation agent for focus and sleep, a Fasting Tracker with cloud sync (16:8 and custom), and a Cognitive Journal with AI tone adjustment and grammar fix.",
    },
    {
        id: "social-community",
        text: "Social Community features allow users to follow friends, compete on weekly distance and step leaderboards, and share media to a real-time social feed.",
    },
    {
        id: "platform-experience",
        text: "StrideIQ is an installable PWA with dark and light modes, cloud synchronization, and secure encryption. It's built as a native-feeling elite-level multimodal platform.",
    },
    {
        id: "model-info",
        text: "StrideIQ Elite is powered by the GPT-5.2 architecture, providing state-of-the-art agentic performance across all features.",
    }
];

export async function GET() {
    try {
        console.log(`[Ingest] Starting ingestion for index: ${INDEX_NAME}`);
        const index = pc.index(INDEX_NAME);

        for (const item of PLATFORM_DATA) {
            console.log(`[Ingest] Processing: ${item.id}`);
            
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: item.text,
            });

            const embedding = embeddingResponse.data[0].embedding;

            await index.upsert({
                records: [{
                    id: item.id,
                    values: embedding,
                    metadata: {
                        text: item.text,
                        source: "platform-documentation"
                    }
                }]
            });
        }

        console.log("[Ingest] Ingestion complete.");
        return NextResponse.json({ success: true, count: PLATFORM_DATA.length });

    } catch (error: any) {
        console.error("[Ingest] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
