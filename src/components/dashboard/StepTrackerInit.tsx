"use client";

import { useEffect, useState } from "react";
import { StepAgent } from "@/lib/agents/step-agent";

export function StepTrackerInit() {
    const [needsPermission, setNeedsPermission] = useState(false);

    useEffect(() => {
        const initAgent = async () => {
            const agent = StepAgent.getInstance();
            const result = await agent.init();
            if (result.needsPermission && !localStorage.getItem("step_agent_permission_dismissed")) {
                setNeedsPermission(true);
            }
        };
        initAgent();
    }, []);

    if (!needsPermission) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--background-secondary)",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            border: "1px solid rgba(255,255,255,0.1)",
            width: "max-content",
            maxWidth: "90vw"
        }}>
            <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px" }}>👣 Enable Step Tracking</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--foreground-muted)" }}>
                    Allow pedometer sensor access for background steps.
                </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
                <button
                    onClick={() => {
                        localStorage.setItem("step_agent_permission_dismissed", "true");
                        setNeedsPermission(false);
                    }}
                    style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "600"
                    }}
                >
                    Dismiss
                </button>
                <button
                    onClick={async () => {
                        const success = await StepAgent.getInstance().requestPermission();
                        if (success) setNeedsPermission(false);
                    }}
                    style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "var(--primary)",
                        border: "none",
                        color: "black",
                        fontSize: "12px",
                        fontWeight: "600"
                    }}
                >
                    Allow
                </button>
            </div>
        </div>
    );
}
