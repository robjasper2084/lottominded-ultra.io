(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  if (window.self !== window.top) document.body.classList.add("is-embedded");

  const W = 1280;
  const H = 720;
  const STEP = 1 / 60;
  const GRAVITY = 2350;
  const WORLD_W = 6500;
  const GATE_X = 4280;
  const BOSS_START_X = 5000;
  const EXTRACTION_X = 6180;
  const BOSS_NATIVE_FACING = {
    canopyDroneQueen: 1,
    jackpotForgeTitan: 1,
    midasHeartcoreOverlord: 1
  };
  const GATE_BLOCK_X_OFFSET = -48;
  const GATE_BLOCK_W = 184;
  const GATE_BLOCK_TOP = -120;
  const GATE_BLOCK_BOTTOM = 648;
  const STORAGE_KEY = "lottomind-vault-run-save-v1";
  const SETTINGS_KEY = "lottomind-vault-run-settings-v1";
  const QUERY = new URLSearchParams(window.location.search);
  const DEBUG = QUERY.has("debug");
  const LOCAL_STATIC_HOST = /^(127\.0\.0\.1|localhost)$/i.test(window.location.hostname);
  const REWARDS_DISABLED = LOCAL_STATIC_HOST && !QUERY.get("rewardsApi") && !window.LOTTOMIND_REWARDS_API_BASE_URL;
  const DRAW_DECORATIVE_WORLD_PROPS = false;
  const ACTIVE_STORAGE_KEY = DEBUG ? `${STORAGE_KEY}-debug` : STORAGE_KEY;
  const LOTTERY_STORAGE_KEY = DEBUG ? "lottomind-number-run-lottery-v1-debug" : "lottomind-number-run-lottery-v1";
  const LOTTERY_DISCLAIMER = "Random number generator - not an official lottery ticket or guarantee.";
  const GAME_MUSIC_SRC = "./assets/audio/digital-static-10.mp3";
  const MUSIC_TRACK_VERSION = "digital-static-10";
  const MENU_MUSIC_VOLUME = 0.46;
  const GAMEPLAY_MUSIC_VOLUME = 0.22;
  const BOSS_MUSIC_VOLUME = 0.28;
  const AMBIENT_MUSIC_VOLUME = 0.16;
  const SFX_GAIN_BOOST = 1.65;
  const REWARD_BUILD_ID = "shadow-ops-2026-06-25";
  let rewardClient = null;
  let rewardTask = Promise.resolve();
  let rewardRunKey = "";

  const ASSETS = {
    backplate: "./assets/backgrounds/higgsfield-soul-location-backplate.png",
    farParallax: "./assets/backgrounds/higgsfield-soul-location-far-parallax.png",
    foreground: "./assets/backgrounds/higgsfield-soul-location-foreground-ground.png",
    level1Bg: "./assets/backgrounds/higgsfield_photo_neon_jungle_bg_20260624.jpeg",
    level2Bg: "./assets/levels/level2_bg_far.webp",
    level3Bg: "./assets/levels/level3_bg_far.webp",
    level1Tiles: "./assets/levels/platform_tiles_level1_clean.png",
    level2Tiles: "./assets/levels/platform_tiles_level2_clean.png",
    level3Tiles: "./assets/levels/platform_tiles_level3_clean.png",
    bossCanopy: "./assets/bosses/canopy_drone_queen_cutout.png",
    bossCanopyMotion: "./assets/bosses/canopy_drone_queen_motion_v2_runtime_384.png",
    bossForge: "./assets/bosses/jackpot_forge_titan_cutout.png",
    bossForgeMotion: "./assets/bosses/jackpot_forge_titan_motion_v2_runtime_384.png",
    bossMidas: "./assets/bosses/midas_heartcore_overlord_cutout.png",
    bossMidasMotion: "./assets/bosses/midas_heartcore_overlord_motion_v2_runtime_384.png",
    levelFrame: "./assets/ui/level_card_frame.png",
    bossFrame: "./assets/ui/boss_health_frame.png",
    victoryBadge: "./assets/ui/final_victory_badge.png",
    hero: "./assets/hero/lottomind-hero-main.png",
    player: "./assets/mascot/lottomind-mascot-runner-atlas.png",
    enemyCrawler: "./assets/characters/enemy_crawler.png",
    crawlerWalk: "./assets/characters/higgsfield_robot_dog_walk_strip_runtime_v2.png",
    enemyDrone: "./assets/characters/enemy_drone.png",
    enemyShieldGuard: "./assets/characters/enemy_shield_guard.png",
    enemyTurret: "./assets/characters/enemy_turret.png",
    cannonTurretMotion: "./assets/characters/higgsfield_cannon_turret_motion_strip_runtime_v3.png",
    droneMotion: "./assets/characters/higgsfield_drone_motion_strip_runtime_v3.png",
    droneLaserOverlay: "./assets/characters/chatgpt_drone_laser_overlay_strip_runtime_v2.png",
    droneFx: "./assets/mission/chatgpt_drone_fx_strip_runtime_v4.png",
    shieldRobotMotion: "./assets/characters/chatgpt_shield_robot_mission_strip_runtime_v5.png",
    missionCollectibles: "./assets/mission/mission_collectibles_sheet_clean.png",
    missionPortal: "./assets/mission/extraction_portal_sheet.png",
    missionGate: "./assets/mission/vault_gate_sheet.png",
    cyberGateSheet: "./assets/mission/chatgpt_cyber_vault_gate_sheet_v1.png",
    missionPortalV2: "./assets/mission/robot_rahbe_portal_v2.png",
    missionGateV2: "./assets/mission/robot_rahbe_vault_gate_v2.png",
    powerupPack: "./assets/mission/robot_rahbe_powerups_v1.png",
    arenaGateV1: "./assets/mission/robot_rahbe_arena_gate_v1.png",
    undergroundGateLocked: "./assets/mission/robot_rahbe_underground_gate_v1_frames/01.png",
    undergroundGatePowered: "./assets/mission/robot_rahbe_underground_gate_v1_frames/02.png",
    undergroundGateOpen: "./assets/mission/robot_rahbe_underground_gate_v1_frames/03.png",
    floorLaserDormant: "./assets/mission/robot_rahbe_floor_laser_v1_frames/01.png",
    floorLaserCharge: "./assets/mission/robot_rahbe_floor_laser_v1_frames/02.png",
    floorLaserActive: "./assets/mission/robot_rahbe_floor_laser_v1_frames/03.png",
    verticalLaser: "./assets/mission/robot_rahbe_vertical_laser_v1.png",
    lotteryKiosk: "./assets/mission/robot_rahbe_lottery_kiosk_v1.png",
    solidVaultPanel: "./assets/mission/robot_rahbe_solid_panel_v1.png",
    missionBrandProps: "./assets/mission/branded_background_props_sheet.png",
    enemyMotion: "./assets/characters/higgsfield_enemy_motion_sheet_runtime.png",
    missionProps: "./assets/mission/higgsfield_missing_world_props_runtime_v3.png",
    fxSheet: "./assets/mission/higgsfield_separate_fx_repair_runtime_v4.png",
    gameplayFx: "./assets/mission/chatgpt_gameplay_fx_sheet_runtime_v2.png",
    missionBatchProps: "./assets/mission/higgsfield_batch_props_runtime_v3.png",
    missionBatchWorld: "./assets/mission/higgsfield_photo_world_retry_runtime_v3.png",
    missionBatchFx: "./assets/mission/higgsfield_batch_fx_retry_runtime_v3.png"
  };

  const LEVELS = [
    {
      id: 1,
      title: "NEON JUNGLE VAULT",
      shortName: "Neon Jungle",
      theme: "jungle",
      width: 6500,
      gateX: 4280,
      bossStartX: 5000,
      extractionX: 6180,
      lotteryTerminal: { x: 5960, y: 548, interactionRadius: 132, unlock: "boss-defeated" },
      boss: "canopyDroneQueen",
      bossName: "Canopy Drone Queen",
      bossImage: "bossCanopy",
      background: "level1Bg",
      tiles: "level1Tiles",
      objective: "Collect 3 jungle vault keys",
      music: { pulse: 110, boss: 82 },
      palette: { platform: "#171217", trim: "#ffd66d", glow: "#a522ff" },
      platforms: [
        [0, 620, 1380, 34, "entry"],
        [1500, 620, 960, 34, "conduit"],
        [2550, 620, 1080, 34, "canopy"],
        [3740, 620, 960, 34, "causeway"],
        [4800, 620, 1700, 34, "chamber"],
        [930, 500, 300, 28, "upper"],
        [1700, 455, 330, 28, "upper"],
        [2260, 500, 360, 28, "upper"],
        [2870, 470, 430, 28, "upper"],
        [3560, 482, 340, 28, "upper"],
        [3950, 420, 290, 28, "upper"],
        [4480, 505, 320, 28, "upper"],
        [5350, 485, 420, 28, "boss"]
      ],
      spawns: [
        ["crawler", 720, 620],
        ["drone", 1160, 405],
        ["turret", 1120, 500],
        ["shield", 1980, 620],
        ["crawler", 2380, 620],
        ["drone", 2810, 385],
        ["turret", 3090, 470],
        ["shield", 3520, 620],
        ["crawler", 3840, 620],
        ["drone", 4070, 390],
        ["shield", 4680, 620],
        ["turret", 4640, 505]
      ],
      waves: [
        {
          id: "jungle-canopy-pinch",
          triggerX: 1580,
          objective: "Canopy ambush incoming",
          spawns: [["crawler", 1980, 620], ["drone", 2260, 390], ["crawler", 2460, 620]]
        },
        {
          id: "jungle-gate-lock",
          triggerX: 3280,
          objective: "Gate sentries converging",
          spawns: [["shield", 3730, 620], ["drone", 3960, 370], ["crawler", 4220, 620]]
        }
      ],
      shardRows: [[420, 510, 4], [1010, 438, 4], [1580, 548, 5], [2270, 438, 4], [2740, 548, 5], [3180, 445, 4], [3780, 548, 5], [4520, 450, 4], [5200, 545, 5]],
      keys: [[1110, 438], [3060, 410], [4080, 360]],
      bonuses: [["health", 2140, 548], ["health", 4710, 548], ["overdrive", 3340, 548], ["shield", 2870, 420]],
      weaponDrops: [["spread", 1560, 548], ["rapid", 3820, 548], ["beam", 5230, 548]],
      hazards: [
        { type: "floor", x: 1810, y: 620, w: 230, h: 36, cycle: 2.7, active: 0.72, phase: 0.1 },
        { type: "floor", x: 3625, y: 620, w: 250, h: 36, cycle: 2.4, active: 0.65, phase: 1.1 }
      ],
      underground: {
        id: "rootline-underworks",
        title: "ROOTLINE UNDERWORKS",
        shortName: "Underworks",
        width: 2360,
        entrance: { x: 3895, y: 620, returnX: 3895, radius: 150 },
        spawn: { x: 126, y: 620 },
        exitX: 2200,
        objective: "Recover 3 rootline power cells",
        palette: { platform: "#121018", trim: "#ffd66d", glow: "#a522ff", fog: "#25123f" },
        platforms: [[0,620,580,34,"tunnel"],[700,560,420,30,"root"],[1220,620,560,34,"conduit"],[1900,620,460,34,"exit"],[420,466,300,28,"root"],[1030,430,340,28,"upper"],[1570,500,350,28,"upper"]],
        spawns: [["crawler",520,620],["drone",910,380],["turret",1640,500],["crawler",1840,620]],
        shardRows: [[300,548,4],[760,500,4],[1290,548,5],[1600,438,4]],
        cells: [[520,410],[1120,370],[1810,440]],
        bonuses: [["health",2070,548],["overdrive",1460,548]],
        weaponDrops: [["rapid",970,500]],
        hazards: [{ type: "floor", x: 630, y: 620, w: 150, h: 36, cycle: 2.3, active: 0.68, phase: 0.15 },{ type: "laser", x: 1430, y: 408, w: 32, h: 212, cycle: 3.0, active: 0.72, phase: 1.05 }],
        checkpoint: { x: 1120, y: 620 }
      }
    },
    {
      id: 2,
      title: "GOLDEN CIRCUIT FOUNDRY",
      shortName: "Circuit Foundry",
      theme: "foundry",
      width: 7200,
      gateX: 4850,
      bossStartX: 5580,
      extractionX: 6900,
      lotteryTerminal: { x: 6665, y: 548, interactionRadius: 132, unlock: "boss-defeated" },
      boss: "jackpotForgeTitan",
      bossName: "Jackpot Forge Titan",
      bossImage: "bossForge",
      background: "level2Bg",
      tiles: "level2Tiles",
      objective: "Collect 3 forge keys",
      music: { pulse: 138, boss: 74 },
      palette: { platform: "#1c1510", trim: "#ffce55", glow: "#ff4f9a" },
      platforms: [
        [0, 620, 1100, 34, "entry"],
        [1250, 620, 820, 34, "conveyor", { conveyor: 90 }],
        [2220, 585, 780, 34, "forge"],
        [3200, 620, 1080, 34, "conveyor", { conveyor: -75 }],
        [4440, 620, 780, 34, "gate"],
        [5400, 620, 1800, 34, "chamber"],
        [820, 478, 280, 28, "upper"],
        [1560, 430, 330, 28, "upper"],
        [2440, 455, 330, 28, "upper"],
        [3040, 380, 320, 28, "moving", { move: { axis: "y", amp: 76, speed: 1.1 } }],
        [3690, 470, 380, 28, "upper"],
        [4260, 405, 300, 28, "upper"],
        [5950, 468, 460, 28, "boss"]
      ],
      spawns: [
        ["crawler", 640, 620],
        ["shield", 1320, 620],
        ["turret", 1780, 430],
        ["drone", 2240, 360],
        ["shield", 2740, 585],
        ["turret", 3280, 380],
        ["shield", 3860, 620],
        ["drone", 4260, 390],
        ["turret", 4740, 620],
        ["shield", 5240, 620],
        ["shield", 5480, 620],
        ["turret", 6100, 468]
      ],
      waves: [
        {
          id: "foundry-belt-swarm",
          triggerX: 1420,
          objective: "Conveyor swarm online",
          spawns: [["crawler", 1850, 620], ["drone", 2190, 360], ["shield", 2500, 585]]
        },
        {
          id: "foundry-laser-crossfire",
          triggerX: 3060,
          objective: "Laser crossfire breach",
          spawns: [["drone", 3520, 360], ["turret", 3930, 470], ["crawler", 4240, 620]]
        },
        {
          id: "foundry-gate-brace",
          triggerX: 4620,
          objective: "Forge gate defenders dropping in",
          spawns: [["shield", 5060, 620], ["drone", 5360, 390]]
        }
      ],
      shardRows: [[360, 548, 5], [920, 418, 4], [1490, 548, 5], [2340, 395, 4], [3050, 320, 5], [3710, 410, 4], [4540, 548, 5], [6000, 405, 5]],
      keys: [[1680, 360], [3128, 312], [4490, 336]],
      bonuses: [["health", 2510, 520], ["overdrive", 3860, 400], ["health", 5360, 548], ["shield", 4260, 355]],
      weaponDrops: [["rapid", 1460, 548], ["spread", 3040, 320], ["beam", 6000, 405]],
      hazards: [
        { type: "floor", x: 2100, y: 620, w: 180, h: 40, cycle: 2.2, active: 0.76, phase: 0.5 },
        { type: "laser", x: 2860, y: 350, w: 36, h: 270, cycle: 3.1, active: 0.9, phase: 1.4 },
        { type: "laser", x: 4150, y: 370, w: 36, h: 250, cycle: 2.8, active: 0.82, phase: 0.2 }
      ],
      underground: {
        id: "furnace-service-depths",
        title: "FURNACE SERVICE DEPTHS",
        shortName: "Service Depths",
        width: 2600,
        entrance: { x: 4380, y: 620, returnX: 4380, radius: 155 },
        spawn: { x: 130, y: 620 },
        exitX: 2440,
        objective: "Stabilize 3 furnace power cells",
        palette: { platform: "#1a1110", trim: "#ffce55", glow: "#ff4f9a", fog: "#35121f" },
        platforms: [[0,620,520,34,"service"],[640,620,470,34,"conveyor",{ conveyor: 70 }],[1230,565,470,34,"forge"],[1820,620,780,34,"exit"],[470,455,310,28,"upper"],[1030,388,300,28,"moving",{ move: { axis: "y", amp: 58, speed: 1.15 } }],[1540,445,350,28,"upper"]],
        spawns: [["crawler",480,620],["shield",830,620],["turret",1540,445],["drone",2020,380],["shield",2260,620]],
        shardRows: [[260,548,4],[710,548,5],[1050,328,4],[1830,548,5],[2180,548,4]],
        cells: [[570,395],[1290,505],[2200,548]],
        bonuses: [["health",2350,548],["overdrive",1610,385]],
        weaponDrops: [["spread",1010,548]],
        hazards: [{ type: "floor", x: 1110, y: 620, w: 170, h: 38, cycle: 2.0, active: 0.76, phase: 0.35 },{ type: "laser", x: 1740, y: 366, w: 34, h: 254, cycle: 2.7, active: 0.82, phase: 1.2 }],
        checkpoint: { x: 1320, y: 565 }
      }
    },
    {
      id: 3,
      title: "ASTRAL VAULT CORE",
      shortName: "Astral Core",
      theme: "astral",
      width: 8000,
      gateX: 5480,
      bossStartX: 6260,
      extractionX: 7700,
      lotteryTerminal: { x: 7465, y: 548, interactionRadius: 132, unlock: "boss-defeated" },
      boss: "midasHeartcoreOverlord",
      bossName: "Midas Heartcore Overlord",
      bossImage: "bossMidas",
      background: "level3Bg",
      tiles: "level3Tiles",
      objective: "Collect 3 astral core keys",
      music: { pulse: 94, boss: 62 },
      palette: { platform: "#10111d", trim: "#ffd66d", glow: "#38dbff" },
      platforms: [
        [0, 620, 900, 34, "entry"],
        [1060, 575, 470, 30, "float"],
        [1650, 515, 360, 28, "float"],
        [2150, 620, 720, 34, "bridge"],
        [3060, 550, 360, 28, "moving", { move: { axis: "y", amp: 70, speed: 1.25 } }],
        [3600, 470, 370, 28, "float"],
        [4140, 620, 760, 34, "bridge"],
        [5040, 530, 420, 28, "float"],
        [5480, 620, 520, 34, "gate"],
        [6160, 620, 1840, 34, "chamber"],
        [640, 445, 300, 28, "float"],
        [2510, 430, 320, 28, "float"],
        [4580, 420, 350, 28, "float"],
        [6790, 452, 480, 28, "boss"]
      ],
      spawns: [
        ["crawler", 640, 620],
        ["drone", 1220, 380],
        ["turret", 1730, 515],
        ["shield", 2280, 620],
        ["drone", 2790, 360],
        ["shield", 3320, 550],
        ["turret", 3840, 470],
        ["crawler", 4270, 620],
        ["drone", 4670, 350],
        ["shield", 5120, 530],
        ["turret", 5580, 620],
        ["shield", 6020, 620],
        ["drone", 6300, 390]
      ],
      waves: [
        {
          id: "astral-low-orbit",
          triggerX: 1180,
          objective: "Astral drones descending",
          spawns: [["drone", 1530, 360], ["crawler", 1910, 515], ["drone", 2310, 360]]
        },
        {
          id: "astral-bridge-collapse",
          triggerX: 2960,
          objective: "Bridge guard phalanx",
          spawns: [["shield", 3360, 550], ["turret", 3800, 470], ["crawler", 4230, 620]]
        },
        {
          id: "astral-core-lock",
          triggerX: 5000,
          objective: "Core lock reinforcements",
          spawns: [["drone", 5400, 360], ["shield", 5750, 620], ["turret", 6260, 620]]
        }
      ],
      shardRows: [[360, 548, 5], [690, 382, 5], [1660, 455, 4], [2470, 370, 5], [3300, 490, 4], [4170, 548, 5], [4620, 360, 5], [5060, 470, 4], [6720, 392, 5]],
      keys: [[730, 372], [2620, 360], [4690, 345]],
      bonuses: [["overdrive", 1460, 510], ["health", 4070, 548], ["health", 5940, 548], ["overdrive", 6810, 392], ["shield", 5040, 470]],
      weaponDrops: [["beam", 1660, 455], ["rapid", 4170, 548], ["spread", 6720, 392]],
      hazards: [
        { type: "laser", x: 2020, y: 390, w: 34, h: 230, cycle: 2.6, active: 0.72, phase: 0.4 },
        { type: "beam", x: 3500, y: 500, w: 420, h: 38, cycle: 3.4, active: 0.82, phase: 1.1 },
        { type: "floor", x: 4880, y: 620, w: 230, h: 40, cycle: 2.3, active: 0.68, phase: 1.6 }
      ],
      underground: {
        id: "astral-catacombs",
        title: "ASTRAL CATACOMBS",
        shortName: "Catacombs",
        width: 2880,
        entrance: { x: 5120, y: 530, returnX: 5120, radius: 160 },
        spawn: { x: 132, y: 620 },
        exitX: 2700,
        objective: "Bind 3 astral power cells",
        palette: { platform: "#0f1321", trim: "#e9db8a", glow: "#38dbff", fog: "#121d3f" },
        platforms: [[0,620,520,34,"catacomb"],[690,565,360,30,"float"],[1180,485,340,28,"float"],[1660,620,470,34,"bridge"],[2240,555,360,28,"float"],[2580,620,300,34,"exit"],[410,430,300,28,"float"],[1540,398,340,28,"moving",{ move: { axis: "y", amp: 66, speed: 1.28 } }]],
        spawns: [["crawler",470,620],["drone",820,380],["shield",1240,485],["turret",1710,620],["drone",2260,380],["shield",2510,555]],
        shardRows: [[270,548,4],[720,500,4],[1230,425,5],[1700,548,4],[2280,495,5]],
        cells: [[480,372],[1450,338],[2380,495]],
        bonuses: [["health",2600,548],["overdrive",1880,548]],
        weaponDrops: [["beam",1180,425]],
        hazards: [{ type: "beam", x: 1030, y: 520, w: 330, h: 34, cycle: 3.0, active: 0.76, phase: 0.8 },{ type: "laser", x: 2140, y: 362, w: 36, h: 258, cycle: 2.6, active: 0.78, phase: 1.5 }],
        checkpoint: { x: 1540, y: 398 }
      }
    }
  ];

  function beginRewardRun(modeKey) {
    rewardClient?.close?.();
    rewardTask = Promise.resolve();
    rewardRunKey = `shadow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    rewardClient = window.LottoMindGameRewards?.createClient?.({
      gameId: "shadow_ops",
      buildId: REWARD_BUILD_ID,
      mode: modeKey === "solo" ? "solo" : "arcade",
      disabled: REWARDS_DISABLED,
      onStatus: (event) => {
        if (event.status === "error") console.warn("[Shadow Ops rewards]", event.detail);
      }
    }) || null;
    emitRewardEvent("shadow.run_started", {
      runMode: modeKey,
      difficulty: settings.difficulty || "arcade",
      localPlayerCount: modeKey === "solo" ? 1 : 2,
      debug: DEBUG
    });
  }

  function emitRewardEvent(type, payload, options = {}) {
    if (!rewardClient) return;
    rewardTask = rewardTask.then(async () => {
      const event = await rewardClient.emit({ type, payload });
      if (options.flush) await rewardClient.flush();
      if (options.finalize && event) {
        await rewardClient.finalize({
          idempotencyKey: options.idempotencyKey || rewardRunKey || event.eventId,
          completionEventId: event.eventId
        });
      }
    }).catch((error) => {
      console.warn("[Shadow Ops rewards]", error);
    });
  }

  function rewardLevelId(state) {
    return String(state.level?.id ?? state.levelIndex + 1);
  }

  function rewardRequiredKeys(state) {
    const id = rewardLevelId(state);
    return [1, 2, 3].map((index) => `level-${id}-key-${index}`);
  }

  function rewardLivesRemaining(state) {
    return allPlayers(state).reduce((total, player) => total + Math.max(0, player.lives || 0), 0);
  }

  const PLAYER_ROWS = {
    run: 0,
    runBack: 1,
    jump: 2,
    crouch: 3,
    shoot: 4,
    idle: 5
  };

  const dom = {
    titleScreen: document.getElementById("titleScreen"),
    cutsceneScreen: document.getElementById("cutsceneScreen"),
    introCutscene: document.getElementById("introCutscene"),
    cutsceneProgress: document.getElementById("cutsceneProgress"),
    cutsceneTime: document.getElementById("cutsceneTime"),
    purchaseScreen: document.getElementById("purchaseScreen"),
    pauseScreen: document.getElementById("pauseScreen"),
    settingsScreen: document.getElementById("settingsScreen"),
    resultsScreen: document.getElementById("resultsScreen"),
    lotteryTerminalScreen: document.getElementById("lotteryTerminalScreen"),
    hud: document.getElementById("hud"),
    bossHud: document.getElementById("bossHud"),
    objectiveChip: document.getElementById("objectiveChip"),
    hudTitle: document.getElementById("hudTitle"),
    levelText: document.getElementById("levelText"),
    hpHearts: document.getElementById("hpHearts"),
    livesText: document.getElementById("livesText"),
    scoreText: document.getElementById("scoreText"),
    comboText: document.getElementById("comboText"),
    shardText: document.getElementById("shardText"),
    keyText: document.getElementById("keyText"),
    weaponText: document.getElementById("weaponText"),
    dropStatusWrap: document.getElementById("dropStatusWrap"),
    dropStatusText: document.getElementById("dropStatusText"),
    overdriveBar: document.getElementById("overdriveBar"),
    dashCooldownBar: document.getElementById("dashCooldownBar"),
    pauseButton: document.getElementById("pauseButton"),
    bossBar: document.getElementById("bossBar"),
    bossName: document.getElementById("bossName"),
    bossPhase: document.getElementById("bossPhase"),
    resultKicker: document.getElementById("resultKicker"),
    resultTitle: document.getElementById("resultTitle"),
    resultCopy: document.getElementById("resultCopy"),
    resultScore: document.getElementById("resultScore"),
    resultTime: document.getElementById("resultTime"),
    resultKills: document.getElementById("resultKills"),
    resultAccuracy: document.getElementById("resultAccuracy"),
    resultDamage: document.getElementById("resultDamage"),
    resultCombo: document.getElementById("resultCombo"),
    resultRank: document.getElementById("resultRank"),
    resultBest: document.getElementById("resultBest"),
    resultLotterySeed: document.getElementById("resultLotterySeed"),
    resultLotteryLevel: document.getElementById("resultLotteryLevel"),
    resultPick3: document.getElementById("resultPick3"),
    resultPick4: document.getElementById("resultPick4"),
    resultLotto6: document.getElementById("resultLotto6"),
    runLotteryDrops: document.getElementById("runLotteryDrops"),
    shareResultButton: document.getElementById("shareResultButton"),
    resultShareMenu: document.getElementById("resultShareMenu"),
    resultShareStatus: document.getElementById("resultShareStatus"),
    lotteryTerminalTitle: document.getElementById("lotteryTerminalTitle"),
    lotteryTerminalStatus: document.getElementById("lotteryTerminalStatus"),
    lotteryTicket: document.getElementById("lotteryTicket"),
    terminalPick3: document.getElementById("terminalPick3"),
    terminalPick4: document.getElementById("terminalPick4"),
    terminalPick6: document.getElementById("terminalPick6"),
    terminalRerolls: document.getElementById("terminalRerolls"),
    generateLotteryButton: document.getElementById("generateLotteryButton"),
    premiumLotteryButton: document.getElementById("premiumLotteryButton"),
    collectorTerminalBadge: document.getElementById("collectorTerminalBadge"),
    copyLotteryButton: document.getElementById("copyLotteryButton"),
    lotteryCopyStatus: document.getElementById("lotteryCopyStatus"),
    touchUseButton: document.getElementById("touchUseButton"),
    soundToggle: document.getElementById("soundToggle"),
    musicToggle: document.getElementById("musicToggle"),
    motionToggle: document.getElementById("motionToggle"),
    shakeToggle: document.getElementById("shakeToggle"),
    contrastToggle: document.getElementById("contrastToggle"),
    touchToggle: document.getElementById("touchToggle"),
    difficultySelect: document.getElementById("difficultySelect")
  };

  const images = {};
  const assetKeys = Object.keys(ASSETS);

  let mode = "title";
  let modeBeforeSettings = "title";
  let run = null;
  let pendingRunMode = "solo";
  let pendingCutsceneRunMode = "solo";
  let cutsceneSession = 0;
  let cutsceneCompleting = false;
  let lastTime = performance.now();
  let accumulator = 0;
  let pulseTimer = 0;
  let audioCtx = null;
  let sfxMaster = null;
  let sfxLimiter = null;
  let gameMusic = null;
  let musicPlayBlocked = false;
  let accountState = {
    authenticated: false,
    verified: false,
    offline: false,
    credits: 0,
    collector: null,
    memberships: [],
    entitlements: {},
    features: {},
    creditActions: {}
  };
  let premiumLotteryPending = null;

  const touchMedia = window.matchMedia("(pointer: coarse)");
  const anyTouchMedia = window.matchMedia("(any-pointer: coarse)");
  const compactMedia = window.matchMedia("(max-width: 820px), (max-height: 620px)");
  const hasTouchEvents = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

  const defaults = {
    sound: true,
    music: true,
    musicTrackVersion: MUSIC_TRACK_VERSION,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    reducedShake: false,
    highContrastShots: false,
    touch: touchMedia.matches || anyTouchMedia.matches || hasTouchEvents || compactMedia.matches,
    difficulty: "arcade"
  };

  const savedSettings = readJSON(SETTINGS_KEY, {});
  const settings = {
    ...defaults,
    ...savedSettings
  };
  if (savedSettings.musicTrackVersion !== MUSIC_TRACK_VERSION) {
    settings.music = true;
    settings.musicTrackVersion = MUSIC_TRACK_VERSION;
    writeJSON(SETTINGS_KEY, settings);
  }

  let bestWasSanitized = false;
  const best = sanitizeBest({
    score: 0,
    fastest: 0,
    highestUnlocked: 1,
    ...readJSON(ACTIVE_STORAGE_KEY, {})
  });
  if (bestWasSanitized) writeJSON(STORAGE_KEY, best);

  let lotteryStore = { version: 1, latestByLevel: {}, history: [] };
  let lotteryReturnMode = "playing";

  const keyboardDown = new Set();
  const keyboardPressed = new Set();
  const keyboardReleased = new Set();
  const touchDown = new Set();
  const touchPressed = new Set();
  const touchReleased = new Set();
  const touchPointers = new Map();
  let padDown = new Set();
  let padPressed = new Set();
  let padReleased = new Set();

  const pointer = {
    x: W * 0.75,
    y: H * 0.5,
    activeUntil: 0
  };
  const virtualAim = {
    x: 1,
    y: 0,
    strength: 0,
    activeUntil: 0
  };

  const keyMap = new Map([
    ["ArrowLeft", "left"],
    ["KeyA", "left"],
    ["ArrowRight", "right"],
    ["KeyD", "right"],
    ["ArrowUp", "up"],
    ["KeyW", "up"],
    ["ArrowDown", "down"],
    ["KeyS", "down"],
    ["Space", "jump"],
    ["KeyZ", "fire"],
    ["KeyJ", "fire"],
    ["KeyX", "interact"],
    ["KeyV", "interact"],
    ["KeyK", "dash"],
    ["ShiftLeft", "dash"],
    ["ShiftRight", "dash"],
    ["KeyE", "overdrive"],
    ["KeyC", "overdrive"],
    ["KeyQ", "overdrive"],
    ["KeyL", "overdrive"],
    ["KeyO", "overdrive"],
    ["KeyF", "p2-left"],
    ["KeyH", "p2-right"],
    ["KeyT", "p2-up"],
    ["KeyG", "p2-down"],
    ["KeyR", "p2-jump"],
    ["KeyY", "p2-fire"],
    ["KeyU", "p2-dash"],
    ["KeyI", "p2-overdrive"],
    ["Numpad4", "p2-left"],
    ["Numpad6", "p2-right"],
    ["Numpad8", "p2-up"],
    ["Numpad5", "p2-down"],
    ["Numpad0", "p2-jump"],
    ["Numpad1", "p2-fire"],
    ["Numpad2", "p2-dash"],
    ["Numpad3", "p2-overdrive"],
    ["NumpadEnter", "p2-overdrive"],
    ["Enter", "start"],
    ["Escape", "pause"],
    ["KeyP", "pause"],
    ["KeyM", "settings"]
  ]);

  const colors = {
    gold: "#ffd66d",
    orange: "#f4a82f",
    cream: "#fff3d1",
    pink: "#ff4f9a",
    purple: "#a522ff",
    cyan: "#38dbff",
    red: "#ff7043",
    green: "#8dff9b"
  };

  const PICKUP_SPRITE_ROWS = {
    shard: 0,
    key: 1,
    health: 2,
    overdrive: 3,
    shield: 0
  };

  const FX_ROWS = {
    heartShot: 0,
    hitSpark: 1,
    spawnBurst: 1,
    bossBeam: 3
  };

  const FX_SHEET_COLS = 5;
  const FX_SHEET_ROWS = 4;
  const GAMEPLAY_FX_COLS = 5;
  const GAMEPLAY_FX_ROWS = 4;
  const MISSION_BATCH_COLS = 5;
  const MISSION_BATCH_ROWS = 4;
  const CANNON_TURRET_FRAMES = 8;
  const CANNON_TURRET_BOTTOM_PAD = [33, 35, 49, 49, 49, 35, 33, 35];
  const CANNON_TURRET = {
    width: 70,
    height: 56,
    spriteScaleX: 2.12,
    spriteScaleY: 1.96,
    fallbackMotionScaleX: 1.64,
    fallbackMotionScaleY: 1.72,
    fallbackStaticScaleX: 1.28,
    fallbackStaticScaleY: 1.3,
    visualInflate: 52
  };
  const DRONE_MOTION_FRAMES = 8;
  const DRONE_LASER_FRAMES = 8;
  const DRONE_FX_FRAMES = 8;
  const CRAWLER_WALK_FRAMES = 8;
  const CRAWLER_WALK_BOTTOM_PAD = 13;
  const CRAWLER_DOG = {
    width: 58,
    height: 42,
    spriteScaleX: 1.62,
    spriteScaleY: 1.62,
    fallbackMotionScaleX: 1.42,
    fallbackMotionScaleY: 1.34,
    fallbackStaticScaleX: 0.94,
    fallbackStaticScaleY: 0.96
  };
  const SHIELD_ROBOT_FRAMES = 8;
  const SHIELD_ROBOT_BOTTOM_PAD = [35, 37, 43, 35, 49, 41, 31, 103];
  const TURRET_TELEGRAPH_LENGTH = 280;
  const GAMEPLAY_FX = {
    weapon: {
      spread: { row: 0, frame: 0 },
      rapid: { row: 0, frame: 1 },
      beam: { row: 0, frame: 2 },
      shield: { row: 0, frame: 3 },
      overdrive: { row: 0, frame: 4 }
    },
    warning: {
      cone: { row: 1, frame: 0 },
      reticle: { row: 1, frame: 1 },
      lockNode: { row: 1, frame: 2 },
      bossCore: { row: 1, frame: 3 },
      bossPhase: { row: 1, frame: 4 }
    },
    attack: {
      muzzle: { row: 2, frame: 0 },
      spreadFan: { row: 2, frame: 1 },
      beamSlash: { row: 2, frame: 2 },
      hitBurst: { row: 2, frame: 3 },
      lowHp: { row: 2, frame: 4 }
    },
    reward: {
      terminal: { row: 3, frame: 0 },
      gateSegment: { row: 3, frame: 1 },
      portalChime: { row: 3, frame: 2 },
      keyBonus: { row: 3, frame: 3 },
      comboGem: { row: 3, frame: 4 }
    }
  };
  const BOSS_MOTION_FRAMES = 8;

  const MOVEMENT = {
    maxGroundSpeed: 430,
    crouchSpeed: 145,
    groundAccel: 4100,
    groundDecel: 3600,
    airAccel: 3100,
    airTurnAccel: 3900,
    airDecel: 760,
    jumpVelocity: -955,
    jumpCut: 0.5,
    coyoteTime: 0.2,
    jumpBuffer: 0.24,
    dashCooldown: 0.62,
    dashDuration: 0.17,
    dashSpeed: 980,
    dashEndMomentum: 0.58,
    wallSlideSpeed: 245,
    wallStickTime: 0.12,
    wallJumpX: 620,
    wallJumpY: -910,
    landingSquashTime: 0.18,
    invulnAfterHit: 1.05,
    contactCooldown: 0.95
  };

  const CAMERA = {
    lookAheadX: 86,
    lookAheadSpeed: 240,
    followEase: 3.25,
    followDeadZone: 52,
    maxFollowSpeed: 860,
    forwardBias: 0.12,
    directionEase: 3.1,
    verticalEase: 2.55,
    verticalDeadZone: 112,
    maxVerticalShift: 46,
    bossLockEase: 2.35,
    bossIntroPan: 1.05
  };

  const FEEDBACK = {
    shotHitStop: 0.045,
    strongHitStop: 0.07,
    damageShake: 0.32,
    slamShake: 0.56,
    maxShake: 4.8
  };

  const PLAYER_VISUAL = {
    standScale: 0.9,
    crouchScale: 0.74,
    bottomOffset: 8
  };

  const DIFFICULTY = {
    casual: { label: "Casual", enemyHp: 0.82, enemySpeed: 0.9, enemyDamage: 0.75, score: 0.9, lives: 5 },
    arcade: { label: "Arcade", enemyHp: 1, enemySpeed: 1, enemyDamage: 1, score: 1, lives: 3 },
    hardcore: { label: "Hardcore", enemyHp: 1.24, enemySpeed: 1.12, enemyDamage: 1.35, score: 1.2, lives: 2 }
  };

  const WEAPON_META = {
    heart: { label: "HEART", color: colors.pink },
    spread: { label: "SPREAD", color: colors.gold, fx: GAMEPLAY_FX.weapon.spread },
    rapid: { label: "RAPID", color: colors.cyan, fx: GAMEPLAY_FX.weapon.rapid },
    beam: { label: "BEAM", color: colors.purple, fx: GAMEPLAY_FX.weapon.beam }
  };

  const BOSS_PHASE_TITLES = {
    canopyDroneQueen: ["", "Target Lock", "Drone Bloom", "Heart Core Sweep"],
    jackpotForgeTitan: ["", "Ground Slam", "Shielded Mine Launch", "Core Triple Spread"],
    midasHeartcoreOverlord: ["", "Guardian Core", "Lotto Storm", "Overdrive Beam"]
  };

  const PLATFORM_TEXTURE_RECTS = [
    [370, 78, 360, 118],
    [812, 78, 430, 132],
    [1305, 78, 360, 118],
    [360, 360, 820, 156],
    [80, 1010, 300, 128],
    [430, 1016, 340, 124]
  ];

  const PICKUP_DRAW_SCALE = {
    shard: 0.54,
    key: 0.5,
    health: 0.56,
    overdrive: 0.56,
    shield: 0.5,
    weapon: 0.56
  };

  const POWERUP_PACK = {
    health: { frame: 0, row: 0, color: colors.pink },
    overdrive: { frame: 1, row: 0, color: colors.purple },
    shield: { frame: 2, row: 0, color: colors.cyan },
    spread: { frame: 0, row: 1, color: colors.pink },
    rapid: { frame: 1, row: 1, color: colors.cyan },
    beam: { frame: 2, row: 1, color: colors.purple }
  };

  const GENERATED_PROP_CELLS = [
    { row: 0, frame: 0, w: 1.0, h: 1.0 },
    { row: 0, frame: 1, w: 0.96, h: 0.96 },
    { row: 0, frame: 2, w: 1.02, h: 1.0 },
    { row: 0, frame: 3, w: 1.12, h: 1.02 },
    { row: 1, frame: 0, w: 1.12, h: 1.02 },
    { row: 1, frame: 1, w: 0.92, h: 1.02 },
    { row: 1, frame: 2, w: 1.02, h: 0.98 },
    { row: 1, frame: 3, w: 0.9, h: 1.1 },
    { row: 2, frame: 0, w: 0.82, h: 1.2 },
    { row: 2, frame: 1, w: 1.18, h: 0.78 },
    { row: 2, frame: 2, w: 1.0, h: 0.96 },
    { row: 2, frame: 3, w: 1.22, h: 0.68 },
    { row: 3, frame: 0, w: 1.18, h: 0.56 },
    { row: 3, frame: 1, w: 1.02, h: 0.7 },
    { row: 3, frame: 2, w: 1.04, h: 0.78 },
    { row: 3, frame: 3, w: 0.94, h: 1.1 }
  ];

  const LEVEL_BRAND_PROPS = {
    1: [
      { cell: 0, x: 260, y: 388, w: 170, h: 128, alpha: 0.38, phase: 0.1 },
      { cell: 1, x: 1020, y: 548, w: 170, h: 128, alpha: 0.58, phase: 1.4 },
      { cell: 2, x: 1510, y: 324, w: 86, h: 146, alpha: 0.42, phase: 2.2 },
      { cell: 3, x: 3150, y: 548, w: 178, h: 134, alpha: 0.5, phase: 3.1 },
      { cell: 4, x: 4140, y: 372, w: 126, h: 150, alpha: 0.44, phase: 0.8 },
      { cell: 5, x: 5480, y: 530, w: 166, h: 124, alpha: 0.5, phase: 2.6 },
      { cell: 6, x: 840, y: 565, w: 132, h: 112, alpha: 0.5, phase: 2.9 },
      { cell: 7, x: 1990, y: 528, w: 118, h: 146, alpha: 0.46, phase: 1.6 },
      { cell: 8, x: 2820, y: 420, w: 104, h: 184, alpha: 0.34, phase: 2.4 },
      { cell: 9, x: 3560, y: 586, w: 210, h: 96, alpha: 0.44, phase: 0.2 },
      { cell: 10, x: 4560, y: 570, w: 146, h: 104, alpha: 0.52, phase: 2.0 },
      { cell: 11, x: 5200, y: 502, w: 190, h: 86, alpha: 0.38, phase: 3.4 },
      { cell: 14, x: 5980, y: 462, w: 166, h: 106, alpha: 0.46, phase: 1.1 },
      { cell: 15, x: 6360, y: 396, w: 132, h: 152, alpha: 0.34, phase: 2.7 }
    ],
    2: [
      { cell: 3, x: 730, y: 554, w: 188, h: 140, alpha: 0.52, phase: 0.5 },
      { cell: 0, x: 1510, y: 356, w: 150, h: 112, alpha: 0.36, phase: 2.1 },
      { cell: 1, x: 2600, y: 510, w: 184, h: 138, alpha: 0.52, phase: 1.2 },
      { cell: 5, x: 3820, y: 446, w: 172, h: 128, alpha: 0.5, phase: 3.2 },
      { cell: 2, x: 4980, y: 348, w: 90, h: 154, alpha: 0.4, phase: 0.3 },
      { cell: 4, x: 6100, y: 542, w: 132, h: 156, alpha: 0.44, phase: 2.8 },
      { cell: 6, x: 1090, y: 558, w: 138, h: 116, alpha: 0.52, phase: 1.5 },
      { cell: 7, x: 2150, y: 522, w: 118, h: 152, alpha: 0.42, phase: 2.5 },
      { cell: 8, x: 3180, y: 412, w: 104, h: 188, alpha: 0.32, phase: 0.9 },
      { cell: 11, x: 4420, y: 516, w: 214, h: 88, alpha: 0.4, phase: 1.8 },
      { cell: 12, x: 5450, y: 600, w: 220, h: 70, alpha: 0.42, phase: 2.2 },
      { cell: 15, x: 6400, y: 382, w: 138, h: 158, alpha: 0.34, phase: 3.4 }
    ],
    3: [
      { cell: 5, x: 800, y: 520, w: 176, h: 132, alpha: 0.5, phase: 1.1 },
      { cell: 2, x: 1750, y: 344, w: 88, h: 152, alpha: 0.42, phase: 2.4 },
      { cell: 3, x: 3000, y: 554, w: 184, h: 138, alpha: 0.5, phase: 0.7 },
      { cell: 1, x: 4300, y: 382, w: 178, h: 134, alpha: 0.5, phase: 2.9 },
      { cell: 0, x: 5480, y: 448, w: 168, h: 126, alpha: 0.36, phase: 1.8 },
      { cell: 4, x: 6560, y: 520, w: 132, h: 156, alpha: 0.45, phase: 3.5 },
      { cell: 6, x: 1280, y: 560, w: 146, h: 118, alpha: 0.52, phase: 2.1 },
      { cell: 7, x: 2350, y: 512, w: 120, h: 154, alpha: 0.44, phase: 0.6 },
      { cell: 8, x: 3620, y: 404, w: 108, h: 188, alpha: 0.34, phase: 1.4 },
      { cell: 10, x: 4940, y: 584, w: 150, h: 108, alpha: 0.5, phase: 2.7 },
      { cell: 13, x: 6040, y: 480, w: 166, h: 94, alpha: 0.42, phase: 3.2 },
      { cell: 15, x: 6850, y: 382, w: 138, h: 158, alpha: 0.34, phase: 0.2 }
    ]
  };

  const BATCH_SCENERY_PROPS = {
    1: [
      { sheet: "world", cell: 0, x: 1350, y: 615, w: 260, h: 96, alpha: 0.94, phase: 0.2, anchor: "bottom" },
      { sheet: "world", cell: 5, x: 750, y: 610, w: 220, h: 172, alpha: 0.48, phase: 1.8, anchor: "bottom" },
      { sheet: "world", cell: 6, x: 2200, y: 616, w: 200, h: 184, alpha: 0.5, phase: 2.2, anchor: "bottom" },
      { sheet: "world", cell: 10, x: 3170, y: 613, w: 146, h: 172, alpha: 0.68, phase: 0.7, anchor: "bottom" },
      { sheet: "props", cell: 2, x: 3920, y: 615, w: 122, h: 156, alpha: 0.78, phase: 1.1, anchor: "bottom" },
      { kind: "floorRelay", x: 4620, y: 613, w: 210, h: 112, alpha: 0.88, phase: 2.9, anchor: "bottom" },
      { sheet: "world", cell: 15, x: 5750, y: 616, w: 130, h: 170, alpha: 0.7, phase: 1.5, anchor: "bottom" }
    ],
    2: [
      { sheet: "world", cell: 2, x: 1040, y: 540, w: 230, h: 146, alpha: 0.5, phase: 0.9, anchor: "bottom" },
      { sheet: "props", cell: 5, x: 1730, y: 617, w: 220, h: 170, alpha: 0.56, phase: 2.4, anchor: "bottom" },
      { sheet: "props", cell: 8, x: 3080, y: 612, w: 180, h: 88, alpha: 0.86, phase: 0.4, anchor: "bottom" },
      { sheet: "world", cell: 12, x: 4340, y: 616, w: 154, h: 158, alpha: 0.72, phase: 1.9, anchor: "bottom" },
      { sheet: "props", cell: 15, x: 5660, y: 612, w: 124, h: 160, alpha: 0.76, phase: 2.7, anchor: "bottom" }
    ],
    3: [
      { sheet: "world", cell: 3, x: 1080, y: 540, w: 240, h: 148, alpha: 0.52, phase: 1.2, anchor: "bottom" },
      { sheet: "world", cell: 8, x: 2180, y: 615, w: 230, h: 92, alpha: 0.66, phase: 0.6, anchor: "bottom" },
      { sheet: "props", cell: 10, x: 3350, y: 614, w: 200, h: 146, alpha: 0.68, phase: 2.3, anchor: "bottom" },
      { sheet: "props", cell: 13, x: 4870, y: 585, w: 120, h: 156, alpha: 0.74, phase: 1.6, anchor: "bottom" },
      { sheet: "world", cell: 19, x: 6080, y: 616, w: 190, h: 176, alpha: 0.72, phase: 3.1, anchor: "bottom" }
    ]
  };

  const WORLD_ASSET_MODULES = {
    1: [
      { type: "wall", x: 132, y: 340, w: 196, h: 260, variant: 0 },
      { type: "crate", x: 1260, y: 565, w: 150, h: 70, variant: 1 },
      { type: "wall", x: 3825, y: 315, w: 176, h: 305, variant: 2 },
      { type: "console", x: 4316, y: 560, w: 136, h: 80, variant: 0 },
      { type: "wall", x: 5710, y: 355, w: 220, h: 245, variant: 1 },
      { type: "crate", x: 6048, y: 565, w: 164, h: 70, variant: 2 }
    ],
    2: [
      { type: "wall", x: 540, y: 350, w: 210, h: 250, variant: 1 },
      { type: "console", x: 2040, y: 545, w: 145, h: 78, variant: 1 },
      { type: "wall", x: 4325, y: 315, w: 188, h: 305, variant: 2 },
      { type: "crate", x: 5050, y: 560, w: 170, h: 76, variant: 0 },
      { type: "wall", x: 6420, y: 340, w: 232, h: 260, variant: 0 }
    ],
    3: [
      { type: "wall", x: 420, y: 334, w: 206, h: 272, variant: 2 },
      { type: "crate", x: 2060, y: 562, w: 164, h: 74, variant: 1 },
      { type: "console", x: 4020, y: 542, w: 150, h: 84, variant: 2 },
      { type: "wall", x: 5260, y: 315, w: 190, h: 305, variant: 1 },
      { type: "wall", x: 7205, y: 338, w: 242, h: 260, variant: 0 }
    ]
  };

  for (const key of assetKeys) {
    const image = new Image();
    image.src = ASSETS[key];
    images[key] = image;
  }

  applySettings();
  syncViewportMode();
  window.addEventListener("resize", syncViewportMode);
  window.addEventListener("orientationchange", syncViewportMode);
  bindInputs();
  bindCutscene();
  installAccountBridge();
  if (DEBUG) installDebugPanel();
  setMode("title");
  requestAnimationFrame(loop);

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local storage can be unavailable in hardened browsers. The game still runs.
    }
  }

  function sanitizeBest(record) {
    if (!DEBUG && record.fastest && record.fastest < 15) {
      record.fastest = 0;
      if (record.score <= 5000) record.score = 0;
      bestWasSanitized = true;
    }
    return record;
  }

  const LotteryGenerator = (() => {
    const MEGA_MAIN_COUNT = 5;
    const MEGA_MAIN_MAX = 70;
    const MEGA_BALL_MAX = 24;

    function secureRandomInt(maxExclusive) {
      if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
        throw new RangeError("maxExclusive must be a positive safe integer");
      }
      if (globalThis.crypto?.getRandomValues) {
        const range = 0x100000000;
        const limit = range - (range % maxExclusive);
        const buffer = new Uint32Array(1);
        let value = 0;
        do {
          globalThis.crypto.getRandomValues(buffer);
          value = buffer[0];
        } while (value >= limit);
        return value % maxExclusive;
      }
      return Math.floor(Math.random() * maxExclusive);
    }

    function digitString(length, randomInt = secureRandomInt) {
      if (![3, 4, 6].includes(length)) {
        throw new RangeError("Supported lottery lengths are 3, 4, and 6");
      }
      return String(randomInt(10 ** length)).padStart(length, "0");
    }

    function formatBall(value) {
      return String(value).padStart(2, "0");
    }

    function drawUniqueBalls(count, maxInclusive, randomInt) {
      const balls = new Set();
      let attempts = 0;
      while (balls.size < count && attempts < 400) {
        balls.add(randomInt(maxInclusive) + 1);
        attempts += 1;
      }
      for (let fallback = 1; balls.size < count && fallback <= maxInclusive; fallback += 1) {
        balls.add(fallback);
      }
      return Array.from(balls).sort((a, b) => a - b);
    }

    function formatMegaPick(pick) {
      return `${pick.main.map(formatBall).join(" ")} + ${formatBall(pick.bonus)}`;
    }

    function parseMegaPick(value) {
      if (!value) return null;
      if (typeof value === "object" && Array.isArray(value.main)) {
        const main = value.main.map(Number);
        const bonus = Number(value.bonus);
        const validMain = main.length === MEGA_MAIN_COUNT
          && main.every((ball) => Number.isInteger(ball) && ball >= 1 && ball <= MEGA_MAIN_MAX)
          && new Set(main).size === main.length;
        if (!validMain || !Number.isInteger(bonus) || bonus < 1 || bonus > MEGA_BALL_MAX) return null;
        return { main: main.slice().sort((a, b) => a - b), bonus };
      }
      const numbers = String(value).trim().match(/\d{1,2}/g)?.map(Number) || [];
      if (numbers.length !== MEGA_MAIN_COUNT + 1) return null;
      return parseMegaPick({ main: numbers.slice(0, MEGA_MAIN_COUNT), bonus: numbers[MEGA_MAIN_COUNT] });
    }

    function megaPick(randomInt = secureRandomInt) {
      return formatMegaPick({
        main: drawUniqueBalls(MEGA_MAIN_COUNT, MEGA_MAIN_MAX, randomInt),
        bonus: randomInt(MEGA_BALL_MAX) + 1
      });
    }

    function generateTicket(meta = {}, randomInt = secureRandomInt) {
      return {
        id: globalThis.crypto?.randomUUID?.() ?? `ticket-${Date.now()}-${randomInt(1000000)}`,
        createdAt: new Date().toISOString(),
        levelId: meta.levelId ?? null,
        levelTitle: meta.levelTitle || "",
        source: meta.source || "vault-terminal",
        dropCode: `DROP ${digitString(4, randomInt)}`,
        pick3: digitString(3, randomInt),
        pick4: digitString(4, randomInt),
        pick6: megaPick(randomInt),
        rerollsUsed: meta.rerollsUsed || 0
      };
    }

    return { secureRandomInt, digitString, formatBall, formatMegaPick, parseMegaPick, megaPick, generateTicket };
  })();

  lotteryStore = sanitizeLotteryStore(readJSON(LOTTERY_STORAGE_KEY, null));

  function sanitizeLotteryStore(record) {
    const safe = { version: 1, latestByLevel: {}, history: [] };
    if (!record || typeof record !== "object") return safe;
    const latest = record.latestByLevel && typeof record.latestByLevel === "object" ? record.latestByLevel : {};
    for (const [levelId, ticket] of Object.entries(latest)) {
      const clean = sanitizeTicket(ticket);
      if (clean) safe.latestByLevel[String(levelId)] = clean;
    }
    const history = Array.isArray(record.history) ? record.history : [];
    safe.history = history.map(sanitizeTicket).filter(Boolean).slice(0, 20);
    return safe;
  }

  function sanitizeTicket(ticket) {
    if (!ticket || typeof ticket !== "object") return null;
    if (!/^\d{3}$/.test(ticket.pick3 || "")) return null;
    if (!/^\d{4}$/.test(ticket.pick4 || "")) return null;
    const pick6 = LotteryGenerator.parseMegaPick(ticket.pick6);
    if (!pick6) return null;
    return {
      id: typeof ticket.id === "string" ? ticket.id : `ticket-${Date.now()}`,
      createdAt: typeof ticket.createdAt === "string" ? ticket.createdAt : new Date().toISOString(),
      levelId: Number.isFinite(Number(ticket.levelId)) ? Number(ticket.levelId) : null,
      levelTitle: typeof ticket.levelTitle === "string" ? ticket.levelTitle : "",
      source: typeof ticket.source === "string" ? ticket.source : "vault-terminal",
      dropCode: typeof ticket.dropCode === "string" ? ticket.dropCode : `DROP ${String(ticket.id || "").slice(-4).toUpperCase().padStart(4, "0")}`,
      pick3: ticket.pick3,
      pick4: ticket.pick4,
      pick6: LotteryGenerator.formatMegaPick(pick6),
      rerollsUsed: clamp(Number(ticket.rerollsUsed) || 0, 0, 2)
    };
  }

  function saveLotteryTicket(ticket) {
    const clean = sanitizeTicket(ticket);
    if (!clean || !clean.levelId) return null;
    lotteryStore.latestByLevel[String(clean.levelId)] = clean;
    lotteryStore.history = [clean, ...lotteryStore.history.filter((entry) => entry.id !== clean.id)].slice(0, 20);
    writeJSON(LOTTERY_STORAGE_KEY, lotteryStore);
    return clean;
  }

  function clearLotteryDebugDrops() {
    lotteryStore = { version: 1, latestByLevel: {}, history: [] };
    writeJSON(LOTTERY_STORAGE_KEY, lotteryStore);
    if (run) {
      run.lotteryTickets = {};
      run.terminal.ticket = null;
      run.terminal.rerollsUsed = 0;
      updateTerminalDom();
      updateHUD();
    }
  }

  function installLotteryDebugApi() {
    window.__lottoDebug = {
      ...(window.__lottoDebug || {}),
      LotteryGenerator,
      runLotteryTests() {
        const failures = [];
        const assert = (condition, label) => { if (!condition) failures.push(label); };
        for (let i = 0; i < 10000; i += 1) {
          const ticket = LotteryGenerator.generateTicket({ levelId: 1, source: "self-test" });
          const pick6 = LotteryGenerator.parseMegaPick(ticket.pick6);
          assert(/^\d{3}$/.test(ticket.pick3), "Pick 3 format");
          assert(/^\d{4}$/.test(ticket.pick4), "Pick 4 format");
          assert(Boolean(pick6), "Pick 6 Mega format");
          assert(pick6?.main?.length === 5 && new Set(pick6.main).size === 5, "Pick 6 Mega unique main balls");
          assert(pick6?.main?.every((ball) => ball >= 1 && ball <= 70), "Pick 6 Mega main ball range");
          assert(pick6?.bonus >= 1 && pick6?.bonus <= 24, "Pick 6 Mega bonus range");
        }
        assert(LotteryGenerator.digitString(3, () => 0) === "000", "zero Pick 3");
        assert(LotteryGenerator.digitString(4, () => 0) === "0000", "zero Pick 4");
        assert(LotteryGenerator.digitString(3, (max) => max - 1) === "999", "max Pick 3");
        assert(LotteryGenerator.digitString(4, (max) => max - 1) === "9999", "max Pick 4");
        assert(LotteryGenerator.megaPick((() => { let next = 0; return (max) => (next += 1, (next - 1) % max); })()) === "01 02 03 04 05 + 06", "low Mega pick");
        assert(LotteryGenerator.megaPick((() => { const seq = [69, 68, 67, 66, 65, 23]; let next = 0; return (max) => seq[next++] % max; })()) === "66 67 68 69 70 + 24", "high Mega pick");
        assert(!sanitizeTicket({ pick3: "12", pick4: "9999", pick6: "01 02 03 04 05 + 06" }), "malformed ticket ignored");
        assert(!sanitizeTicket({ pick3: "123", pick4: "9999", pick6: "01 02 03 04 04 + 07" }), "duplicate Mega pick ignored");
        const history = Array.from({ length: 25 }, (_, index) => LotteryGenerator.generateTicket({ levelId: 1, source: `history-${index}` }));
        const clean = sanitizeLotteryStore({ version: 1, history });
        assert(clean.history.length === 20, "history caps at 20");
        const fakeState = createRun({ coOp: true });
        fakeState.bossDefeated = true;
        claimLotteryTicket(fakeState, "self-test");
        const first = fakeState.lotteryTickets["1"]?.id;
        claimLotteryTicket(fakeState, "self-test");
        assert(fakeState.lotteryTickets["1"]?.id === first, "duplicate free claim prevented");
        fakeState.shards = 25;
        claimLotteryTicket(fakeState, "self-test-reroll", { replace: true, rerollsUsed: 1 });
        assert(fakeState.shards === 25, "claim helper does not charge shards outside terminal");
        return { passed: failures.length === 0, failures };
      }
    };
  }

  installLotteryDebugApi();
  renderPick6Balls(dom.terminalPick6, null);
  renderPick6Balls(dom.resultLotto6, null);

  function bindInputs() {
    window.addEventListener("keydown", (event) => {
      const code = normalizeKey(event);
      const action = keyMap.get(code);
      if (!action) return;
      if (!keyboardDown.has(action)) keyboardPressed.add(action);
      keyboardDown.add(action);
      if (["left", "right", "up", "down", "jump", "fire", "dash", "overdrive", "pause", "interact"].includes(action) || action.startsWith("p2-")) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      const action = keyMap.get(normalizeKey(event));
      if (!action) return;
      keyboardDown.delete(action);
      keyboardReleased.add(action);
    });

    window.addEventListener("blur", () => {
      clearTouchActions();
      if (mode === "playing" && !DEBUG) pauseRun();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearTouchActions();
    });

    window.addEventListener("pagehide", clearTouchActions);
    window.addEventListener("orientationchange", clearTouchActions);

    document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
    document.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
    document.addEventListener("touchmove", (event) => {
      if (event.target.closest?.(".game-shell")) event.preventDefault();
    }, { passive: false });

    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") event.preventDefault();
      const point = canvasPoint(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.activeUntil = performance.now() + 2800;
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") event.preventDefault();
      initAudio();
      const point = canvasPoint(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.activeUntil = performance.now() + 2800;
      if (mode === "playing" && event.pointerType !== "touch") {
        touchAction("fire", true);
      }
    });

    canvas.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") event.preventDefault();
      touchAction("fire", false);
    });
    canvas.addEventListener("pointercancel", clearTouchActions);
    window.addEventListener("lottomind:virtual-aim", (event) => {
      const detail = event.detail || {};
      const strength = Number(detail.distance) || 0;
      if (!detail.active) {
        virtualAim.activeUntil = 0;
        virtualAim.strength = 0;
        return;
      }
      if (strength > 0.06) {
        const x = Number(detail.x) || 0;
        const y = Number(detail.y) || 0;
        const length = Math.hypot(x, y) || 1;
        virtualAim.x = x / length;
        virtualAim.y = y / length;
        virtualAim.strength = strength;
        virtualAim.activeUntil = performance.now() + 180;
      }
    });

    canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    document.querySelectorAll("[data-touch]").forEach((button) => {
      const action = button.dataset.touch;
      const down = (event) => {
        event.preventDefault();
        if (button.setPointerCapture && event.pointerId !== undefined) button.setPointerCapture(event.pointerId);
        initAudio();
        if (event.pointerId !== undefined) touchPointers.set(event.pointerId, action);
        touchAction(action, true);
      };
      const up = (event) => {
        event.preventDefault();
        if (button.releasePointerCapture && event.pointerId !== undefined && button.hasPointerCapture(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }
        const heldAction = event.pointerId !== undefined ? touchPointers.get(event.pointerId) : action;
        if (event.pointerId !== undefined) touchPointers.delete(event.pointerId);
        if (heldAction) touchAction(heldAction, false);
      };
      button.addEventListener("pointerdown", down);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
      button.addEventListener("pointerleave", up);
      button.addEventListener("lostpointercapture", (event) => {
        const heldAction = event.pointerId !== undefined ? touchPointers.get(event.pointerId) : action;
        if (event.pointerId !== undefined) touchPointers.delete(event.pointerId);
        if (heldAction) touchAction(heldAction, false);
      });
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        initAudio();
        handleAction(button.dataset.action);
      });
    });

    document.querySelectorAll("[data-share-platform]").forEach((button) => {
      button.addEventListener("click", () => shareResult(button.dataset.sharePlatform));
    });

    dom.premiumLotteryButton?.addEventListener("click", requestPremiumLotteryConversion);

    dom.soundToggle.addEventListener("change", () => updateSetting("sound", dom.soundToggle.checked));
    dom.musicToggle.addEventListener("change", () => updateSetting("music", dom.musicToggle.checked));
    dom.motionToggle.addEventListener("change", () => updateSetting("reducedMotion", dom.motionToggle.checked));
    dom.shakeToggle.addEventListener("change", () => updateSetting("reducedShake", dom.shakeToggle.checked));
    dom.contrastToggle.addEventListener("change", () => updateSetting("highContrastShots", dom.contrastToggle.checked));
    dom.touchToggle.addEventListener("change", () => updateSetting("touch", dom.touchToggle.checked));
    dom.difficultySelect.addEventListener("change", () => updateSetting("difficulty", dom.difficultySelect.value));
  }

  function installDebugPanel() {
    document.body.classList.add("debug-mode");
    const panel = document.createElement("div");
    panel.className = "debug-panel";
    panel.innerHTML = `
      <button type="button" data-debug="keys">Keys</button>
      <button type="button" data-debug="level2">L2</button>
      <button type="button" data-debug="level3">L3</button>
      <button type="button" data-debug="boss">Boss</button>
      <button type="button" data-debug="wave">Wave</button>
      <button type="button" data-debug="underground-entrance">UG Door</button>
      <button type="button" data-debug="underground-enter">UG Enter</button>
      <button type="button" data-debug="underground-gate">UG Gate</button>
      <button type="button" data-debug="underground-cells">UG Cells</button>
      <button type="button" data-debug="underground-complete">UG Clear</button>
      <button type="button" data-debug="surface-return">Surface</button>
      <button type="button" data-debug="sentinel">Defeat</button>
      <button type="button" data-debug="terminal">Terminal</button>
      <button type="button" data-debug="generate">Generate</button>
      <button type="button" data-debug="clear-drops">Clear Drops</button>
      <button type="button" data-debug="victory">Victory</button>
    `;
    document.querySelector(".game-shell").appendChild(panel);
    panel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-debug]");
      if (!button) return;
      runDebugAction(button.dataset.debug);
    });
  }

  function runDebugAction(action) {
    if (!run || mode === "title" || mode === "results") startRun(pendingRunMode);
    run.introTimer = 0;
    run.levelCompleteTimer = 0;
    const p = run.player;
    if (action === "level2" || action === "level3") {
      loadLevel(run, action === "level2" ? 1 : 2);
      run.introTimer = 0;
      setObjective(run, `Debug: ${run.level.shortName}`, 1.6);
    }
    if (action === "keys") {
      run.keys = 3;
      run.undergroundCells[undergroundKey(run)] = 3;
      run.undergroundComplete[undergroundKey(run)] = true;
      run.gateOpen = true;
      warpPlayers(run, gateX(run) + 170);
      setObjective(run, "Debug: vault gate open", 2);
    }
    if (action === "boss") {
      run.keys = 3;
      run.undergroundCells[undergroundKey(run)] = 3;
      run.undergroundComplete[undergroundKey(run)] = true;
      run.gateOpen = true;
      warpPlayers(run, bossStartX(run) + 120);
      updateProgression(run);
      setObjective(run, "Debug: boss chamber", 2);
    }
    if (action === "wave") {
      const waves = run.level.waves || [];
      const wave = waves.find((entry) => !run.reinforcementFlags.has(entry.id)) || waves[waves.length - 1];
      if (wave) {
        warpPlayers(run, wave.triggerX + 40);
        run.cameraX = clamp(p.x - 350, 0, worldWidth(run) - W);
        run.reinforcementFlags.add(wave.id);
        spawnReinforcementWave(run, wave);
        setObjective(run, `Debug: ${wave.objective}`, 2);
      }
    }
    if (action === "underground-entrance") {
      if (isUnderground(run)) returnToSurface(run);
      const entrance = run.level.underground?.entrance;
      if (entrance) {
        placePlayersAt(run, entrance.x - 48, entrance.y || 620);
        run.cameraX = clamp(entrance.x - 420, 0, worldWidth(run) - W);
        setObjective(run, "Debug: underground entrance", 1.8);
      }
    }
    if (action === "underground-enter") {
      if (!isUnderground(run)) enterUnderground(run);
      setObjective(run, "Debug: underground sector", 1.8);
    }
    if (action === "underground-gate") {
      if (!isUnderground(run)) enterUnderground(run);
      const key = undergroundKey(run);
      const area = activeArea(run);
      run.undergroundCells[key] = 0;
      run.undergroundComplete[key] = false;
      placePlayersAt(run, area.exitX - 250, area.exitY || 620);
      run.cameraX = clamp(area.exitX - W * 0.66, 0, worldWidth(run) - W);
      setObjective(run, "Debug: underground gate locked", 1.8);
    }
    if (action === "underground-cells") {
      if (!isUnderground(run)) enterUnderground(run);
      const key = undergroundKey(run);
      run.undergroundCells[key] = 3;
      for (const pickup of run.pickups) if (pickup.type === "cell") pickup.taken = true;
      setObjective(run, "Debug: all power cells recovered", 1.8);
    }
    if (action === "underground-complete") {
      const key = undergroundKey(run);
      run.undergroundCells[key] = 3;
      run.undergroundComplete[key] = true;
      if (isUnderground(run)) returnToSurface(run);
      setObjective(run, "Debug: underground cleared", 1.8);
    }
    if (action === "surface-return") {
      if (isUnderground(run)) returnToSurface(run);
      setObjective(run, "Debug: surface sector", 1.4);
    }
    if (action === "sentinel") {
      if (!run.boss) {
        warpPlayers(run, bossStartX(run) + 120);
        updateProgression(run);
      }
      if (run.boss && run.boss.hp > 0) defeatBoss(run);
    }
    if (action === "terminal") {
      run.keys = 3;
      run.undergroundCells[undergroundKey(run)] = 3;
      run.undergroundComplete[undergroundKey(run)] = true;
      run.gateOpen = true;
      if (!run.bossDefeated) {
        if (!run.boss) {
          warpPlayers(run, bossStartX(run) + 120);
          updateProgression(run);
        }
        if (run.boss) defeatBoss(run);
      }
      const cfg = lotteryTerminalConfig(run);
      warpPlayers(run, cfg.x - 52, 620);
      updateLotteryTerminal(run, STEP);
      setObjective(run, "Debug: terminal interaction range", 2);
    }
    if (action === "generate") {
      if (!run.bossDefeated) runDebugAction("terminal");
      claimLotteryTicket(run, "debug-generate", { replace: !currentLevelTicket(run), rerollsUsed: 0 });
      updateTerminalDom();
    }
    if (action === "clear-drops") {
      clearLotteryDebugDrops();
      setObjective(run, "Debug: lottery drops cleared", 1.6);
    }
    if (action === "victory") {
      if (!run.bossDefeated) {
        if (!run.boss) {
          warpPlayers(run, bossStartX(run) + 120);
          updateProgression(run);
        }
        if (run.boss) defeatBoss(run);
      }
      warpPlayers(run, extractionX(run) + 30);
      if (run.levelIndex < LEVELS.length - 1) completeLevel(run);
      else finishRun(true);
    }
    run.cameraX = clamp((run.boss && !run.bossDefeated ? bossStartX(run) - 220 : p.x - 350), 0, worldWidth(run) - W);
    updateCamera(run);
  }

  function warpPlayers(state, x, groundY = 620) {
    for (const p of allPlayers(state)) {
      p.x = clamp(x + p.index * 106, 8, worldWidth(state) - p.w - 10);
      p.y = groundY - p.standingH;
      p.vx = 0;
      p.vy = 0;
      p.checkpointX = p.x;
      p.checkpointY = p.y;
    }
  }

  function normalizeKey(event) {
    if (event.code && event.code !== "Unidentified") return event.code;
    if (event.key === " ") return "Space";
    if (/^[a-z]$/i.test(event.key)) return `Key${event.key.toUpperCase()}`;
    return event.key || "";
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H
    };
  }

  function clearTouchActions() {
    if (!touchDown.size && !touchPressed.size && !touchReleased.size && !touchPointers.size) return;
    for (const action of touchDown) touchReleased.add(action);
    touchDown.clear();
    touchPressed.clear();
    touchPointers.clear();
  }

  function touchAction(action, down) {
    if (action === "pause" && down && mode === "lottery") {
      closeLotteryTerminal();
      return;
    }
    if (down) {
      if (!touchDown.has(action)) touchPressed.add(action);
      touchDown.add(action);
    } else {
      if (touchDown.delete(action)) touchReleased.add(action);
    }
  }

  function handleAction(action) {
    if (action === "start" || action === "start-solo") beginCutscene("solo");
    if (action === "start-two-player") beginCutscene("two-player");
    if (action === "start-coop") beginCutscene("coop");
    if (action === "skip-cutscene") completeCutscene();
    if (action === "cancel-cutscene") cancelCutscene();
    if (action === "resume") resumeRun();
    if (action === "pause") {
      if (mode === "paused") resumeRun();
      else pauseRun();
    }
    if (action === "restart") startRun(run?.runMode || (run?.coOp ? "two-player" : pendingRunMode));
    if (action === "title") setMode("title");
    if (action === "purchase") setMode("purchase");
    if (action === "close-purchase") setMode("title");
    if (action === "settings") openSettings();
    if (action === "close-settings") closeSettings();
    if (action === "generate-lottery") generateLotteryFromTerminal();
    if (action === "copy-lottery") copyTerminalTicket();
    if (action === "copy-all-lottery") copyAllLotteryDrops();
    if (action === "share-result") toggleResultShareMenu();
    if (action === "close-lottery") closeLotteryTerminal();
  }

  function updateSetting(key, value) {
    settings[key] = value;
    writeJSON(SETTINGS_KEY, settings);
    applySettings();
  }

  function applySettings() {
    dom.soundToggle.checked = settings.sound;
    dom.musicToggle.checked = settings.music;
    dom.motionToggle.checked = settings.reducedMotion;
    dom.shakeToggle.checked = settings.reducedShake;
    dom.contrastToggle.checked = settings.highContrastShots;
    dom.touchToggle.checked = settings.touch;
    dom.difficultySelect.value = DIFFICULTY[settings.difficulty] ? settings.difficulty : "arcade";
    document.body.classList.toggle("touch-hidden", !settings.touch);
    document.body.classList.toggle("touch-forced", settings.touch);
    syncGameMusic();
  }

  function syncViewportMode() {
    const compact = window.innerWidth <= 820 || window.innerHeight <= 620 || touchMedia.matches || anyTouchMedia.matches || hasTouchEvents;
    document.body.classList.toggle("compact-play", compact);
    if (compact && !settings.touch) {
      settings.touch = true;
      applySettings();
    }
  }

  function setMode(next) {
    mode = next;
    document.body.classList.toggle("is-title-mode", next === "title");
    document.body.classList.toggle("is-cutscene-mode", next === "cutscene");
    document.body.classList.toggle("is-playing-mode", next === "playing");
    dom.titleScreen.classList.toggle("is-hidden", next !== "title");
    dom.cutsceneScreen?.classList.toggle("is-hidden", next !== "cutscene");
    dom.purchaseScreen.classList.toggle("is-hidden", next !== "purchase");
    dom.pauseScreen.classList.toggle("is-hidden", next !== "paused");
    dom.settingsScreen.classList.toggle("is-hidden", next !== "settings");
    dom.resultsScreen.classList.toggle("is-hidden", next !== "results");
    dom.lotteryTerminalScreen.classList.toggle("is-hidden", next !== "lottery");
    dom.hud.classList.toggle("is-hidden", !(next === "playing" || next === "paused" || next === "settings" || next === "lottery"));
    updatePremiumLotteryButton();
    syncGameMusic();
    updateHUD();
  }

  function openSettings() {
    if (mode === "lottery") return;
    modeBeforeSettings = mode === "playing" ? "paused" : mode;
    if (mode === "playing") modeBeforeSettings = "paused";
    setMode("settings");
  }

  function closeSettings() {
    setMode(modeBeforeSettings || "title");
  }

  function bindCutscene() {
    if (!dom.introCutscene) return;
    dom.introCutscene.addEventListener("timeupdate", updateCutsceneProgress);
    dom.introCutscene.addEventListener("loadedmetadata", updateCutsceneProgress);
    dom.introCutscene.addEventListener("ended", completeCutscene);
    dom.introCutscene.addEventListener("error", completeCutscene);
  }

  function normalizeRunMode(runMode) {
    if (runMode === "coop") return "coop";
    if (runMode === "two-player" || runMode === true) return "two-player";
    return "solo";
  }

  function beginCutscene(runMode = pendingRunMode) {
    const modeKey = normalizeRunMode(runMode);
    pendingCutsceneRunMode = modeKey;
    pendingRunMode = modeKey;
    cutsceneCompleting = false;
    const video = dom.introCutscene;
    if (!video) {
      startRun(modeKey);
      return;
    }

    const session = ++cutsceneSession;
    video.pause();
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    setMode("cutscene");
    updateCutsceneProgress();

    const playback = video.play();
    if (playback?.catch) {
      playback.catch(() => {
        if (session !== cutsceneSession || mode !== "cutscene") return;
        video.muted = true;
        video.play().catch(() => completeCutscene());
      });
    }
  }

  function completeCutscene() {
    if (mode !== "cutscene" || cutsceneCompleting) return;
    cutsceneCompleting = true;
    cutsceneSession += 1;
    dom.introCutscene?.pause();
    if (dom.introCutscene) dom.introCutscene.currentTime = 0;
    const runMode = pendingCutsceneRunMode;
    cutsceneCompleting = false;
    startRun(runMode);
  }

  function cancelCutscene() {
    if (mode !== "cutscene") return;
    cutsceneSession += 1;
    dom.introCutscene?.pause();
    if (dom.introCutscene) dom.introCutscene.currentTime = 0;
    updateCutsceneProgress();
    setMode("title");
  }

  function updateCutsceneProgress() {
    const video = dom.introCutscene;
    if (!video) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const percent = duration ? clamp(current / duration, 0, 1) * 100 : 0;
    if (dom.cutsceneProgress) dom.cutsceneProgress.style.width = `${percent}%`;
    if (dom.cutsceneTime) {
      const seconds = Math.floor(current);
      dom.cutsceneTime.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
  }

  function startRun(runMode = pendingRunMode) {
    const coOp = runMode === "coop";
    const twoPlayer = runMode === "two-player" || coOp || runMode === true;
    const modeKey = coOp ? "coop" : twoPlayer ? "two-player" : "solo";
    pendingRunMode = modeKey;
    beginRewardRun(modeKey);
    run = createRun({ coOp: twoPlayer, runMode: modeKey });
    restartGameMusic();
    setMode("playing");
    pulseTimer = 0;
    playTone(420, 0.08, "triangle", 0.05);
    playTone(720, 0.10, "sine", 0.035);
    syncGameMusic();
  }

  function pauseRun() {
    if (!run || mode !== "playing") return;
    clearInputState();
    setMode("paused");
  }

  function resumeRun() {
    if (!run) return;
    clearInputState();
    setMode("playing");
  }

  function makePlayer(index, spawnX) {
    const diff = difficultyConfig();
    return {
      id: index === 0 ? "p1" : "p2",
      label: index === 0 ? "P1" : "P2",
      index,
      x: spawnX,
      y: 620 - 118,
      w: 56,
      h: 118,
      standingH: 118,
      crouchH: 76,
      vx: 0,
      vy: 0,
      facing: 1,
      hp: 3,
      maxHp: 3,
      lives: diff.lives,
      grounded: false,
      coyote: 0,
      jumpBuffer: 0,
      fireCd: 0,
      dashCd: 0,
      dashTime: 0,
      dashX: 1,
      dashY: 0,
      airDashUsed: false,
      invuln: 0,
      overdrive: 0,
      overdriveTime: 0,
      weapon: "heart",
      weaponTimer: 0,
      luckyShield: 0,
      checkpointX: spawnX,
      checkpointY: 620 - 118,
      crouching: false,
      action: "idle",
      aim: { x: 1, y: 0 },
      dashReadyFlash: 0,
      knockbackTime: 0,
      wallSide: 0,
      wallStick: 0,
      wallKickLock: 0,
      landingSquash: 0,
      trail: []
    };
  }

  function createRun(options = {}) {
    const player1 = makePlayer(0, 118);
    const player2 = makePlayer(1, 224);
    const players = options.coOp ? [player1, player2] : [player1];
    const state = {
      coOp: Boolean(options.coOp),
      runMode: options.runMode || (options.coOp ? "two-player" : "solo"),
      time: 0,
      campaignTime: 0,
      levelIndex: 0,
      level: LEVELS[0],
      area: "surface",
      zones: { surface: null, underground: null },
      undergroundCells: {},
      undergroundComplete: {},
      areaPrompt: { inRange: false, type: null, text: "", x: 0, y: 0 },
      areaTransition: 0,
      areaNotice: "",
      levelTime: 0,
      introTimer: 2.6,
      levelCompleteTimer: 0,
      nextLevelIndex: null,
      cameraX: 0,
      cameraY: 0,
      cameraLookX: 0,
      bossIntroPan: 0,
      shakeTrauma: 0,
      hitStop: 0,
      platforms: [],
      enemies: [],
      playerShots: [],
      enemyShots: [],
      hazards: [],
      levelHazards: [],
      particles: [],
      fxBursts: [],
      reinforcementFlags: new Set(),
      waveRewardFlags: new Set(),
      pickups: [],
      gateOpen: false,
      gatePulse: 0,
      arenaLock: null,
      boss: null,
      bossDefeated: false,
      extractionOpen: false,
      objective: "Collect 3 vault keys",
      objectiveTimer: 4,
      toast: "",
      toastTimer: 0,
      keys: 0,
      shards: 0,
      lotteryTickets: {},
      terminal: {
        inRange: false,
        activeLevelId: null,
        ticket: null,
        rerollsUsed: 0,
        copyStatusTimer: 0
      },
      levelResults: [],
      combo: 0,
      comboTimer: 0,
      stats: {
        score: 0,
        kills: 0,
        shotsFired: 0,
        shotsHit: 0,
        damageTaken: 0,
        maxCombo: 0
      },
      player: player1,
      players
    };

    loadLevel(state, 0, true);
    return state;
  }

  function loadLevel(state, index, fresh = false) {
    const level = LEVELS[index] || LEVELS[0];
    state.levelIndex = index;
    state.level = level;
    state.area = "surface";
    state.zones = { surface: null, underground: null };
    state.undergroundCells[String(level.id)] = 0;
    state.undergroundComplete[String(level.id)] = false;
    state.areaPrompt = { inRange: false, type: null, text: "", x: 0, y: 0 };
    state.areaTransition = 0;
    state.areaNotice = "";
    state.levelTime = 0;
    state.introTimer = fresh ? 2.8 : 2.35;
    state.levelCompleteTimer = 0;
    state.nextLevelIndex = null;
    state.cameraX = 0;
    state.cameraY = 0;
    state.cameraLookX = 0;
    state.bossIntroPan = 0;
    state.shakeTrauma = 0;
    state.hitStop = 0;
    state.platforms = buildPlatforms(level);
    state.pickups = buildPickups(level);
    state.enemies = level.spawns.map(([type, x, groundY]) => makeEnemy(type, x, groundY));
    state.playerShots = [];
    state.enemyShots = [];
    state.hazards = [];
    state.levelHazards = level.hazards.map((hazard) => ({ ...hazard, pulse: 0, hitCd: 0 }));
    state.particles = [];
    state.fxBursts = [];
    state.reinforcementFlags = new Set();
    state.waveRewardFlags = new Set();
    state.gateOpen = false;
    state.gatePulse = 0;
    state.arenaLock = null;
    state.boss = null;
    state.bossDefeated = false;
    state.extractionOpen = false;
    state.objective = level.objective;
    state.objectiveTimer = 4;
    state.toast = "";
    state.toastTimer = 0;
    state.terminal.inRange = false;
    state.terminal.activeLevelId = level.id;
    state.terminal.ticket = state.lotteryTickets[String(level.id)] || null;
    state.terminal.rerollsUsed = state.terminal.ticket?.rerollsUsed || 0;
    state.keys = 0;
    state.shards = 0;
    state.combo = 0;
    state.comboTimer = 0;
    for (const [playerIndex, player] of allPlayers(state).entries()) {
      resetPlayerForLevel(player, playerIndex, fresh);
    }
    playTone(360 + level.id * 80, 0.10, "triangle", 0.04);
    for (const player of allPlayers(state)) {
      addBurst(state, player.x + 28, player.y + 80, player.index === 1 ? colors.cyan : colors.gold, 24, 220);
    }
    emitRewardEvent("shadow.level_started", {
      levelId: rewardLevelId(state),
      levelIndex: state.levelIndex,
      difficulty: settings.difficulty || "arcade"
    });
  }

  function resetPlayerForLevel(p, playerIndex, fresh) {
    const spawnX = 118 + playerIndex * 106;
    if (!fresh && p.lives <= 0) p.lives = 1;
    p.x = spawnX;
    p.y = 620 - p.standingH;
    p.vx = 0;
    p.vy = 0;
    p.dashCd = 0;
    p.dashTime = 0;
    p.dashReadyFlash = 0;
    p.knockbackTime = 0;
    p.wallSide = 0;
    p.wallStick = 0;
    p.wallKickLock = 0;
    p.landingSquash = 0;
    p.airDashUsed = false;
    p.hp = p.maxHp;
    p.facing = 1;
    p.invuln = fresh ? 1.8 : 1.2;
    p.overdrive = fresh ? p.overdrive : Math.max(p.overdrive, 42);
    p.overdriveTime = 0;
    p.weapon = fresh ? "heart" : p.weapon;
    p.weaponTimer = fresh ? 0 : Math.max(0, p.weaponTimer || 0);
    p.luckyShield = fresh ? 0 : Math.max(0, p.luckyShield || 0);
    p.checkpointX = p.x;
    p.checkpointY = p.y;
    p.crouching = false;
    p.trail = [];
  }

  function isUnderground(state) {
    return state?.area === "underground";
  }

  function activeArea(state) {
    if (!state) return null;
    return isUnderground(state) ? state.level?.underground || state.level : state.level;
  }

  function activeAreaWidth(state) {
    return activeArea(state)?.width || state?.level?.width || WORLD_W;
  }

  function undergroundKey(state) {
    return String(state?.level?.id || 1);
  }

  function undergroundCellCount(state) {
    return state?.undergroundCells?.[undergroundKey(state)] || 0;
  }

  function undergroundComplete(state) {
    return Boolean(state?.undergroundComplete?.[undergroundKey(state)]);
  }

  function undergroundExitReady(state) {
    return undergroundComplete(state) || undergroundCellCount(state) >= 3;
  }

  function gateReady(state) {
    return Boolean(state && state.keys >= 3 && undergroundComplete(state));
  }

  function currentObjectiveText(state) {
    if (!state) return "Collect 3 vault keys";
    if (isUnderground(state)) return undergroundCellCount(state) >= 3 ? "Return to the surface" : "Recover 3 power cells";
    if (state.bossDefeated) return "Reach extraction and claim the terminal drop";
    if (state.gateOpen) return "Enter the boss chamber";
    if (state.keys < 3) return state.level?.objective || "Collect 3 vault keys";
    if (!undergroundComplete(state)) return "Enter the underground sector and recover 3 power cells";
    return "Open the boss gate";
  }

  function createZoneState(state, area, areaName) {
    return {
      areaName,
      area,
      cameraX: 0,
      cameraY: 0,
      cameraLookX: 0,
      platforms: buildPlatforms(area),
      pickups: buildPickups(area),
      enemies: (area.spawns || []).map(([type, x, groundY]) => makeEnemy(type, x, groundY)),
      playerShots: [],
      enemyShots: [],
      hazards: [],
      levelHazards: (area.hazards || []).map((hazard) => ({ ...hazard, pulse: 0, hitCd: 0 })),
      particles: [],
      fxBursts: [],
      reinforcementFlags: new Set(),
      waveRewardFlags: new Set(),
      gateOpen: areaName === "surface" ? state.gateOpen : false,
      gatePulse: state.gatePulse || 0,
      arenaLock: areaName === "surface" ? state.arenaLock : null,
      boss: areaName === "surface" ? state.boss : null,
      bossDefeated: areaName === "surface" ? state.bossDefeated : false,
      extractionOpen: areaName === "surface" ? state.extractionOpen : false,
      objective: area.objective || currentObjectiveText(state),
      objectiveTimer: 3,
      checkpoints: allPlayers(state).map((p) => ({ id: p.id, x: p.checkpointX, y: p.checkpointY }))
    };
  }
  function captureActiveZone(state) {
    return {
      areaName: state.area || "surface",
      area: activeArea(state),
      cameraX: state.cameraX,
      cameraY: state.cameraY,
      cameraLookX: state.cameraLookX,
      platforms: state.platforms,
      pickups: state.pickups,
      enemies: state.enemies,
      playerShots: [],
      enemyShots: [],
      hazards: [],
      levelHazards: state.levelHazards,
      particles: state.particles,
      fxBursts: state.fxBursts,
      reinforcementFlags: state.reinforcementFlags,
      waveRewardFlags: state.waveRewardFlags,
      gateOpen: state.gateOpen,
      gatePulse: state.gatePulse,
      arenaLock: state.arenaLock,
      boss: state.boss,
      bossDefeated: state.bossDefeated,
      extractionOpen: state.extractionOpen,
      objective: state.objective,
      objectiveTimer: state.objectiveTimer,
      checkpoints: allPlayers(state).map((p) => ({ id: p.id, x: p.checkpointX, y: p.checkpointY }))
    };
  }

  function applyZoneState(state, zone) {
    state.area = zone.areaName || "surface";
    state.cameraX = zone.cameraX || 0;
    state.cameraY = zone.cameraY || 0;
    state.cameraLookX = zone.cameraLookX || 0;
    state.platforms = zone.platforms || [];
    state.pickups = zone.pickups || [];
    state.enemies = zone.enemies || [];
    state.playerShots = [];
    state.enemyShots = [];
    state.hazards = [];
    state.levelHazards = zone.levelHazards || [];
    state.particles = zone.particles || [];
    state.fxBursts = zone.fxBursts || [];
    state.reinforcementFlags = zone.reinforcementFlags || new Set();
    state.waveRewardFlags = zone.waveRewardFlags || new Set();
    state.gateOpen = state.area === "surface" ? Boolean(zone.gateOpen) : false;
    state.gatePulse = zone.gatePulse || 0;
    state.arenaLock = state.area === "surface" ? zone.arenaLock : null;
    state.boss = state.area === "surface" ? zone.boss : null;
    state.bossDefeated = state.area === "surface" ? Boolean(zone.bossDefeated) : false;
    state.extractionOpen = state.area === "surface" ? Boolean(zone.extractionOpen) : false;
    state.objective = zone.objective || currentObjectiveText(state);
    state.objectiveTimer = Math.max(zone.objectiveTimer || 0, 1.4);
    for (const p of allPlayers(state)) {
      const saved = zone.checkpoints?.find((entry) => entry.id === p.id);
      if (saved) {
        p.checkpointX = saved.x;
        p.checkpointY = saved.y;
      }
    }
  }

  function placePlayersAt(state, x, groundY = 620) {
    for (const [index, p] of allPlayers(state).entries()) {
      p.x = x + index * 86;
      p.y = groundY - p.standingH;
      p.vx = 0;
      p.vy = 0;
      p.dashTime = 0;
      p.crouching = false;
      p.h = p.standingH;
      p.checkpointX = p.x;
      p.checkpointY = p.y;
      p.invuln = Math.max(p.invuln || 0, 0.8);
      p.trail = [];
    }
    state.cameraX = clamp(x - 220, 0, Math.max(0, activeAreaWidth(state) - W));
    state.cameraY = 0;
    state.cameraLookX = 0;
  }

  function startAreaTransition(state, label) {
    state.areaTransition = 0.38;
    state.areaNotice = label || activeArea(state)?.title || "AREA LINK";
    clearInputState();
  }
  function enterUnderground(state) {
    const area = state?.level?.underground;
    if (!state || !area || isUnderground(state)) return false;
    state.zones.surface = captureActiveZone(state);
    if (!state.zones.underground) state.zones.underground = createZoneState(state, area, "underground");
    applyZoneState(state, state.zones.underground);
    placePlayersAt(state, area.spawn?.x || 126, area.spawn?.y || 620);
    setObjective(state, area.objective || "Recover 3 power cells", 3.2);
    addBurst(state, area.spawn?.x || 126, 560, colors.purple, 42, 440);
    playTone(180, 0.12, "triangle", 0.052);
    playTone(520, 0.16, "sine", 0.036);
    startAreaTransition(state, area.title);
    return true;
  }

  function returnToSurface(state) {
    const area = state?.level?.underground;
    if (!state || !area || !isUnderground(state)) return false;
    state.zones.underground = captureActiveZone(state);
    const completedNow = undergroundCellCount(state) >= 3 && !undergroundComplete(state);
    if (undergroundCellCount(state) >= 3) state.undergroundComplete[undergroundKey(state)] = true;
    if (!state.zones.surface) state.zones.surface = createZoneState(state, state.level, "surface");
    applyZoneState(state, state.zones.surface);
    placePlayersAt(state, area.entrance?.returnX || area.entrance?.x || 360, area.entrance?.y || 620);
    setObjective(state, completedNow ? "Underground sector complete: open the boss gate" : currentObjectiveText(state), 3.2);
    addBurst(state, area.entrance?.returnX || area.entrance?.x || 360, (area.entrance?.y || 620) - 70, completedNow ? colors.gold : colors.cyan, 46, 460);
    playTone(completedNow ? 620 : 360, 0.12, "triangle", 0.054);
    playTone(980, 0.16, "sine", 0.034);
    startAreaTransition(state, completedNow ? "SECTOR COMPLETE" : state.level.title);
    return true;
  }

  function playerInAreaPortal(state, player) {
    const area = state?.level?.underground;
    if (!state || !area || !player) return false;
    if (!isUnderground(state) && undergroundComplete(state)) return false;
    const centerX = player.x + player.w * 0.5;
    const centerY = player.y + player.h * 0.5;
    const cfg = isUnderground(state)
      ? { x: area.exitX, y: 620, radius: 150 }
      : { x: area.entrance?.x || 0, y: area.entrance?.y || 620, radius: area.entrance?.radius || 145 };
    return Math.abs(centerX - cfg.x) <= cfg.radius && Math.abs(centerY - cfg.y + 30) <= 210;
  }

  function updateAreaPrompt(state) {
    state.areaPrompt = { inRange: false, type: null, text: "", x: 0, y: 0 };
    const area = state?.level?.underground;
    if (!state || !area) return;
    const player = activePlayers(state).find((p) => playerInAreaPortal(state, p));
    if (!player) {
      if (!state.terminal?.inRange) dom.touchUseButton.classList.add("is-hidden");
      return;
    }
    if (isUnderground(state)) {
      state.areaPrompt = { inRange: true, type: "exit", text: undergroundCellCount(state) >= 3 ? "DOWN / S - RETURN SURFACE" : "DOWN / S - RETURN SURFACE (CELLS STILL MISSING)", x: area.exitX, y: 560 };
    } else {
      state.areaPrompt = { inRange: true, type: "entrance", text: "DOWN / S - ENTER UNDERGROUND", x: area.entrance?.x || 0, y: (area.entrance?.y || 620) - 70 };
    }
    dom.touchUseButton.textContent = state.areaPrompt.type === "entrance" ? "DOWN" : "UP";
    dom.touchUseButton.setAttribute("aria-label", state.areaPrompt.text);
    dom.touchUseButton.classList.toggle("is-hidden", mode !== "playing");
    if (state.objectiveTimer <= 0.35) setObjective(state, state.areaPrompt.text, 0.9);
  }

  function tryUseAreaPortal(state) {
    updateAreaPrompt(state);
    if (!state.areaPrompt?.inRange) return false;
    return state.areaPrompt.type === "entrance" ? enterUnderground(state) : returnToSurface(state);
  }
  function allPlayers(state) {
    if (!state) return [];
    return state.players?.length ? state.players : [state.player].filter(Boolean);
  }

  function activePlayers(state) {
    return allPlayers(state).filter((player) => player.lives > 0);
  }

  function playerById(state, id) {
    return allPlayers(state).find((player) => player.id === id) || state.player;
  }

  function nearestPlayer(state, x, y = 0) {
    const players = activePlayers(state);
    if (!players.length) return state.player;
    let nearest = players[0];
    let bestDistance = Infinity;
    for (const player of players) {
      const px = player.x + player.w * 0.5;
      const py = player.y + player.h * 0.5;
      const distance = Math.hypot(px - x, py - y);
      if (distance < bestDistance) {
        nearest = player;
        bestDistance = distance;
      }
    }
    return nearest;
  }

  function maxPlayerX(state) {
    const players = activePlayers(state);
    if (!players.length) return state.player?.x || 0;
    return Math.max(...players.map((player) => player.x + player.w));
  }

  function buildPlatforms(level) {
    return level.platforms.map(([x, y, w, h, kind, options]) => platform(x, y, w, h, kind, options || {}));
  }

  function platform(x, y, w, h, kind, options = {}) {
    const plat = { x, y, baseX: x, baseY: y, w, h, kind, ...options };
    if (plat.move) {
      plat.move.phase = plat.move.phase || Math.random() * Math.PI * 2;
    }
    return plat;
  }

  function buildPickups(level) {
    const pickups = [];
    for (const [x, y, count] of level.shardRows || []) {
      for (let i = 0; i < count; i += 1) {
        pickups.push({ type: "shard", x: x + i * 54, y, r: 15, taken: false, bob: i * 0.6 });
      }
    }
    (level.keys || []).forEach(([x, y], index) => pickups.push({ type: "key", x, y, r: 22, taken: false, bob: index * 1.4 }));
    (level.bonuses || []).forEach(([type, x, y], index) => pickups.push({ type, x, y, r: 20, taken: false, bob: index * 0.7 }));
    (level.weaponDrops || []).forEach(([weapon, x, y], index) => pickups.push({ type: "weapon", weapon, x, y, r: 21, taken: false, bob: index * 0.9 }));
    (level.cells || []).forEach(([x, y], index) => pickups.push({ type: "cell", cellIndex: index, x, y, r: 23, taken: false, bob: index * 1.1 }));
    return pickups;
  }

  function updateEncounterDirector(state) {
    if (!state?.level?.waves?.length || state.levelCompleteTimer > 0 || state.bossDefeated) return;
    const leadX = maxPlayerX(state);
    for (const wave of state.level.waves) {
      if (state.reinforcementFlags.has(wave.id) || leadX < wave.triggerX) continue;
      state.reinforcementFlags.add(wave.id);
      if (leadX > wave.triggerX + 900) continue;
      spawnReinforcementWave(state, wave);
    }
  }

  function spawnReinforcementWave(state, wave) {
    let spawned = 0;
    for (const [type, x, groundY] of wave.spawns) {
      if (x < state.cameraX - 220 || x > state.cameraX + W + 920) continue;
      const enemy = makeEnemy(type, x, groundY);
      enemy.waveId = wave.id;
      enemy.arenaEnemy = true;
      enemy.cd = Math.max(enemy.cd, 0.85);
      enemy.telegraph = type === "drone" || type === "turret" ? 0.45 : 0;
      enemy.hurt = 0.08;
      state.enemies.push(enemy);
      spawned += 1;
      addBurst(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.48, colors.purple, 12, 260);
      addFxBurst(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.52, FX_ROWS.spawnBurst, enemy.type === "drone" ? 190 : 150, 0.5);
    }
    if (spawned > 0) {
      setObjective(state, `${wave.objective}: push through`, 2.2);
      playTone(180 + state.level.id * 35, 0.07, "sawtooth", 0.035);
      playTone(420 + state.level.id * 55, 0.09, "triangle", 0.025);
    }
    return spawned;
  }

  function setArenaLock(state) {
    // Ambushes are no longer hard-locked; clear stale lock state from older runs.
    if (state) state.arenaLock = null;
  }

  function updateArenaLock(state) {
    setArenaLock(state);
  }

  function arenaLockActive() {
    return false;
  }

  function worldWidth(state) {
    return activeAreaWidth(state);
  }

  function gateX(state) {
    return state?.level?.gateX || GATE_X;
  }

  function gateBlockBox(state) {
    return {
      x: gateX(state) + GATE_BLOCK_X_OFFSET,
      y: GATE_BLOCK_TOP,
      w: GATE_BLOCK_W,
      h: GATE_BLOCK_BOTTOM - GATE_BLOCK_TOP
    };
  }

  function gateLockedMessage(state) {
    if (state.keys < 3) return "Gate locked: collect 3 vault keys";
    return "Gate ready: move in close to unlock";
  }

  function bossStartX(state) {
    return state?.level?.bossStartX || BOSS_START_X;
  }

  function extractionX(state) {
    return state?.level?.extractionX || EXTRACTION_X;
  }

  function lotteryTerminalConfig(state) {
    const level = state?.level;
    return level?.lotteryTerminal || { x: extractionX(state) - 220, y: 548, interactionRadius: 120, unlock: "boss-defeated" };
  }

  function lotteryTerminalUnlocked(state) {
    return Boolean(state?.bossDefeated);
  }

  function currentLevelTicket(state) {
    return state?.lotteryTickets?.[String(state.level.id)] || null;
  }

  function ticketDropLabel(ticket) {
    const source = ticket?.dropCode || ticket?.id || "DROP 0000";
    return source.startsWith("DROP") ? source : `DROP ${source.slice(-4).toUpperCase().padStart(4, "0")}`;
  }

  function formatTicketCopy(ticket, prefix = `ROBOT RAHBE - Level ${ticket.levelId} Vault Drop`) {
    return [
      prefix,
      `Pick 3: ${ticket.pick3}`,
      `Pick 4: ${ticket.pick4}`,
      `Pick 6 Mega: ${ticket.pick6}`,
      "Random number generator - entertainment only."
    ].join("\n");
  }

  function terminalInRange(state) {
    if (!state || !lotteryTerminalUnlocked(state)) return false;
    const cfg = lotteryTerminalConfig(state);
    return activePlayers(state).some((p) => Math.hypot(p.x + p.w * 0.5 - cfg.x, p.y + p.h * 0.5 - cfg.y) <= cfg.interactionRadius);
  }

  function updateLotteryTerminal(state, dt) {
    state.terminal.inRange = terminalInRange(state);
    if (state.toastTimer > 0) state.toastTimer = Math.max(0, state.toastTimer - dt);
    if (state.terminal.copyStatusTimer > 0) {
      state.terminal.copyStatusTimer = Math.max(0, state.terminal.copyStatusTimer - dt);
      if (state.terminal.copyStatusTimer <= 0) dom.lotteryCopyStatus.textContent = "";
    }
    if (!state.areaPrompt?.inRange) {
      dom.touchUseButton.textContent = "USE";
      dom.touchUseButton.setAttribute("aria-label", "Use terminal");
    }
    dom.touchUseButton.classList.toggle("is-hidden", !(mode === "playing" && (state.terminal.inRange || state.areaPrompt?.inRange)));
    if (state.terminal.inRange && !currentLevelTicket(state) && state.objectiveTimer <= 0.4) {
      setObjective(state, "Press X or USE to access terminal", 0.8);
    }
  }

  function makeLotteryTicket(state, source = "vault-terminal", rerollsUsed = 0) {
    return LotteryGenerator.generateTicket({
      levelId: state.level.id,
      levelTitle: state.level.title,
      source,
      rerollsUsed
    });
  }

  function claimLotteryTicket(state, source = "vault-terminal", options = {}) {
    const levelId = String(state.level.id);
    if (!options.replace && state.lotteryTickets[levelId]) return state.lotteryTickets[levelId];
    const ticket = makeLotteryTicket(state, source, options.rerollsUsed || 0);
    state.lotteryTickets[levelId] = ticket;
    state.terminal.ticket = ticket;
    state.terminal.rerollsUsed = ticket.rerollsUsed || 0;
    saveLotteryTicket(ticket);
    const reward = terminalGameplayReward(state);
    addScore(state, reward.score);
    for (const player of activePlayers(state)) {
      player.luckyShield = Math.max(player.luckyShield || 0, reward.shield);
      player.overdrive = clamp(player.overdrive + reward.overdrive, 0, 100);
      player.weapon = reward.weapon;
      player.weaponTimer = Math.max(player.weaponTimer || 0, reward.weaponTime);
      addBurst(state, player.x + player.w * 0.5, player.y + player.h * 0.48, WEAPON_META[reward.weapon]?.color || colors.gold, 18, 280);
    }
    state.toast = `VAULT DROP SECURED - P3 ${ticket.pick3} - P4 ${ticket.pick4} - P6 MEGA ${ticket.pick6}`;
    state.toastTimer = 3;
    setObjective(state, `Terminal reward: ${reward.label}`, 3);
    playTone(620, 0.05, "triangle", 0.032);
    playTone(880, 0.08, "sine", 0.03);
    return ticket;
  }

  function terminalGameplayReward(state) {
    const stats = state.stats || {};
    const accuracy = stats.shotsFired ? (stats.shotsHit / stats.shotsFired) * 100 : 0;
    const cleanRun = (stats.damageTaken || 0) <= 3;
    const combo = stats.maxCombo || state.combo || 0;
    const weapon = accuracy >= 55 || combo >= 10 ? "beam" : combo >= 5 ? "spread" : "rapid";
    const overdrive = clamp(32 + combo * 2 + (accuracy >= 50 ? 12 : 0), 30, 82);
    const shield = cleanRun ? 32 : 20;
    const score = 750 + (stats.kills || 0) * 35 + (state.shards || 0) * 20 + combo * 45;
    const label = `${WEAPON_META[weapon]?.label || "WEAPON"} +${Math.round(overdrive)} OD + shield`;
    return { weapon, weaponTime: cleanRun ? 18 : 12, overdrive, shield, score, label };
  }

  function ensureLevelTicket(state, source = "auto-extraction") {
    return currentLevelTicket(state) || claimLotteryTicket(state, source);
  }

  function tryOpenLotteryTerminal() {
    if (!run || mode !== "playing" || run.levelCompleteTimer > 0 || !run.terminal.inRange) return false;
    if (!lotteryTerminalUnlocked(run)) {
      setObjective(run, "Terminal locked until sentinel defeat", 1.4);
      return false;
    }
    openLotteryTerminal();
    return true;
  }

  function openLotteryTerminal() {
    if (!run || mode === "lottery") return;
    lotteryReturnMode = mode;
    run.terminal.ticket = currentLevelTicket(run);
    run.terminal.rerollsUsed = run.terminal.ticket?.rerollsUsed || 0;
    clearInputState();
    updateTerminalDom();
    setMode("lottery");
    requestAnimationFrame(() => dom.generateLotteryButton?.focus());
  }

  function closeLotteryTerminal() {
    if (mode !== "lottery") return;
    clearInputState();
    setMode(lotteryReturnMode || "playing");
    canvas.focus?.();
  }

  function installAccountBridge() {
    window.addEventListener("message", (event) => {
      if (event.origin !== location.origin || event.source !== window.parent || !event.data) return;
      const message = event.data;
      if (message.type === "lottomind:account-state") {
        const next = message.snapshot || {};
        accountState = {
          authenticated: Boolean(next.authenticated),
          verified: Boolean(next.verified),
          offline: Boolean(next.offline),
          credits: Number.isFinite(Number(next.credits)) ? Math.max(0, Number(next.credits)) : 0,
          collector: next.collector || null,
          memberships: Array.isArray(next.memberships) ? next.memberships : [],
          entitlements: next.entitlements && typeof next.entitlements === "object" ? next.entitlements : {},
          features: next.features && typeof next.features === "object" ? next.features : {},
          creditActions: next.creditActions && typeof next.creditActions === "object" ? next.creditActions : {}
        };
        document.body.classList.toggle("has-collector-access", accountState.collector?.status === "active");
        updatePremiumLotteryButton();
        return;
      }
      if (!premiumLotteryPending || message.requestId !== premiumLotteryPending.requestId) return;
      if (message.type === "lottomind:credit-action-denied") {
        premiumLotteryPending = null;
        dom.lotteryCopyStatus.textContent = message.message || creditDenialMessage(message.reason);
        updatePremiumLotteryButton();
        return;
      }
      if (message.type !== "lottomind:credit-action-approved") return;
      const pending = premiumLotteryPending;
      premiumLotteryPending = null;
      try {
        completePremiumLotteryConversion();
        accountState.credits = Number.isFinite(Number(message.balance)) ? Math.max(0, Number(message.balance)) : accountState.credits;
        window.parent.postMessage({
          type: "lottomind:credit-action-completed",
          requestId: pending.requestId,
          transactionId: message.transactionId
        }, location.origin);
      } catch (_error) {
        window.parent.postMessage({
          type: "lottomind:credit-action-failed",
          requestId: pending.requestId,
          transactionId: message.transactionId
        }, location.origin);
        dom.lotteryCopyStatus.textContent = "Premium conversion did not complete. The wallet is restoring the credits.";
      }
      updatePremiumLotteryButton();
    });
    if (window.parent !== window) {
      window.parent.postMessage({ type: "lottomind:game-ready" }, location.origin);
    }
    updatePremiumLotteryButton();
  }

  function creditDenialMessage(reason) {
    if (reason === "AUTH_REQUIRED") return "Sign in through Collector Access to use premium actions.";
    if (reason === "ACCOUNT_OFFLINE") return "The verified wallet is offline. Premium actions are paused.";
    if (reason === "INSUFFICIENT_CREDITS") return "Not enough Lotto Credits for this premium action.";
    if (reason === "CANCELLED") return "Premium conversion cancelled. No credits were used.";
    return "Premium conversion is unavailable right now.";
  }

  function premiumLotteryPrice() {
    const configured = Number(accountState.creditActions?.["beat2lotto.premium-number-conversion"]);
    return Number.isFinite(configured) && configured > 0 ? configured : null;
  }

  function updatePremiumLotteryButton() {
    const button = dom.premiumLotteryButton;
    if (!button) return;
    const price = premiumLotteryPrice();
    const activeCollector = accountState.collector?.status === "active";
    dom.collectorTerminalBadge.hidden = !activeCollector;
    button.textContent = premiumLotteryPending
      ? "Verifying Wallet..."
      : !accountState.authenticated
        ? "Sign In for Premium"
        : accountState.offline || !accountState.verified
          ? "Wallet Offline"
          : price
            ? `Premium Convert · ${price} Credits`
            : "Premium Convert";
    button.disabled = Boolean(
      premiumLotteryPending ||
      mode !== "lottery" ||
      !run ||
      !accountState.authenticated ||
      accountState.offline ||
      !accountState.verified ||
      !price ||
      accountState.credits < price
    );
    button.title = button.disabled && accountState.authenticated && price && accountState.credits < price
      ? `Requires ${price} Lotto Credits. Verified balance: ${accountState.credits}.`
      : "Convert the current entertainment pick using the verified Lotto Credit wallet.";
  }

  function requestPremiumLotteryConversion() {
    if (premiumLotteryPending || !run || mode !== "lottery") return;
    const price = premiumLotteryPrice();
    if (!accountState.authenticated || !accountState.verified || accountState.offline || !price || accountState.credits < price) {
      updatePremiumLotteryButton();
      return;
    }
    const requestId = crypto.randomUUID ? crypto.randomUUID() : `premium-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    premiumLotteryPending = { requestId };
    dom.lotteryCopyStatus.textContent = "Waiting for verified wallet confirmation...";
    updatePremiumLotteryButton();
    window.parent.postMessage({
      type: "lottomind:credit-action-request",
      requestId,
      action: "beat2lotto.premium-number-conversion"
    }, location.origin);
  }

  function completePremiumLotteryConversion() {
    if (!run || mode !== "lottery") throw new Error("Lottery terminal is not active");
    const existing = currentLevelTicket(run);
    const ticket = claimLotteryTicket(run, "premium-number-conversion", {
      replace: Boolean(existing),
      rerollsUsed: existing?.rerollsUsed || run.terminal.rerollsUsed || 0
    });
    dom.lotteryTicket?.classList.add("is-premium-conversion");
    dom.lotteryCopyStatus.textContent = "Premium entertainment pick converted and saved.";
    if (!settings.reducedMotion) {
      showTicketPlaceholders();
      setTimeout(() => updateTerminalDom(ticket), 420);
    } else {
      updateTerminalDom(ticket);
    }
  }

  function generateLotteryFromTerminal() {
    if (!run || mode !== "lottery") return;
    const existing = currentLevelTicket(run);
    const reroll = Boolean(existing);
    const used = existing?.rerollsUsed || run.terminal.rerollsUsed || 0;
    if (reroll) {
      if (used >= 2 || run.shards < 25) return;
      run.shards -= 25;
    }
    const ticket = claimLotteryTicket(run, reroll ? "vault-terminal-reroll" : "vault-terminal", {
      replace: reroll,
      rerollsUsed: reroll ? used + 1 : 0
    });
    if (!settings.reducedMotion) {
      showTicketPlaceholders();
      setTimeout(() => updateTerminalDom(ticket), 420);
    } else {
      updateTerminalDom(ticket);
    }
  }

  function showTicketPlaceholders() {
    dom.terminalPick3.textContent = "***";
    dom.terminalPick4.textContent = "****";
    renderPick6Balls(dom.terminalPick6, null);
  }

  function updateTerminalDom(ticket = run?.terminal?.ticket || currentLevelTicket(run)) {
    const levelName = run?.level?.shortName || "Vault";
    dom.lotteryTerminalStatus.textContent = ticket ? `${levelName} drop secured. Rerolling is optional entertainment only.` : `${levelName} reward ready. Generate your level-completion drop.`;
    dom.terminalPick3.textContent = ticket?.pick3 || "---";
    dom.terminalPick4.textContent = ticket?.pick4 || "----";
    renderPick6Balls(dom.terminalPick6, ticket?.pick6);
    const rerollsUsed = ticket?.rerollsUsed || run?.terminal?.rerollsUsed || 0;
    dom.terminalRerolls.textContent = `Rerolls ${rerollsUsed}/2`;
    dom.generateLotteryButton.textContent = ticket ? "Reroll Numbers" : "Generate Numbers";
    dom.generateLotteryButton.disabled = Boolean(ticket && (rerollsUsed >= 2 || run.shards < 25));
    dom.copyLotteryButton.disabled = !ticket;
    updatePremiumLotteryButton();
  }

  function renderPick6Balls(target, value) {
    if (!target) return;
    const pick = LotteryGenerator.parseMegaPick(value);
    const labels = pick
      ? [...pick.main.map(LotteryGenerator.formatBall), LotteryGenerator.formatBall(pick.bonus)]
      : ["--", "--", "--", "--", "--", "--"];
    target.textContent = "";
    target.setAttribute(
      "aria-label",
      pick
        ? `Pick 6 Mega numbers ${pick.main.map(LotteryGenerator.formatBall).join(", ")} and Mega Ball ${LotteryGenerator.formatBall(pick.bonus)}`
        : "Pick 6 Mega numbers pending"
    );
    const wrap = document.createElement("span");
    wrap.className = "pick6-balls";
    for (let index = 0; index < 6; index += 1) {
      const ball = document.createElement("span");
      ball.className = `pick6-ball${index === 5 ? " pick6-ball--bonus" : ""}`;
      ball.textContent = labels[index];
      wrap.appendChild(ball);
    }
    target.appendChild(wrap);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await Promise.race([
          navigator.clipboard.writeText(text),
          new Promise((_, reject) => window.setTimeout(() => reject(new Error("Clipboard timeout")), 900))
        ]);
        return true;
      }
    } catch {}
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }

  async function copyTerminalTicket() {
    const ticket = currentLevelTicket(run);
    if (!ticket) return;
    const ok = await copyText(formatTicketCopy(ticket));
    dom.lotteryCopyStatus.textContent = ok ? "Copied" : "Copy unavailable";
    run.terminal.copyStatusTimer = 1.8;
    playTone(720, 0.04, "square", 0.025);
  }

  async function copyAllLotteryDrops() {
    if (!run) return;
    const tickets = LEVELS.map((level) => run.lotteryTickets[String(level.id)]).filter(Boolean);
    if (!tickets.length) return;
    await copyText(tickets.map((ticket) => formatTicketCopy(ticket)).join("\n\n"));
  }

  function toggleResultShareMenu(forceOpen) {
    if (!dom.resultShareMenu || !dom.shareResultButton) return;
    const open = typeof forceOpen === "boolean" ? forceOpen : dom.resultShareMenu.hidden;
    dom.resultShareMenu.hidden = !open;
    dom.shareResultButton.setAttribute("aria-expanded", String(open));
    if (open && dom.resultShareStatus) dom.resultShareStatus.textContent = "";
  }

  function resultShareText() {
    const pick6Balls = Array.from(dom.resultLotto6?.querySelectorAll(".pick6-ball") || []).map((ball) => ball.textContent.trim());
    const pick6 = pick6Balls.length ? pick6Balls.join(" ") : dom.resultLotto6?.textContent?.trim().replace(/\s+/g, " ") || "------";
    return [
      `ROBOT RAHBE - ${dom.resultTitle?.textContent || "Run Result"}`,
      `Score ${dom.resultScore?.textContent || "0"} | Rank ${dom.resultRank?.textContent || "-"} | Time ${dom.resultTime?.textContent || "00:00"}`,
      `Pick 3 ${dom.resultPick3?.textContent || "---"} | Pick 4 ${dom.resultPick4?.textContent || "----"} | Pick 6 Mega ${pick6}`
    ].join("\n");
  }

  function resultShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("debug");
    url.searchParams.delete("touch");
    url.searchParams.delete("shareTest");
    return url.toString();
  }

  function openShareTarget(target) {
    if (QUERY.has("shareTest")) {
      document.body.setAttribute("data-share-target", target);
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  }

  async function shareResult(platform) {
    const text = resultShareText();
    const url = resultShareUrl();
    if (platform === "instagram") {
      openShareTarget("https://www.instagram.com/");
      const copied = await copyText(`${text}\n${url}`);
      if (dom.resultShareStatus) {
        dom.resultShareStatus.textContent = copied ? "Result copied. Paste it into Instagram." : "Open Instagram and share your result.";
      }
      toggleResultShareMenu(false);
      return;
    }
    let target = "";
    if (platform === "facebook") {
      target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    } else if (platform === "x") {
      target = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    }
    if (target) openShareTarget(target);
    if (platform !== "instagram" && dom.resultShareStatus) {
      dom.resultShareStatus.textContent = `Opening ${platform === "x" ? "X" : "Facebook"}...`;
    }
    toggleResultShareMenu(false);
  }

  function clearInputState() {
    keyboardDown.clear();
    keyboardPressed.clear();
    keyboardReleased.clear();
    touchDown.clear();
    touchPressed.clear();
    touchReleased.clear();
    padDown = new Set();
    padPressed = new Set();
    padReleased = new Set();
  }

  function makeEnemy(type, x, groundY) {
    const difficulty = difficultyConfig();
    const base = {
      id: Math.random().toString(36).slice(2),
      type,
      x,
      y: groundY,
      w: 70,
      h: 70,
      vx: 0,
      vy: 0,
      facing: -1,
      hp: 2,
      maxHp: 2,
      cd: 0.5 + Math.random() * 0.8,
      hurt: 0,
      telegraph: 0,
      fireFlash: 0,
      damageCd: 0,
      dead: false,
      deathTimer: 0,
      baseY: groundY,
      phase: Math.random() * Math.PI * 2
    };
    if (type === "crawler") {
      base.w = CRAWLER_DOG.width;
      base.h = CRAWLER_DOG.height;
      base.hp = 2;
      base.maxHp = 2;
      base.y = groundY - base.h;
    }
    if (type === "drone") {
      base.w = 78;
      base.h = 54;
      base.hp = 2;
      base.maxHp = 2;
      base.y = groundY;
      base.baseY = groundY;
    }
    if (type === "shield") {
      base.w = 78;
      base.h = 104;
      base.hp = 5;
      base.maxHp = 5;
      base.y = groundY - base.h;
    }
    if (type === "turret") {
      base.w = CANNON_TURRET.width;
      base.h = CANNON_TURRET.height;
      base.hp = 4;
      base.maxHp = 4;
      base.y = groundY - base.h;
    }
    base.hp = Math.max(1, Math.round(base.hp * difficulty.enemyHp));
    base.maxHp = base.hp;
    return base;
  }

  function difficultyConfig() {
    return DIFFICULTY[settings.difficulty] || DIFFICULTY.arcade;
  }

  function loop(now) {
    const frameDt = Math.min(0.08, (now - lastTime) / 1000);
    lastTime = now;
    pollGamepad();
    accumulator += frameDt;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
    render();
    updateHUD();
    clearPressed();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (mode === "title") {
      if (actionPressed("start") || actionPressed("fire")) beginCutscene();
      if (actionPressed("settings")) openSettings();
      return;
    }

    if (mode === "cutscene") {
      if (actionPressed("pause")) cancelCutscene();
      else if (actionPressed("start") || actionPressed("fire") || actionPressed("interact")) completeCutscene();
      return;
    }

    if (mode === "paused") {
      if (actionPressed("pause") || actionPressed("start")) resumeRun();
      if (actionPressed("settings")) openSettings();
      return;
    }

    if (mode === "results") {
      if (actionPressed("start") || actionPressed("fire")) startRun();
      return;
    }

    if (mode === "lottery") {
      if (actionPressed("pause")) closeLotteryTerminal();
      return;
    }

    if (mode !== "playing" || !run) return;

    if (actionPressed("pause")) {
      pauseRun();
      return;
    }
    if (actionPressed("settings")) {
      openSettings();
      return;
    }
    updateAreaPrompt(run);
    if ((actionPressed("interact") || actionPressed("down") || keyboardPressed.has("p2-down")) && tryUseAreaPortal(run)) {
      return;
    }
    if (actionPressed("interact")) {
      tryOpenLotteryTerminal();
      return;
    }

    if (run.areaTransition > 0) {
      run.areaTransition = Math.max(0, run.areaTransition - dt);
      updateParticles(run, dt);
      updateFxBursts(run, dt);
      updateCamera(run, dt);
      return;
    }

    if (run.hitStop > 0) {
      run.hitStop = Math.max(0, run.hitStop - dt);
      run.shakeTrauma = Math.max(0, run.shakeTrauma - dt * 1.8);
      updateParticles(run, dt);
      updateFxBursts(run, dt);
      updateCamera(run, dt);
      return;
    }

    run.time += dt;
    run.campaignTime = run.time;
    run.levelTime += dt;
    updatePulseMusic(dt);
    if (run.introTimer > 0) {
      run.introTimer -= dt;
      updateParticles(run, dt);
      updateCamera(run, dt);
      return;
    }
    if (run.levelCompleteTimer > 0) {
      run.levelCompleteTimer -= dt;
      updateParticles(run, dt);
      if (run.levelCompleteTimer <= 0) {
        if (run.nextLevelIndex !== null) loadLevel(run, run.nextLevelIndex);
        else finishRun(true);
      }
      updateCamera(run, dt);
      return;
    }
    updatePlatforms(run, dt);
    updateAreaPrompt(run);
    updatePlayers(run, dt);
    updateGate(run, dt);
    updatePickups(run, dt);
    if (isUnderground(run)) {
      run.terminal.inRange = false;
    } else {
      updateLotteryTerminal(run, dt);
      updateEncounterDirector(run);
      updateArenaLock(run, dt);
      updateBoss(run, dt);
    }
    updateEnemies(run, dt);
    updateProjectiles(run, dt);
    updateLevelHazards(run, dt);
    updateHazards(run, dt);
    updateFxBursts(run, dt);
    updateParticles(run, dt);
    run.shakeTrauma = Math.max(0, run.shakeTrauma - dt * 1.8);
    updateProgression(run);
    updateCamera(run, dt);
  }

  function pollGamepad() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    const next = new Set();
    const pad = pads[0];
    if (pad) {
      const ax = pad.axes[0] || 0;
      const ay = pad.axes[1] || 0;
      if (ax < -0.35) next.add("left");
      if (ax > 0.35) next.add("right");
      if (ay < -0.45) next.add("up");
      if (ay > 0.45) next.add("down");
      const buttons = pad.buttons || [];
      if (buttons[0]?.pressed || buttons[12]?.pressed) next.add("jump");
      if (buttons[2]?.pressed || buttons[7]?.pressed) next.add("fire");
      if (buttons[1]?.pressed || buttons[5]?.pressed) next.add("dash");
      if (buttons[3]?.pressed || buttons[4]?.pressed) next.add("overdrive");
      if (buttons[6]?.pressed) next.add("interact");
      if (buttons[9]?.pressed) next.add("start");
      if (buttons[8]?.pressed) next.add("pause");
      if (buttons[13]?.pressed) next.add("down");
      if (buttons[14]?.pressed) next.add("left");
      if (buttons[15]?.pressed) next.add("right");
    }
    padPressed = new Set([...next].filter((action) => !padDown.has(action)));
    padReleased = new Set([...padDown].filter((action) => !next.has(action)));
    padDown = next;
  }

  function actionDown(action) {
    return keyboardDown.has(action) || touchDown.has(action) || padDown.has(action);
  }

  function actionPressed(action) {
    return keyboardPressed.has(action) || touchPressed.has(action) || padPressed.has(action);
  }

  function actionReleased(action) {
    return keyboardReleased.has(action) || touchReleased.has(action) || padReleased.has(action);
  }

  function playerActionName(player, action) {
    return player.index === 1 ? `p2-${action}` : action;
  }

  function playerActionDown(player, action) {
    const mapped = playerActionName(player, action);
    if (player.index === 1) return keyboardDown.has(mapped);
    return actionDown(action);
  }

  function playerActionPressed(player, action) {
    const mapped = playerActionName(player, action);
    if (player.index === 1) return keyboardPressed.has(mapped);
    return actionPressed(action);
  }

  function playerActionReleased(player, action) {
    const mapped = playerActionName(player, action);
    if (player.index === 1) return keyboardReleased.has(mapped);
    return actionReleased(action);
  }

  function clearPressed() {
    keyboardPressed.clear();
    keyboardReleased.clear();
    touchPressed.clear();
    touchReleased.clear();
    padPressed.clear();
    padReleased.clear();
  }

  function updatePlatforms(state, dt) {
    for (const plat of state.platforms) {
      if (!plat.move) continue;
      const wave = Math.sin(state.levelTime * plat.move.speed + plat.move.phase) * plat.move.amp;
      const oldY = plat.y;
      const oldX = plat.x;
      if (plat.move.axis === "y") plat.y = plat.baseY + wave;
      else plat.x = plat.baseX + wave;
      plat.dx = plat.x - oldX;
      plat.dy = plat.y - oldY;
      for (const p of activePlayers(state)) {
        if (p.grounded && p.y + p.h <= oldY + 10 && p.x + p.w > plat.x && p.x < plat.x + plat.w) {
          p.x += plat.dx;
          p.y += plat.dy;
        }
      }
    }
  }

  function updateLevelHazards(state, dt) {
    for (const hazard of state.levelHazards) {
      hazard.hitCd = Math.max(0, (hazard.hitCd || 0) - dt);
      const active = isLevelHazardActive(state, hazard);
      if (!active || hazard.hitCd > 0) continue;
      for (const p of activePlayers(state)) {
        if (overlap(playerBox(p), levelHazardBox(hazard))) {
          hazard.hitCd = 0.8;
          takeDamage(state, hazard.type === "laser" || hazard.type === "beam" ? 2 : 1, hazard.x, p);
          break;
        }
      }
    }
  }

  function isLevelHazardActive(state, hazard) {
    const t = (state.levelTime + (hazard.phase || 0)) % hazard.cycle;
    return t < hazard.active;
  }

  function isLevelHazardWarning(state, hazard) {
    const t = (state.levelTime + (hazard.phase || 0)) % hazard.cycle;
    return t < hazard.active + 0.45;
  }

  function levelHazardBox(hazard) {
    if (hazard.type === "floor") {
      return { x: hazard.x, y: hazard.y - hazard.h, w: hazard.w, h: hazard.h };
    }
    return { x: hazard.x, y: hazard.y, w: hazard.w, h: hazard.h };
  }

  function updatePlayers(state, dt) {
    for (const p of allPlayers(state)) {
      updatePlayer(state, dt, p);
    }
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
  }

  function updatePlayer(state, dt, p) {
    if (p.lives <= 0) return;
    const wasGrounded = p.grounded;
    const jumpHeld = playerActionDown(p, "jump") || playerActionDown(p, "up");
    const jumpPressed = playerActionPressed(p, "jump") || playerActionPressed(p, "up");
    const jumpReleased = playerActionReleased(p, "jump") || playerActionReleased(p, "up");
    const left = playerActionDown(p, "left");
    const right = playerActionDown(p, "right");
    const moving = Number(right) - Number(left);
    const wantsCrouch = playerActionDown(p, "down") && p.grounded && p.dashTime <= 0 && !jumpPressed && !playerInAreaPortal(state, p);
    const oldBottom = p.y + p.h;

    p.knockbackTime = Math.max(0, (p.knockbackTime || 0) - dt);
    p.dashReadyFlash = Math.max(0, (p.dashReadyFlash || 0) - dt);
    p.wallKickLock = Math.max(0, (p.wallKickLock || 0) - dt);
    p.landingSquash = Math.max(0, (p.landingSquash || 0) - dt);
    p.crouching = wantsCrouch;
    p.h = wantsCrouch ? p.crouchH : p.standingH;
    p.y = oldBottom - p.h;

    p.fireCd = Math.max(0, p.fireCd - dt);
    const oldDashCd = p.dashCd;
    p.dashCd = Math.max(0, p.dashCd - dt);
    if (oldDashCd > 0 && p.dashCd <= 0) p.dashReadyFlash = 0.22;
    p.invuln = Math.max(0, p.invuln - dt);
    p.overdriveTime = Math.max(0, p.overdriveTime - dt);
    p.weaponTimer = Math.max(0, (p.weaponTimer || 0) - dt);
    p.luckyShield = Math.max(0, (p.luckyShield || 0) - dt);
    if (p.weaponTimer <= 0) p.weapon = "heart";
    p.aim = getAim(state, p);
    p.trail.forEach((trail) => trail.t += dt);
    p.trail = p.trail.filter((trail) => trail.t < trail.life);

    if (moving !== 0) p.facing = moving > 0 ? 1 : -1;
    if (p.aim.x > 0.2) p.facing = 1;
    if (p.aim.x < -0.2) p.facing = -1;

    if (p.grounded) p.airDashUsed = false;

    if (jumpPressed) p.jumpBuffer = MOVEMENT.jumpBuffer;
    p.coyote = p.grounded ? MOVEMENT.coyoteTime : Math.max(0, p.coyote - dt);
    p.wallStick = !p.grounded && p.wallSide ? MOVEMENT.wallStickTime : Math.max(0, (p.wallStick || 0) - dt);

    const jumpedEarly = performBufferedJump(state, p);

    if (jumpReleased && p.vy < -180) p.vy *= MOVEMENT.jumpCut;

    if (playerActionPressed(p, "dash") && p.dashCd <= 0 && (p.grounded || !p.airDashUsed)) {
      p.crouching = false;
      p.h = p.standingH;
      p.y = oldBottom - p.h;
      p.dashCd = MOVEMENT.dashCooldown;
      p.dashTime = MOVEMENT.dashDuration;
      p.invuln = Math.max(p.invuln, 0.22);
      p.dashX = Math.abs(p.aim.x) > 0.18 ? Math.sign(p.aim.x) : p.facing;
      p.dashY = p.aim.y < -0.45 && !p.grounded ? -0.42 : 0;
      if (!p.grounded) p.airDashUsed = true;
      addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.55, colors.purple, 22, 420);
      playTone(180, 0.05, "sawtooth", 0.05);
    }

    if (p.dashTime > 0) {
      p.dashTime -= dt;
      p.vx = p.dashX * MOVEMENT.dashSpeed;
      p.vy = p.dashY < 0 ? Math.min(p.vy, -260) : Math.min(p.vy, 80);
      if (p.dashTime <= 0) p.vx *= MOVEMENT.dashEndMomentum;
      if (!settings.reducedMotion) {
        p.trail.push({
          x: p.x,
          y: p.y,
          h: p.h,
          facing: p.facing,
          t: 0,
          life: 0.18
        });
      }
    } else {
      const max = p.crouching ? MOVEMENT.crouchSpeed : MOVEMENT.maxGroundSpeed;
      const reversingAir = !p.grounded && moving !== 0 && Math.sign(p.vx || moving) !== moving;
      const accel = p.grounded ? MOVEMENT.groundAccel : reversingAir ? MOVEMENT.airTurnAccel : MOVEMENT.airAccel;
      const friction = p.grounded ? MOVEMENT.groundDecel : MOVEMENT.airDecel;
      if (moving !== 0 && !p.crouching && p.knockbackTime <= 0) p.vx = approach(p.vx, moving * max, accel * dt);
      else p.vx = approach(p.vx, 0, friction * dt);
      const gravityScale = p.vy < 0 && jumpHeld ? 0.68 : p.vy > 0 ? 1.14 : 1;
      if (!jumpedEarly) p.vy = Math.min(1320, p.vy + GRAVITY * gravityScale * dt);
      if (!p.grounded && p.wallSide && moving === p.wallSide && p.vy > MOVEMENT.wallSlideSpeed) {
        p.vy = approach(p.vy, MOVEMENT.wallSlideSpeed, GRAVITY * 1.6 * dt);
        p.wallStick = MOVEMENT.wallStickTime;
        if (state.time % 0.18 < dt) {
          addBurst(state, p.x + (p.wallSide > 0 ? p.w + 2 : -2), p.y + p.h * 0.62, colors.cyan, 3, 90);
        }
      }
      if (playerActionDown(p, "down") && !p.grounded) p.vy = Math.min(1450, p.vy + GRAVITY * 0.38 * dt);
    }

    const fallSpeedBeforeMove = p.vy;
    movePlayer(state, dt, p);
    performBufferedJump(state, p);
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    if (!wasGrounded && p.grounded && fallSpeedBeforeMove > 420) {
      p.landingSquash = MOVEMENT.landingSquashTime;
      addBurst(state, p.x + p.w * 0.5, p.y + p.h, colors.gold, 8, 160);
      playTone(150, 0.035, "triangle", 0.02);
    }

    if (playerActionDown(p, "fire") && p.fireCd <= 0) firePlayerShot(state, p);
    if (playerActionPressed(p, "overdrive") && p.overdrive >= 100) activateOverdrive(state, p);

    if (p.y > H + 160) {
      p.invuln = 0;
      p.dashTime = 0;
      p.overdriveTime = 0;
      takeDamage(state, p.hp || p.maxHp, p.x - 60, p);
    }

    p.action = p.crouching ? "crouch" : "idle";
    if (!p.grounded) p.action = "jump";
    else if (Math.abs(p.vx) > 24) p.action = "run";
    if (p.fireCd > 0.05) p.action = "shoot";
  }

  function performBufferedJump(state, p) {
    if (!(p.jumpBuffer > 0) || p.dashTime > 0) return false;
    const canWallJump = !p.grounded && (p.wallSide || p.wallStick > 0);
    if (!(p.grounded || p.coyote > 0 || canWallJump)) return false;
    const bottom = p.y + p.h;
    p.crouching = false;
    p.h = p.standingH;
    p.y = bottom - p.h;
    if (canWallJump && !(p.grounded || p.coyote > 0)) {
      const wall = p.wallSide || p.facing;
      p.vx = -wall * MOVEMENT.wallJumpX;
      p.vy = MOVEMENT.wallJumpY;
      p.facing = -wall;
      p.wallKickLock = 0.16;
      p.wallSide = 0;
      p.wallStick = 0;
      addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.6, colors.gold, 16, 300);
      playTone(640, 0.055, "square", 0.045);
    } else {
      p.vy = MOVEMENT.jumpVelocity;
      addBurst(state, p.x + p.w * 0.5, p.y + p.h, colors.cyan, 12, 230);
      playTone(560, 0.07, "square", 0.04);
    }
    p.grounded = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    return true;
  }

  function movePlayer(state, dt, p) {
    const prevX = p.x;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 8, worldWidth(state) - p.w - 10);

    if (!isUnderground(state) && !state.gateOpen) {
      const gate = gateBlockBox(state);
      if (overlap({ x: p.x, y: p.y, w: p.w, h: p.h }, gate)) {
        const wasLeft = prevX + p.w <= gate.x + 8 || p.x + p.w * 0.5 < gate.x + gate.w * 0.5;
        if (wasLeft) {
          p.x = gate.x - p.w - 2;
          p.vx = Math.min(0, p.vx);
        } else {
          p.x = gate.x + gate.w + 2;
          p.vx = Math.max(0, p.vx);
        }
        p.wallSide = 0;
        p.wallStick = 0;
        p.dashTime = 0;
        setObjective(state, gateLockedMessage(state), 1.4);
      }
    }
    p.wallSide = detectWallSide(state, p);
    if (arenaLockActive(state)) {
      const lock = state.arenaLock;
      if (p.x < lock.left) {
        p.x = lock.left;
        p.vx = Math.max(0, p.vx);
      }
      if (p.x + p.w > lock.right) {
        p.x = lock.right - p.w;
        p.vx = Math.min(0, p.vx);
      }
    }

    const prevY = p.y;
    p.y += p.vy * dt;
    p.grounded = false;
    for (const plat of state.platforms) {
      if (p.vy >= 0 && p.x + p.w > plat.x + 4 && p.x < plat.x + plat.w - 4) {
        const prevBottom = prevY + p.h;
        const nextBottom = p.y + p.h;
        if (prevBottom <= plat.y + 6 && nextBottom >= plat.y) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          p.wallSide = 0;
          p.wallStick = 0;
          if (plat.conveyor) {
            p.x = clamp(p.x + plat.conveyor * dt, 8, worldWidth(state) - p.w - 10);
          }
          if (plat.kind === "float" && p.jumpBuffer > 0) {
            p.vy = -860;
            p.grounded = false;
            p.jumpBuffer = 0;
            addBurst(state, p.x + p.w * 0.5, p.y + p.h, colors.cyan, 14, 260);
          }
        }
      }
    }
  }

  function detectWallSide(state, p) {
    if (p.grounded || p.dashTime > 0) return 0;
    const reach = 11;
    const top = p.y + 14;
    const bottom = p.y + p.h - 12;
    let side = 0;
    for (const plat of state.platforms) {
      const faceTop = plat.y - 8;
      const faceBottom = plat.y + Math.max(plat.h, 70);
      if (bottom < faceTop || top > faceBottom) continue;
      const rightGap = Math.abs(p.x + p.w - plat.x);
      const leftGap = Math.abs(p.x - (plat.x + plat.w));
      if (rightGap <= reach) side = 1;
      if (leftGap <= reach) side = -1;
    }
    return side;
  }

  function getAim(state, p) {
    const virtualAimFresh = performance.now() < virtualAim.activeUntil && mode === "playing";
    if (virtualAimFresh && p.index === 0) {
      return { x: virtualAim.x, y: virtualAim.y };
    }

    const pointerFresh = performance.now() < pointer.activeUntil && mode === "playing";
    if (pointerFresh && p.index === 0) {
      const worldX = pointer.x + state.cameraX;
      const dx = worldX - (p.x + p.w * 0.5);
      const dy = pointer.y - (p.y + p.h * 0.48);
      const length = Math.hypot(dx, dy) || 1;
      return { x: dx / length, y: dy / length };
    }

    let x = 0;
    let y = 0;
    if (playerActionDown(p, "left")) x -= 1;
    if (playerActionDown(p, "right")) x += 1;
    if (playerActionDown(p, "up")) y -= 1;
    if (playerActionDown(p, "down") && !p.grounded) y += 1;
    if (y !== 0 && x === 0) return { x: 0, y };
    if (x === 0) x = p.facing;
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  function firePlayerShot(state, p) {
    if (state.playerShots.length > 34) return;
    const weapon = p.overdriveTime > 0 ? "beam" : p.weapon || "heart";
    const speed = weapon === "beam" ? 1120 : p.overdriveTime > 0 ? 1040 : 900;
    const strong = p.overdriveTime > 0;
    const muzzle = playerMuzzle(p);
    const muzzleX = muzzle.x;
    const muzzleY = muzzle.y;
    const shots = [];
    const base = {
      x: muzzleX,
      y: muzzleY,
      vx: p.aim.x * speed,
      vy: p.aim.y * speed,
      w: weapon === "beam" ? 46 : strong ? 38 : 30,
      h: weapon === "beam" ? 20 : strong ? 26 : 20,
      life: weapon === "beam" ? 0.95 : 1.15,
      damage: weapon === "beam" || strong ? 2 : 1,
      color: settings.highContrastShots ? colors.cyan : WEAPON_META[weapon]?.color || colors.pink,
      weapon,
      pierce: strong || weapon === "beam",
      ownerId: p.id,
      ownerFacing: p.facing,
      overdriveHit: strong,
      hitIds: new Set(),
      age: 0
    };
    if (weapon === "spread") {
      for (const offset of [-0.18, 0, 0.18]) shots.push(angledShot(base, offset));
    } else {
      shots.push(base);
    }
    for (const shot of shots) state.playerShots.push(shot);
    p.fireCd = weapon === "rapid" ? 0.075 : weapon === "beam" || strong ? 0.09 : 0.15;
    state.stats.shotsFired += shots.length;
    addBurst(state, muzzleX, muzzleY, WEAPON_META[weapon]?.color || colors.pink, weapon === "spread" ? 8 : strong ? 7 : 4, 120);
    playTone(weapon === "rapid" ? 980 : weapon === "beam" ? 520 : strong ? 920 : 740, 0.045, "triangle", strong ? 0.045 : 0.032);
  }

  function angledShot(shot, radians) {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      ...shot,
      vx: shot.vx * cos - shot.vy * sin,
      vy: shot.vx * sin + shot.vy * cos,
      hitIds: new Set()
    };
  }

  function playerMuzzle(p) {
    const side = p.facing || Math.sign(p.aim?.x || 0) || 1;
    return {
      x: p.x + p.w * 0.5 + side * 42 + (p.aim?.x || side) * 8,
      y: p.y + (p.crouching ? p.h * 0.48 : p.h * 0.52) + (p.aim?.y || 0) * 10
    };
  }

  function activateOverdrive(state, p) {
    p.overdrive = 0;
    p.overdriveTime = 4.2;
    p.invuln = Math.max(p.invuln, 0.6);
    addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.45, colors.pink, 44, 620);
    state.enemies.forEach((enemy) => {
      if (Math.abs(enemy.x - p.x) < 620) damageEnemy(state, enemy, 2, true, p);
    });
    if (state.boss && Math.abs(state.boss.x - p.x) < 820) damageBoss(state, 4, true);
    setObjective(state, `${p.label} Heartburst Overdrive online`, 1.4);
    playTone(240, 0.1, "sawtooth", 0.06);
    playTone(960, 0.16, "sine", 0.04);
  }

  function updateGate(state, dt) {
    if (isUnderground(state)) return;
    state.gatePulse += dt;
    const gx = gateX(state);
    const opener = activePlayers(state).find((player) => player.x + player.w > gx - 90);
    if (!state.gateOpen && gateReady(state) && opener) {
      openVaultGate(state, gx);
    }
  }

  function openVaultGate(state, gx = gateX(state)) {
    if (!state || state.gateOpen || !gateReady(state)) return false;
    state.gateOpen = true;
    for (const player of allPlayers(state)) {
      player.checkpointX = gx + 210;
      player.checkpointY = 620 - player.standingH;
    }
    setObjective(state, "Vault gate open: push to the chamber", 3);
    addBurst(state, gx + 44, (supportYAt(state, gx + 44, 620) ?? 620) - 190, colors.gold, 60, 520);
    playTone(320, 0.12, "triangle", 0.06);
    playTone(640, 0.18, "sine", 0.04);
    emitRewardEvent("shadow.gate_opened", {
      levelId: rewardLevelId(state),
      uniqueKeysCollected: state.keys
    });
    return true;
  }

  function updatePickups(state, dt) {
    for (const pickup of state.pickups) {
      if (pickup.taken) continue;
      pickup.bob += dt * 3;
      const box = { x: pickup.x - pickup.r, y: pickup.y - pickup.r, w: pickup.r * 2, h: pickup.r * 2 };
      for (const p of activePlayers(state)) {
        if (overlap(playerBox(p), box)) {
          collectPickup(state, pickup, p);
          break;
        }
      }
    }
  }

  function collectPickup(state, pickup, p = state.player) {
    pickup.taken = true;
    if (pickup.type === "shard") {
      state.shards += 1;
      addScore(state, 45);
      p.overdrive = clamp(p.overdrive + 4, 0, 100);
      addBurst(state, pickup.x, pickup.y, colors.cyan, 10, 180);
      playTone(1100, 0.035, "sine", 0.025);
    }
    if (pickup.type === "key") {
      state.keys += 1;
      addScore(state, 500);
      p.overdrive = clamp(p.overdrive + 18, 0, 100);
      setObjective(state, state.keys >= 3 ? "All keys secured: open the vault gate" : `Vault key secured ${state.keys}/3`, 2.4);
      addBurst(state, pickup.x, pickup.y, colors.gold, 28, 340);
      playTone(520, 0.08, "triangle", 0.045);
      playTone(960, 0.12, "sine", 0.035);
      if (!isUnderground(state) && state.keys >= 3) openVaultGate(state);
      emitRewardEvent("shadow.key_collected", {
        levelId: rewardLevelId(state),
        keyId: `level-${rewardLevelId(state)}-key-${state.keys}`
      });
    }
    if (pickup.type === "cell") {
      const key = undergroundKey(state);
      state.undergroundCells[key] = clamp((state.undergroundCells[key] || 0) + 1, 0, 3);
      addScore(state, 650);
      p.overdrive = clamp(p.overdrive + 16, 0, 100);
      const count = undergroundCellCount(state);
      setObjective(state, count >= 3 ? "All power cells recovered: return to the surface" : `Power cell recovered ${count}/3`, 2.4);
      addBurst(state, pickup.x, pickup.y, colors.purple, 34, 380);
      playTone(580, 0.08, "triangle", 0.045);
      playTone(1180, 0.12, "sine", 0.032);
    }
    if (pickup.type === "health") {
      p.hp = clamp(p.hp + 1, 0, p.maxHp);
      addBurst(state, pickup.x, pickup.y, colors.pink, 18, 260);
      playTone(700, 0.08, "sine", 0.035);
    }
    if (pickup.type === "overdrive") {
      p.overdrive = 100;
      setObjective(state, "Overdrive charged", 1.7);
      addBurst(state, pickup.x, pickup.y, colors.purple, 24, 320);
      playTone(420, 0.08, "sawtooth", 0.045);
    }
    if (pickup.type === "shield") {
      p.luckyShield = Math.max(p.luckyShield || 0, 18);
      p.overdrive = clamp(p.overdrive + 25, 0, 100);
      setObjective(state, "Shield burst charged", 1.7);
      addBurst(state, pickup.x, pickup.y, colors.cyan, 28, 360);
      addFxBurst(state, pickup.x, pickup.y, FX_ROWS.hitSpark, 156, 0.42);
      playTone(760, 0.08, "triangle", 0.04);
      playTone(1120, 0.06, "sine", 0.028);
    }
    if (pickup.type === "weapon") {
      p.weapon = pickup.weapon || "rapid";
      p.weaponTimer = 22;
      setObjective(state, `${WEAPON_META[p.weapon]?.label || "WEAPON"} weapon online`, 1.8);
      addBurst(state, pickup.x, pickup.y, WEAPON_META[p.weapon]?.color || colors.gold, 26, 340);
      playTone(860, 0.08, "triangle", 0.04);
      playTone(1180, 0.08, "sine", 0.026);
    }
  }

  function updateEnemies(state, dt) {
    for (const enemy of state.enemies) {
      if (enemy.dead) {
        enemy.deathTimer = Math.max(0, (enemy.deathTimer || 0) - dt);
        continue;
      }
      const target = nearestPlayer(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5);
      if (!target) continue;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.fireFlash = Math.max(0, (enemy.fireFlash || 0) - dt);
      enemy.damageCd = Math.max(0, enemy.damageCd - dt);
      enemy.cd -= dt;
      enemy.targetPlayerId = target.id;
      enemy.facing = target.x + target.w * 0.5 < enemy.x + enemy.w * 0.5 ? -1 : 1;

      if (enemy.type === "crawler") updateCrawler(state, enemy, dt, target);
      if (enemy.type === "drone") updateDrone(state, enemy, dt, target);
      if (enemy.type === "shield") updateShield(state, enemy, dt, target);
      if (enemy.type === "turret") updateTurret(state, enemy, dt, target);

      if (enemy.damageCd <= 0) {
        for (const p of activePlayers(state)) {
          if (overlap(playerBox(p), enemyBox(enemy))) {
            enemy.damageCd = MOVEMENT.contactCooldown;
            takeDamage(state, enemy.type === "shield" ? 2 : 1, enemy.x, p);
            break;
          }
        }
      }
    }
    state.enemies = state.enemies.filter((enemy) => {
      const visibleAfterDefeat = !enemy.dead || enemy.deathTimer > 0;
      return visibleAfterDefeat && (enemy.x > state.cameraX - 260 || state.arenaLock?.id === enemy.waveId);
    });
  }

  function updateCrawler(state, enemy, dt, p) {
    const speed = difficultyConfig().enemySpeed;
    const distance = p.x - enemy.x;
    enemy.telegraph = 0;
    enemy.lungeTime = 0;
    const desiredVx = clamp(distance * 1.05, -145 * speed, 145 * speed);
    enemy.vx = approach(enemy.vx || 0, desiredVx, 620 * dt);
    enemy.x += enemy.vx * dt;
    enemy.y = snapEnemyToGround(state, enemy, enemy.y);
  }

  function updateDrone(state, enemy, dt, p) {
    enemy.x += Math.sin(state.time * 1.8 + enemy.phase) * 20 * dt;
    enemy.y = enemy.baseY + Math.sin(state.time * 2.4 + enemy.phase) * 24;
    if (enemy.telegraph > 0) {
      enemy.telegraph -= dt;
      if (enemy.telegraph <= 0) {
        const muzzle = droneMuzzle(enemy);
        const targetX = p.x + p.w * 0.5;
        const targetY = p.y + 54;
        enemy.lastShotAngle = Math.atan2(targetY - muzzle.y, targetX - muzzle.x);
        enemy.fireFlash = 0.24;
        fireEnemyShot(state, muzzle.x, muzzle.y, targetX, targetY, 430, colors.purple, 1, { kind: "droneLaser" });
      }
    } else if (enemy.cd <= 0 && Math.abs(enemy.x - p.x) < 620) {
      enemy.telegraph = 0.38;
      enemy.cd = 1.55 + Math.random() * 0.5;
    }
  }

  function updateShield(state, enemy, dt, p) {
    const speed = difficultyConfig().enemySpeed;
    const distance = p.x - enemy.x;
    enemy.vx = clamp(distance * 0.72, -92 * speed, 92 * speed);
    enemy.x += enemy.vx * dt;
    enemy.y = snapEnemyToGround(state, enemy, enemy.y);
    if (enemy.cd <= 0 && Math.abs(distance) < 180) {
      enemy.cd = 1.15;
      enemy.fireFlash = 0.26;
      const muzzle = shieldMuzzle(enemy);
      fireEnemyShot(state, muzzle.x, muzzle.y, p.x + p.w * 0.5, p.y + 62, 360, colors.orange, 1, { kind: "shieldBolt" });
    }
  }

  function updateTurret(state, enemy, dt, p) {
    if (enemy.telegraph > 0) {
      enemy.telegraph -= dt;
      if (enemy.telegraph <= 0) {
        const muzzle = turretMuzzle(enemy);
        fireEnemyShot(state, muzzle.x, muzzle.y, p.x + p.w * 0.5, p.y + 64, 520, colors.red, 1);
        enemy.fireFlash = 0.24;
      }
    } else if (enemy.cd <= 0 && Math.abs(enemy.x - p.x) < 760) {
      enemy.telegraph = 0.55;
      enemy.cd = 1.85;
    }
  }

  function turretMuzzle(enemy) {
    const dir = enemy.facing || -1;
    return {
      x: enemy.x + enemy.w * 0.5 + dir * enemy.w * 0.58,
      y: enemy.y + enemy.h * 0.43
    };
  }

  function droneMuzzle(enemy) {
    const dir = enemy.facing || -1;
    return {
      x: enemy.x + enemy.w * 0.5 + dir * enemy.w * 0.56,
      y: enemy.y + enemy.h * 0.62
    };
  }

  function shieldMuzzle(enemy) {
    const dir = enemy.facing || -1;
    return {
      x: enemy.x + enemy.w * 0.5 + dir * enemy.w * 0.48,
      y: enemy.y + enemy.h * 0.5
    };
  }

  function snapEnemyToGround(state, enemy, currentY) {
    const center = enemy.x + enemy.w * 0.5;
    let best = 620;
    for (const plat of state.platforms) {
      if (center > plat.x && center < plat.x + plat.w && plat.y <= best) best = plat.y;
    }
    return approach(currentY, best - enemy.h, 18);
  }

  function updateProjectiles(state, dt) {
    for (const shot of state.playerShots) {
      const owner = playerById(state, shot.ownerId);
      const overdriveHit = Boolean(shot.overdriveHit || owner?.overdriveTime > 0);
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      shot.age = (shot.age || 0) + dt;

      for (const enemy of state.enemies) {
        if (enemy.dead || shot.hitIds.has(enemy.id)) continue;
        if (overlap(projectileBox(shot), enemyBox(enemy))) {
          shot.hitIds.add(enemy.id);
          state.stats.shotsHit += 1;
          const blocked = enemy.type === "shield" && enemy.facing !== Math.sign(shot.vx || shot.ownerFacing || owner?.facing || 1) && !overdriveHit;
          if (blocked) {
            addBurst(state, shot.x, shot.y, colors.gold, 10, 160);
            addFxBurst(state, shot.x, shot.y, FX_ROWS.hitSpark, 116, 0.34);
            shot.life = 0;
            playTone(230, 0.045, "square", 0.03);
          } else {
            damageEnemy(state, enemy, shot.damage, overdriveHit, owner);
            if (!shot.pierce) shot.life = 0;
          }
          break;
        }
      }

      if (state.boss && state.boss.hp > 0 && overlap(projectileBox(shot), bossBox(state.boss)) && !shot.hitIds.has("boss")) {
        shot.hitIds.add("boss");
        state.stats.shotsHit += 1;
        damageBoss(state, shot.damage, overdriveHit);
        if (!shot.pierce) shot.life = 0;
      }
    }

    for (const shot of state.enemyShots) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      shot.age = (shot.age || 0) + dt;
      for (const p of activePlayers(state)) {
        if (overlap(projectileBox(shot), playerBox(p))) {
          shot.life = 0;
          addFxBurst(state, shot.x, shot.y, FX_ROWS.hitSpark, 128, 0.34);
          takeDamage(state, shot.damage || 1, shot.x, p);
          break;
        }
      }
    }

    state.playerShots = state.playerShots.filter((shot) => shot.life > 0 && shot.x > state.cameraX - 180 && shot.x < state.cameraX + W + 220 && shot.y > -120 && shot.y < H + 160);
    state.enemyShots = state.enemyShots.filter((shot) => shot.life > 0 && shot.x > state.cameraX - 220 && shot.x < state.cameraX + W + 260 && shot.y > -140 && shot.y < H + 180);
  }

  function damageEnemy(state, enemy, amount, overdriveHit = false, sourcePlayer = state.player) {
    enemy.hp -= amount;
    enemy.hurt = 0.16;
    enemy.x += Math.sign(enemy.x - (sourcePlayer?.x || enemy.x)) * (enemy.type === "turret" ? 2 : 8);
    state.hitStop = Math.max(state.hitStop || 0, overdriveHit ? FEEDBACK.strongHitStop : FEEDBACK.shotHitStop);
    addShake(state, enemy.hp <= 0 ? FEEDBACK.damageShake : 0.12);
    addBurst(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.45, overdriveHit ? colors.pink : colors.cyan, 12, 220);
    addFxBurst(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.45, FX_ROWS.hitSpark, enemy.hp <= 0 ? 176 : 124, 0.38);
    if (enemy.hp <= 0) {
      enemy.dead = true;
      enemy.deathTimer = 0.34;
      enemy.vx = 0;
      state.stats.kills += 1;
      if (sourcePlayer) sourcePlayer.overdrive = clamp(sourcePlayer.overdrive + 8, 0, 100);
      addCombo(state, 1);
      addScore(state, 220 + state.combo * 28);
      spawnDrop(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.55);
      maybeSpawnWaveReward(state, enemy, sourcePlayer);
      playTone(130, 0.05, "sawtooth", 0.04);
    } else {
      playTone(510, 0.035, "triangle", 0.03);
    }
  }

  function spawnDrop(state, x, y) {
    if (Math.random() < 0.22 && activePlayers(state).some((player) => player.hp < player.maxHp)) {
      state.pickups.push({ type: "health", x, y, r: 18, taken: false, bob: 0 });
    } else {
      for (let i = 0; i < 3; i += 1) {
        state.pickups.push({ type: "shard", x: x + (i - 1) * 24, y: y - 20 - i * 8, r: 12, taken: false, bob: i });
      }
    }
  }

  function maybeSpawnWaveReward(state, enemy, sourcePlayer = state.player) {
    if (!enemy.waveId || state.waveRewardFlags?.has(enemy.waveId)) return;
    const remaining = state.enemies.some((other) => other !== enemy && !other.dead && other.waveId === enemy.waveId);
    if (remaining) return;
    state.waveRewardFlags.add(enemy.waveId);
    const wave = state.level.waves?.find((entry) => entry.id === enemy.waveId);
    const x = enemy.x + enemy.w * 0.5 + 24;
    const y = clamp(enemy.y + enemy.h * 0.42, 330, 548);
    const needsHealth = activePlayers(state).some((player) => player.hp < player.maxHp);
    const cycle = (state.level.id + state.stats.kills + state.combo) % 4;
    let reward = needsHealth ? { type: "health", r: 19 } : cycle === 0 ? { type: "overdrive", r: 20 } : cycle === 1 ? { type: "shield", r: 20 } : { type: "weapon", weapon: cycle === 2 ? "spread" : "rapid", r: 21 };
    if (sourcePlayer?.weaponTimer <= 3 && cycle === 3) reward = { type: "weapon", weapon: "beam", r: 21 };
    state.pickups.push({ ...reward, x, y, taken: false, bob: state.time });
    addCombo(state, 2);
    addScore(state, 700 + state.level.id * 150);
    setObjective(state, `${wave?.objective || "Ambush"} cleared: reward dropped`, 2.2);
    addBurst(state, x, y, reward.type === "weapon" ? colors.gold : reward.type === "shield" ? colors.cyan : colors.purple, 26, 340);
    playTone(640, 0.08, "triangle", 0.042);
    playTone(1040, 0.08, "sine", 0.03);
  }

  function fireEnemyShot(state, x, y, targetX, targetY, speed, color, damage, options = {}) {
    if (state.enemyShots.length > 48) return;
    const dx = targetX - x;
    const dy = targetY - y;
    const length = Math.hypot(dx, dy) || 1;
    state.enemyShots.push({
      x,
      y,
      vx: (dx / length) * speed,
      vy: (dy / length) * speed,
      w: 28,
      h: 20,
      life: 2.5,
      color,
      damage,
      age: 0,
      kind: options.kind || "orb"
    });
    addBurst(state, x, y, color, 5, 140);
  }

  function updateBoss(state, dt) {
    if (!state.boss) return;
    const boss = state.boss;
    if (boss.hp <= 0) return;
    boss.targetPlayer = nearestPlayer(state, boss.x + boss.w * 0.5, boss.y + boss.h * 0.5);
    if (boss.targetPlayer) {
      const targetCenter = boss.targetPlayer.x + boss.targetPlayer.w * 0.5;
      const bossCenter = boss.x + boss.w * 0.5;
      if (Math.abs(targetCenter - bossCenter) > 12) boss.facing = targetCenter < bossCenter ? -1 : 1;
    }

    boss.time += dt;
    boss.hurt = Math.max(0, boss.hurt - dt);
    boss.shieldTime = Math.max(0, boss.shieldTime - dt);
    boss.telegraph = Math.max(0, boss.telegraph - dt);
    boss.attackAnim = Math.max(0, (boss.attackAnim || 0) - dt);
    boss.y = boss.baseY + Math.sin(boss.time * boss.floatSpeed) * boss.floatAmp;

    const nextPhase = boss.hp <= boss.maxHp * 0.33 ? 3 : boss.hp <= boss.maxHp * 0.66 ? 2 : 1;
    if (nextPhase !== boss.phase) {
      boss.phase = nextPhase;
      boss.phaseTitle = bossPhaseTitle(boss.kind, boss.phase);
      boss.attackCd = 0.35;
      boss.telegraph = 0.9;
      boss.shieldTime = boss.kind === "canopyDroneQueen" ? 0.5 : 1.1;
      rewardBossPhaseBreak(state, boss);
      setObjective(state, `${boss.name}: ${boss.phaseTitle}`, 2.4);
      addBurst(state, boss.x + boss.w * 0.5, boss.y + boss.h * 0.5, colors.purple, 46, 480);
      playTone(110 - boss.phase * 10, 0.18, "sawtooth", 0.045);
    }

    boss.attackCd -= dt;
    boss.shieldCycle -= dt;
    if (boss.shieldCycle <= 0 && boss.kind !== "canopyDroneQueen") {
      boss.shieldCycle = boss.kind === "jackpotForgeTitan" ? 5.2 : 6.2;
      boss.shieldTime = 1.25;
    }

    if (boss.attackCd <= 0) {
      bossAttack(state, boss);
    }

    if (boss.kind === "midasHeartcoreOverlord" && boss.phase === 3) {
      for (const p of activePlayers(state)) {
        p.overdrive = clamp(p.overdrive + dt * 13, 0, 100);
      }
    }

    for (const p of activePlayers(state)) {
      if (overlap(playerBox(p), bossBox(boss))) {
        takeDamage(state, 2, boss.x, p);
      }
    }
  }

  function bossAttack(state, boss) {
    boss.attackAnim = 0.46;
    if (boss.kind === "jackpotForgeTitan") {
      bossAttackForge(state, boss);
      return;
    }
    if (boss.kind === "midasHeartcoreOverlord") {
      bossAttackMidas(state, boss);
      return;
    }
    bossAttackCanopy(state, boss);
  }

  function bossMuzzleX(boss, inset) {
    return boss.facing < 0 ? boss.x + inset : boss.x + boss.w - inset;
  }

  function rewardBossPhaseBreak(state, boss) {
    const weapon = boss.phase >= 3 ? "beam" : boss.phase === 2 ? "rapid" : "spread";
    for (const p of activePlayers(state)) {
      p.overdrive = clamp(p.overdrive + 28, 0, 100);
      p.weapon = weapon;
      p.weaponTimer = Math.max(p.weaponTimer || 0, boss.phase >= 3 ? 12 : 9);
      p.luckyShield = Math.max(p.luckyShield || 0, 3.5);
      addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.48, WEAPON_META[weapon]?.color || colors.gold, 18, 300);
    }
    addCombo(state, 3);
    addScore(state, 1200 + boss.phase * 350);
  }

  function bossAttackCanopy(state, boss) {
    const p = boss.targetPlayer || nearestPlayer(state, boss.x, boss.y);
    const speed = boss.phase === 3 ? 470 : 410;
    if (boss.phase === 1) {
      boss.attackName = "Aimed Violet Bolts";
      for (let i = -1; i <= 1; i += 1) {
        fireEnemyShot(state, bossMuzzleX(boss, 42), boss.y + 88 + i * 24, p.x + p.w * 0.5, p.y + 58 + i * 18, speed, colors.purple, 1);
      }
      boss.attackCd = 1.45;
    } else if (boss.phase === 2) {
      boss.attackName = "Drone Bloom";
      summonMinion(state, boss);
      summonMinion(state, boss);
      floorHazard(state, p.x + p.w * 0.5 - 80, 160);
      fireEnemyShot(state, bossMuzzleX(boss, 34), boss.y + 122, p.x + p.w * 0.5, p.y + 42, speed, colors.orange, 1);
      boss.attackCd = 1.25;
    } else {
      boss.attackName = "Heart Core Sweep";
      for (let i = -2; i <= 2; i += 1) {
        state.enemyShots.push({
          x: bossMuzzleX(boss, 44),
          y: boss.y + 116,
          vx: boss.facing * 520,
          vy: i * 72,
          w: 30,
          h: 20,
          life: 1.8,
          color: i === 0 ? colors.pink : colors.purple,
          damage: 1
        });
      }
      floorHazard(state, p.x - 70, 140);
      floorHazard(state, p.x + 150, 120);
      boss.attackCd = 1.02;
    }
  }

  function bossAttackForge(state, boss) {
    const p = boss.targetPlayer || nearestPlayer(state, boss.x, boss.y);
    if (boss.phase === 1) {
      boss.attackName = "Jackpot Ground Slam";
      boss.telegraph = 0.35;
      state.enemyShots.push(makeShockwave(bossMuzzleX(boss, 28), 594, boss.facing * 520));
      state.enemyShots.push(makeShockwave(bossMuzzleX(boss, 72), 594, boss.facing * 390));
      floorHazard(state, p.x - 65, 130);
      boss.attackCd = 1.55;
      return;
    }
    if (boss.phase === 2) {
      boss.attackName = "Shielded Mine Launch";
      boss.shieldTime = 0.85;
      for (let i = 0; i < 3; i += 1) {
        state.enemyShots.push({
          x: bossMuzzleX(boss, 44),
          y: boss.y + 120 - i * 28,
          vx: boss.facing * (360 + i * 60),
          vy: -120 + i * 95,
          w: 32,
          h: 32,
          life: 2.0,
          color: i === 1 ? colors.gold : colors.purple,
          damage: 1
        });
      }
      boss.attackCd = 1.35;
      return;
    }
    boss.attackName = "Core Triple Spread";
    boss.shieldTime = 0.35;
    for (let i = -1; i <= 1; i += 1) {
      fireEnemyShot(state, bossMuzzleX(boss, 64), boss.y + 142, p.x + p.w * 0.5, p.y + 48 + i * 72, 500, i === 0 ? colors.pink : colors.orange, 1);
    }
    state.levelHazards.forEach((hazard) => {
      if (hazard.type === "laser") hazard.phase = (hazard.phase + 0.55) % hazard.cycle;
    });
    boss.attackCd = 1.05;
  }

  function bossAttackMidas(state, boss) {
    const p = boss.targetPlayer || nearestPlayer(state, boss.x, boss.y);
    if (boss.phase === 1) {
      boss.attackName = "Guardian Core";
      for (let i = -1; i <= 1; i += 1) {
        fireEnemyShot(state, bossMuzzleX(boss, 90), boss.y + 112 + i * 34, p.x + p.w * 0.5, p.y + 50, 400, colors.pink, 1);
      }
      floorHazard(state, p.x - 100, 200);
      boss.attackCd = 1.45;
      return;
    }
    if (boss.phase === 2) {
      boss.attackName = "Lotto Storm";
      const cx = boss.x + boss.w * 0.4;
      const cy = boss.y + boss.h * 0.45;
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * Math.PI * 2 + boss.time;
        state.enemyShots.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * 260,
          vy: Math.sin(a) * 260,
          w: 24,
          h: 24,
          life: 2.1,
          color: i % 2 ? colors.gold : colors.purple,
          damage: 1
        });
      }
      summonMinion(state, boss);
      boss.shieldTime = 0.75;
      boss.attackCd = 1.65;
      return;
    }
    boss.attackName = "Overdrive Beam";
    for (let i = -2; i <= 2; i += 1) {
      fireEnemyShot(state, bossMuzzleX(boss, 100), boss.y + 150 + i * 24, p.x + p.w * 0.5, p.y + 50 + i * 26, 560, i === 0 ? colors.pink : colors.cyan, 1);
    }
    floorHazard(state, p.x - 140, 280);
    state.hazards.push({ x: p.x - 60, y: 430, w: 420, h: 38, charge: 0.75, life: 1.55, hit: false, beam: true });
    boss.attackCd = boss.hp <= boss.maxHp * 0.16 ? 0.95 : 1.18;
  }

  function makeShockwave(x, y, vx) {
    return { x, y, vx, vy: 0, w: 78, h: 26, life: 2.3, color: colors.orange, damage: 1 };
  }

  function summonMinion(state, boss) {
    if (state.enemies.filter((enemy) => enemy.x > bossStartX(state) - 160).length > 5) return;
    const type = boss.kind === "midasHeartcoreOverlord" || boss.phase === 3 ? "drone" : "crawler";
    const x = boss.x - 450 - Math.random() * 160;
    const y = type === "drone" ? 420 : 620;
    const enemy = makeEnemy(type, x, y);
    state.enemies.push(enemy);
    addFxBurst(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.52, FX_ROWS.spawnBurst, type === "drone" ? 200 : 156, 0.54);
  }

  function floorHazard(state, x, w) {
    state.hazards.push({
      x: clamp(x, bossStartX(state) - 120, worldWidth(state) - 360),
      y: 620,
      w,
      h: 48,
      charge: 0.55,
      life: 1.35,
      hit: false
    });
  }

  function damageBoss(state, amount, overdriveHit = false) {
    const boss = state.boss;
    if (!boss || boss.hp <= 0) return;
    if (boss.shieldTime > 0 && !overdriveHit) {
      addBurst(state, boss.x + 24, boss.y + boss.h * 0.48, colors.gold, 15, 220);
      addFxBurst(state, boss.x + 24, boss.y + boss.h * 0.48, FX_ROWS.hitSpark, 136, 0.36);
      playTone(180, 0.05, "square", 0.035);
      return;
    }
    boss.hp -= amount;
    boss.hurt = 0.18;
    state.hitStop = Math.max(state.hitStop || 0, overdriveHit ? FEEDBACK.strongHitStop : FEEDBACK.shotHitStop);
    addShake(state, overdriveHit ? FEEDBACK.damageShake : 0.18);
    addBurst(state, boss.x + boss.w * 0.34, boss.y + boss.h * 0.45, overdriveHit ? colors.pink : colors.cyan, 20, 300);
    addFxBurst(state, boss.x + boss.w * 0.34, boss.y + boss.h * 0.45, FX_ROWS.hitSpark, 190, 0.42);
    playTone(380, 0.045, "triangle", 0.034);
    if (boss.hp <= 0) defeatBoss(state);
  }

  function defeatBoss(state) {
    const boss = state.boss;
    boss.hp = 0;
    state.bossDefeated = true;
    state.extractionOpen = true;
    addScore(state, 5000);
    addCombo(state, 3);
    addBurst(state, boss.x + boss.w * 0.5, boss.y + boss.h * 0.5, colors.gold, 90, 720);
    addFxBurst(state, boss.x + boss.w * 0.5, boss.y + boss.h * 0.5, FX_ROWS.hitSpark, 310, 0.7);
    emitRewardEvent("shadow.boss_defeated", {
      levelId: rewardLevelId(state),
      bossId: boss.kind,
      elapsedTicks: Math.round(state.levelTime * 60),
      playerLivesRemaining: rewardLivesRemaining(state),
      score: state.stats.score,
      kills: state.stats.kills
    });
    addShake(state, FEEDBACK.slamShake);
    setObjective(state, "Vault Lottery Terminal unlocked", 4);
    playTone(180, 0.08, "sawtooth", 0.05);
    playTone(760, 0.16, "sine", 0.05);
  }

  function updateHazards(state, dt) {
    for (const hazard of state.hazards) {
      hazard.life -= dt;
      hazard.charge -= dt;
      const box = hazard.beam ? { x: hazard.x, y: hazard.y, w: hazard.w, h: hazard.h } : { x: hazard.x, y: hazard.y - hazard.h, w: hazard.w, h: hazard.h };
      if (hazard.charge <= 0 && !hazard.hit) {
        for (const p of activePlayers(state)) {
          if (overlap(playerBox(p), box)) {
            hazard.hit = true;
            takeDamage(state, hazard.beam ? 2 : 1, hazard.x, p);
            break;
          }
        }
      }
    }
    state.hazards = state.hazards.filter((hazard) => hazard.life > 0);
  }

  function updateParticles(state, dt) {
    for (const particle of state.particles) {
      particle.t += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 360 * dt;
    }
    state.particles = state.particles.filter((particle) => particle.t < particle.life);
  }

  function updateFxBursts(state, dt) {
    for (const fx of state.fxBursts) {
      fx.t += dt;
    }
    state.fxBursts = state.fxBursts.filter((fx) => fx.t < fx.life);
  }

  function updateProgression(state) {
    if (state.objectiveTimer > 0) state.objectiveTimer -= STEP;
    else {
      state.objective = currentObjectiveText(state);
      state.objectiveTimer = 1.2;
    }
    updateCheckpoints(state);
    if (isUnderground(state)) return;

    if (!state.boss && !state.bossDefeated && state.gateOpen && maxPlayerX(state) > bossStartX(state) - 120) {
      state.boss = makeBoss(state);
      state.bossIntroPan = CAMERA.bossIntroPan;
      for (const p of allPlayers(state)) {
        p.checkpointX = bossStartX(state) + 70;
        p.checkpointY = 620 - p.standingH;
      }
      setObjective(state, `Defeat ${state.boss.name}`, 3.5);
      playTone(120, 0.12, "sawtooth", 0.055);
      playTone(70, 0.22, "triangle", 0.045);
      emitRewardEvent("shadow.boss_started", {
        levelId: rewardLevelId(state),
        bossId: state.boss.kind
      });
    }

    if (state.extractionOpen && activePlayers(state).some((p) => p.x + p.w * 0.5 > extractionX(state))) {
      completeLevel(state);
    }
  }

  function updateCheckpoints(state) {
    if (isUnderground(state)) {
      const checkpoint = activeArea(state)?.checkpoint;
      if (checkpoint) {
        for (const p of activePlayers(state)) {
          if (p.x > checkpoint.x && p.checkpointX < checkpoint.x) {
            p.checkpointX = checkpoint.x;
            p.checkpointY = (checkpoint.y || 620) - p.standingH;
            if (state.objectiveTimer <= 0.3) setObjective(state, `${p.label} underground checkpoint synced`, 1.5);
            addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.5, colors.cyan, 14, 180);
          }
        }
      }
      return;
    }
    const marks = [1500, 3000, Math.max(3600, gateX(state) - 420), bossStartX(state) + 70];
    for (const p of activePlayers(state)) {
      for (const mark of marks) {
        if (p.x > mark && p.checkpointX < mark && (!state.boss || mark <= bossStartX(state) + 70)) {
          p.checkpointX = mark;
          p.checkpointY = 620 - p.standingH;
          if (state.objectiveTimer <= 0.3) setObjective(state, `${p.label} checkpoint synced`, 1.4);
          addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.5, colors.cyan, 12, 160);
        }
      }
    }
  }

  function makeBoss(state) {
    const level = state.level;
    const finalBoss = level.boss === "midasHeartcoreOverlord";
    const forgeBoss = level.boss === "jackpotForgeTitan";
    const w = finalBoss ? 370 : forgeBoss ? 310 : 260;
    const h = finalBoss ? 360 : forgeBoss ? 330 : 250;
    const maxHp = finalBoss ? 220 : forgeBoss ? 118 : 68;
    return {
      kind: level.boss,
      name: level.bossName,
      imageKey: level.bossImage,
      x: clamp(level.bossStartX + (finalBoss ? 650 : 620), level.bossStartX + 500, level.width - w - 130),
      y: finalBoss ? 235 : forgeBoss ? 292 : 290,
      baseY: finalBoss ? 235 : forgeBoss ? 292 : 290,
      w,
      h,
      hp: maxHp,
      maxHp,
      phase: 1,
      time: 0,
      hurt: 0,
      telegraph: 1.15,
      shieldTime: 0,
      shieldCycle: forgeBoss ? 3.2 : 4.8,
      attackCd: 1.2,
      attackAnim: 0,
      facing: -1,
      attackName: finalBoss ? "Guardian Core" : forgeBoss ? "Ground Slam" : "Aimed Violet Bolts",
      phaseTitle: bossPhaseTitle(level.boss, 1),
      floatAmp: forgeBoss ? 0 : 18,
      floatSpeed: forgeBoss ? 0 : 1.4
    };
  }

  function bossPhaseTitle(kind, phase) {
    return BOSS_PHASE_TITLES[kind]?.[phase] || `Phase ${phase}`;
  }

  function completeLevel(state) {
    if (state.levelCompleteTimer > 0) return;
    const finalLevel = state.levelIndex >= LEVELS.length - 1;
    const ticket = ensureLevelTicket(state, "auto-extraction");
    emitRewardEvent("shadow.extraction_reached", {
      levelId: rewardLevelId(state)
    });
    state.levelResults.push({
      id: state.level.id,
      title: state.level.title,
      time: state.levelTime,
      score: state.stats.score,
      kills: state.stats.kills,
      combo: state.stats.maxCombo,
      ticket
    });
    best.highestUnlocked = Math.max(best.highestUnlocked || 1, finalLevel ? LEVELS.length : state.levelIndex + 2);
    if (state.stats.score > best.score) best.score = state.stats.score;
    writeJSON(ACTIVE_STORAGE_KEY, best);
    state.levelCompleteTimer = finalLevel ? 2.8 : 3.6;
    state.nextLevelIndex = finalLevel ? null : state.levelIndex + 1;
    for (const p of allPlayers(state)) {
      p.vx = 0;
      p.vy = 0;
      p.overdrive = Math.max(p.overdrive, finalLevel ? p.overdrive : 100);
    }
    setObjective(state, finalLevel ? "Final vault core defeated" : `${state.level.shortName} clear`, 2.8);
    for (const p of activePlayers(state)) {
      addBurst(state, p.x + p.w * 0.5, p.y + 52, p.index === 1 ? colors.cyan : colors.gold, finalLevel ? 90 : 52, 620);
    }
    playTone(finalLevel ? 180 : 260, 0.20, "triangle", 0.055);
    playTone(finalLevel ? 520 : 720, 0.18, "sine", 0.04);
    emitRewardEvent("shadow.level_completed", {
      levelId: rewardLevelId(state),
      levelTimeMs: Math.round(state.levelTime * 1000),
      campaignTimeMs: Math.round(state.campaignTime * 1000),
      score: state.stats.score,
      kills: state.stats.kills,
      maximumCombo: state.stats.maxCombo,
      livesRemaining: rewardLivesRemaining(state),
      requiredKeyIds: rewardRequiredKeys(state),
      bossId: state.level.boss,
      bossDefeated: state.bossDefeated,
      extractionReached: state.extractionOpen,
      difficulty: settings.difficulty || "arcade"
    }, { flush: !finalLevel });
  }

  function updateCamera(state, dt = STEP) {
    const players = activePlayers(state);
    const p = players[0] || state.player;
    const movingDir = Math.abs(p.vx) > 90 ? Math.sign(p.vx) : (state.cameraLeadDir || p.facing || 1);
    state.cameraLeadDir = approach(state.cameraLeadDir ?? movingDir, movingDir, CAMERA.directionEase * dt);
    state.cameraLookX = approach(state.cameraLookX || 0, state.cameraLeadDir * CAMERA.lookAheadX, CAMERA.lookAheadSpeed * dt);
    const viewportBias = 0.5 - state.cameraLeadDir * CAMERA.forwardBias;
    let target = p.x + p.w * 0.5 + (state.cameraLookX || 0) - W * viewportBias;
    if (players.length > 1) {
      const minX = Math.min(...players.map((player) => player.x));
      const maxX = Math.max(...players.map((player) => player.x + player.w));
      target = (minX + maxX) * 0.5 - W * 0.5;
      const keepLeadVisible = maxX - W + 230;
      const keepBackVisible = minX - 220;
      if (keepLeadVisible <= keepBackVisible) target = clamp(target, keepLeadVisible, keepBackVisible);
    }
    let followRate = CAMERA.followEase;
    let deadZone = CAMERA.followDeadZone;
    if (state.boss && !state.bossDefeated) {
      const arenaStart = clamp(bossStartX(state) - 180, 0, worldWidth(state) - W);
      const arenaEnd = clamp(extractionX(state) - W + 250, arenaStart, worldWidth(state) - W);
      target = clamp(target, arenaStart, arenaEnd);
      followRate = CAMERA.bossLockEase;
      deadZone = 18;
      if (state.bossIntroPan > 0) target = approach(arenaStart, arenaEnd, (1 - state.bossIntroPan / CAMERA.bossIntroPan) * (arenaEnd - arenaStart));
    }
    const clampedTarget = clamp(target, 0, worldWidth(state) - W);
    const deltaX = clampedTarget - state.cameraX;
    if (Math.abs(deltaX) > W * 0.82) {
      state.cameraX = clampedTarget;
    } else if (Math.abs(deltaX) > deadZone) {
      const adjustedDelta = deltaX - Math.sign(deltaX) * deadZone;
      const step = adjustedDelta * smoothFactor(followRate, dt);
      state.cameraX += clamp(step, -CAMERA.maxFollowSpeed * dt, CAMERA.maxFollowSpeed * dt);
    } else {
      state.cameraX += deltaX * smoothFactor(followRate * 0.28, dt);
    }

    const playerMidY = p.y + p.h * 0.5;
    const desiredY = clamp(playerMidY - H * 0.54, -CAMERA.maxVerticalShift, CAMERA.maxVerticalShift);
    if (Math.abs(desiredY - (state.cameraY || 0)) > CAMERA.verticalDeadZone * 0.2) {
      state.cameraY += (desiredY - state.cameraY) * smoothFactor(CAMERA.verticalEase, dt);
    } else {
      state.cameraY += (desiredY - state.cameraY) * smoothFactor(CAMERA.verticalEase * 0.22, dt);
    }
    state.cameraY = clamp(state.cameraY || 0, -CAMERA.maxVerticalShift, CAMERA.maxVerticalShift);
    state.bossIntroPan = Math.max(0, (state.bossIntroPan || 0) - STEP);
  }

  function addShake(state, amount) {
    if (!state || settings.reducedMotion || settings.reducedShake) return;
    state.shakeTrauma = clamp((state.shakeTrauma || 0) + amount, 0, 1);
  }

  function cameraShake(state) {
    if (!state || settings.reducedMotion || settings.reducedShake) return { x: 0, y: 0 };
    const trauma = clamp(state.shakeTrauma || 0, 0, 1);
    if (trauma <= 0.01) return { x: 0, y: 0 };
    const amp = trauma * trauma * FEEDBACK.maxShake;
    return {
      x: (Math.random() * 2 - 1) * amp,
      y: (Math.random() * 2 - 1) * amp * 0.7
    };
  }

  function addScore(state, amount) {
    state.stats.score += Math.round(amount);
  }

  function addCombo(state, amount) {
    state.combo += amount;
    state.comboTimer = 3.1;
    state.stats.maxCombo = Math.max(state.stats.maxCombo, state.combo);
  }

  function setObjective(state, text, seconds) {
    state.objective = text;
    state.objectiveTimer = seconds;
  }

  function takeDamage(state, amount, sourceX, p = state.player) {
    if (p.invuln > 0 || p.dashTime > 0 || p.overdriveTime > 0) return;
    if (p.luckyShield > 0) {
      p.luckyShield = 0;
      p.invuln = 0.65;
      addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.42, colors.gold, 30, 360);
      setObjective(state, `${p.label} lucky shield absorbed the hit`, 1.4);
      playTone(760, 0.08, "triangle", 0.035);
      return;
    }
    const scaledAmount = Math.max(1, Math.round(amount * difficultyConfig().enemyDamage));
    p.hp -= scaledAmount;
    p.invuln = MOVEMENT.invulnAfterHit;
    p.knockbackTime = 0.28;
    state.combo = 0;
    state.comboTimer = 0;
    state.hitStop = Math.max(state.hitStop || 0, 0.055);
    state.stats.damageTaken += scaledAmount;
    addShake(state, FEEDBACK.damageShake);
    addBurst(state, p.x + p.w * 0.5, p.y + p.h * 0.55, colors.red, 24, 340);
    p.vx = sourceX < p.x ? 260 : -260;
    p.vy = -310;
    playTone(90, 0.08, "sawtooth", 0.05);

    if (p.hp <= 0) {
      p.lives -= 1;
      if (p.lives <= 0) {
        p.hp = 0;
        p.vx = 0;
        p.vy = 0;
        setObjective(state, `${p.label} down`, 1.5);
        if (!activePlayers(state).length) finishRun(false);
      } else {
        respawnPlayer(state, p);
      }
    }
  }

  function respawnPlayer(state, p = state.player) {
    p.hp = p.maxHp;
    p.x = p.checkpointX;
    p.y = p.checkpointY;
    p.vx = 0;
    p.vy = 0;
    p.invuln = 1.6;
    p.dashCd = 0;
    p.dashTime = 0;
    p.airDashUsed = false;
    p.crouching = false;
    setObjective(state, `${p.label} checkpoint restored`, 1.5);
  }

  function finishRun(victory) {
    if (!run) return;
    const stats = run.stats;
    const elapsed = run.time;
    const accuracy = stats.shotsFired ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
    const rank = rankRun(victory, stats, elapsed, accuracy);
    const finalTicket = run.lotteryTickets[String(LEVELS[LEVELS.length - 1].id)] || currentLevelTicket(run) || ensureLevelTicket(run, victory ? "final-results" : "run-failed");
    if (stats.score > best.score) best.score = stats.score;
    if (victory && (!best.fastest || elapsed < best.fastest)) best.fastest = elapsed;
    if (victory) best.highestUnlocked = LEVELS.length;
    writeJSON(ACTIVE_STORAGE_KEY, best);

    dom.resultKicker.textContent = victory ? "Final Victory" : "Run Failed";
    dom.resultTitle.textContent = victory ? "Midas Heartcore Offline" : "Vault Overrun";
    dom.resultCopy.textContent = victory ? "LottoMind cleared every number vault and secured the run lottery drops." : "The vault reset at the last checkpoint, but your current vault drop remains saved.";
    dom.resultScore.textContent = String(stats.score);
    dom.resultTime.textContent = formatTime(elapsed);
    dom.resultKills.textContent = String(stats.kills);
    dom.resultAccuracy.textContent = `${accuracy}%`;
    dom.resultDamage.textContent = String(stats.damageTaken);
    dom.resultCombo.textContent = String(stats.maxCombo);
    dom.resultRank.textContent = rank;
    dom.resultBest.textContent = best.fastest ? `${best.score} / ${formatTime(best.fastest)}` : String(best.score);
    if (dom.resultLotteryLevel) dom.resultLotteryLevel.textContent = `Level ${finalTicket.levelId || run.level.id} Vault Drop`;
    dom.resultLotterySeed.textContent = ticketDropLabel(finalTicket);
    dom.resultPick3.textContent = finalTicket.pick3;
    dom.resultPick4.textContent = finalTicket.pick4;
    renderPick6Balls(dom.resultLotto6, finalTicket.pick6);
    renderRunLotteryDrops(run);
    toggleResultShareMenu(false);
    if (dom.resultShareStatus) dom.resultShareStatus.textContent = "";
    if (victory) {
      emitRewardEvent("shadow.campaign_completed", {
        completedLevelIds: run.levelResults.map((level) => String(level.id)),
        totalCampaignTimeMs: Math.round(run.campaignTime * 1000),
        score: stats.score,
        kills: stats.kills,
        maximumCombo: stats.maxCombo,
        difficulty: settings.difficulty || "arcade"
      }, { finalize: true, idempotencyKey: rewardRunKey });
    }
    setMode("results");
  }

  function renderRunLotteryDrops(state) {
    if (!dom.runLotteryDrops) return;
    dom.runLotteryDrops.innerHTML = "";
    for (const level of LEVELS) {
      const ticket = state.lotteryTickets[String(level.id)];
      const card = document.createElement("div");
      card.className = "lottery-drop-card";
      card.innerHTML = ticket
        ? `<span>Level ${level.id}</span><strong>${ticket.pick3} / ${ticket.pick4} / Mega ${ticket.pick6}</strong><span>${ticketDropLabel(ticket)}</span><strong>${level.shortName}</strong>`
        : `<span>Level ${level.id}</span><strong>Pending</strong><span>Vault</span><strong>${level.shortName}</strong>`;
      dom.runLotteryDrops.appendChild(card);
    }
  }

  function rankRun(victory, stats, elapsed, accuracy) {
    let points = 0;
    if (victory) points += 4;
    if (stats.score >= 12000) points += 2;
    if (stats.maxCombo >= 12) points += 2;
    if (accuracy >= 55) points += 1;
    if (stats.damageTaken <= 4) points += 1;
    if (elapsed <= 210) points += 1;
    if (points >= 9) return "S";
    if (points >= 7) return "A";
    if (points >= 5) return "B";
    return victory ? "C" : "D";
  }

  function generateLotteryNumbers(state, victory, elapsed, accuracy, rank) {
    const stats = state.stats;
    const rankValue = rank.charCodeAt(0);
    const seedParts = [
      stats.score,
      stats.kills * 37,
      stats.shotsFired * 11,
      stats.shotsHit * 19,
      stats.damageTaken * 23,
      stats.maxCombo * 29,
      Math.round(elapsed * 10),
      accuracy * 31,
      state.shards * 17,
      state.keys * 43,
      state.levelIndex * 53,
      state.coOp ? 97 : 13,
      victory ? 307 : 101,
      rankValue * 7
    ];
    let seed = 0x811c9dc5;
    for (const value of seedParts) {
      seed ^= value >>> 0;
      seed = Math.imul(seed, 0x01000193) >>> 0;
    }
    const random = seededRandom(seed || 1);
    const digit = () => Math.floor(random() * 10);
    const pick3 = `${digit()}${digit()}${digit()}`;
    const pick4 = `${digit()}${digit()}${digit()}${digit()}`;
    const lotto = [];
    while (lotto.length < 6) {
      const n = 1 + Math.floor(random() * 49);
      if (!lotto.includes(n)) lotto.push(n);
    }
    lotto.sort((a, b) => a - b);
    return {
      seedLabel: (seed >>> 0).toString(16).toUpperCase().padStart(8, "0"),
      pick3,
      pick4,
      lotto6: lotto.map((n) => String(n).padStart(2, "0"))
    };
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value + 0x6d2b79f5) >>> 0;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    if (mode === "title") {
      return;
    }
    if (!run) {
      return;
    }
    drawGame(run);
  }

  function drawTitleCanvas() {
    drawTitleBackdropWash();
    const wash = ctx.createLinearGradient(0, 0, W, 0);
    wash.addColorStop(0, "rgba(0,0,0,.76)");
    wash.addColorStop(0.44, "rgba(0,0,0,.42)");
    wash.addColorStop(0.72, "rgba(0,0,0,.08)");
    wash.addColorStop(1, "rgba(0,0,0,.70)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitleBackdropWash() {
    ctx.fillStyle = "#020104";
    ctx.fillRect(0, 0, W, H);
    if (images.backplate?.complete && images.backplate.naturalWidth) {
      drawCover(images.backplate, 0, 0, 0.44);
    }
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const cyan = ctx.createRadialGradient(W * 0.22, H * 0.26, 20, W * 0.22, H * 0.26, 520);
    cyan.addColorStop(0, "rgba(56,219,255,.12)");
    cyan.addColorStop(0.42, "rgba(56,219,255,.04)");
    cyan.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, W, H);
    const magenta = ctx.createRadialGradient(W * 0.82, H * 0.56, 30, W * 0.82, H * 0.56, 620);
    magenta.addColorStop(0, "rgba(255,79,154,.16)");
    magenta.addColorStop(0.36, "rgba(165,34,255,.08)");
    magenta.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = magenta;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawGame(state) {
    drawBackground(state);
    ctx.save();
    const shake = cameraShake(state);
    ctx.translate(shake.x - state.cameraX, shake.y - (state.cameraY || 0));
    drawBacklightRays(state);
    drawWorldAssetPass(state);
    if (DRAW_DECORATIVE_WORLD_PROPS) {
      drawBrandProps(state);
      drawBatchSceneryProps(state);
    }
    drawPlatforms(state);
    drawAreaPortals(state);
    drawGate(state);
    if (!isUnderground(state)) {
      drawArenaLockGates(state);
      drawExtraction(state);
      drawLotteryTerminal(state);
    }
    drawPickups(state);
    drawLevelHazards(state);
    drawHazards(state);
    drawEntityShadows(state);
    drawEnemyShots(state);
    drawPlayerShots(state);
    drawEnemies(state);
    drawBoss(state);
    drawFxBursts(state);
    drawParticles(state);
    drawPlayer(state);
    ctx.restore();
    drawScreenDepth(state);
    drawToast(state);
    if (state.objectiveTimer > 0) {
      dom.objectiveChip.textContent = state.objective;
      dom.objectiveChip.classList.remove("is-hidden");
    } else {
      dom.objectiveChip.classList.add("is-hidden");
    }
    drawLevelOverlay(state);
    drawAreaTransition(state);
  }

  function drawBackground(stateOrCameraX, timeArg = 0) {
    const state = typeof stateOrCameraX === "object" ? stateOrCameraX : null;
    const cameraX = state ? state.cameraX : stateOrCameraX;
    const time = state ? state.time : timeArg;
    if (state && isUnderground(state)) {
      drawUndergroundBackground(state);
      return;
    }
    const bgKey = state?.level?.background;
    ctx.fillStyle = "#030302";
    ctx.fillRect(0, 0, W, H);
    if (bgKey && images[bgKey]) {
      if (images.farParallax?.complete && images.farParallax.naturalWidth && state?.level?.id === 1) {
        drawCover(images.farParallax, -cameraX * 0.035, Math.sin(time * 0.16) * 2 - 4, 0.45);
      }
      drawCover(images[bgKey], -cameraX * 0.08, Math.sin(time * 0.22) * 2, 0.94);
    } else {
      drawCover(images.backplate, -cameraX * 0.08, 0, 0.88);
      drawCover(images.foreground, -cameraX * 0.18, Math.sin(time * 0.35) * 4, 0.96);
    }
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const amber = ctx.createRadialGradient(W * 0.78, H * 0.5, 20, W * 0.78, H * 0.5, 520);
    amber.addColorStop(0, "rgba(255, 112, 67, .12)");
    amber.addColorStop(0.42, "rgba(165, 34, 255, .10)");
    amber.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = amber;
    ctx.fillRect(0, 0, W, H);
    const vaultGlow = ctx.createRadialGradient(W * 0.46, H * 0.54, 30, W * 0.46, H * 0.54, 620);
    vaultGlow.addColorStop(0, "rgba(56, 219, 255, .10)");
    vaultGlow.addColorStop(0.36, "rgba(96, 62, 195, .10)");
    vaultGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vaultGlow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(0,0,0,.04)");
    shade.addColorStop(0.58, "rgba(0,0,0,.04)");
    shade.addColorStop(1, "rgba(0,0,0,.36)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  }

  function withAlpha(color, alpha) {
    const hex = String(color || "").trim();
    const match = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!match) return `rgba(165,34,255,${alpha})`;
    const value = match[1];
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function drawUndergroundBackground(state) {
    const cameraX = state.cameraX;
    const areaPalette = activeArea(state)?.palette || {};
    const glowColor = areaPalette.glow || "#a522ff";
    const fogColor = areaPalette.fog || "#25123f";
    const deepColor = areaPalette.platform || "#12071f";
    ctx.fillStyle = "#030204";
    ctx.fillRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 80, 0, H);
    sky.addColorStop(0, deepColor);
    sky.addColorStop(0.55, fogColor);
    sky.addColorStop(1, "#050209");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 92, W, H - 92);
    ctx.save();
    ctx.translate(-cameraX * 0.08, 0);
    ctx.globalAlpha = 0.48;
    for (let x = -220; x < W + 460; x += 260) {
      ctx.fillStyle = "rgba(7,6,12,.7)";
      ctx.fillRect(x, 155, 150, 455);
      ctx.strokeStyle = "rgba(255,214,109,.16)";
      ctx.lineWidth = 2;
      for (let y = 175; y < 585; y += 58) {
        ctx.beginPath();
        ctx.moveTo(x + 18, y);
        ctx.lineTo(x + 92, y);
        ctx.lineTo(x + 126, y + 19);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.save();
    ctx.translate(-cameraX * 0.18, 0);
    ctx.globalCompositeOperation = "screen";
    for (let x = -280; x < W + 560; x += 380) {
      const g = ctx.createRadialGradient(x + 180, 445, 8, x + 180, 445, 250);
      g.addColorStop(0, withAlpha(glowColor, 0.18));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, 210, 360, 430);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = "rgba(0,0,0,.42)";
    for (let x = -(cameraX * 0.34 % 180); x < W + 180; x += 180) ctx.fillRect(x, 92, 3, H - 92);
    for (let y = 140; y < H; y += 72) ctx.fillRect(0, y, W, 2);
    ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(0,0,0,.2)");
    shade.addColorStop(0.42, "rgba(0,0,0,.03)");
    shade.addColorStop(1, "rgba(0,0,0,.42)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  }

  function drawBacklightRays(state) {
    if (settings.reducedMotion) return;
    const cameraX = state.cameraX;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 7; i += 1) {
      const x = cameraX + ((i * 740 - (cameraX * 0.28) + state.time * 16) % (worldWidth(state) + 740)) - 260;
      const alpha = 0.045 + ((i % 3) * 0.012);
      const g = ctx.createLinearGradient(x, 120, x + 260, 610);
      g.addColorStop(0, `rgba(255,214,109,${alpha})`);
      g.addColorStop(0.45, `rgba(165,34,255,${alpha * 0.58})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 108);
      ctx.lineTo(x + 94, 108);
      ctx.lineTo(x + 342, 640);
      ctx.lineTo(x + 116, 640);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawScreenDepth(state) {
    ctx.save();
    const scan = ctx.createLinearGradient(0, 0, 0, H);
    scan.addColorStop(0, "rgba(255,255,255,0.035)");
    scan.addColorStop(0.18, "rgba(255,255,255,0)");
    scan.addColorStop(0.72, "rgba(0,0,0,0)");
    scan.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = scan;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "multiply";
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, 120, W * 0.5, H * 0.5, 780);
    vignette.addColorStop(0, "rgba(255,255,255,0)");
    vignette.addColorStop(0.7, "rgba(0,0,0,0.08)");
    vignette.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawLevelOverlay(state) {
    if (state.introTimer <= 0 && state.levelCompleteTimer <= 0) return;
    const intro = state.introTimer > 0;
    const t = intro ? state.introTimer : state.levelCompleteTimer;
    const alpha = clamp(t / 0.45, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,.56)";
    ctx.fillRect(0, 0, W, H);
    const frame = images.levelFrame;
    if (frame?.complete && frame.naturalWidth) {
      ctx.globalAlpha = alpha * 0.92;
      ctx.drawImage(frame, 185, 122, 910, 508);
    } else {
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 4;
      roundedRect(250, 178, 780, 360, 10, false, true);
    }
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.fillStyle = colors.gold;
    ctx.font = "900 26px system-ui";
    ctx.fillText(intro ? `LEVEL ${state.level.id}` : "LEVEL COMPLETE", W * 0.5, 272);
    ctx.fillStyle = "#fff3d1";
    ctx.font = "900 48px system-ui";
    ctx.fillText(state.level.title, W * 0.5, 330);
    ctx.fillStyle = colors.pink;
    ctx.font = "800 24px system-ui";
    const ticket = !intro ? currentLevelTicket(state) : null;
    const rewardLine = ticket ? `P3 ${ticket.pick3}  |  P4 ${ticket.pick4}  |  P6 Mega ${ticket.pick6}` : "";
    ctx.fillText(intro ? state.level.objective : ticket ? `LEVEL LOTTERY DROP - ${rewardLine}` : state.nextLevelIndex === null ? "FINAL PORTAL OPENING" : `NEXT: ${LEVELS[state.nextLevelIndex].title}`, W * 0.5, 378);
    ctx.fillStyle = "rgba(255,243,209,.82)";
    ctx.font = "700 18px system-ui";
    const copy = intro ? `${state.level.bossName} guards the chamber.` : `Score ${String(state.stats.score).padStart(6, "0")}  |  Combo x${state.stats.maxCombo}  |  Time ${formatTime(state.time)}`;
    ctx.fillText(copy, W * 0.5, 426);
    if (!intro && state.nextLevelIndex === null && images.victoryBadge?.complete) {
      ctx.drawImage(images.victoryBadge, W * 0.5 - 62, 452, 124, 124);
    }
    ctx.restore();
  }

  function drawCover(image, xOffset, yOffset, alpha = 1) {
    if (!image.complete || !image.naturalWidth) return false;
    const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    const baseY = (H - dh) / 2 + yOffset;
    let start = ((xOffset % dw) + dw) % dw;
    start = -start;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let x = start - dw; x < W + dw; x += dw) {
      ctx.drawImage(image, x, baseY, dw, dh);
    }
    ctx.restore();
    return true;
  }

  function drawSheetCell(image, cols, rows, frame, row, x, y, w, h, alpha = 1) {
    if (!image?.complete || !image.naturalWidth) return false;
    const cellW = image.naturalWidth / cols;
    const cellH = image.naturalHeight / rows;
    const sx = (frame % cols) * cellW;
    const sy = (row % rows) * cellH;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, sx, sy, cellW, cellH, x, y, w, h);
    ctx.restore();
    return true;
  }

  function drawSheetCellFit(image, cols, rows, frame, row, x, y, maxW, maxH, alpha = 1, options = {}) {
    if (!image?.complete || !image.naturalWidth) return false;
    const cellW = image.naturalWidth / cols;
    const cellH = image.naturalHeight / rows;
    const inset = options.sourceInset || 0;
    const sx = (frame % cols) * cellW + inset;
    const sy = (row % rows) * cellH + inset;
    const sw = Math.max(1, cellW - inset * 2);
    const sh = Math.max(1, cellH - inset * 2);
    const ratio = Math.min(maxW / sw, maxH / sh);
    const dw = sw * ratio;
    const dh = sh * ratio;
    const drawX = -dw * 0.5;
    const drawY = options.anchor === "bottom" ? -dh : -dh * 0.5;

    ctx.save();
    ctx.translate(x + (options.offsetX || 0), y + (options.offsetY || 0));
    if (options.flip) ctx.scale(-1, 1);
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, sx, sy, sw, sh, drawX, drawY, dw, dh);
    ctx.restore();
    return true;
  }

  function drawFxCell(row, frame, x, y, w, h, alpha = 1, rotation = 0) {
    const image = images.fxSheet;
    if (!image?.complete || !image.naturalWidth) return false;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = row === FX_ROWS.bossBeam ? "rgba(255,79,154,.52)" : "rgba(165,34,255,.5)";
    ctx.shadowBlur = row === FX_ROWS.hitSpark ? 10 : 18;
    const drawn = drawSheetCellFit(image, FX_SHEET_COLS, FX_SHEET_ROWS, frame, row, 0, 0, w, h, alpha, { sourceInset: 0 });
    ctx.restore();
    return drawn;
  }

  function drawGameplayFxCell(cell, x, y, w, h, alpha = 1, options = {}) {
    const image = images.gameplayFx;
    if (!cell || !image?.complete || !image.naturalWidth) return false;
    ctx.save();
    ctx.translate(x, y);
    if (options.rotation) ctx.rotate(options.rotation);
    if (options.composite) ctx.globalCompositeOperation = options.composite;
    if (options.shadowColor) {
      ctx.shadowColor = options.shadowColor;
      ctx.shadowBlur = options.shadowBlur ?? 18;
    }
    const drawn = drawSheetCellFit(
      image,
      GAMEPLAY_FX_COLS,
      GAMEPLAY_FX_ROWS,
      cell.frame,
      cell.row,
      0,
      0,
      w,
      h,
      alpha,
      {
        sourceInset: 0,
        flip: options.flip,
        anchor: options.anchor,
        offsetX: options.offsetX,
        offsetY: options.offsetY
      }
    );
    ctx.restore();
    return drawn;
  }

  function drawDroneFxCell(frame, x, y, w, h, alpha = 1, options = {}) {
    const image = images.droneFx;
    if (!image?.complete || !image.naturalWidth) return false;
    ctx.save();
    ctx.translate(x, y);
    if (options.rotation) ctx.rotate(options.rotation);
    ctx.globalCompositeOperation = options.composite || "screen";
    ctx.shadowColor = options.shadowColor || "rgba(255,79,154,.58)";
    ctx.shadowBlur = options.shadowBlur ?? 18;
    const drawn = drawSheetCellFit(image, DRONE_FX_FRAMES, 1, frame, 0, 0, 0, w, h, alpha, {
      sourceInset: options.sourceInset || 0,
      anchor: options.anchor
    });
    ctx.restore();
    return drawn;
  }

  function drawFxBursts(state) {
    for (const fx of state.fxBursts) {
      const progress = clamp(fx.t / fx.life, 0, 0.999);
      const frame = Math.min(FX_SHEET_COLS - 1, Math.floor(progress * FX_SHEET_COLS));
      const alpha = 1 - progress;
      const bloom = 0.84 + progress * 0.38;
      if (drawFxCell(fx.row, frame, fx.x, fx.y, fx.size * bloom, fx.size * bloom, alpha, fx.rotation + progress * 0.45)) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fx.row === FX_ROWS.bossBeam ? colors.pink : colors.purple;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.size * 0.2 * bloom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBrandProps(state) {
    const image = images.missionBrandProps;
    const generated = images.missionProps;
    if (!image?.complete && !generated?.complete) return;
    const props = LEVEL_BRAND_PROPS[state.level.id] || [];
    for (const prop of props) {
      if (prop.x + prop.w < state.cameraX - 200 || prop.x - prop.w > state.cameraX + W + 200) continue;
      if (!visualBoundsFullyInView(state, prop.x - prop.w * 0.6, prop.x + prop.w * 0.6, 6)) continue;
      const motion = settings.reducedMotion ? 0 : Math.sin(state.time * 1.6 + prop.phase);
      const alpha = (prop.alpha || 0.5) * (0.9 + motion * 0.1);
      const y = prop.y + motion * 4;
      const row = Math.floor(prop.cell / 3);
      const frame = prop.cell % 3;

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(255,214,109,${Math.max(0.08, alpha * 0.25)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prop.x - prop.w * 0.32, y + prop.h * 0.32);
      ctx.lineTo(prop.x + prop.w * 0.28, y + prop.h * 0.32 + motion * 3);
      ctx.stroke();
      ctx.restore();

      if (generated?.complete && generated.naturalWidth) {
        const generatedCell = GENERATED_PROP_CELLS[prop.cell % GENERATED_PROP_CELLS.length];
        drawSheetCellFit(generated, 4, 4, generatedCell.frame, generatedCell.row, prop.x, y, prop.w * generatedCell.w, prop.h * generatedCell.h, alpha * 1.08, { sourceInset: 10 });
      } else {
        drawSheetCell(image, 3, 2, frame, row, prop.x - prop.w * 0.5, y - prop.h * 0.5, prop.w, prop.h, alpha);
      }
    }
  }

  function drawBatchSceneryProps(state) {
    const props = BATCH_SCENERY_PROPS[state.level.id] || [];
    if (!props.length) return;
    for (const prop of props) {
      if (prop.x + prop.w < state.cameraX - 200 || prop.x - prop.w > state.cameraX + W + 200) continue;
      if (!visualBoundsFullyInView(state, prop.x - prop.w * 0.62, prop.x + prop.w * 0.62, 6)) continue;
      if (prop.kind === "floorRelay") {
        const motion = settings.reducedMotion ? 0 : Math.sin(state.time * 1.15 + prop.phase) * 2.5;
        drawVaultFloorRelayAsset(prop.x, prop.y + motion, prop.w, prop.h, state.level?.palette || {}, prop.alpha || 0.88);
        continue;
      }
      const image = prop.sheet === "world" ? images.missionBatchWorld : images.missionBatchProps;
      if (!image?.complete || !image.naturalWidth) continue;

      const frame = prop.cell % MISSION_BATCH_COLS;
      const row = Math.floor(prop.cell / MISSION_BATCH_COLS);
      const motion = settings.reducedMotion ? 0 : Math.sin(state.time * 1.15 + prop.phase) * 2.5;
      const alpha = (prop.alpha || 0.7) * (0.96 + (motion / 2.5) * 0.04);

      ctx.save();
      ctx.globalCompositeOperation = prop.composite || "source-over";
      drawSheetCellFit(
        image,
        MISSION_BATCH_COLS,
        MISSION_BATCH_ROWS,
        frame,
        row,
        prop.x,
        prop.y + motion,
        prop.w,
        prop.h,
        alpha,
        { anchor: prop.anchor || "center", sourceInset: prop.sourceInset ?? 10 }
      );
      ctx.restore();
    }
  }

  function drawVaultFloorRelayAsset(x, y, w, h, palette, alpha = 0.88) {
    const trim = palette?.trim || colors.gold;
    const glow = palette?.glow || colors.purple;
    const accent = palette?.accent || colors.pink;
    const top = y - h * 0.35;
    const baseH = h * 0.34;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = withAlpha(glow, 0.3);
    ctx.shadowBlur = 16;

    const rail = ctx.createLinearGradient(x - w * 0.5, top, x + w * 0.5, top + baseH);
    rail.addColorStop(0, "rgba(14, 10, 18, 0)");
    rail.addColorStop(0.12, "#0b0710");
    rail.addColorStop(0.5, "#22152b");
    rail.addColorStop(0.88, "#0b0710");
    rail.addColorStop(1, "rgba(14, 10, 18, 0)");
    ctx.fillStyle = rail;
    roundedRect(x - w * 0.5, top, w, baseH, 8, true, false);

    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = withAlpha(trim, 0.64);
    roundedRect(x - w * 0.46, top + 4, w * 0.92, baseH - 8, 7, false, true);

    ctx.globalCompositeOperation = "screen";
    const core = ctx.createLinearGradient(x - w * 0.38, top, x + w * 0.38, top);
    core.addColorStop(0, withAlpha(glow, 0.02));
    core.addColorStop(0.5, withAlpha(accent, 0.52));
    core.addColorStop(1, withAlpha(glow, 0.02));
    ctx.fillStyle = core;
    roundedRect(x - w * 0.36, top + baseH * 0.4, w * 0.72, 7, 4, true, false);

    ctx.strokeStyle = withAlpha(trim, 0.44);
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i += 1) {
      const px = x + i * w * 0.13;
      ctx.beginPath();
      ctx.moveTo(px - 14, top + baseH * 0.18);
      ctx.lineTo(px + 6, top + baseH * 0.18);
      ctx.lineTo(px + 16, top + baseH * 0.36);
      ctx.stroke();
    }

    ctx.fillStyle = withAlpha(trim, 0.75);
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * w * 0.22, top + baseH * 0.52, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWorldAssetPass(state) {
    if (!state || !DRAW_DECORATIVE_WORLD_PROPS) return;
    const area = activeArea(state);
    const palette = state.level?.palette || {};
    const modules = isUnderground(state)
      ? buildUndergroundWorldModules(state, area)
      : buildSurfaceWorldModules(state);
    for (const module of modules) {
      // Functional gates and portals render later in a single authoritative pass.
      // Drawing their decorative housings here caused doubled, translucent panels.
      if (module.type === "portal" || module.type === "gate") continue;
      const pad = module.type === "wall" ? module.w * 0.45 : module.w * 0.8;
      if (module.x + module.w < state.cameraX - pad || module.x - module.w > state.cameraX + W + pad) continue;
      if (module.type === "portal") {
        drawPortalHousingAsset(module.x, module.y, module.kind || "entrance", palette, { ...module, time: state.time });
      } else if (module.type === "gate") {
        drawGateFrameAsset(module.x, module.y, module.w, module.h, palette, module);
      } else if (module.type === "crate") {
        drawVaultCrateAsset(module.x, module.y, module.w, module.h, palette, module.variant || 0);
      } else if (module.type === "console") {
        drawVaultConsoleAsset(module.x, module.y, module.w, module.h, palette, module.variant || 0);
      } else {
        drawCircuitWallAsset(module.x, module.y, module.w, module.h, palette, module.variant || 0);
      }
    }
  }

  function buildSurfaceWorldModules(state) {
    const modules = [...(WORLD_ASSET_MODULES[state.level.id] || [])];
    const underground = state.level.underground;
    if (underground?.entrance) {
      modules.push({
        type: "portal",
        kind: undergroundComplete(state) ? "sealed" : "entrance",
        x: underground.entrance.x,
        y: underground.entrance.y || 620,
        w: 112,
        h: 164
      });
    }
    modules.push({
      type: "gate",
      x: gateX(state) - 36,
      y: 392,
      w: 104,
      h: 212,
      open: state.gateOpen
    });
    modules.push({
      type: "portal",
      kind: state.extractionOpen ? "exit" : "dormant",
      x: extractionX(state),
      y: 620,
      w: 136,
      h: 174
    });
    return modules;
  }

  function buildUndergroundWorldModules(state, area) {
    const modules = [
      { type: "wall", x: 150, y: 340, w: 230, h: 260, variant: 2 },
      { type: "wall", x: Math.max(520, area.width * 0.36), y: 314, w: 260, h: 286, variant: 1 },
      { type: "console", x: Math.max(680, area.width * 0.5), y: 548, w: 150, h: 84, variant: 2 },
      { type: "wall", x: Math.max(1120, area.width - 560), y: 334, w: 230, h: 270, variant: 0 },
      { type: "crate", x: Math.max(820, area.width * 0.64), y: 560, w: 170, h: 78, variant: 1 },
      { type: "portal", kind: undergroundExitReady(state) ? "exit" : "cell-lock", x: area.exitX, y: area.exitY || 620, w: 150, h: 220 }
    ];
    return modules;
  }

  function drawCircuitWallAsset(x, y, w, h, palette, variant = 0) {
    const solidPanel = images.solidVaultPanel;
    if (solidPanel?.complete && solidPanel.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = true;
      ctx.shadowColor = withAlpha(palette.glow || colors.purple, 0.28);
      ctx.shadowBlur = 10;
      ctx.drawImage(solidPanel, x, y, w, h);
      ctx.restore();
      return;
    }
    const trim = palette.trim || colors.gold;
    const glow = palette.glow || colors.purple;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.shadowColor = withAlpha(glow, 0.24);
    ctx.shadowBlur = 14;
    const panel = ctx.createLinearGradient(x, y, x + w, y + h);
    panel.addColorStop(0, "#08070b");
    panel.addColorStop(0.46, "#15111a");
    panel.addColorStop(1, "#050407");
    ctx.fillStyle = panel;
    roundedRect(x, y, w, h, 10, true, false);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = withAlpha(trim, 0.58);
    roundedRect(x + 4, y + 4, w - 8, h - 8, 8, false, true);
    ctx.strokeStyle = withAlpha(glow, 0.38);
    ctx.lineWidth = 2;
    const step = variant % 2 ? 42 : 36;
    for (let cy = y + 34; cy < y + h - 28; cy += step) {
      ctx.beginPath();
      ctx.moveTo(x + 18, cy);
      ctx.lineTo(x + w * 0.36, cy);
      ctx.lineTo(x + w * 0.48, cy + 15);
      ctx.lineTo(x + w - 26, cy + 15);
      ctx.stroke();
      ctx.fillStyle = withAlpha(trim, 0.7);
      ctx.beginPath();
      ctx.arc(x + w - 26, cy + 15, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "screen";
    const core = ctx.createLinearGradient(x, y, x + w, y);
    core.addColorStop(0, "rgba(0,0,0,0)");
    core.addColorStop(0.5, withAlpha(glow, 0.18));
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(x + 14, y + 18, w - 28, h - 36);
    ctx.restore();
  }

  function drawAnchoredTechBase(x, groundY, width, options = {}) {
    const glow = options.glow || colors.purple;
    const trim = options.trim || colors.gold;
    const height = options.height || 28;
    const depth = options.depth || 18;
    const topY = groundY - height;
    const left = x - width * 0.5;
    ctx.save();
    ctx.globalAlpha = options.alpha == null ? 1 : options.alpha;
    ctx.shadowColor = withAlpha(glow, 0.34);
    ctx.shadowBlur = 12;
    const shadow = ctx.createRadialGradient(x, groundY - 3, 8, x, groundY - 3, width * 0.62);
    shadow.addColorStop(0, withAlpha(glow, 0.22));
    shadow.addColorStop(0.56, "rgba(0,0,0,.42)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 4, width * 0.58, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createLinearGradient(0, topY, 0, groundY + depth);
    body.addColorStop(0, "#17121a");
    body.addColorStop(0.46, "#08070c");
    body.addColorStop(1, "#030205");
    ctx.fillStyle = body;
    roundedRect(left, topY, width, height + depth, 8, true, false);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = withAlpha(trim, 0.74);
    ctx.lineWidth = 2.4;
    roundedRect(left + 4, topY + 4, width - 8, height + depth - 8, 6, false, true);
    ctx.globalCompositeOperation = "screen";
    const underglow = ctx.createLinearGradient(left + 8, groundY - 9, left + width - 8, groundY - 9);
    underglow.addColorStop(0, "rgba(0,0,0,0)");
    underglow.addColorStop(0.5, withAlpha(glow, 0.58));
    underglow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = underglow;
    roundedRect(left + 12, groundY - 13, width - 24, 8, 4, true, false);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = withAlpha(glow, 0.45);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i += 1) {
      const sx = left + width * (0.18 + i * 0.26);
      ctx.beginPath();
      ctx.moveTo(sx, topY + 10);
      ctx.lineTo(sx + width * 0.1, topY + 10);
      ctx.lineTo(sx + width * 0.15, topY + 19);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawVaultCrateAsset(x, y, w, h, palette, variant = 0) {
    const trim = palette.trim || colors.gold;
    const glow = palette.glow || colors.purple;
    ctx.save();
    ctx.globalAlpha = 0.94;
    const g = ctx.createLinearGradient(x, y - h, x + w, y);
    g.addColorStop(0, "#2b2527");
    g.addColorStop(0.55, "#111015");
    g.addColorStop(1, "#070609");
    ctx.fillStyle = g;
    roundedRect(x - w * 0.5, y - h, w, h, 8, true, false);
    ctx.strokeStyle = withAlpha(trim, 0.62);
    ctx.lineWidth = 3;
    roundedRect(x - w * 0.5 + 4, y - h + 4, w - 8, h - 8, 7, false, true);
    ctx.fillStyle = withAlpha(glow, 0.22);
    ctx.fillRect(x - w * 0.28, y - h * 0.28, w * 0.56, 5);
    ctx.strokeStyle = withAlpha(trim, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.36, y - h * 0.72);
    ctx.lineTo(x - w * 0.08, y - h * 0.72);
    ctx.lineTo(x + w * 0.12, y - h * 0.5);
    ctx.lineTo(x + w * 0.36, y - h * 0.5);
    ctx.stroke();
    if (variant % 2 === 0) {
      ctx.fillStyle = withAlpha(trim, 0.78);
      ctx.fillRect(x - 10, y - h * 0.56, 20, 16);
    }
    ctx.restore();
  }

  function drawVaultConsoleAsset(x, y, w, h, palette, variant = 0) {
    const trim = palette.trim || colors.gold;
    const glow = palette.glow || colors.purple;
    ctx.save();
    ctx.globalAlpha = 0.96;
    const baseX = x - w * 0.5;
    const baseY = y - h;
    ctx.fillStyle = "#08070b";
    roundedRect(baseX, baseY, w, h, 10, true, false);
    ctx.strokeStyle = withAlpha(trim, 0.64);
    ctx.lineWidth = 3;
    roundedRect(baseX + 3, baseY + 3, w - 6, h - 6, 8, false, true);
    ctx.globalCompositeOperation = "screen";
    const meter = ctx.createLinearGradient(baseX + 16, baseY + 26, baseX + w - 18, baseY + 26);
    meter.addColorStop(0, withAlpha(glow, 0.22));
    meter.addColorStop(0.48, withAlpha(glow, 0.72));
    meter.addColorStop(1, "rgba(255,214,109,.58)");
    ctx.fillStyle = meter;
    roundedRect(baseX + 16, baseY + 22, w - 32, 12, 6, true, false);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = withAlpha(glow, 0.62);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const cx = baseX + 30 + i * 30 + variant * 4;
      ctx.beginPath();
      ctx.moveTo(cx, baseY + 48);
      ctx.lineTo(cx + 14, baseY + 62);
      ctx.lineTo(cx + 28, baseY + 62);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGateFrameAsset(x, y, w, h, palette, module = {}) {
    const gateV2 = images.missionGateV2;
    if (gateV2?.complete && gateV2.naturalWidth) {
      const targetW = Math.max(118, w + 38);
      const targetH = Math.max(178, h + 10);
      ctx.save();
      ctx.globalAlpha = module.open ? 0.42 : 0.94;
      ctx.drawImage(gateV2, x - (targetW - w) * 0.5, y - 6, targetW, targetH);
      ctx.restore();
      return;
    }
    const gateImage = images.cyberGateSheet;
    if (gateImage?.complete && gateImage.naturalWidth) {
      const frame = module.open ? 1 : 0;
      const targetW = Math.max(118, w + 56);
      const targetH = Math.max(164, h + 8);
      drawSheetCell(gateImage, 6, 1, frame, 0, x - (targetW - w) * 0.5, y - 4, targetW, targetH, module.open ? 0.64 : 0.78);
      return;
    }
    const trim = palette.trim || colors.gold;
    const glow = module.open ? colors.cyan : palette.glow || colors.purple;
    ctx.save();
    ctx.globalAlpha = module.open ? 0.34 : 0.62;
    const pillarW = Math.max(18, Math.min(28, w * 0.2));
    drawCircuitWallAsset(x - pillarW, y + 4, pillarW, h - 8, palette, 1);
    drawCircuitWallAsset(x + w, y + 4, pillarW, h - 8, palette, 2);
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = withAlpha(glow, module.open ? 0.46 : 0.62);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 20);
    ctx.lineTo(x + w - 8, y + 20);
    ctx.moveTo(x + 8, y + h - 20);
    ctx.lineTo(x + w - 8, y + h - 20);
    ctx.stroke();
    ctx.fillStyle = withAlpha(trim, 0.18);
    ctx.fillRect(x + w * 0.48, y + 38, w * 0.04, h - 76);
    ctx.restore();
  }

  function drawPortalHousingAsset(x, groundY, kind, palette, module = {}) {
    const portalV2 = images.missionPortalV2;
    if (portalV2?.complete && portalV2.naturalWidth) {
      const w = module.w || 150;
      const h = module.h || 220;
      const pulse = 0.8 + Math.sin((module.time || 0) * 4 + x * 0.01) * 0.12;
      ctx.save();
      ctx.shadowColor = kind === "exit" ? colors.cyan : colors.purple;
      ctx.shadowBlur = 12 + pulse * 10;
      ctx.globalAlpha = kind === "dormant" ? 0.56 : 0.94;
      ctx.drawImage(portalV2, x - w * 0.5, groundY - h, w, h);
      ctx.restore();
      return;
    }
    const trim = palette.trim || colors.gold;
    const glow = kind === "exit" ? colors.cyan : palette.glow || colors.purple;
    const w = module.w || 150;
    const h = module.h || 220;
    const left = x - w * 0.5;
    const top = groundY - h;
    const pulse = 0.76 + Math.sin((module.time || 0) * 4 + x * 0.01) * 0.12;
    ctx.save();
    ctx.globalAlpha = kind === "dormant" ? 0.52 : 0.78;
    const body = ctx.createLinearGradient(left, top, left + w, top + h);
    body.addColorStop(0, "#09070c");
    body.addColorStop(0.55, "#15101a");
    body.addColorStop(1, "#050306");
    ctx.fillStyle = body;
    roundedRect(left, top, w, h, 14, true, false);
    ctx.strokeStyle = withAlpha(trim, 0.7);
    ctx.lineWidth = 4;
    roundedRect(left + 5, top + 5, w - 10, h - 10, 12, false, true);
    ctx.globalCompositeOperation = "screen";
    const inner = ctx.createRadialGradient(x, top + h * 0.48, 8, x, top + h * 0.48, w * 0.72);
    inner.addColorStop(0, withAlpha(glow, 0.58 * pulse));
    inner.addColorStop(0.45, withAlpha(glow, 0.14));
    inner.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = inner;
    ctx.fillRect(left + 10, top + 14, w - 20, h - 28);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = withAlpha(glow, 0.82);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 22, top + h * 0.32);
    ctx.lineTo(x, top + h * 0.49);
    ctx.lineTo(x + 22, top + h * 0.32);
    ctx.moveTo(x, top + h * 0.49);
    ctx.lineTo(x, top + h * 0.72);
    ctx.stroke();
    ctx.fillStyle = withAlpha(glow, 0.6);
    roundedRect(x - 28, groundY - 34, 56, 20, 6, true, false);
    ctx.strokeStyle = withAlpha(trim, 0.42);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const yy = top + 72 + i * 32;
      ctx.beginPath();
      ctx.moveTo(left + 18, yy);
      ctx.lineTo(left + 42, yy);
      ctx.lineTo(left + 54, yy + 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlatforms(state) {
    const palette = state.level?.palette || { platform: "#282024", trim: colors.gold, glow: colors.purple };
    for (const plat of state.platforms) {
      if (plat.x + plat.w < state.cameraX - 120 || plat.x > state.cameraX + W + 120) continue;
      const g = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.h + 48);
      g.addColorStop(0, palette.platform);
      g.addColorStop(0.46, "#100c11");
      g.addColorStop(1, "#070608");
      ctx.fillStyle = g;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h + 26);
      drawPlatformTexture(state, plat);
      ctx.strokeStyle = "rgba(255,214,109,.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y + 2);
      ctx.lineTo(plat.x + plat.w, plat.y + 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,243,209,.2)";
      ctx.beginPath();
      ctx.moveTo(plat.x + 2, plat.y + 6);
      ctx.lineTo(plat.x + plat.w - 2, plat.y + 6);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.48)";
      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y + plat.h + 25);
      ctx.lineTo(plat.x + plat.w, plat.y + plat.h + 25);
      ctx.stroke();
      if (plat.kind === "conveyor") {
        ctx.strokeStyle = colors.pink;
        ctx.lineWidth = 2;
        for (let x = plat.x + ((state.levelTime * Math.abs(plat.conveyor || 80)) % 52); x < plat.x + plat.w; x += 52) {
          ctx.beginPath();
          ctx.moveTo(x, plat.y + 14);
          ctx.lineTo(x + Math.sign(plat.conveyor || 1) * 22, plat.y + 14);
          ctx.stroke();
        }
      }
      if (plat.kind === "moving" || plat.kind === "float") {
        ctx.fillStyle = "rgba(56,219,255,.18)";
        ctx.fillRect(plat.x, plat.y + plat.h + 8, plat.w, 8);
      }
      ctx.strokeStyle = "rgba(255,214,109,.28)";
      ctx.lineWidth = 1;
      for (let x = plat.x + 28; x < plat.x + plat.w; x += 92) {
        ctx.strokeRect(x, plat.y + 10, 42, 12);
        ctx.beginPath();
        ctx.moveTo(x + 42, plat.y + 16);
        ctx.lineTo(Math.min(plat.x + plat.w, x + 78), plat.y + 16);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(122, 93, 42, .5)";
      for (let x = plat.x + 62; x < plat.x + plat.w; x += 180) {
        ctx.fillRect(x, plat.y + plat.h - 2, 8, 36);
        ctx.fillRect(x + 12, plat.y + plat.h + 10, 6, 25);
      }
    }
  }

  function drawPlatformTexture(state, plat) {
    const image = images[state.level?.tiles];
    if (!image?.complete || !image.naturalWidth) return false;
    const tileW = 256;
    const textureIndex = Math.abs(Math.floor((plat.x / 260) + state.level.id + plat.kind.length)) % PLATFORM_TEXTURE_RECTS.length;
    const [sx, sy, sw, sh] = PLATFORM_TEXTURE_RECTS[textureIndex];
    ctx.save();
    ctx.globalAlpha = plat.kind === "entry" || plat.kind === "chamber" ? 0.86 : 0.76;
    ctx.imageSmoothingEnabled = true;
    for (let x = plat.x; x < plat.x + plat.w; x += tileW) {
      const w = Math.min(tileW, plat.x + plat.w - x);
      ctx.drawImage(image, sx, sy, sw, sh, x, plat.y - 18, w, plat.h + 60);
    }
    ctx.globalCompositeOperation = "multiply";
    const shade = ctx.createLinearGradient(0, plat.y - 6, 0, plat.y + plat.h + 44);
    shade.addColorStop(0, "rgba(255,255,255,0)");
    shade.addColorStop(0.44, "rgba(0,0,0,0.08)");
    shade.addColorStop(1, "rgba(0,0,0,0.58)");
    ctx.fillStyle = shade;
    ctx.fillRect(plat.x, plat.y - 6, plat.w, plat.h + 52);
    ctx.restore();
    return true;
  }

  function drawVaultPortalAsset(state, portal) {
    const pulse = 0.62 + Math.sin(state.time * 4.8) * 0.18;
    const color = portal.type === "exit" ? colors.cyan : colors.purple;
    const accent = portal.type === "exit" ? colors.gold : colors.pink;
    const portalImage = images.missionPortalV2;
    const arenaGate = images.arenaGateV1;
    const x = portal.x;
    const supportY = supportYAt(state, x, portal.y) ?? portal.y;
    const groundY = supportY + (isUnderground(state) ? 9 : 7);
    // The portal sheet has 42 px of content below its local origin. Keep that
    // edge on the resolved support instead of leaving the whole prop floating.
    const y = groundY - 42;

    if (!isUnderground(state)) {
      const gateImage = images[portal.type === "exit" ? "undergroundGateOpen" : "undergroundGatePowered"];
      if (gateImage?.complete && gateImage.naturalWidth) {
        const gateW = portal.type === "exit" ? 188 : 176;
        const gateH = 326;
        drawAnchoredTechBase(x, groundY, gateW * 0.86, {
          glow: portal.type === "exit" ? colors.cyan : colors.purple,
          trim: colors.gold,
          height: 24,
          depth: 14
        });
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowColor = portal.type === "exit" ? "rgba(56,219,255,.52)" : "rgba(165,34,255,.48)";
        ctx.shadowBlur = 14 + pulse * 10;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(gateImage, 58, 0, 396, 512, x - gateW * 0.5, groundY - gateH, gateW, gateH);
        ctx.shadowBlur = 0;
        ctx.font = "900 10px 'Arial Black', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffe88a";
        ctx.fillText(portal.label, x, groundY - 10);
        ctx.restore();
        return;
      }
    }

    if (isUnderground(state) && (portal.type === "cell-lock" || portal.type === "exit")) {
      const cells = state.undergroundCells?.[undergroundKey(state)] || 0;
      const imageKey = portal.type === "exit"
        ? "undergroundGateOpen"
        : cells > 0
          ? "undergroundGatePowered"
          : "undergroundGateLocked";
      const gateImage = images[imageKey];
      if (gateImage?.complete && gateImage.naturalWidth) {
        const gateW = portal.type === "exit" ? 184 : 176;
        const gateH = 326;
        drawAnchoredTechBase(x, groundY, gateW * 0.86, {
          glow: portal.type === "exit" ? colors.cyan : colors.purple,
          trim: colors.gold,
          height: 24,
          depth: 14
        });
        ctx.save();
        ctx.globalAlpha = 0.99;
        ctx.shadowColor = portal.type === "exit" ? "rgba(56,219,255,.48)" : "rgba(165,34,255,.48)";
        ctx.shadowBlur = 14 + pulse * 12;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(gateImage, 58, 0, 396, 512, x - gateW * 0.5, groundY - gateH, gateW, gateH);
        ctx.shadowBlur = 0;
        ctx.font = "900 10px 'Arial Black', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffe88a";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 4;
        ctx.fillText(portal.label, x, groundY - 10);
        ctx.restore();
        return;
      }
    }

    if (portal.type === "cell-lock") {
      ctx.save();
      const gateW = 104;
      const gateH = 326;
      drawAnchoredTechBase(x, groundY, gateW * 0.92, {
        glow: colors.purple,
        trim: colors.gold,
        height: 24,
        depth: 14
      });
      ctx.shadowColor = colors.purple;
      ctx.shadowBlur = 10 + pulse * 12;
      if (arenaGate?.complete && arenaGate.naturalWidth) {
        drawSheetCellFit(arenaGate, 1, 1, 0, 0, x, groundY, gateW, gateH, 0.98, {
          anchor: "bottom",
          sourceInset: 2
        });
      } else {
        ctx.fillStyle = "#09070c";
        ctx.strokeStyle = colors.gold;
        ctx.lineWidth = 4;
        roundedRect(x - gateW * 0.5, groundY - gateH, gateW, gateH, 12, true, true);
      }
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(255,79,154,${0.34 + pulse * 0.34})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, groundY - gateH * 0.69);
      ctx.lineTo(x, groundY - gateH * 0.31);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      ctx.font = "900 10px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffe88a";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 4;
      ctx.fillText(portal.label, x, groundY + 18);
      ctx.restore();
      return;
    }

    drawAnchoredTechBase(x, groundY, 128, {
      glow: color,
      trim: colors.gold,
      height: 24,
      depth: 15
    });
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 + pulse * 18;

    const halo = ctx.createRadialGradient(0, -24, 8, 0, -24, 92);
    halo.addColorStop(0, portal.type === "exit" ? "rgba(56,219,255,0.58)" : "rgba(255,79,154,0.52)");
    halo.addColorStop(0.45, "rgba(165,34,255,0.2)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(0, -24, 82, 116, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    const core = ctx.createRadialGradient(0, -35, 4, 0, -35, 55);
    core.addColorStop(0, withAlpha(color, 0.42 + pulse * 0.18));
    core.addColorStop(0.62, withAlpha(color, 0.14));
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, -35, 38, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    if (portalImage?.complete && portalImage.naturalWidth) {
      ctx.globalAlpha = 0.98;
      ctx.drawImage(portalImage, -72, -154, 144, 196);
    } else {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, -35, 45, 88, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.font = "900 10px 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe88a";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(portal.label, 0, 58);
    ctx.restore();
  }

  function drawAreaPortals(state) {
    const area = activeArea(state);
    const underground = state.level.underground;
    if (!underground) return;
    const exitReady = undergroundExitReady(state);
    const portals = isUnderground(state)
      ? [{
          type: exitReady ? "exit" : "cell-lock",
          x: area.exitX,
          y: area.exitY || 620,
          label: exitReady ? "RETURN" : "3 CELLS"
        }]
      : [{ type: "entrance", x: underground.entrance.x, y: underground.entrance.y || 620, label: "UNDER" }];
    for (const portal of portals) {
      drawVaultPortalAsset(state, portal);
    }
  }

  function drawGate(state) {
    if (isUnderground(state)) return;
    const openLift = 0;
    const pulse = 0.55 + Math.sin(state.gatePulse * 6) * 0.18;
    const gx = gateX(state);
    const gateGroundY = supportYAt(state, gx + 45, 620) ?? 620;
    const ready = gateReady(state);
    const stateGate = images[state.gateOpen ? "undergroundGateOpen" : ready ? "undergroundGatePowered" : "undergroundGateLocked"];
    if (stateGate?.complete && stateGate.naturalWidth) {
      const targetW = 184;
      const targetH = 326;
      drawAnchoredTechBase(gx + 45, gateGroundY, targetW * 0.86, {
        glow: ready || state.gateOpen ? colors.cyan : colors.purple,
        trim: colors.gold,
        height: 26,
        depth: 16
      });
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.shadowColor = state.gateOpen ? colors.cyan : ready ? colors.cyan : colors.purple;
      ctx.shadowBlur = 10 + pulse * 12;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(stateGate, 58, 0, 396, 512, gx + 45 - targetW * 0.5, gateGroundY - targetH, targetW, targetH);
      ctx.restore();
      return;
    }
    const gateV2 = images.missionGateV2;
    if (gateV2?.complete && gateV2.naturalWidth) {
      const targetW = 166;
      const targetH = 252;
      drawAnchoredTechBase(gx + 45, gateGroundY, targetW * 0.82, {
        glow: ready || state.gateOpen ? colors.cyan : colors.purple,
        trim: colors.gold,
        height: 26,
        depth: 16
      });
      ctx.save();
      ctx.globalAlpha = state.gateOpen ? 0.72 : 0.98;
      ctx.shadowColor = state.gateOpen ? colors.cyan : ready ? colors.cyan : colors.purple;
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.drawImage(gateV2, gx - 38, gateGroundY - targetH - openLift, targetW, targetH);
      ctx.restore();
      if (!state.gateOpen) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = ready ? `rgba(56,219,255,${pulse * 0.88})` : `rgba(255,79,154,${pulse * 0.68})`;
        ctx.lineWidth = ready ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(gx + 45, gateGroundY - targetH + 42);
        ctx.lineTo(gx + 45, gateGroundY - 42);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const cyberGateImage = images.cyberGateSheet;
    if (cyberGateImage?.complete && cyberGateImage.naturalWidth) {
      const ready = gateReady(state);
      const frame = state.gateOpen ? 1 : ready ? 0 : 5;
      const targetW = 168;
      const targetH = 252;
      drawAnchoredTechBase(gx + 43, gateGroundY, targetW * 0.82, {
        glow: ready || state.gateOpen ? colors.cyan : colors.purple,
        trim: colors.gold,
        height: 26,
        depth: 16
      });
      drawSheetCell(cyberGateImage, 6, 1, frame, 0, gx - 40, gateGroundY - targetH - openLift, targetW, targetH, 0.98);
      if (!state.gateOpen) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = ready ? `rgba(56,219,255,${pulse * 0.9})` : `rgba(255,79,154,${pulse})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gx + 43, gateGroundY - targetH + 30);
        ctx.lineTo(gx + 43, gateGroundY - 22);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const gateImage = images.missionGate;
    if (gateImage?.complete && gateImage.naturalWidth) {
      const ready = gateReady(state);
      const frame = state.gateOpen ? Math.floor(state.time * 10) % 4 : ready ? Math.floor(state.time * 7) % 4 : Math.floor(state.time * 2) % 2;
      drawAnchoredTechBase(gx + 46, gateGroundY, 126, {
        glow: ready || state.gateOpen ? colors.cyan : colors.purple,
        trim: colors.gold,
        height: 26,
        depth: 16
      });
      drawSheetCell(gateImage, 4, 1, frame, 0, gx - 26, gateGroundY - 320 - openLift, 144, 320, 0.98);
      if (!state.gateOpen) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = ready ? `rgba(56,219,255,${pulse})` : `rgba(255,79,154,${pulse})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(gx + 46, gateGroundY - 282);
        ctx.lineTo(gx + 46, gateGroundY - 10);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    drawAnchoredTechBase(gx + 46, gateGroundY, 118, {
      glow: gateReady(state) || state.gateOpen ? colors.cyan : colors.purple,
      trim: colors.gold,
      height: 26,
      depth: 16
    });
    ctx.save();
    ctx.translate(gx, gateGroundY - 292 - openLift);
    ctx.fillStyle = "rgba(6,5,8,.92)";
    ctx.fillRect(0, 0, 92, 292);
    ctx.strokeStyle = state.gateOpen ? colors.cyan : colors.gold;
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 6, 82, 282);
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = gateReady(state) ? colors.cyan : colors.pink;
    ctx.lineWidth = 3;
    for (let y = 38; y < 250; y += 42) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(44, y);
      ctx.lineTo(70, y + 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawExtraction(state) {
    if (!state.extractionOpen) return;
    const t = state.time;
    const x = extractionX(state);
    const groundY = supportYAt(state, x, 620) ?? 620;
    const y = groundY - 138;
    const portalImage = images.undergroundGateOpen;
    drawAnchoredTechBase(x, groundY, 178, {
      glow: colors.pink,
      trim: colors.gold,
      height: 26,
      depth: 15
    });
    if (portalImage?.complete && portalImage.naturalWidth) {
      const portalW = 196;
      const portalH = 344;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.shadowColor = "rgba(255,79,154,0.72)";
      ctx.shadowBlur = 26;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(portalImage, 58, 0, 396, 512, x - portalW * 0.5, groundY - portalH, portalW, portalH);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.shadowColor = "rgba(255,79,154,0.72)";
    ctx.shadowBlur = 26;
    ctx.globalCompositeOperation = "screen";
    const outer = ctx.createRadialGradient(x, y, 10, x, y, 138);
    outer.addColorStop(0, "rgba(255,243,209,0.82)");
    outer.addColorStop(0.28, "rgba(255,79,154,0.58)");
    outer.addColorStop(0.7, "rgba(56,219,255,0.18)");
    outer.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.ellipse(x, y, 104, 148, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(5,6,12,0.72)";
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 4;
    roundedRect(x - 82, y - 138, 164, 276, 34, true, true);
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(x, y, 12, x, y, 118 + Math.sin(t * 4) * 8);
    g.addColorStop(0, "rgba(255,243,209,.95)");
    g.addColorStop(0.25, "rgba(255,79,154,.78)");
    g.addColorStop(0.58, "rgba(56,219,255,.34)");
    g.addColorStop(1, "rgba(86,28,180,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 88, 132, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x, y, 70 + Math.sin(t * 5) * 8, 112, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawArenaLockGates(state) {
    if (!arenaLockActive(state)) return;
    const lock = state.arenaLock;
    const pulse = 0.45 + Math.sin(state.time * 6) * 0.18;
    for (const x of [lock.left, lock.right]) {
      const groundY = supportYAt(state, x, 620) ?? 620;
      const arenaGate = images.arenaGateV1;
      if (arenaGate?.complete && arenaGate.naturalWidth) {
        drawAnchoredTechBase(x, groundY, 106, {
          glow: colors.purple,
          trim: colors.gold,
          height: 22,
          depth: 12
        });
        ctx.save();
        ctx.shadowColor = colors.purple;
        ctx.shadowBlur = 10 + pulse * 14;
        drawSheetCellFit(arenaGate, 1, 1, 0, 0, x, groundY, 116, 390, 0.96, {
          anchor: "bottom",
          sourceInset: 2
        });
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(255,79,154," + (0.08 + pulse * 0.1) + ")";
        ctx.beginPath();
        ctx.ellipse(x, groundY - 194, 34, 104, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createLinearGradient(x, 210, x, 640);
      g.addColorStop(0, `rgba(56,219,255,${0.02 + pulse * 0.1})`);
      g.addColorStop(0.45, `rgba(255,214,109,${0.16 + pulse * 0.18})`);
      g.addColorStop(1, "rgba(165,34,255,0.08)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 10, 250, 20, 390);
      ctx.strokeStyle = `rgba(255,214,109,${0.55 + pulse * 0.35})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 270);
      ctx.lineTo(x, 632);
      ctx.stroke();
      ctx.restore();

      const artAlpha = 0.64 + pulse * 0.4;
      const segmentDrawn = drawGameplayFxCell(GAMEPLAY_FX.reward.gateSegment, x, 446, 92, 392, artAlpha, {
        composite: "screen",
        shadowColor: colors.purple,
        shadowBlur: 22,
        sourceInset: 8
      });
      drawGameplayFxCell(GAMEPLAY_FX.warning.lockNode, x, 250, 86, 86, 0.82 + pulse * 0.16, {
        composite: "screen",
        shadowColor: colors.gold,
        shadowBlur: 18,
        sourceInset: 10
      });
      if (!segmentDrawn) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = `rgba(56,219,255,${0.45 + pulse * 0.28})`;
        ctx.lineWidth = 2;
        for (let y = 310; y < 620; y += 58) {
          ctx.beginPath();
          ctx.moveTo(x - 26, y);
          ctx.lineTo(x + 26, y + 24);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  function drawLotteryTerminal(state) {
    const cfg = lotteryTerminalConfig(state);
    if (cfg.x < state.cameraX - 140 || cfg.x > state.cameraX + W + 140) return;
    const unlocked = lotteryTerminalUnlocked(state);
    if (!unlocked) return;
    const claimed = Boolean(currentLevelTicket(state));
    const inRange = state.terminal.inRange;
    const pulse = settings.reducedMotion ? 0 : Math.sin(state.time * 4) * 0.5 + 0.5;
    const x = cfg.x;
    const y = cfg.y;
    const groundY = supportYAt(state, x, y) ?? y + 72;
    const kiosk = images.lotteryKiosk;

    if (kiosk?.complete && kiosk.naturalWidth) {
      const kioskW = 146;
      const kioskH = 206;
      drawAnchoredTechBase(x, groundY, kioskW * 0.82, {
        glow: claimed ? colors.green : inRange ? colors.cyan : colors.purple,
        trim: colors.gold,
        height: 22,
        depth: 13
      });
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = true;
      ctx.shadowColor = claimed ? colors.green : inRange ? colors.cyan : colors.purple;
      ctx.shadowBlur = inRange ? 24 : 14;
      ctx.drawImage(kiosk, x - kioskW * 0.5, groundY - kioskH, kioskW, kioskH);
      if (claimed) {
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = colors.green;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x - 16, groundY - 126);
        ctx.lineTo(x - 4, groundY - 114);
        ctx.lineTo(x + 22, groundY - 144);
        ctx.stroke();
      }
      ctx.restore();
      if (inRange && !claimed) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "900 11px 'Arial Black', sans-serif";
        ctx.fillStyle = colors.cream;
        ctx.shadowColor = colors.cyan;
        ctx.shadowBlur = 10;
        ctx.fillText("USE", x, groundY - kioskH - 12);
        ctx.restore();
      }
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = unlocked ? 1 : 0.62;
    ctx.fillStyle = "rgba(4,4,8,.9)";
    ctx.strokeStyle = claimed ? colors.green : inRange ? colors.cyan : unlocked ? colors.gold : colors.purple;
    ctx.lineWidth = inRange ? 4 : 3;
    roundedRect(-54, -92, 108, 126, 10, true, true);
    ctx.fillStyle = "rgba(255,214,109,.12)";
    ctx.fillRect(-42, -78, 84, 12);
    ctx.fillStyle = unlocked ? "rgba(56,219,255,.18)" : "rgba(255,79,154,.15)";
    ctx.strokeStyle = unlocked ? colors.cyan : colors.pink;
    roundedRect(-36, -55, 72, 46, 7, true, true);
    const terminalArt = drawGameplayFxCell(GAMEPLAY_FX.reward.terminal, 0, -34, 86, 86, unlocked ? 0.94 : 0.42, {
      composite: unlocked && !claimed ? "screen" : "source-over",
      shadowColor: claimed ? colors.green : unlocked ? colors.cyan : colors.pink,
      shadowBlur: 16,
      sourceInset: 8
    });
    if (terminalArt && claimed) {
      ctx.strokeStyle = colors.green;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-16, -29);
      ctx.lineTo(-5, -18);
      ctx.lineTo(19, -44);
      ctx.stroke();
    }
    if (!terminalArt) {
      ctx.fillStyle = claimed ? colors.green : unlocked ? colors.gold : colors.pink;
      ctx.beginPath();
      if (claimed) {
        ctx.moveTo(-16, -30);
        ctx.lineTo(-4, -18);
        ctx.lineTo(20, -44);
      } else {
        ctx.arc(0, -32, 12 + pulse * 2, 0, Math.PI * 2);
      }
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = claimed ? 6 : 2;
      claimed ? ctx.stroke() : ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,214,109,.5)";
    ctx.lineWidth = 2;
    for (let i = -30; i <= 30; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, -4);
      ctx.lineTo(i + 8, 20);
      ctx.stroke();
    }
    if (unlocked && !claimed) {
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(56,219,255,${0.18 + pulse * 0.28})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -28, 74 + pulse * 8, 84 + pulse * 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (unlocked && inRange && !claimed) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "900 18px system-ui";
      ctx.fillStyle = colors.cyan;
      ctx.strokeStyle = "rgba(0,0,0,.72)";
      ctx.lineWidth = 5;
      ctx.strokeText("X / USE", x, y - 118);
      ctx.fillText("X / USE", x, y - 118);
      ctx.restore();
    }
  }

  function drawAreaTransition(state) {
    if (!state.areaTransition) return;
    const alpha = clamp(state.areaTransition / 0.34, 0, 1);
    ctx.save();
    ctx.fillStyle = `rgba(3,2,8,${0.72 * alpha})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,79,218,${0.14 * alpha})`;
    ctx.fillRect(0, H * 0.46 - 24, W, 48);
    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff4bd";
    ctx.font = "900 30px 'Arial Black', sans-serif";
    ctx.fillText(state.areaNotice || currentObjectiveText(state), W * 0.5, H * 0.48);
    ctx.font = "900 12px 'Arial Black', sans-serif";
    ctx.fillStyle = colors.cyan;
    ctx.fillText(isUnderground(state) ? "UNDERGROUND SECTOR" : "SURFACE SECTOR", W * 0.5, H * 0.48 + 28);
    ctx.restore();
  }

  function drawToast(state) {
    if (!state.toastTimer || !state.toast) return;
    const alpha = clamp(state.toastTimer / 0.35, 0, 1);
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.textAlign = "center";
    ctx.font = "900 16px system-ui";
    const width = Math.min(760, ctx.measureText(state.toast).width + 48);
    const x = W * 0.5 - width * 0.5;
    const y = 142;
    ctx.fillStyle = "rgba(4,3,6,.86)";
    ctx.strokeStyle = "rgba(56,219,255,.58)";
    roundedRect(x, y, width, 42, 8, true, true);
    ctx.fillStyle = colors.gold;
    ctx.fillText(state.toast, W * 0.5, y + 27);
    ctx.restore();
  }

  function drawPickups(state) {
    for (const pickup of state.pickups) {
      if (pickup.taken) continue;
      const y = pickup.y + Math.sin(pickup.bob) * 8;
      const displayR = pickupDisplayRadius(pickup);
      const visualR = displayR * (pickup.type === "weapon" ? 2.95 : pickup.type === "key" ? 2.9 : 2.8);
      if (!visualBoundsFullyInView(state, pickup.x - visualR, pickup.x + visualR, 6)) continue;
      if (drawPickupSprite(pickup.type, pickup.x, y, displayR, state.time, pickup.bob)) continue;
      if (pickup.type === "shard") drawBrokenHeartShard(pickup.x, y, displayR, pickup.bob);
      if (pickup.type === "key") drawKey(pickup.x, y, displayR);
      if (pickup.type === "health") drawHeart(pickup.x, y, displayR, colors.pink);
      if (pickup.type === "overdrive") drawOverdrivePickup(pickup.x, y, displayR);
      if (pickup.type === "cell") drawPowerCell(pickup.x, y, displayR);
      if (pickup.type === "shield") drawShieldPickup(pickup.x, y, displayR);
      if (pickup.type === "weapon") drawWeaponPickup(pickup.x, y, displayR, pickup.weapon);
    }
  }

  function pickupDisplayRadius(pickup) {
    return pickup.r * (PICKUP_DRAW_SCALE[pickup.type] || 0.62);
  }

  function drawPowerCell(x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    const pulse = 0.82 + Math.sin((run?.time || 0) * 5.2 + x * 0.02) * 0.12;
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 3.3);
    glow.addColorStop(0, `rgba(255,79,218,${0.52 * pulse})`);
    glow.addColorStop(0.45, `rgba(56,219,255,${0.24 * pulse})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(8,7,12,.94)";
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3;
    roundedRect(-r * 1.15, -r * 1.15, r * 2.3, r * 2.3, 8, true, true);
    ctx.strokeStyle = colors.purple;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, 0);
    ctx.lineTo(0, -r * 0.52);
    ctx.lineTo(r * 0.45, 0);
    ctx.lineTo(0, r * 0.52);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawShieldPickup(x, y, r) {
    if (drawPowerupPackIcon("shield", x, y, r)) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = "screen";
    const pulse = 0.85 + Math.sin((run?.time || 0) * 5 + x * 0.01) * 0.1;
    drawGameplayFxCell(GAMEPLAY_FX.weapon.shield, 0, 0, r * 5.1, r * 5.1, 0.88 * pulse, {
      shadowColor: colors.cyan,
      shadowBlur: 18,
      sourceInset: 8
    });
    ctx.restore();
  }

  function drawWeaponPickup(x, y, r, weapon = "rapid") {
    const meta = WEAPON_META[weapon] || WEAPON_META.rapid;
    if (drawPowerupPackIcon(weapon, x, y, r)) return;
    const assetSize = r * 4.72;
    const wobble = Math.sin((run?.time || 0) * 4 + x * 0.01) * 0.06;
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 3.2);
    glow.addColorStop(0, meta.color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(wobble);
    const drawn = drawGameplayFxCell(meta.fx || GAMEPLAY_FX.weapon.rapid, 0, 0, assetSize, assetSize * 0.9, 0.98, {
      shadowColor: meta.color,
      shadowBlur: 18,
      sourceInset: 0
    });
    if (drawn) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = "rgba(5,4,8,.9)";
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 3;
    roundedRect(-r * 1.45, -r * 0.85, r * 2.9, r * 1.7, 7, true, true);
    ctx.fillStyle = meta.color;
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(meta.label.slice(0, 3), 0, 4);
    ctx.restore();
  }

  function drawPickupSprite(type, x, y, r, time, bob) {
    // Keys and common pickups use procedural art so every frame stays crisp and readable.
    if (type !== "legacyKeySprite") return false;
    const row = PICKUP_SPRITE_ROWS[type];
    const image = images.missionCollectibles;
    if (row === undefined || !image?.complete || !image.naturalWidth) return false;
    const frame = Math.floor((time * 8 + bob) % 8);
    const size = r * (type === "key" ? 4.25 : type === "health" ? 4.05 : 4.2);
    const spin = settings.reducedMotion ? 0 : Math.sin(time * 4 + bob) * 2;
    ctx.save();
    ctx.translate(x, y);
    if (spin) ctx.rotate((spin * Math.PI) / 180);
    drawSheetCell(image, 8, 4, frame, row, -size * 0.5, -size * 0.5, size, size, 0.98);
    ctx.restore();
    return true;
  }

  function drawBrokenHeartShard(x, y, r, seed = 0) {
    const side = Math.floor(seed + x / 54) % 2 === 0 ? -1 : 1;
    const pulse = 0.9 + Math.sin((run?.time || 0) * 5.4 + seed) * 0.08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(side, 1);

    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.35);
    glow.addColorStop(0, `rgba(255,255,255,${0.34 * pulse})`);
    glow.addColorStop(0.32, `rgba(255,79,154,${0.45 * pulse})`);
    glow.addColorStop(1, "rgba(255,79,154,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.25, 0, Math.PI * 2);
    ctx.fill();

    const fill = ctx.createLinearGradient(-r, -r, r * 0.2, r);
    fill.addColorStop(0, "#fff1f8");
    fill.addColorStop(0.28, "#ff7fbd");
    fill.addColorStop(1, "#d61870");
    ctx.fillStyle = fill;
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = Math.max(1.8, r * 0.17);
    ctx.shadowColor = colors.pink;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0.08 * r, 0.94 * r);
    ctx.bezierCurveTo(-0.28 * r, 0.58 * r, -0.98 * r, 0.12 * r, -0.94 * r, -0.42 * r);
    ctx.bezierCurveTo(-0.9 * r, -1.02 * r, -0.28 * r, -1.14 * r, 0.02 * r, -0.7 * r);
    ctx.lineTo(-0.16 * r, -0.38 * r);
    ctx.lineTo(0.12 * r, -0.12 * r);
    ctx.lineTo(-0.1 * r, 0.16 * r);
    ctx.lineTo(0.14 * r, 0.42 * r);
    ctx.lineTo(-0.05 * r, 0.66 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,244,255,.92)";
    ctx.lineWidth = Math.max(1.2, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(-0.16 * r, -0.38 * r);
    ctx.lineTo(0.12 * r, -0.12 * r);
    ctx.lineTo(-0.1 * r, 0.16 * r);
    ctx.lineTo(0.14 * r, 0.42 * r);
    ctx.stroke();
    ctx.restore();
  }

  function drawKey(x, y, r) {
    const t = run?.time || 0;
    const pulse = 0.82 + Math.sin(t * 5.5 + x * 0.018) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.18 + Math.sin(t * 2.4 + x * 0.01) * 0.05);
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.9);
    glow.addColorStop(0, withAlpha(colors.gold, 0.42 * pulse));
    glow.addColorStop(0.45, withAlpha(colors.cyan, 0.16 * pulse));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(7,6,10,.94)";
    ctx.strokeStyle = "rgba(255,214,109,.92)";
    ctx.lineWidth = Math.max(2, r * 0.16);
    roundedRect(-r * 1.42, -r * 0.82, r * 2.84, r * 1.64, r * 0.22, true, true);
    ctx.shadowColor = colors.gold;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = colors.gold;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, r * 0.2);
    ctx.beginPath();
    ctx.arc(-r * 0.54, -r * 0.08, r * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, -r * 0.05);
    ctx.lineTo(r * 1.04, r * 0.1);
    ctx.moveTo(r * 0.62, r * 0.04);
    ctx.lineTo(r * 0.62, r * 0.48);
    ctx.moveTo(r * 0.86, r * 0.08);
    ctx.lineTo(r * 0.86, r * 0.36);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(56,219,255,.72)";
    ctx.lineWidth = Math.max(1.2, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(-r * 1.03, -r * 0.56);
    ctx.lineTo(-r * 0.64, -r * 0.56);
    ctx.moveTo(r * 0.24, -r * 0.5);
    ctx.lineTo(r * 0.84, -r * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawHeart(x, y, r, color) {
    if (drawPowerupPackIcon("health", x, y, r)) return;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.8);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.32, color);
    g.addColorStop(1, "rgba(255,79,154,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.strokeStyle = colors.cream;
    ctx.lineWidth = 2;
    ctx.beginPath();
    heartPath(x, y + r * 0.1, r * 0.72, 1);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawOverdrivePickup(x, y, r) {
    if (drawPowerupPackIcon("overdrive", x, y, r)) return;
    ctx.save();
    ctx.strokeStyle = colors.purple;
    ctx.fillStyle = "rgba(165,34,255,.24)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(x + 2, y - r);
    ctx.lineTo(x - r * 0.5, y + 2);
    ctx.lineTo(x + r * 0.12, y + 2);
    ctx.lineTo(x - 2, y + r);
    ctx.lineTo(x + r * 0.58, y - 2);
    ctx.lineTo(x - r * 0.08, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPowerupPackIcon(type, x, y, r) {
    const cell = POWERUP_PACK[type];
    const image = images.powerupPack;
    if (!cell || !image?.complete || !image.naturalWidth) return false;
    const t = run?.time || 0;
    const pulse = 0.82 + Math.sin(t * 5 + x * 0.013) * 0.12;
    const size = r * (type === "spread" ? 4.5 : type === "beam" ? 4.42 : 4.28);
    ctx.save();
    ctx.translate(x, y);
    if (!settings.reducedMotion) ctx.rotate(Math.sin(t * 3.2 + x * 0.009) * 0.035);
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.9);
    glow.addColorStop(0, withAlpha(cell.color, 0.32 * pulse));
    glow.addColorStop(0.62, withAlpha(cell.color, 0.12));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(6,5,10,.92)";
    ctx.strokeStyle = withAlpha(colors.gold, 0.86);
    ctx.lineWidth = Math.max(2, r * 0.13);
    roundedRect(-r * 1.52, -r * 1.08, r * 3.04, r * 2.16, r * 0.3, true, true);
    ctx.strokeStyle = withAlpha(cell.color, 0.78);
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    roundedRect(-r * 1.2, -r * 0.78, r * 2.4, r * 1.56, r * 0.22, false, true);
    ctx.shadowColor = cell.color;
    ctx.shadowBlur = 10 + pulse * 8;
    const drawn = drawSheetCellFit(image, 3, 2, cell.frame, cell.row, 0, 0, size, size, 0.98, { sourceInset: 3 });
    ctx.restore();
    return drawn;
  }

  function drawLevelHazards(state) {
    for (const hazard of state.levelHazards) {
      const active = isLevelHazardActive(state, hazard);
      const warning = isLevelHazardWarning(state, hazard);
      const box = levelHazardBox(hazard);
      ctx.save();
      drawVaultHazardAsset(box.x, box.y, box.w, box.h, {
        type: hazard.type,
        active,
        warning,
        alpha: active ? 0.95 : warning ? 0.7 : 0.34,
        pulse: Math.sin(state.time * 8 + (hazard.phase || 0)) * 0.5 + 0.5
      });
      ctx.restore();
    }
  }

  function drawHazards(state) {
    for (const hazard of state.hazards) {
      const active = hazard.charge <= 0;
      const y = hazard.beam ? hazard.y : hazard.y - hazard.h;
      const pulse = Math.sin(state.time * 10 + hazard.x * 0.01) * 0.5 + 0.5;
      ctx.save();
      drawVaultHazardAsset(hazard.x, y, hazard.w, hazard.h, {
        type: hazard.beam ? "beam" : "floor",
        active,
        warning: !active,
        alpha: active ? 0.94 : 0.7,
        pulse
      });
      if (active && !hazard.beam) {
        const g = ctx.createLinearGradient(0, hazard.y - 220, 0, hazard.y);
        g.addColorStop(0, "rgba(255,79,154,0)");
        g.addColorStop(0.74, "rgba(165,34,255,.05)");
        g.addColorStop(1, "rgba(255,79,154,.2)");
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = g;
        ctx.fillRect(hazard.x, hazard.y - 220, hazard.w, 220);
      }
      ctx.restore();
    }
  }

  function drawVaultHazardAsset(x, y, w, h, options = {}) {
    const type = options.type || "floor";
    const active = !!options.active;
    const warning = !!options.warning;
    const pulse = options.pulse || 0;
    const alpha = options.alpha == null ? 1 : options.alpha;
    const trim = active ? colors.pink : colors.gold;
    const core = active ? colors.pink : colors.gold;
    const shell = "rgba(7,6,12,.9)";
    const rail = "rgba(255,214,109,.72)";
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    if (type === "beam" || type === "floor") {
      const image = images[active ? "floorLaserActive" : warning ? "floorLaserCharge" : "floorLaserDormant"];
      if (image?.complete && image.naturalWidth) {
        const visualH = clamp(w / 3.7, 44, 130);
        const drawY = y + h - visualH;
        drawAnchoredTechBase(x + w * 0.5, y + h, Math.min(w, 280), {
          glow: active ? colors.pink : warning ? colors.gold : colors.purple,
          trim: colors.gold,
          height: 16,
          depth: 8,
          alpha: 0.92
        });
        if (active) {
          ctx.globalCompositeOperation = "screen";
          const bloom = ctx.createLinearGradient(x, 0, x + w, 0);
          bloom.addColorStop(0, "rgba(165,34,255,0)");
          bloom.addColorStop(0.5, `rgba(255,79,154,${0.18 + pulse * 0.12})`);
          bloom.addColorStop(1, "rgba(165,34,255,0)");
          ctx.fillStyle = bloom;
          ctx.fillRect(x - 12, drawY + visualH * 0.42, w + 24, visualH * 0.42);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.imageSmoothingEnabled = true;
        ctx.shadowColor = active ? "rgba(255,79,154,.68)" : warning ? "rgba(255,214,109,.46)" : "rgba(165,34,255,.28)";
        ctx.shadowBlur = active ? 22 : warning ? 14 : 8;
        ctx.drawImage(image, 0, 270, 384, 114, x, drawY, w, visualH);
        ctx.restore();
        return;
      }
    }
    if (type === "laser") {
      const cx = x + w * 0.5;
      const image = images.verticalLaser;
      if (image?.complete && image.naturalWidth) {
        const frame = active ? 2 : warning ? 1 : 0;
        const cellW = image.naturalWidth / 3;
        const cellH = image.naturalHeight;
        const groundY = y + h;
        const drawH = h;
        const drawW = drawH * (cellW / cellH);
        drawAnchoredTechBase(cx, groundY, Math.max(72, drawW * 0.82), {
          glow: active ? colors.pink : warning ? colors.gold : colors.purple,
          trim: colors.gold,
          height: 18,
          depth: 10,
          alpha: 0.95
        });
        ctx.imageSmoothingEnabled = true;
        ctx.shadowColor = active ? "rgba(255,79,154,.7)" : warning ? "rgba(255,214,109,.5)" : "rgba(165,34,255,.28)";
        ctx.shadowBlur = active ? 24 : warning ? 16 : 9;
        ctx.drawImage(image, frame * cellW, 0, cellW, cellH, cx - drawW * 0.5, groundY - drawH, drawW, drawH);
        ctx.restore();
        return;
      }
      drawAnchoredTechBase(cx, y + h, Math.max(70, w * 1.55), {
        glow: active ? colors.pink : warning ? colors.gold : colors.purple,
        trim: colors.gold,
        height: 18,
        depth: 10,
        alpha: 0.9
      });
      ctx.globalCompositeOperation = "screen";
      const glow = ctx.createLinearGradient(cx - w * 2.8, 0, cx + w * 2.8, 0);
      glow.addColorStop(0, "rgba(165,34,255,0)");
      glow.addColorStop(0.5, active ? "rgba(255,79,154,.42)" : "rgba(255,214,109,.18)");
      glow.addColorStop(1, "rgba(165,34,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - w * 2.8, y - 6, w * 5.6, h + 12);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = shell;
      roundedRect(cx - w * 0.55, y, w * 1.1, h, Math.min(10, w * 0.35), true, false);
      ctx.strokeStyle = rail;
      ctx.lineWidth = 2;
      roundedRect(cx - w * 0.55, y, w * 1.1, h, Math.min(10, w * 0.35), false, true);
      const beam = ctx.createLinearGradient(cx - 4, 0, cx + 4, 0);
      beam.addColorStop(0, "rgba(255,255,255,.14)");
      beam.addColorStop(0.45, active ? "rgba(255,79,154,.96)" : "rgba(255,214,109,.58)");
      beam.addColorStop(1, "rgba(165,34,255,.34)");
      ctx.fillStyle = beam;
      roundedRect(cx - Math.max(4, w * 0.16), y + 8, Math.max(8, w * 0.32), h - 16, 5, true, false);
      return ctx.restore();
    }

    const radius = Math.min(12, Math.max(5, h * 0.25));
    ctx.fillStyle = shell;
    roundedRect(x, y, w, h, radius, true, false);
    ctx.strokeStyle = trim;
    ctx.lineWidth = active ? 3 : 2;
    roundedRect(x + 1.5, y + 1.5, w - 3, h - 3, radius, false, true);
    ctx.strokeStyle = "rgba(255,214,109,.34)";
    ctx.lineWidth = 1;
    roundedRect(x + 7, y + 7, Math.max(0, w - 14), Math.max(0, h - 14), Math.max(3, radius - 3), false, true);

    ctx.globalCompositeOperation = "screen";
    const centerGlow = ctx.createLinearGradient(x + 12, y, x + w - 12, y);
    centerGlow.addColorStop(0, "rgba(165,34,255,0)");
    centerGlow.addColorStop(0.22, warning ? "rgba(255,214,109,.28)" : "rgba(165,34,255,.2)");
    centerGlow.addColorStop(0.52, active ? "rgba(255,79,154,.72)" : "rgba(255,214,109,.36)");
    centerGlow.addColorStop(0.78, warning ? "rgba(255,214,109,.28)" : "rgba(165,34,255,.2)");
    centerGlow.addColorStop(1, "rgba(165,34,255,0)");
    ctx.fillStyle = centerGlow;
    roundedRect(x + 12, y + h * 0.34, Math.max(0, w - 24), Math.max(5, h * 0.22), 5, true, false);

    if (active) {
      ctx.fillStyle = `rgba(255,79,154,${0.14 + pulse * 0.14})`;
      roundedRect(x - 12, y - 9, w + 24, h + 18, radius + 5, true, false);
    }
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = active ? "rgba(255,255,255,.72)" : "rgba(255,214,109,.56)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + h * 0.5);
    ctx.lineTo(x + w * 0.28, y + h * 0.5);
    ctx.moveTo(x + w * 0.72, y + h * 0.5);
    ctx.lineTo(x + w - 16, y + h * 0.5);
    ctx.stroke();

    const nodes = [0.24, 0.5, 0.76];
    for (const node of nodes) {
      const nx = x + w * node;
      ctx.fillStyle = active ? core : colors.gold;
      ctx.beginPath();
      ctx.arc(nx, y + h * 0.5, active ? 3.4 + pulse * 1.8 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const capW = Math.min(22, Math.max(10, w * 0.08));
    ctx.fillStyle = "rgba(255,214,109,.2)";
    roundedRect(x + 5, y + 5, capW, h - 10, 4, true, false);
    roundedRect(x + w - capW - 5, y + 5, capW, h - 10, 4, true, false);
    ctx.restore();
  }

  function drawEntityShadows(state) {
    for (const p of activePlayers(state)) {
      drawGroundShadow(state, p.x + p.w * 0.5, p.y + p.h, p.w * 0.78, 0.42);
    }
    for (const enemy of state.enemies) {
      if (enemy.x + enemy.w < state.cameraX - 120 || enemy.x > state.cameraX + W + 120) continue;
      drawGroundShadow(state, enemy.x + enemy.w * 0.5, enemy.y + enemy.h, enemy.w * 0.82, enemy.type === "drone" ? 0.26 : 0.36);
    }
    if (state.boss && state.boss.hp > 0) {
      drawGroundShadow(state, state.boss.x + state.boss.w * 0.5, state.boss.y + state.boss.h, state.boss.w * 0.68, 0.42);
    }
  }

  function drawGroundShadow(state, x, bottomY, width, alpha) {
    const groundY = supportYAt(state, x, bottomY);
    if (!groundY) return;
    const distance = clamp(groundY - bottomY, 0, 190);
    const squash = 1 - distance / 240;
    ctx.save();
    ctx.globalAlpha = alpha * squash;
    const g = ctx.createRadialGradient(x, groundY + 4, 2, x, groundY + 4, width);
    g.addColorStop(0, "rgba(0,0,0,0.72)");
    g.addColorStop(0.56, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 4, width, Math.max(7, width * 0.15 * squash), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function supportYAt(state, x, bottomY) {
    let ground = Infinity;
    for (const plat of state.platforms) {
      if (x < plat.x - 18 || x > plat.x + plat.w + 18 || plat.y < bottomY - 12) continue;
      ground = Math.min(ground, plat.y);
    }
    return Number.isFinite(ground) ? ground : null;
  }

  function drawPlayerShots(state) {
    for (const shot of state.playerShots) {
      const angle = Math.atan2(shot.vy, shot.vx);
      if (shot.weapon === "beam" && drawGameplayFxCell(GAMEPLAY_FX.attack.beamSlash, shot.x, shot.y, 148, 86, 0.94, {
        rotation: angle,
        composite: "screen",
        shadowColor: colors.purple,
        shadowBlur: 20,
        sourceInset: 8
      })) continue;
      if (shot.weapon === "spread" && drawGameplayFxCell(GAMEPLAY_FX.attack.spreadFan, shot.x, shot.y, 132, 82, 0.9, {
        rotation: angle,
        composite: "screen",
        shadowColor: colors.pink,
        shadowBlur: 18,
        sourceInset: 8
      })) continue;
      const frame = Math.floor(((shot.age || 0) * 16 + (shot.pierce ? 2 : 0)) % FX_SHEET_COLS);
      const width = shot.pierce ? 132 : 104;
      const height = shot.pierce ? 76 : 58;
      if (drawFxCell(FX_ROWS.heartShot, frame, shot.x, shot.y, width, height, 0.98, angle)) continue;
      ctx.save();
      ctx.translate(shot.x, shot.y);
      ctx.rotate(angle);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, shot.w);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.35, shot.color || colors.pink);
      g.addColorStop(1, settings.highContrastShots ? "rgba(56,219,255,0)" : "rgba(255,79,154,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, shot.w, shot.h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shot.color || colors.pink;
      ctx.strokeStyle = colors.cream;
      ctx.lineWidth = 2;
      ctx.beginPath();
      heartPath(0, 1, shot.h * 0.58, 1);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEnemyShots(state) {
    for (const shot of state.enemyShots) {
      const angle = Math.atan2(shot.vy, shot.vx);
      if (shot.kind === "droneLaser") {
        const frame = Math.floor(((shot.age || 0) * 22) % DRONE_LASER_FRAMES);
        const laserDrawn = drawDroneLaserAsset(shot.x, shot.y, Math.max(72, Math.min(132, shot.w * 2.35)), Math.max(28, shot.h * 1.45), angle, 0.74, frame, { center: true });
        drawDroneFxCell(7, shot.x, shot.y, 58, 58, 0.34 + Math.sin((shot.age || 0) * 18) * 0.08, {
          rotation: angle,
          shadowBlur: 14
        });
        if (laserDrawn) continue;
      }
      const frame = Math.floor(((shot.age || 0) * 14) % FX_SHEET_COLS);
      if (drawFxCell(FX_ROWS.bossBeam, frame, shot.x, shot.y, Math.max(82, shot.w * 3.2), Math.max(32, shot.h * 1.8), 0.72, angle)) continue;
      const g = ctx.createRadialGradient(shot.x, shot.y, 1, shot.x, shot.y, 28);
      g.addColorStop(0, "#fff7cf");
      g.addColorStop(0.38, shot.color || colors.purple);
      g.addColorStop(1, "rgba(165,34,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shot.color || colors.purple;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shot.x - Math.sign(shot.vx || 1) * 22, shot.y);
      ctx.lineTo(shot.x + Math.sign(shot.vx || 1) * 12, shot.y);
      ctx.stroke();
    }
  }

  function drawEnemies(state) {
    for (const enemy of state.enemies) {
      if (enemy.x + enemy.w < state.cameraX - 120 || enemy.x > state.cameraX + W + 120) continue;
      const bounds = enemyVisualBounds(enemy);
      if (!visualBoundsFullyInView(state, bounds.left, bounds.right, 4)) continue;
      drawEnemyTelegraph(enemy, state);
      if (enemy.type === "crawler") drawCrawler(enemy, state.time);
      if (enemy.type === "drone") drawDrone(enemy, state.time, state);
      if (enemy.type === "shield") drawShield(enemy, state.time);
      if (enemy.type === "turret") drawTurret(enemy, state.time);
      if (enemy.hurt > 0) {
        drawGameplayFxCell(GAMEPLAY_FX.attack.hitBurst, enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.48, enemy.w * 1.7, enemy.h * 1.3, clamp(enemy.hurt / 0.16, 0.18, 0.82), {
          composite: "screen",
          shadowColor: colors.purple,
          shadowBlur: 14,
          sourceInset: 8
        });
      }
      drawEnemyHealth(enemy);
    }
  }

  function visualBoundsFullyInView(state, left, right, margin = 0) {
    return left >= state.cameraX + margin && right <= state.cameraX + W - margin;
  }

  function enemyVisualBounds(enemy) {
    const inflate = enemy.type === "drone" ? 78 : enemy.type === "turret" ? CANNON_TURRET.visualInflate : enemy.type === "shield" ? 44 : 34;
    return {
      left: enemy.x - inflate,
      right: enemy.x + enemy.w + inflate
    };
  }

  function drawEnemyTelegraph(enemy, state) {
    if (!(enemy.telegraph > 0)) return false;
    const baseDuration = enemy.type === "turret" ? 0.55 : enemy.type === "crawler" ? 0.38 : 0.38;
    const charge = clamp(enemy.telegraph / baseDuration, 0, 1);
    const alpha = 0.34 + charge * 0.48;
    const cx = enemy.x + enemy.w * 0.5;
    const cy = enemy.y + enemy.h * 0.55;
    if (enemy.type === "crawler") {
      const dir = enemy.facing || -1;
      const groundY = enemy.y + enemy.h - 4;
      const warnW = 82 + (1 - charge) * 44;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(255,214,109,${0.38 + alpha * 0.35})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + dir * 14, groundY);
      ctx.lineTo(cx + dir * warnW, groundY);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,79,154,${0.1 + alpha * 0.16})`;
      ctx.beginPath();
      ctx.moveTo(cx + dir * 18, groundY - 5);
      ctx.lineTo(cx + dir * warnW, groundY - 18);
      ctx.lineTo(cx + dir * warnW, groundY + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      drawGameplayFxCell(GAMEPLAY_FX.warning.lockNode, cx + dir * 46, groundY - 22, 54, 54, alpha * 0.82, {
        composite: "screen",
        shadowColor: colors.gold,
        shadowBlur: 12,
        sourceInset: 10
      });
      return true;
    }
    if (enemy.type === "drone") {
      drawGameplayFxCell(GAMEPLAY_FX.warning.reticle, cx, enemy.y + enemy.h + 56, 82, 82, alpha, {
        composite: "screen",
        shadowColor: colors.pink,
        shadowBlur: 18,
        sourceInset: 8
      });
      drawGameplayFxCell(GAMEPLAY_FX.warning.cone, cx, cy + 44, 74, 74, alpha * 0.8, {
        composite: "screen",
        shadowColor: colors.pink,
        shadowBlur: 16,
        sourceInset: 10
      });
      return true;
    }
    if (enemy.type === "turret") {
      const dir = enemy.facing || -1;
      const angle = dir > 0 ? 0 : Math.PI;
      const muzzle = turretMuzzle(enemy);
      drawGameplayFxCell(GAMEPLAY_FX.warning.reticle, muzzle.x + dir * 108, muzzle.y, 74, 74, alpha, {
        rotation: angle,
        composite: "screen",
        shadowColor: colors.red,
        shadowBlur: 18,
        sourceInset: 8
      });
      drawGameplayFxCell(GAMEPLAY_FX.warning.cone, muzzle.x + dir * 24, muzzle.y, 76, 76, alpha * 0.82, {
        rotation: angle,
        composite: "screen",
        shadowColor: colors.orange,
        shadowBlur: 16,
        sourceInset: 10
      });
      return true;
    }
    return false;
  }

  function drawEnemySprite(enemy, imageKey, options = {}) {
    const image = images[imageKey];
    if (!image?.complete || !image.naturalWidth) return false;

    const targetW = enemy.w * (options.scaleX || 1);
    const targetH = enemy.h * (options.scaleY || 1);
    const ratio = Math.min(targetW / image.naturalWidth, targetH / image.naturalHeight);
    const dw = image.naturalWidth * ratio;
    const dh = image.naturalHeight * ratio;
    const x = enemy.x + enemy.w * 0.5 - dw * 0.5 + (options.offsetX || 0);
    const y = enemy.y + enemy.h - dh + (options.offsetY || 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = enemy.hurt > 0 ? "brightness(2.25) saturate(0.3)" : "none";
    ctx.shadowColor = enemy.type === "turret" ? "rgba(255,112,67,.46)" : "rgba(165,34,255,.42)";
    ctx.shadowBlur = enemy.hurt > 0 ? 26 : 14;
    ctx.shadowOffsetY = 8;
    if (enemy.facing > 0) {
      ctx.translate(x + dw * 0.5, y + dh * 0.5);
      ctx.scale(-1, 1);
      ctx.drawImage(image, -dw * 0.5, -dh * 0.5, dw, dh);
    } else {
      ctx.drawImage(image, x, y, dw, dh);
    }
    ctx.restore();
    return true;
  }

  function drawEnemyMotionSprite(enemy, row, frame, options = {}) {
    const image = images.enemyMotion;
    if (!image?.complete || !image.naturalWidth) return false;

    const cellW = image.naturalWidth / 4;
    const cellH = image.naturalHeight / 3;
    const inset = options.sourceInset ?? 0;
    const sx = (frame % 4) * cellW + inset;
    const sy = row * cellH + inset;
    const sw = Math.max(1, cellW - inset * 2);
    const sh = Math.max(1, cellH - inset * 2);
    const targetW = enemy.w * (options.scaleX || 2.15);
    const targetH = enemy.h * (options.scaleY || 1.95);
    const ratio = Math.min(targetW / sw, targetH / sh);
    const dw = sw * ratio;
    const dh = sh * ratio;
    const x = enemy.x + enemy.w * 0.5 + (options.offsetX || 0);
    const y = enemy.y + enemy.h + (options.offsetY || 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = enemy.hurt > 0 ? "brightness(2.1) saturate(0.6)" : "none";
    ctx.shadowColor = enemy.type === "turret" ? "rgba(255,112,67,.5)" : "rgba(165,34,255,.46)";
    ctx.shadowBlur = enemy.hurt > 0 || enemy.telegraph > 0 ? 24 : 15;
    ctx.shadowOffsetY = 8;
    ctx.translate(x, y);
    if (enemy.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, sx, sy, sw, sh, -dw * 0.5, -dh, dw, dh);
    ctx.restore();
    return true;
  }

  function droneMotionFrame(enemy, time) {
    if (enemy.dead) return 7;
    if (enemy.hurt > 0) return 7;
    if ((enemy.fireFlash || 0) > 0.16) return 4;
    if ((enemy.fireFlash || 0) > 0) return 5;
    if (enemy.telegraph > 0) return enemy.telegraph > 0.2 ? 2 : 3;
    if (enemy.cd > 1.1 && enemy.cd < 1.55) return 6;
    return Math.floor(time * 7 + enemy.phase) % 2;
  }

  function drawDroneMotionSprite(enemy, frame, options = {}) {
    const image = images.droneMotion;
    if (!image?.complete || !image.naturalWidth) return false;

    const cellW = image.naturalWidth / DRONE_MOTION_FRAMES;
    const cellH = image.naturalHeight;
    const sx = (frame % DRONE_MOTION_FRAMES) * cellW;
    const targetW = enemy.w * (options.scaleX || 2.95);
    const targetH = enemy.h * (options.scaleY || 2.54);
    const ratio = Math.min(targetW / cellW, targetH / cellH);
    const dw = cellW * ratio;
    const dh = cellH * ratio;
    const x = enemy.x + enemy.w * 0.5 + (options.offsetX || 0);
    const y = enemy.y + enemy.h + (options.offsetY || 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = enemy.hurt > 0 ? "brightness(2.08) saturate(0.68)" : "none";
    ctx.shadowColor = enemy.fireFlash > 0 || enemy.telegraph > 0 ? "rgba(255,79,154,.58)" : "rgba(165,34,255,.46)";
    ctx.shadowBlur = enemy.fireFlash > 0 || enemy.telegraph > 0 ? 26 : 15;
    ctx.shadowOffsetY = 8;
    ctx.translate(x, y);
    if (enemy.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, sx, 0, cellW, cellH, -dw * 0.5, -dh, dw, dh);
    ctx.restore();
    return true;
  }

  function droneAimAngle(enemy, state) {
    if (enemy.lastShotAngle !== undefined && (enemy.fireFlash || 0) > 0) return enemy.lastShotAngle;
    const muzzle = droneMuzzle(enemy);
    const target = nearestPlayer(state, muzzle.x, muzzle.y);
    if (target) return Math.atan2(target.y + 54 - muzzle.y, target.x + target.w * 0.5 - muzzle.x);
    return enemy.facing > 0 ? 0 : Math.PI;
  }

  function drawDroneLaserAsset(x, y, length, height, angle, alpha, frame, options = {}) {
    const image = images.droneLaserOverlay;
    if (image?.complete && image.naturalWidth) {
      const cellW = image.naturalWidth / DRONE_LASER_FRAMES;
      const cellH = image.naturalHeight;
      const sx = (frame % DRONE_LASER_FRAMES) * cellW;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.shadowColor = "rgba(255,79,154,.62)";
      ctx.shadowBlur = 20;
      const drawX = options.center ? -length * 0.5 : -length * 0.07;
      ctx.drawImage(image, sx, 0, cellW, cellH, drawX, -height * 0.5, length, height);
      ctx.restore();
      return true;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha;
    const start = options.center ? -length * 0.5 : 0;
    const g = ctx.createLinearGradient(start, 0, start + length, 0);
    g.addColorStop(0, "rgba(255,79,154,.92)");
    g.addColorStop(0.45, "rgba(255,245,255,.94)");
    g.addColorStop(1, "rgba(165,34,255,.08)");
    ctx.strokeStyle = g;
    ctx.lineWidth = height * 0.42;
    ctx.shadowColor = "rgba(255,79,154,.72)";
    ctx.shadowBlur = height * 0.45;
    ctx.beginPath();
    ctx.moveTo(start, 0);
    ctx.lineTo(start + length, 0);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.95)";
    ctx.lineWidth = Math.max(2, height * 0.08);
    ctx.beginPath();
    ctx.moveTo(start, 0);
    ctx.lineTo(start + length, 0);
    ctx.stroke();
    ctx.restore();
    return true;
  }

  function drawDroneLaserOverlay(enemy, state) {
    const flash = enemy.fireFlash || 0;
    const charging = enemy.telegraph > 0;
    if (!flash && !charging) return false;
    const muzzle = droneMuzzle(enemy);
    const angle = droneAimAngle(enemy, state);
    const progress = charging ? 1 - clamp(enemy.telegraph / 0.38, 0, 1) : 1;
    const length = flash ? 172 : 70 + progress * 104;
    const height = flash ? 44 : 24 + progress * 12;
    const alpha = flash ? clamp(flash / 0.24, 0.28, 0.92) : 0.18 + progress * 0.36;
    const frame = Math.floor((state.time * 22 + (flash ? 4 : 0)) % DRONE_LASER_FRAMES);
    let drawn = false;
    if (charging) {
      drawn = drawDroneFxCell(progress > 0.55 ? 1 : 0, muzzle.x, muzzle.y, 54 + progress * 50, 54 + progress * 50, alpha * 0.94, {
        rotation: angle,
        shadowBlur: 18 + progress * 12
      }) || drawn;
    }
    if (flash) {
      drawn = drawDroneFxCell(2, muzzle.x, muzzle.y, 70, 70, alpha, {
        rotation: angle,
        shadowBlur: 22
      }) || drawn;
    }
    drawn = drawDroneLaserAsset(muzzle.x, muzzle.y, length, height, angle, alpha, frame) || drawn;
    if (flash) {
      const tipX = muzzle.x + Math.cos(angle) * length * 0.92;
      const tipY = muzzle.y + Math.sin(angle) * length * 0.92;
      drawn = drawDroneFxCell(frame % 2 ? 5 : 6, tipX, tipY, 76, 76, alpha * 0.54, {
        rotation: angle,
        shadowBlur: 18
      }) || drawn;
    }
    return drawn;
  }

  function shieldRobotFrame(enemy, time) {
    if (enemy.dead) return 7;
    if (enemy.hurt > 0) return 6;
    if ((enemy.fireFlash || 0) > 0.14) return 4;
    if ((enemy.fireFlash || 0) > 0) return 5;
    if (Math.abs(enemy.vx || 0) > 18) return Math.floor(time * 8.6 + enemy.phase) % 4;
    return Math.floor(time * 3.2 + enemy.phase) % 2;
  }

  function drawShieldRobotSprite(enemy, frame, options = {}) {
    const image = images.shieldRobotMotion;
    if (!image?.complete || !image.naturalWidth) return false;

    const cellW = image.naturalWidth / SHIELD_ROBOT_FRAMES;
    const cellH = image.naturalHeight;
    const sx = (frame % SHIELD_ROBOT_FRAMES) * cellW;
    const targetW = enemy.w * (options.scaleX || 2.26);
    const targetH = enemy.h * (options.scaleY || 1.56);
    const ratio = Math.min(targetW / cellW, targetH / cellH);
    const dw = cellW * ratio;
    const dh = cellH * ratio;
    const x = enemy.x + enemy.w * 0.5 + (options.offsetX || 0);
    const bottomPad = SHIELD_ROBOT_BOTTOM_PAD[frame % SHIELD_ROBOT_FRAMES] || 0;
    const y = enemy.y + enemy.h + bottomPad * ratio + (options.offsetY || 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = enemy.hurt > 0 ? "brightness(2.1) saturate(0.68)" : "none";
    ctx.shadowColor = enemy.fireFlash > 0 || enemy.hurt > 0 ? "rgba(255,79,154,.52)" : "rgba(165,34,255,.44)";
    ctx.shadowBlur = enemy.fireFlash > 0 || enemy.hurt > 0 ? 24 : 14;
    ctx.shadowOffsetY = 8;
    ctx.translate(x, y);
    if (enemy.facing > 0) ctx.scale(-1, 1);
    ctx.drawImage(image, sx, 0, cellW, cellH, -dw * 0.5, -dh, dw, dh);
    ctx.restore();
    return true;
  }

  function crawlerWalkFrame(enemy, time) {
    if (enemy.dead) return 5;
    if (enemy.hurt > 0) return 5;
    const speed = Math.abs(enemy.vx || 0);
    if (speed < 18) return 0;
    const cadence = speed > 115 ? 13 : 10;
    return Math.floor(time * cadence + enemy.phase) % CRAWLER_WALK_FRAMES;
  }

  function drawCrawlerWalkSprite(enemy, frame, options = {}) {
    const image = images.crawlerWalk;
    if (!image?.complete || !image.naturalWidth) return false;

    const cellW = image.naturalWidth / CRAWLER_WALK_FRAMES;
    const cellH = image.naturalHeight;
    const sx = (frame % CRAWLER_WALK_FRAMES) * cellW;
    const targetW = enemy.w * (options.scaleX || CRAWLER_DOG.spriteScaleX);
    const targetH = enemy.h * (options.scaleY || CRAWLER_DOG.spriteScaleY);
    const ratio = Math.min(targetW / cellW, targetH / cellH);
    const dw = cellW * ratio;
    const dh = cellH * ratio;
    const x = enemy.x + enemy.w * 0.5 + (options.offsetX || 0);
    const y = enemy.y + enemy.h + CRAWLER_WALK_BOTTOM_PAD * ratio + (options.offsetY || 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = enemy.hurt > 0 ? "brightness(2.12) saturate(0.72)" : "none";
    ctx.shadowColor = enemy.hurt > 0 ? "rgba(255,79,154,.56)" : "rgba(165,34,255,.44)";
    ctx.shadowBlur = enemy.hurt > 0 ? 24 : 14;
    ctx.shadowOffsetY = 8;
    ctx.translate(x, y);
    if (enemy.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, sx, 0, cellW, cellH, -dw * 0.5, -dh, dw, dh);
    ctx.restore();
    return true;
  }

  function drawCrawler(enemy, time) {
    const walkFrame = crawlerWalkFrame(enemy, time);
    if (drawCrawlerWalkSprite(enemy, walkFrame)) return;
    const frame = enemy.hurt > 0 ? 3 : Math.floor(time * 9 + enemy.phase) % 2;
    if (drawEnemyMotionSprite(enemy, 1, frame, { scaleX: CRAWLER_DOG.fallbackMotionScaleX, scaleY: CRAWLER_DOG.fallbackMotionScaleY })) return;
    if (drawEnemySprite(enemy, "enemyCrawler", { scaleX: CRAWLER_DOG.fallbackStaticScaleX, scaleY: CRAWLER_DOG.fallbackStaticScaleY })) return;

    ctx.save();
    ctx.translate(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5);
    ctx.fillStyle = enemy.hurt > 0 ? "#ffffff" : "#121016";
    ctx.strokeStyle = colors.purple;
    ctx.lineWidth = 3;
    roundedRect(-36, -22, 72, 42, 8, true, true);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(enemy.facing > 0 ? 8 : -20, -8, 18, 8);
    ctx.strokeStyle = "rgba(255,214,109,.72)";
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i * 18, 16);
      ctx.lineTo(i * 34, 28);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDrone(enemy, time, state) {
    const frame = droneMotionFrame(enemy, time);
    const usedMotion = drawDroneMotionSprite(enemy, frame, { scaleX: 2.58, scaleY: 2.2, offsetY: Math.sin(time * 5 + enemy.phase) * 2 + 12 });
    if (usedMotion) {
      drawDroneLaserOverlay(enemy, state);
      return;
    }
    const fallbackFrame = enemy.hurt > 0 ? 3 : enemy.fireFlash > 0 || enemy.telegraph > 0 ? 2 : Math.floor(time * 7 + enemy.phase) % 2;
    const fallbackMotion = drawEnemyMotionSprite(enemy, 0, fallbackFrame, { scaleX: 2.26, scaleY: 2.16, offsetY: Math.sin(time * 5 + enemy.phase) * 2 + 12 });
    if (fallbackMotion) {
      drawDroneLaserOverlay(enemy, state);
      return;
    }
    const usedSprite = drawEnemySprite(enemy, "enemyDrone", { scaleX: 1.32, scaleY: 1.42, offsetY: Math.sin(time * 5 + enemy.phase) * 2 });
    if (usedSprite) {
      drawDroneLaserOverlay(enemy, state);
      return;
    }

    ctx.save();
    ctx.translate(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5);
    ctx.fillStyle = enemy.hurt > 0 ? "#ffffff" : "#0f0d14";
    ctx.strokeStyle = enemy.telegraph > 0 ? colors.pink : colors.purple;
    ctx.lineWidth = 3;
    roundedRect(-30, -20, 60, 40, 8, true, true);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-12, -2, 24, 8);
    ctx.strokeStyle = colors.purple;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.ellipse(i * 46, -18 + Math.sin(time * 9) * 3, 22, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 30, -6);
      ctx.lineTo(i * 46, -18);
      ctx.stroke();
    }
    if (enemy.telegraph > 0) {
      ctx.strokeStyle = "rgba(255,79,154,.7)";
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(0, 58);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShield(enemy, time) {
    const frame = shieldRobotFrame(enemy, time);
    if (drawShieldRobotSprite(enemy, frame)) return;
    const fallbackFrame = enemy.hurt > 0 ? 1 : Math.floor(time * 4.5 + enemy.phase) % 2;
    if (drawEnemyMotionSprite(enemy, 2, fallbackFrame, { scaleX: 2.0, scaleY: 1.72, offsetY: 6 })) return;
    if (drawEnemySprite(enemy, "enemyShieldGuard", { scaleX: 1.22, scaleY: 1.12, offsetY: 6 })) return;

    ctx.save();
    ctx.translate(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.55);
    ctx.scale(enemy.facing, 1);
    ctx.fillStyle = enemy.hurt > 0 ? "#ffffff" : "#15121a";
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3;
    roundedRect(-24, -48, 48, 90, 8, true, true);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-10, -28, 20, 8);
    ctx.strokeStyle = colors.purple;
    ctx.fillStyle = "rgba(165,34,255,.22)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-2, -40);
    ctx.lineTo(42, -22);
    ctx.lineTo(38, 32);
    ctx.lineTo(-2, 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawTurret(enemy, time) {
    const cannonFrame = cannonTurretFrame(enemy, time);
    const usedCannon = drawCannonTurretSprite(enemy, cannonFrame);
    if (usedCannon) {
      if (enemy.telegraph > 0) {
        const dir = enemy.facing || -1;
        const muzzle = turretMuzzle(enemy);
        ctx.save();
        ctx.strokeStyle = "rgba(255,112,67,.55)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(muzzle.x, muzzle.y);
        ctx.lineTo(muzzle.x + dir * TURRET_TELEGRAPH_LENGTH, muzzle.y);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const frame = enemy.telegraph > 0 || enemy.hurt > 0 ? 3 : 2;
    const usedMotion = drawEnemyMotionSprite(enemy, 2, frame, { scaleX: CANNON_TURRET.fallbackMotionScaleX, scaleY: CANNON_TURRET.fallbackMotionScaleY, offsetY: 3 });
    if (usedMotion) {
      if (enemy.telegraph > 0) {
        const dir = enemy.facing || -1;
        const muzzle = turretMuzzle(enemy);
        ctx.save();
        ctx.strokeStyle = "rgba(255,112,67,.55)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(muzzle.x, muzzle.y);
        ctx.lineTo(muzzle.x + dir * TURRET_TELEGRAPH_LENGTH, muzzle.y);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const usedSprite = drawEnemySprite(enemy, "enemyTurret", { scaleX: CANNON_TURRET.fallbackStaticScaleX, scaleY: CANNON_TURRET.fallbackStaticScaleY, offsetY: 3 });
    if (usedSprite) {
      if (enemy.telegraph > 0) {
        const dir = enemy.facing || -1;
        const muzzle = turretMuzzle(enemy);
        ctx.save();
        ctx.strokeStyle = "rgba(255,112,67,.55)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(muzzle.x, muzzle.y);
        ctx.lineTo(muzzle.x + dir * TURRET_TELEGRAPH_LENGTH, muzzle.y);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    ctx.save();
    ctx.translate(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5);
    ctx.fillStyle = enemy.hurt > 0 ? "#ffffff" : "#100d13";
    ctx.strokeStyle = enemy.telegraph > 0 ? colors.red : colors.gold;
    ctx.lineWidth = 3;
    roundedRect(-38, -28, 76, 56, 8, true, true);
    ctx.strokeStyle = colors.purple;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-46, -5, 22, 10);
    if (enemy.telegraph > 0) {
      ctx.strokeStyle = "rgba(255,112,67,.55)";
      ctx.beginPath();
      ctx.moveTo(-46, 0);
      ctx.lineTo(-TURRET_TELEGRAPH_LENGTH, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function cannonTurretFrame(enemy, time) {
    if (enemy.hurt > 0) return 7;
    if ((enemy.fireFlash || 0) > 0.14) return 4;
    if ((enemy.fireFlash || 0) > 0) return 5;
    if (enemy.telegraph > 0) return enemy.telegraph > 0.25 ? 2 : 3;
    if (enemy.cd > 1.0 && enemy.cd < 1.75) return 6;
    return Math.floor(time * 2.2 + enemy.phase) % 2;
  }

  function drawCannonTurretSprite(enemy, frame) {
    const image = images.cannonTurretMotion;
    if (!image?.complete || !image.naturalWidth) return false;

    const cellW = image.naturalWidth / CANNON_TURRET_FRAMES;
    const cellH = image.naturalHeight;
    const inset = 0;
    const sx = (frame % CANNON_TURRET_FRAMES) * cellW + inset;
    const sy = inset;
    const sw = Math.max(1, cellW - inset * 2);
    const sh = Math.max(1, cellH - inset * 2);
    const targetW = enemy.w * CANNON_TURRET.spriteScaleX;
    const targetH = enemy.h * CANNON_TURRET.spriteScaleY;
    const ratio = Math.min(targetW / sw, targetH / sh);
    const dw = sw * ratio;
    const dh = sh * ratio;
    const x = enemy.x + enemy.w * 0.5;
    const bottomPad = CANNON_TURRET_BOTTOM_PAD[frame % CANNON_TURRET_FRAMES] || 0;
    const y = enemy.y + enemy.h + bottomPad * ratio;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = enemy.hurt > 0 ? "brightness(2.1) saturate(0.5)" : "none";
    ctx.shadowColor = enemy.fireFlash > 0 || enemy.telegraph > 0 ? "rgba(255,79,154,.58)" : "rgba(165,34,255,.42)";
    ctx.shadowBlur = enemy.fireFlash > 0 || enemy.telegraph > 0 ? 24 : 15;
    ctx.shadowOffsetY = 8;
    ctx.translate(x, y);
    if (enemy.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, sx, sy, sw, sh, -dw * 0.5, -dh, dw, dh);
    ctx.restore();
    return true;
  }

  function drawEnemyHealth(enemy) {
    if (enemy.hp >= enemy.maxHp) return;
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(enemy.x, enemy.y - 12, enemy.w, 5);
    ctx.fillStyle = enemy.type === "shield" ? colors.gold : colors.pink;
    ctx.fillRect(enemy.x, enemy.y - 12, enemy.w * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }

  function drawBoss(state) {
    const boss = state.boss;
    if (!boss || boss.hp <= 0) return;
    const image = images[boss.imageKey];
    ctx.save();
    ctx.translate(boss.x + boss.w * 0.5, boss.y + boss.h * 0.5);
    const hurt = boss.hurt > 0;
    const activePulse = boss.telegraph > 0 ? boss.telegraph : boss.shieldTime > 0 ? 0.35 : 0;
    const sway = Math.sin(boss.time * (1.7 + boss.phase * 0.34)) * 0.018;
    const recoil = activePulse > 0 ? Math.sin(state.time * 28) * 0.022 * clamp(activePulse, 0, 1) : 0;
    const breathe = 1 + Math.sin(boss.time * 2.4) * 0.012 + clamp(activePulse, 0, 1) * 0.018;
    ctx.rotate(sway + recoil);
    ctx.scale(breathe, 1 / Math.sqrt(breathe));
    const glow = ctx.createRadialGradient(0, 0, 12, 0, 0, Math.max(boss.w, boss.h) * 0.72);
    glow.addColorStop(0, boss.phase === 3 ? "rgba(255,79,154,.34)" : "rgba(165,34,255,.24)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, boss.w * 0.72, boss.h * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    if (boss.telegraph > 0) {
      ctx.strokeStyle = `rgba(255,214,109,${0.2 + boss.telegraph * 0.45})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, boss.w * (0.56 + boss.telegraph * 0.18), boss.h * (0.48 + boss.telegraph * 0.12), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (image?.complete && image.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = hurt ? 0.74 : 1;
      ctx.shadowColor = boss.phase === 3 ? colors.pink : colors.purple;
      ctx.shadowBlur = boss.phase === 3 ? 32 : 20;
      drawBossMotionFrame(state, boss, image, hurt);
      ctx.restore();
      if (hurt) {
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(255,255,255,.34)";
        ctx.beginPath();
        ctx.ellipse(0, 0, boss.w * 0.52, boss.h * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
    } else {
      ctx.fillStyle = hurt ? "#ffffff" : "#0d0b12";
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 5;
      roundedRect(-98, -112, 196, 214, 8, true, true);
      ctx.strokeStyle = colors.purple;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -36, 52, 0, Math.PI * 2);
      ctx.stroke();
    }
    const coreAlpha = hurt ? 0.78 : boss.telegraph > 0 ? 0.5 : boss.shieldTime > 0 ? 0.18 : 0.34;
    drawGameplayFxCell(GAMEPLAY_FX.warning.bossCore, -boss.w * 0.08, -boss.h * 0.02, boss.w * 0.34, boss.h * 0.26, coreAlpha, {
      composite: "screen",
      shadowColor: boss.phase === 3 ? colors.pink : colors.purple,
      shadowBlur: hurt ? 26 : 18,
      sourceInset: 8
    });
    if (boss.telegraph > 0) {
      const markerX = boss.w * 0.28;
      const markerY = -boss.h * 0.43;
      const markerSize = 18 + boss.telegraph * 5;
      ctx.save();
      ctx.translate(markerX, markerY);
      ctx.rotate(Math.PI * 0.25 + state.time * 0.7);
      ctx.strokeStyle = `rgba(255,214,109,${0.62 + boss.telegraph * 0.28})`;
      ctx.fillStyle = `rgba(255,79,154,${0.12 + boss.telegraph * 0.18})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = colors.pink;
      ctx.shadowBlur = 12;
      ctx.fillRect(-markerSize * 0.5, -markerSize * 0.5, markerSize, markerSize);
      ctx.strokeRect(-markerSize * 0.5, -markerSize * 0.5, markerSize, markerSize);
      ctx.restore();
    }
    if (boss.shieldTime > 0) {
      ctx.strokeStyle = `rgba(56,219,255,${0.55 + Math.sin(state.time * 12) * 0.25})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, boss.w * 0.58, boss.h * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,.52)";
    ctx.strokeStyle = "rgba(255,214,109,.58)";
    ctx.lineWidth = 2;
    roundedRect(-boss.w * 0.34, -boss.h * 0.64, boss.w * 0.68, 26, 4, true, true);
    ctx.fillStyle = boss.phase === 3 ? colors.pink : colors.gold;
    ctx.font = "800 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(boss.attackName || `Phase ${boss.phase}`, 0, -boss.h * 0.64 + 18);
    ctx.restore();
  }

  function drawBossMotionFrame(state, boss, fallbackImage, hurt) {
    const sheet = images[`${boss.imageKey}Motion`];
    const drawW = boss.w * 1.18;
    const drawH = boss.h * 1.18;
    const actionDuration = 0.46;
    const actionProgress = 1 - clamp((boss.attackAnim || 0) / actionDuration, 0, 1);
    let frame = Math.floor(boss.time * (2.4 + boss.phase * 0.25)) % 2;
    if (boss.attackAnim > 0) frame = 3 + Math.min(2, Math.floor(actionProgress * 3));
    if (boss.telegraph > 0) frame = boss.telegraph > 0.55 ? 2 : boss.telegraph > 0.22 ? 3 : 4;
    if (boss.shieldTime > 0) frame = 2;
    if (boss.phase >= 2 && boss.attackAnim <= 0 && boss.telegraph <= 0 && boss.shieldTime <= 0) {
      frame = Math.floor(boss.time * (3.1 + boss.phase * 0.35)) % 2;
    }
    if (boss.hp / boss.maxHp < 0.18 && boss.telegraph <= 0 && boss.attackAnim <= 0) frame = 7;
    if (hurt) frame = 6;
    const jitterX = hurt ? Math.sin(state.time * 54) * 4 : 0;
    const jitterY = boss.telegraph > 0 ? Math.sin(state.time * 18) * 3 : 0;
    const nativeFacing = BOSS_NATIVE_FACING[boss.kind] || 1;
    const flip = (boss.facing || -1) !== nativeFacing;

    ctx.save();
    if (flip) ctx.scale(-1, 1);
    if (sheet?.complete && sheet.naturalWidth) {
      const cellW = sheet.naturalWidth / BOSS_MOTION_FRAMES;
      const cellH = sheet.naturalHeight;
      if (boss.telegraph > 0 || boss.attackAnim > 0) {
        ctx.save();
        ctx.globalAlpha = boss.telegraph > 0 ? 0.28 : 0.18;
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(sheet, frame * cellW, 0, cellW, cellH, -drawW * 0.5 + jitterX - 8, -drawH * 0.5 + jitterY, drawW, drawH);
        ctx.drawImage(sheet, frame * cellW, 0, cellW, cellH, -drawW * 0.5 + jitterX + 8, -drawH * 0.5 + jitterY, drawW, drawH);
        ctx.restore();
      }
      ctx.drawImage(sheet, frame * cellW, 0, cellW, cellH, -drawW * 0.5 + jitterX, -drawH * 0.5 + jitterY, drawW, drawH);
      ctx.restore();
      return;
    }

    ctx.drawImage(fallbackImage, -drawW * 0.5 + jitterX, -drawH * 0.5 + jitterY, drawW, drawH);
    ctx.restore();
  }

  function drawParticles(state) {
    for (const particle of state.particles) {
      const a = 1 - particle.t / particle.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawPlayer(state) {
    for (const p of allPlayers(state)) {
      drawSinglePlayer(state, p);
    }
  }

  function drawSinglePlayer(state, p) {
    if (p.lives <= 0) return;
    const blinking = p.invuln > 0 && Math.floor(state.time * 18) % 2 === 0;
    for (const trail of p.trail) {
      const alpha = 0.24 * (1 - trail.t / trail.life);
      drawPlayerSprite(trail.x, trail.y, trail.h, p.action, trail.facing, alpha);
    }
    if (p.luckyShield > 0) {
      drawGameplayFxCell(GAMEPLAY_FX.weapon.shield, p.x + p.w * 0.5, p.y + p.h * 0.5, 124, 124, 0.38 + Math.sin(state.time * 7) * 0.08, {
        composite: "screen",
        shadowColor: colors.cyan,
        shadowBlur: 24,
        sourceInset: 8
      });
    }
    if (p.overdriveTime > 0) {
      drawGameplayFxCell(GAMEPLAY_FX.weapon.overdrive, p.x + p.w * 0.5, p.y + p.h * 0.48, 110, 110, 0.42 + Math.sin(state.time * 10) * 0.08, {
        composite: "screen",
        shadowColor: colors.pink,
        shadowBlur: 24,
        sourceInset: 8
      });
    }
    drawPlayerSprite(p.x, p.y, p.h, p.action, p.facing, blinking ? 0.38 : 1, p);
    if (p.dashReadyFlash > 0) {
      ctx.save();
      ctx.globalAlpha = p.dashReadyFlash / 0.22;
      ctx.strokeStyle = p.index === 1 ? colors.cyan : colors.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x + p.w * 0.5, p.y + p.h * 0.5, 42 + (1 - p.dashReadyFlash / 0.22) * 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (p.hp <= 1 && p.lives > 0) {
      drawGameplayFxCell(GAMEPLAY_FX.attack.lowHp, p.x + p.w * 0.5, p.y - 18, 58, 58, 0.62 + Math.sin(state.time * 9) * 0.18, {
        composite: "screen",
        shadowColor: colors.pink,
        shadowBlur: 16,
        sourceInset: 8
      });
    }
    drawPlayerMarker(p);
  }

  function drawPlayerMarker(p) {
    ctx.save();
    const x = p.x + p.w * 0.5;
    const y = p.y - (p.crouching ? 22 : 42);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = p.index === 1 ? "rgba(56,219,255,.16)" : "rgba(255,214,109,.16)";
    ctx.strokeStyle = p.index === 1 ? colors.cyan : colors.gold;
    ctx.lineWidth = 2;
    roundedRect(x - 18, y - 14, 36, 22, 6, true, true);
    ctx.fillStyle = p.index === 1 ? colors.cyan : colors.gold;
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(p.label, x, y + 1);
    ctx.restore();
  }

  function drawPlayerSprite(x, y, h, action, facing, alpha, player = null) {
    const image = images.player;
    if (image.complete && image.naturalWidth) {
      const row = action === "run" && facing < 0 ? PLAYER_ROWS.runBack : PLAYER_ROWS[action] ?? PLAYER_ROWS.idle;
      const frame = Math.floor((run?.time || 0) * (action === "idle" ? 5 : 12)) % 8;
      const scale = h < 100 ? PLAYER_VISUAL.crouchScale : PLAYER_VISUAL.standScale;
      const squash = player?.landingSquash > 0 ? clamp(player.landingSquash / MOVEMENT.landingSquashTime, 0, 1) : 0;
      const pulse = player?.invuln > 0 ? `brightness(${1.1 + Math.sin((run?.time || 0) * 38) * 0.25}) saturate(1.35)` : "none";
      const anchorX = x + 28;
      const bottom = y + h + PLAYER_VISUAL.bottomOffset;
      drawAtlas(image, row, frame, anchorX, bottom, scale, action === "run" && facing < 0 ? false : facing < 0, alpha, pulse, squash);
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + 28, y + h);
    ctx.scale(facing, 1);
    ctx.fillStyle = "#151018";
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3;
    roundedRect(-22, -h, 44, h, 8, true, true);
    ctx.fillStyle = colors.pink;
    ctx.fillRect(-16, -h + 24, 32, 10);
    ctx.strokeStyle = colors.purple;
    ctx.beginPath();
    ctx.moveTo(18, -h + 62);
    ctx.lineTo(48, -h + 58);
    ctx.stroke();
    ctx.restore();
  }

  function drawAtlas(image, row, frame, x, bottom, scale, flip, alpha, filter = "none", squash = 0) {
    const cellW = image.naturalWidth / 8;
    const rows = image === images.player ? 6 : Math.max(1, Math.round(image.naturalHeight / 256));
    const cellH = image.naturalHeight / rows;
    const pad = image === images.player ? 2 : 0;
    const sx = (frame % 8) * cellW + pad;
    const sy = Math.min(row, rows - 1) * cellH + pad;
    const sw = cellW - pad * 2;
    const sh = cellH - pad * 2;
    const dw = sw * scale * (1 + squash * 0.08);
    const dh = sh * scale * (1 - squash * 0.07);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.filter = filter;
    ctx.translate(x, bottom);
    if (flip) ctx.scale(-1, 1);
    ctx.shadowColor = "rgba(165,34,255,.48)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(image, sx, sy, sw, sh, -dw / 2, -dh, dw, dh);
    ctx.restore();
  }

  function updateHUD() {
    const playing = run && (mode === "playing" || mode === "paused" || mode === "settings" || mode === "lottery");
    dom.hud.classList.toggle("is-hidden", !playing);
    if (!playing) {
      dom.bossHud.classList.add("is-hidden");
      dom.objectiveChip.classList.add("is-hidden");
      dom.touchUseButton.classList.add("is-hidden");
      return;
    }
    const players = allPlayers(run);
    dom.hpHearts.innerHTML = "";
    for (const p of players) {
      const row = document.createElement("span");
      row.className = "heart-line";
      const tag = document.createElement("span");
      tag.className = `player-tag${p.index === 1 ? " player-tag--p2" : ""}`;
      tag.textContent = p.label;
      row.appendChild(tag);
      for (let i = 0; i < p.maxHp; i += 1) {
        const span = document.createElement("span");
        span.className = `heart${p.index === 1 ? " heart--p2" : ""}${i >= p.hp ? " is-empty" : ""}`;
        row.appendChild(span);
      }
      dom.hpHearts.appendChild(row);
    }
    dom.livesText.textContent = players.map((p) => `${p.label} ${p.lives}`).join(" | ");
    dom.hudTitle.textContent = run.runMode === "coop" ? "ROBOT RAHBE CO-OP" : run.coOp ? "ROBOT RAHBE 2P" : "ROBOT RAHBE";
    dom.levelText.textContent = `${run.level.id} ${run.level.shortName} ${isUnderground(run) ? "UNDERGROUND" : "SURFACE"}`;
    dom.scoreText.textContent = String(run.stats.score).padStart(6, "0");
    dom.comboText.textContent = `x${run.combo}`;
    dom.shardText.textContent = String(run.shards);
    dom.keyText.textContent = isUnderground(run) ? `Cells ${undergroundCellCount(run)}/3` : `${run.keys}/3`;
    const leadPlayer = activePlayers(run)[0] || run.player;
    const weaponLabel = leadPlayer?.weaponTimer > 0 ? `${WEAPON_META[leadPlayer.weapon]?.label || "HEART"} ${Math.ceil(leadPlayer.weaponTimer)}` : leadPlayer?.luckyShield > 0 ? "SHIELD" : "HEART";
    dom.weaponText.textContent = weaponLabel;
    const ticket = currentLevelTicket(run);
    const dropReady = run.bossDefeated || Boolean(ticket);
    dom.dropStatusWrap.classList.toggle("is-hidden", !dropReady);
    dom.dropStatusText.textContent = ticket ? "CLAIMED" : "READY";
    dom.overdriveBar.style.width = `${Math.max(...players.map((p) => p.overdrive))}%`;
    const dashReady = Math.max(...players.map((p) => 1 - clamp(p.dashCd / MOVEMENT.dashCooldown, 0, 1)));
    dom.dashCooldownBar.style.width = `${dashReady * 100}%`;
    dom.pauseButton.setAttribute("aria-label", mode === "paused" ? "Resume" : "Pause");

    if (run.boss && run.boss.hp > 0) {
      dom.bossHud.classList.remove("is-hidden");
      dom.bossName.textContent = run.boss.name;
      dom.bossBar.style.width = `${Math.max(0, (run.boss.hp / run.boss.maxHp) * 100)}%`;
      dom.bossPhase.textContent = `${run.boss.phaseTitle || `Phase ${run.boss.phase}`} - ${run.boss.attackName || "Charging"}`;
    } else {
      dom.bossHud.classList.add("is-hidden");
    }
  }

  function initAudio() {
    if (!audioCtx) {
      try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        audioCtx = AudioContextCtor ? new AudioContextCtor() : null;
      } catch {
        audioCtx = null;
      }
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    setupAudioGraph();
    syncGameMusic();
  }

  function setupAudioGraph() {
    if (!audioCtx || sfxMaster) return;
    sfxMaster = audioCtx.createGain();
    sfxMaster.gain.value = 1.12;
    try {
      sfxLimiter = audioCtx.createDynamicsCompressor();
      sfxLimiter.threshold.setValueAtTime(-16, audioCtx.currentTime);
      sfxLimiter.knee.setValueAtTime(18, audioCtx.currentTime);
      sfxLimiter.ratio.setValueAtTime(7, audioCtx.currentTime);
      sfxLimiter.attack.setValueAtTime(0.004, audioCtx.currentTime);
      sfxLimiter.release.setValueAtTime(0.16, audioCtx.currentTime);
      sfxMaster.connect(sfxLimiter);
      sfxLimiter.connect(audioCtx.destination);
    } catch {
      sfxMaster.connect(audioCtx.destination);
      sfxLimiter = null;
    }
  }

  function ensureGameMusic() {
    if (gameMusic) return gameMusic;
    gameMusic = new Audio(GAME_MUSIC_SRC);
    gameMusic.loop = true;
    gameMusic.preload = "auto";
    gameMusic.volume = MENU_MUSIC_VOLUME;
    return gameMusic;
  }

  function restartGameMusic() {
    if (!settings.music && !gameMusic) return;
    const track = ensureGameMusic();
    musicPlayBlocked = false;
    track.pause();
    try {
      track.currentTime = 0;
    } catch {
      track.addEventListener("loadedmetadata", () => {
        try {
          track.currentTime = 0;
        } catch {
          // Some mobile browsers delay seekability until the first user-started play.
        }
      }, { once: true });
    }
  }

  function currentMusicVolume() {
    if (mode === "playing") {
      return run?.boss && !run.bossDefeated ? BOSS_MUSIC_VOLUME : GAMEPLAY_MUSIC_VOLUME;
    }
    if (mode === "paused" || mode === "lottery") return AMBIENT_MUSIC_VOLUME;
    if (mode === "settings" && (modeBeforeSettings === "paused" || modeBeforeSettings === "playing")) {
      return AMBIENT_MUSIC_VOLUME;
    }
    return MENU_MUSIC_VOLUME;
  }

  function shouldPlayGameMusic() {
    return settings.music && ["title", "playing", "paused", "settings", "results", "lottery"].includes(mode);
  }

  function syncGameMusic() {
    if (!gameMusic && !settings.music) return;
    const track = ensureGameMusic();
    track.volume = currentMusicVolume();
    if (!shouldPlayGameMusic()) {
      track.pause();
      return;
    }
    const playPromise = track.play();
    if (playPromise?.then) {
      playPromise
        .then(() => {
          musicPlayBlocked = false;
        })
        .catch(() => {
          musicPlayBlocked = true;
        });
    }
  }

  function playTone(freq, duration, type = "sine", gainValue = 0.04) {
    if (!settings.sound || !audioCtx) return;
    setupAudioGraph();
    const now = audioCtx.currentTime;
    const destination = sfxMaster || audioCtx.destination;
    const peak = Math.min(0.13, Math.max(0.01, gainValue * SFX_GAIN_BOOST));
    const harmonicPeak = peak * (type === "sine" ? 0.22 : 0.3);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const harmonic = audioCtx.createOscillator();
    const harmonicGain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, now);
    osc.type = type;
    harmonic.frequency.setValueAtTime(Math.max(40, freq * (type === "sawtooth" ? 0.5 : 2)), now);
    harmonic.type = type === "square" ? "triangle" : "sine";
    harmonic.detune.setValueAtTime(type === "sawtooth" ? -7 : 9, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    harmonicGain.gain.setValueAtTime(0.0001, now);
    harmonicGain.gain.exponentialRampToValueAtTime(harmonicPeak, now + 0.008);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.86);
    osc.connect(gain);
    harmonic.connect(harmonicGain);
    gain.connect(destination);
    harmonicGain.connect(destination);
    osc.start(now);
    harmonic.start(now);
    osc.stop(now + duration + 0.02);
    harmonic.stop(now + duration + 0.02);
  }

  function updatePulseMusic(dt) {
    if (musicPlayBlocked || (gameMusic && !gameMusic.paused)) return;
    syncGameMusic();
  }

  function addBurst(state, x, y, color, count, force) {
    if (settings.reducedMotion) count = Math.min(count, 8);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.25 + Math.random() * 0.75) * force;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        color,
        size: 3 + Math.random() * 5,
        t: 0,
        life: 0.28 + Math.random() * 0.36
      });
    }
  }

  function addFxBurst(state, x, y, row, size = 140, life = 0.4, rotation = 0) {
    if (!state?.fxBursts) return;
    state.fxBursts.push({ x, y, row, size, life, rotation, t: 0 });
  }

  function playerBox(p) {
    return {
      x: p.x + 8,
      y: p.y + 10,
      w: p.w - 16,
      h: p.h - 12
    };
  }

  function enemyBox(enemy) {
    return {
      x: enemy.x + 4,
      y: enemy.y + 4,
      w: enemy.w - 8,
      h: enemy.h - 6
    };
  }

  function bossBox(boss) {
    return {
      x: boss.x + 20,
      y: boss.y + 14,
      w: boss.w - 40,
      h: boss.h - 24
    };
  }

  function projectileBox(shot) {
    return {
      x: shot.x - shot.w * 0.5,
      y: shot.y - shot.h * 0.5,
      w: shot.w,
      h: shot.h
    };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function heartPath(x, y, size, dir = 1) {
    const s = size;
    ctx.moveTo(x, y + s * 0.48);
    ctx.bezierCurveTo(x - dir * s * 1.1, y - s * 0.18, x - dir * s * 0.62, y - s * 1.12, x, y - s * 0.54);
    ctx.bezierCurveTo(x + dir * s * 0.62, y - s * 1.12, x + dir * s * 1.1, y - s * 0.18, x, y + s * 0.48);
  }

  function roundedRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function approach(value, target, amount) {
    if (value < target) return Math.min(target, value + amount);
    if (value > target) return Math.max(target, value - amount);
    return target;
  }

  function smoothFactor(rate, dt = STEP) {
    return 1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
})();
