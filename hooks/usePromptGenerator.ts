export type SignalGame = "pick3" | "pick4" | "cash5" | "powerball-style" | "powerballStyle";

export function buildSunoPrompt(input: { idea?: string; mood?: string; bpm?: string }) {
  const idea = input.idea?.trim() || "mystical LottoMind signal beat";
  const mood = input.mood?.trim() || "cinematic Detroit soul, futuristic R&B, gold neon atmosphere";
  const bpm = input.bpm?.trim() || "88";
  return `Style: ${mood}. Tempo: ${bpm} BPM. Create a polished song around: ${idea}. Use warm bass, crisp drums, soulful hooks, cinematic pads, and a memorable chorus. Add call-and-response background vocals. Keep it premium, mystical, and motion-ready for LottoMind visuals.`;
}

export function buildVideoPrompt(input: { subject?: string; location?: string; motion?: string }) {
  const subject = input.subject?.trim() || "a glowing LottoMind prompt console";
  const location = input.location?.trim() || "dark luxury studio with gold signal rings";
  const motion = input.motion?.trim() || "slow orbital camera, light sweeps, particle trails";
  return `${subject} inside ${location}. ${motion}. Cinematic black and gold palette, neon violet accents, glass UI panels, floating prompt cards, volumetric haze, premium tech-luxury mood, high-detail 4K, no copied external logos or assets.`;
}

export function buildCreativeSignals(seedText: string, game: SignalGame = "pick4") {
  const gameKey = game === "powerballStyle" ? "powerball-style" : game;
  const maxes = gameKey === "pick3" ? [9,9,9] : gameKey === "pick4" ? [9,9,9,9] : gameKey === "cash5" ? [39,39,39,39,39] : [69,69,69,69,69,26];
  let seed = Array.from(seedText || "LottoMind").reduce((a, c) => a + c.charCodeAt(0), 0) % 9973;
  const next = (max: number) => { seed = (seed * 9301 + 49297) % 233280; return 1 + (seed % max); };
  return maxes.map(next);
}
