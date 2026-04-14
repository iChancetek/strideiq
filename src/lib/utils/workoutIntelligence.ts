export interface MetabolicInsight {
    label: string;
    description: string;
    value: string;
    color: string;
}

export function getWorkoutMetabolicInsight(type: string, pace: string, durationSeconds: number): MetabolicInsight {
    const isRunning = type.toLowerCase().includes("run");
    const isWalking = type.toLowerCase().includes("walk");
    const isCycling = type.toLowerCase().includes("bike");

    // Convert pace string (e.g., "8:30 /mi") to seconds
    const paceMatch = pace.match(/(\d+):(\d+)/);
    const paceSeconds = paceMatch ? parseInt(paceMatch[1]) * 60 + parseInt(paceMatch[2]) : 600;

    if (isWalking) {
        return {
            label: "Fat Oxidation",
            value: "High",
            description: "Steady state movement at this duration maximizes fatty acid mobilization and metabolic flexibility.",
            color: "#CCFF00"
        };
    }

    if (isRunning) {
        if (paceSeconds > 540) { // Slower than 9:00/mi
            return {
                label: "Fat Burning",
                value: "High",
                description: "Aerobic zone 2. Your body is primarily utilizing lipolysis (fat stores) for sustained energy.",
                color: "#CCFF00"
            };
        } else if (paceSeconds < 420) { // Faster than 7:00/mi
            return {
                label: "Glycolytic Power",
                value: "Peak",
                description: "High intensity anaerobic output. Focus switched to glucose for rapid ATP production.",
                color: "#FF5252"
            };
        } else {
            return {
                label: "Cardiovascular Stress",
                value: "Moderate",
                description: "Balanced metabolic state. Improving V02 Max and heart-lung efficiency.",
                color: "#00E5FF"
            };
        }
    }

    if (isCycling) {
        return {
            label: "Mitochondrial Benefit",
            value: "Significant",
            description: "Extended duration cycling enhances mitochondrial density and muscular endurance.",
            color: "#7E57C2"
        };
    }

    return {
        label: "Elite Recovery",
        value: "Active",
        description: "Promoting blood flow and clearing metabolic waste products from muscle tissue.",
        color: "#CCD4FF"
    };
}
