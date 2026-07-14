export const BEAT2LOTTO_CREDIT_ACTIONS = {
  "beat2lotto.premium-number-conversion": 10,
  "beat2lotto.rhythm-sequence-analysis": 15,
  "beat2lotto.advanced-number-visualization": 20,
  "beat2lotto.ai-beat-interpretation": 20,
} as const;

export type Beat2LottoCreditAction = keyof typeof BEAT2LOTTO_CREDIT_ACTIONS;

export const BEAT2LOTTO_FEATURES = {
  basicWorkspace: { access: "free" },
  standardNumberGeneration: { access: "free" },
  additionalSavedDrops: { access: "membership" },
  premiumMissionVisualizer: { access: "membership" },
  collectorCircuitTheme: { access: "collector" },
  collectorProjectBadge: { access: "collector" },
  premiumNumberConversion: { access: "credits", action: "beat2lotto.premium-number-conversion" },
  rhythmSequenceAnalysis: { access: "credits", action: "beat2lotto.rhythm-sequence-analysis" },
  advancedNumberVisualization: { access: "credits", action: "beat2lotto.advanced-number-visualization" },
} as const;

