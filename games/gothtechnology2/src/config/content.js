export const ROSTER_IDS = ["KALYX", "MASTER_EZRA", "DETROIT_LENS_NOIR", "AMARA_VALENTINE"];

export const ROSTER_CARD_LAYOUT = [
  { x: 36, y: 142, w: 286, h: 382 },
  { x: 343, y: 142, w: 286, h: 382 },
  { x: 650, y: 142, w: 286, h: 382 },
  { x: 957, y: 142, w: 286, h: 382 }
];

export const GAME_MODES = {
  versus: { label: "VERSUS", roundsToWin: 2 },
  arcade: { label: "ARCADE", roundsToWin: 2 },
  training: { label: "TRAINING", roundsToWin: 0 },
  replay: { label: "REPLAY", roundsToWin: 2 }
};

export const STAGES = [
  {
    id: "forest-ruin",
    name: "FOREST RUIN",
    backgroundKey: "background",
    legacyLayers: true,
    grade: ["rgba(0,0,0,0.72)", "rgba(0,0,0,0.16)", "rgba(0,0,0,0.78)"],
    fogAlpha: 0.2,
    emberAlpha: 0.18
  },
  {
    id: "detroit-midnight-mile",
    name: "DETROIT MIDNIGHT MILE",
    backgroundKey: "detroitMidnightMile",
    legacyLayers: false,
    grade: ["rgba(2,9,22,0.2)", "rgba(30,72,96,0.04)", "rgba(0,2,8,0.58)"],
    fogAlpha: 0.08,
    emberAlpha: 0.03
  },
  {
    id: "motor-city-assembly",
    name: "MOTOR CITY ASSEMBLY",
    backgroundKey: "motorCityAssembly",
    legacyLayers: false,
    grade: ["rgba(3,12,16,0.18)", "rgba(80,16,12,0.035)", "rgba(0,3,5,0.62)"],
    fogAlpha: 0.06,
    emberAlpha: 0.14
  },
  {
    id: "detroit-riverfront",
    name: "DETROIT RIVERFRONT",
    backgroundKey: "detroitRiverfront",
    legacyLayers: false,
    grade: ["rgba(3,10,24,0.12)", "rgba(28,60,86,0.025)", "rgba(0,3,10,0.42)"],
    fogAlpha: 0.04,
    emberAlpha: 0.01
  },
  {
    id: "eastern-market-after-dark",
    name: "EASTERN MARKET AFTER DARK",
    backgroundKey: "easternMarketAfterDark",
    legacyLayers: false,
    grade: ["rgba(4,7,18,0.18)", "rgba(82,22,18,0.035)", "rgba(0,2,8,0.52)"],
    fogAlpha: 0.07,
    emberAlpha: 0.04
  },
  {
    id: "michigan-central-concourse",
    name: "MICHIGAN CENTRAL CONCOURSE",
    backgroundKey: "michiganCentralConcourse",
    legacyLayers: false,
    grade: ["rgba(20,9,3,0.08)", "rgba(80,48,28,0.02)", "rgba(4,2,1,0.38)"],
    fogAlpha: 0.025,
    emberAlpha: 0.01
  }
];

export const ARCADE_LADDER = ["MASTER_EZRA", "DETROIT_LENS_NOIR", "AMARA_VALENTINE", "KALYX"];

export const arcadeRouteFor = (playerId) => {
  const rivals = ROSTER_IDS.filter((id) => id !== playerId);
  const finalBossId = playerId === "KALYX" ? "AMARA_VALENTINE" : "KALYX";
  return [
    { opponentId: rivals[0], stageIndex: 1, label: "MIDNIGHT QUALIFIER", difficulty: "easy" },
    { opponentId: rivals[1], stageIndex: 2, label: "ASSEMBLY INTERCEPT", difficulty: "normal" },
    { opponentId: rivals[2], stageIndex: 3, label: "RIVERFRONT RIVAL", difficulty: "normal" },
    { opponentId: playerId, stageIndex: 4, label: "MIRROR PROTOCOL", difficulty: "hard" },
    { opponentId: finalBossId, stageIndex: 5, label: "CENTRAL TERMINUS BOSS", difficulty: "hard", boss: true }
  ];
};

const commonCommands = [
  { input: "BACK", name: "GUARD", detail: "Hold away. Add DOWN for low guard." },
  { input: "DASH", name: "BURST STEP", detail: "Dash button or double-tap a direction." },
  { input: "LP + HP", name: "CHAIN I", detail: "Fast two-hit route." },
  { input: "LP + LK", name: "CHAIN II", detail: "Low-to-mid route." },
  { input: "THROW / MOD+LP", name: "THROW / TECH", detail: "Use close; match an incoming throw to tech." },
  { input: "A1/A2 / MOD+LK/HK", name: "ASSISTS", detail: "Call an assist; each slot has its own cooldown." },
  { input: "TAUNT / MOD+SP", name: "TAUNT", detail: "Gain a small amount of meter while exposed." }
];

export const COMMAND_LISTS = {
  KALYX: {
    title: "SHADOW RUSHDOWN",
    passive: "Air dash once per jump. Forward dash briefly evades attacks.",
    commands: [
      ...commonCommands,
      { input: "DOWN + SP", name: "SHADOW STEP", detail: "Spend meter to cross through the opponent." },
      { input: "SP", name: "SHADOW RAVEN STRIKE", detail: "Launch a six-frame raven dive across the arena." },
      { input: "MAX / MOD+HP", name: "SHADOW ROAR", detail: "Three-hit rushing super." }
    ]
  },
  MASTER_EZRA: {
    title: "BLUE CONTROL",
    passive: "Long perfect-guard window and stronger meter gain on defense.",
    commands: [
      ...commonCommands,
      { input: "DOWN + SP", name: "ARCANE PARRY", detail: "Spend meter to repel the next strike or projectile." },
      { input: "SP", name: "ARCANE OWL DIVE", detail: "Launch a six-frame owl that controls the mid-range." },
      { input: "MAX / MOD+HP", name: "SKY JUDGMENT", detail: "Heavy space-control super." }
    ]
  },
  DETROIT_LENS_NOIR: {
    title: "MIDNIGHT GUARDIAN",
    passive: "The Boerboel controls the ground while Guardian Intercept stops close pressure.",
    commands: [
      ...commonCommands,
      { input: "DOWN + SP", name: "GUARDIAN INTERCEPT", detail: "Spend meter to call a close Boerboel counter." },
      { input: "SP", name: "BOERBOEL RUSH", detail: "Send the Boerboel sprinting into a leap-and-bite attack." },
      { input: "MAX / MOD+HP", name: "RED-EYE EXPOSURE", detail: "Fire a three-hit ruby laser through the glasses." }
    ]
  },
  AMARA_VALENTINE: {
    title: "HEARTLINE VANGUARD",
    passive: "Charm slows movement. Amara's next clean strike consumes it for a Heartlink damage bonus.",
    commands: [
      ...commonCommands,
      { input: "DOWN + SP", name: "CHARM COUNTER", detail: "Arm a brief counter. A successful parry pulls and charms the attacker." },
      { input: "SP", name: "HEARTLINE PULSE", detail: "Launch a rose pulse that pulls and charms its target." },
      { input: "MAX / MOD+HP", name: "HEARTBREAK NOVA", detail: "Release a multi-hit love nova that launches the target away." }
    ]
  }
};

export const opponentFor = (playerId, offset = 0) => {
  const options = ROSTER_IDS.filter((id) => id !== playerId);
  return options[((offset % options.length) + options.length) % options.length];
};
