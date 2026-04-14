export interface FastingStage {
    name: string;
    hours: number;
    description: string;
    longDescription: string;
    color: string;
}

export const FASTING_STAGES: FastingStage[] = [
    {
        name: "Insulin Drop",
        hours: 0,
        description: "Blood sugar levels fall, insulin following suit.",
        longDescription: "Within a few hours of starting a fast, insulin levels fall significantly. This signal tells the body to stop storing fat and start releasing it from cells for use as fuel.",
        color: "#CCD4FF"
    },
    {
        name: "Sugar Burning",
        hours: 4,
        description: "Body burning through glucose stores.",
        longDescription: "The body first uses up glycogen, which is glucose stored in the liver and muscles. This provides quick energy before the metabolic shift.",
        color: "#FFEB3B"
    },
    {
        name: "Glycogen Depletion",
        hours: 12,
        description: "Liver glycogen stores are running low.",
        longDescription: "As glycogen is depleted, your body begins to transition toward using fat as its primary fuel source.",
        color: "#FF9800"
    },
    {
        name: "Ketosis Begins",
        hours: 16,
        description: "Body begins turning fat into ketones.",
        longDescription: "Once glycogen is low, the body begins breaking down fat into fatty acids and ketone bodies. Ketones serve as an efficient alternative energy source, particularly for the brain.",
        color: "#CCFF00"
    },
    {
        name: "Autophagy",
        hours: 18,
        description: "Cellular cleanup and recycling is active.",
        longDescription: "Fasting triggers a 'cellular cleanup' process called autophagy. The body identifies and recycles damaged or old cellular components, turning 'junk' into raw materials for new cells.",
        color: "#00E5FF"
    },
    {
        name: "Deep Ketosis / Growth",
        hours: 24,
        description: "HGH levels increase and fat burn peaks.",
        longDescription: "Levels of human growth hormone (HGH) increase significantly during fasting, which helps preserve muscle mass and regulate metabolism. Fat burning is now the primary energy engine.",
        color: "#7E57C2"
    }
];

export function getFastingStage(elapsedHours: number): FastingStage {
    // Find the current stage (the last one where hours <= elapsedHours)
    let current = FASTING_STAGES[0];
    for (const stage of FASTING_STAGES) {
        if (elapsedHours >= stage.hours) {
            current = stage;
        } else {
            break;
        }
    }
    return current;
}
