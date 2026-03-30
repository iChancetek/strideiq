import { OpenAI } from "openai";
import { db } from "@/db";
import { fastingSessions, activities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Fetch Session Details
    const [session] = await db
      .select()
      .from(fastingSessions)
      .where(eq(fastingSessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 2. GPT-5.3 Metabolic Analysis
    const response = await openai.chat.completions.create({
      model: "gpt-5.3",
      messages: [
        {
          role: "system",
          content: `You are the StrideIQ Elite Metabolic Coach. Analyze this completed fasting session.
          Provide structured, elite-level feedback.
          Focus on:
          1. Metabolic stage achieved (Autophagy, Ketosis, etc.).
          2. Hormonal impact (Insulin reset, Growth Hormone).
          3. Suggestions for the refeeding window.
          
          Format your response as a JSON object with:
          - feedback (string, summary)
          - score (number, 1-100)
          - insights (array of string, 3 items)
          - model (string, "GPT-5.3")`
        },
        {
          role: "user",
          content: `Analyze this fasting session: ${JSON.stringify(session)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");

    // 3. Update the Fasting Session record
    await db.update(fastingSessions)
      .set({
        aiAnalysis: {
          ...analysis,
          analyzedAt: new Date().toISOString()
        }
      })
      .where(eq(fastingSessions.id, sessionId));

    // 4. Also update the corresponding activity record if it exists
    await db.update(activities)
      .set({
        aiAnalysis: {
          ...analysis,
          analyzedAt: new Date().toISOString()
        }
      })
      .where(eq(activities.fastingSessionId, sessionId));

    return NextResponse.json({ success: true, analysis });

  } catch (err: any) {
    console.error("Fasting Analysis Error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze session" }, { status: 500 });
  }
}
