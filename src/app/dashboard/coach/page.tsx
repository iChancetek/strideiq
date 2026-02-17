"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AICoach from "@/components/dashboard/AICoach";

export default function CoachPage() {
    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1 style={{ marginBottom: "20px" }}>AI Performance Coach</h1>
                <AICoach />
            </div>
        </DashboardLayout>
    );
}
