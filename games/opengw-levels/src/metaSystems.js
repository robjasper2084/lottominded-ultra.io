const SETTINGS_KEY = "2084-static-wave-settings-v1";
const PROFILE_KEY = "2084-static-wave-profile-v1";
const MODE_KEY = "2084-static-wave-mode-v1";
const DIFFICULTY_KEY = "2084-static-wave-difficulty-v1";

export const GAME_MODES = {
  campaign: { label: "Campaign", note: "Clear all 12 sectors", scoreScale: 1 },
  endless: { label: "Endless", note: "Escalating sectors without a ceiling", scoreScale: 1.15 },
  timeAttack: { label: "Time Attack", note: "Three minutes. Score everything.", scoreScale: 1.2, timeLimit: 180 },
  daily: { label: "Daily Signal", note: "One seeded challenge per day", scoreScale: 1.3 }
};

export const DIFFICULTIES = {
  easy: { label: "Easy", quota: 0.78, speed: 0.86, hp: 0.82, score: 0.82, lives: 2 },
  normal: { label: "Normal", quota: 1, speed: 1, hp: 1, score: 1, lives: 0 },
  hard: { label: "Hard", quota: 1.18, speed: 1.14, hp: 1.2, score: 1.35, lives: -1 }
};

export const ACHIEVEMENTS = {
  firstRun: { label: "Signal Initiate", note: "Complete a run" },
  firstBoss: { label: "Crown Breaker", note: "Destroy a boss signal" },
  coop: { label: "Squad Frequency", note: "Launch with two or more pilots" },
  noBomb: { label: "Cold Trigger", note: "Finish without using a bomb" },
  highScore: { label: "Five Digit Mind", note: "Score 50,000 points" },
  victory: { label: "Static Sovereign", note: "Clear the campaign" }
};

export const DEFAULT_SETTINGS = {
  music: 0.78,
  sfx: 0.9,
  effects: 0.82,
  shake: 0.78,
  colorMode: "standard",
  controlPreset: "classic",
  graphicsPreset: "auto",
  dynamicResolution: true,
  haptics: true,
  tutorial: true
};

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_KEY, {}) };
}

export function saveSettings(settings) {
  writeJson(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...settings });
}

export function loadProfile() {
  const stored = readJson(PROFILE_KEY, {});
  return {
    xp: Math.max(0, Number(stored.xp) || 0),
    rank: Math.max(1, Number(stored.rank) || 1),
    medals: Math.max(0, Number(stored.medals) || 0),
    runs: Math.max(0, Number(stored.runs) || 0),
    bosses: Math.max(0, Number(stored.bosses) || 0),
    tutorialComplete: Boolean(stored.tutorialComplete),
    achievements: Array.isArray(stored.achievements) ? [...new Set(stored.achievements.filter((id) => ACHIEVEMENTS[id]))] : [],
    bestByMode: stored.bestByMode && typeof stored.bestByMode === "object" ? stored.bestByMode : {}
  };
}

export function saveProfile(profile) {
  writeJson(PROFILE_KEY, profile);
}

export function loadMode() {
  const value = readText(MODE_KEY, "campaign");
  return GAME_MODES[value] ? value : "campaign";
}

export function saveMode(value) {
  writeText(MODE_KEY, GAME_MODES[value] ? value : "campaign");
}

export function loadDifficulty() {
  const value = readText(DIFFICULTY_KEY, "normal");
  return DIFFICULTIES[value] ? value : "normal";
}

export function saveDifficulty(value) {
  writeText(DIFFICULTY_KEY, DIFFICULTIES[value] ? value : "normal");
}

export function dailySeed(date = new Date()) {
  const stamp = Number(`${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`);
  return (stamp ^ 0x2084c0de) >>> 0;
}

export function awardRun(profile, summary) {
  const next = { ...profile, achievements: [...profile.achievements], bestByMode: { ...profile.bestByMode } };
  const unlocked = [];
  const achievementIds = [];
  const target = Math.max(12000, summary.level * 9000);
  const performance = summary.score / target + (summary.victory ? 0.8 : 0) + Math.min(0.35, summary.lives * 0.06);
  const grade = performance >= 2.1 ? "S" : performance >= 1.45 ? "A" : performance >= 0.9 ? "B" : "C";
  const medal = summary.score > 0 ? (grade === "S" ? 3 : grade === "A" ? 2 : 1) : 0;
  const xp = Math.max(20, Math.round(summary.score / 240 + summary.level * 42 + summary.bosses * 180 + (summary.victory ? 500 : 0)));
  const previousRank = next.rank;
  next.xp += xp;
  next.rank = Math.max(1, 1 + Math.floor(next.xp / 900));
  next.medals += medal;
  next.runs += 1;
  next.bosses += summary.bosses;
  next.bestByMode[summary.mode] = Math.max(Number(next.bestByMode[summary.mode]) || 0, summary.score);

  const earn = (id, condition) => {
    if (!condition || next.achievements.includes(id)) return;
    next.achievements.push(id);
    achievementIds.push(id);
  };
  earn("firstRun", summary.score >= 1000 || summary.victory);
  earn("firstBoss", summary.bosses > 0);
  earn("coop", summary.players > 1 && summary.score >= 5000);
  earn("noBomb", summary.bombsUsed === 0 && summary.score >= 5000);
  earn("highScore", summary.score >= 50000);
  earn("victory", summary.victory);

  for (let rank = previousRank + 1; rank <= next.rank; rank += 1) {
    if (rank === 2) unlocked.push("Pulse Cannon II");
    if (rank === 4) unlocked.push("Tri-Lance Cannons");
    if (rank === 6) unlocked.push("Nova Hull Aura");
  }
  saveProfile(next);
  return { profile: next, grade, medal, xp, achievements: achievementIds, unlocked };
}

export function createLeaderboardService(endpoint = "") {
  const base = String(endpoint || "").trim().replace(/\/$/, "");
  return {
    configured: Boolean(base),
    async list(limit = 5) {
      if (!base) return { online: false, scores: [] };
      const response = await fetch(`${base}?limit=${Math.max(1, Math.min(20, limit))}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Leaderboard failed: ${response.status}`);
      const payload = await response.json();
      const scores = Array.isArray(payload) ? payload : payload.scores;
      return { online: true, scores: Array.isArray(scores) ? scores.map(normalizeRemoteScore).filter(Boolean).slice(0, limit) : [] };
    },
    async submit(score) {
      if (!base) return { online: false };
      const response = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(normalizeRemoteScore(score))
      });
      if (!response.ok) throw new Error(`Score submit failed: ${response.status}`);
      return { online: true };
    }
  };
}

function normalizeRemoteScore(entry) {
  if (!entry || typeof entry !== "object") return null;
  const score = Math.max(0, Math.floor(Number(entry.score) || 0));
  if (!score) return null;
  return {
    name: String(entry.name || "PILOT").replace(/[^a-z0-9 _-]/gi, "").slice(0, 14) || "PILOT",
    score,
    players: Math.max(1, Math.min(4, Math.round(Number(entry.players) || 1))),
    level: Math.max(1, Math.round(Number(entry.level) || 1)),
    mode: GAME_MODES[entry.mode] ? entry.mode : "campaign",
    grade: /^[SABC]$/.test(entry.grade) ? entry.grade : "C",
    timestamp: Number(entry.timestamp) || Date.now()
  };
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is optional in privacy modes.
  }
}

function readText(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeText(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Persistence is optional in privacy modes.
  }
}
