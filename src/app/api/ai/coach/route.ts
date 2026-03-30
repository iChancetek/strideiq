import { OpenAI } from "openai";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { activityId } = await req.json();

    if (!activityId) {
      return NextResponse.json({ error: "Missing activityId" }, { status: 400 });
    }

    // 1. Fetch Activity Details
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId));

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // 2. GPT-5.3 Analysis
    const response = await openai.chat.completions.create({
      model: "gpt-5.3",
      messages: [
        {
          role: "system",
          content: `You are the StrideIQ Elite AI Coach. You specialize in high-performance athletic training and metabolic wellness.
          Provide structured, elite-level feedback on the following workout data. 
          Focus on:
          1. Technical efficiency (pace consistency, splits analysis).
          2. Metabolic impact (intensity, recovery).
          3. Actionable insights for the next session.
          
          Format your response as a JSON object with:
          - feedback (string, summary)
          - score (number, 1-100)
          - insights (array of string, 3 items)
          - model (string, "GPT-5.3")`
        },
        {
          role: "user",
          content: `Analyze this workout: ${JSON.stringify(activity)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");

    // 3. Save Analysis back to DB
    await db.update(activities)
      .set({
        aiAnalysis: {
          ...analysis,
          analyzedAt: new Date().toISOString()
        }
      })
      .where(eq(activities.id, activityId));

    return NextResponse.json({ success: true, analysis });

  } catch (err: any) {
    console.error("AI Coaching Error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze activity" }, { status: 500 });
  }
}
