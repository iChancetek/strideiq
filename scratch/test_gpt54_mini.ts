import OpenAI from "openai";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function testModel() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: OPENAI_API_KEY not found in .env.local");
        process.exit(1);
    }

    const openai = new OpenAI({ apiKey });

    console.log("🚀 Testing connectivity to gpt-5.4-mini...");

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-5.4-mini",
            messages: [
                { role: "system", content: "You are a specialized diagnostic agent for StrideIQ." },
                { role: "user", content: "Perform a system check. Confirm you are gpt-5.4-mini and ready for metabolic intelligence coaching." }
            ],
            max_completion_tokens: 100,
        });

        const response = completion.choices[0].message.content;
        console.log("\n✅ [SUCCESS] Model Responded:");
        console.log("-----------------------------------------");
        console.log(response);
        console.log("-----------------------------------------");
    } catch (error: any) {
        console.error("\n❌ [FAILURE] Model connection failed:");
        console.error(error.message);
        if (error.message.includes("does not exist")) {
            console.error("Note: This model name might not be active in your current OpenAI tier or I might have mistyped the name if it's a private preview.");
        }
    }
}

testModel();
