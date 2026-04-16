"use client";

import { useEffect } from "react";
import { StepAgent } from "@/lib/agents/step-agent";

export function StepTrackerInit() {
    useEffect(() => {
        const initAgent = async () => {
            const agent = StepAgent.getInstance();
            await agent.init();
        };
        initAgent();
    }, []);

    return null;
}
