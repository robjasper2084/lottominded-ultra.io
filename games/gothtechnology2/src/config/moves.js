export const ATTACKS = {
  lightPunch: {
    motion: "LIGHT_PUNCH",
    damage: 42,
    chip: 4,
    meter: 8,
    stun: 0.2,
    blockstun: 0.16,
    startup: 0.08,
    active: [0.08, 0.2],
    recovery: 0.18,
    activeFrames: [1, 2, 3],
    frameBoxes: {
      1: { forward: 66, y: -130, w: 60, h: 56 },
      2: { forward: 92, y: -130, w: 78, h: 58 },
      3: { forward: 108, y: -130, w: 86, h: 58 }
    },
    reach: 82,
    width: 72,
    height: 58,
    y: -130,
    knockback: 150,
    level: "high"
  },
  heavyPunch: {
    motion: "HEAVY_PUNCH",
    damage: 88,
    chip: 8,
    meter: 13,
    stun: 0.34,
    blockstun: 0.25,
    startup: 0.16,
    active: [0.16, 0.32],
    recovery: 0.3,
    activeFrames: [2, 3],
    frameBoxes: {
      2: { forward: 92, y: -136, w: 82, h: 68 },
      3: { forward: 126, y: -136, w: 108, h: 72 }
    },
    reach: 112,
    width: 90,
    height: 70,
    y: -138,
    knockback: 260,
    level: "high"
  },
  lightKick: {
    motion: "LIGHT_KICK",
    damage: 48,
    chip: 4,
    meter: 8,
    stun: 0.22,
    blockstun: 0.17,
    startup: 0.1,
    active: [0.1, 0.23],
    recovery: 0.2,
    activeFrames: [2, 3],
    frameBoxes: {
      2: { forward: 78, y: -92, w: 76, h: 50 },
      3: { forward: 106, y: -88, w: 98, h: 54 }
    },
    reach: 96,
    width: 88,
    height: 52,
    y: -88,
    knockback: 170,
    level: "low"
  },
  heavyKick: {
    motion: "HEAVY_KICK",
    damage: 96,
    chip: 9,
    meter: 14,
    stun: 0.36,
    blockstun: 0.27,
    startup: 0.18,
    active: [0.18, 0.36],
    recovery: 0.34,
    activeFrames: [2, 3],
    frameBoxes: {
      2: { forward: 102, y: -112, w: 102, h: 66 },
      3: { forward: 142, y: -106, w: 142, h: 72 }
    },
    hurtboxesByFrame: {
      2: { offsetX: -10, w: 82, h: 166 },
      3: { offsetX: -16, w: 88, h: 164 }
    },
    reach: 132,
    width: 106,
    height: 58,
    y: -95,
    knockback: 310,
    level: "low"
  },
  crouchAttack: {
    motion: "CROUCH_ATTACK",
    damage: 60,
    chip: 5,
    meter: 9,
    stun: 0.26,
    blockstun: 0.2,
    startup: 0.12,
    active: [0.12, 0.28],
    recovery: 0.24,
    activeFrames: [2, 3],
    frameBoxes: {
      2: { forward: 82, y: -62, w: 82, h: 44 },
      3: { forward: 116, y: -60, w: 108, h: 48 }
    },
    hurtboxesByFrame: {
      2: { offsetX: -8, w: 92, h: 112 },
      3: { offsetX: -8, w: 96, h: 108 }
    },
    reach: 110,
    width: 96,
    height: 48,
    y: -62,
    knockback: 190,
    level: "low"
  },
  airAttack: {
    motion: "AIR_ATTACK",
    damage: 72,
    chip: 4,
    meter: 10,
    stun: 0.3,
    blockstun: 0.23,
    startup: 0.1,
    active: [0.1, 0.34],
    recovery: 0.18,
    activeFrames: [2, 3, 4],
    frameBoxes: {
      2: { forward: 72, y: -148, w: 78, h: 72 },
      3: { forward: 100, y: -142, w: 100, h: 86 },
      4: { forward: 112, y: -134, w: 108, h: 92 }
    },
    reach: 92,
    width: 94,
    height: 80,
    y: -150,
    knockback: 220,
    level: "high"
  },
  combo1: {
    motion: "COMBO_1",
    damage: 70,
    chip: 6,
    meter: 12,
    stun: 0.28,
    blockstun: 0.22,
    startup: 0.12,
    active: [0.12, 0.45],
    recovery: 0.34,
    activeFrames: [1, 2, 3, 4],
    reach: 128,
    width: 116,
    height: 84,
    y: -122,
    knockback: 230,
    level: "mid",
    multiHit: 2,
    hitInterval: 0.09
  },
  combo2: {
    motion: "COMBO_2",
    damage: 82,
    chip: 7,
    meter: 14,
    stun: 0.32,
    blockstun: 0.24,
    startup: 0.14,
    active: [0.14, 0.5],
    recovery: 0.36,
    activeFrames: [1, 2, 3, 4],
    reach: 136,
    width: 124,
    height: 90,
    y: -126,
    knockback: 280,
    level: "mid",
    multiHit: 2,
    hitInterval: 0.1
  },
  throw: {
    motion: "THROW_GRAB",
    finishMotion: "THROW_FINISH",
    damage: 118,
    meter: 10,
    startup: 0.08,
    active: [0.08, 0.22],
    recovery: 0.34,
    activeFrames: [1, 2],
    frameBoxes: {
      1: { forward: 38, y: -126, w: 54, h: 136 },
      2: { forward: 48, y: -126, w: 60, h: 140 }
    },
    reach: 54,
    width: 58,
    height: 142,
    y: -132,
    knockback: 360,
    level: "throw"
  },
  special: {
    motion: "SPECIAL_PROJECTILE",
    startMotion: "SPECIAL_START",
    recoverMotion: "SPECIAL_RECOVER",
    damage: 95,
    chip: 15,
    meter: 18,
    cost: 0,
    cooldown: 0.64,
    startup: 0.18,
    speed: 700,
    radius: 36,
    stun: 0.34,
    blockstun: 0.28,
    knockback: 320,
    level: "mid"
  },
  super: {
    motion: "SUPER_RELEASE",
    startMotion: "SUPER_CHARGE",
    damage: 245,
    chip: 42,
    meter: 0,
    cost: 100,
    cooldown: 2.2,
    startup: 0.28,
    speed: 880,
    radius: 74,
    stun: 0.68,
    blockstun: 0.5,
    knockback: 520,
    level: "mid",
    multiHit: 3,
    hitInterval: 0.075
  }
};

export const ASSISTS = {
  KALYX: {
    assist1: {
      name: "Shadow Raven",
      imageKey: "assistRaven",
      damage: 80,
      cooldown: 7.2,
      speed: 780,
      yOffset: -230,
      hitbox: { w: 100, h: 70 },
      motion: "SPECIAL_START",
      sheet: { sourceX: 0, sourceY: 0, cellWidth: 256, cellHeight: 256, row: 0, frames: 6, frameRate: 14, visualScale: 0.66 }
    },
    assist2: {
      name: "Nocturna Wraith",
      imageKey: "assistNocturna",
      damage: 68,
      cooldown: 8.4,
      speed: 640,
      yOffset: -158,
      hitbox: { w: 112, h: 100 },
      motion: "HEAVY_PUNCH",
      sheet: { sourceX: 0, sourceY: 0, cellWidth: 256, cellHeight: 256, row: 0, frames: 4, frameRate: 11, visualScale: 0.7 }
    }
  },
  MASTER_EZRA: {
    assist1: {
      name: "Owl Dive",
      imageKey: "assistOwl",
      damage: 76,
      cooldown: 7.6,
      speed: 760,
      yOffset: -220,
      hitbox: { w: 96, h: 70 },
      motion: "SPECIAL_START",
      sheet: { sourceX: 0, sourceY: 0, cellWidth: 256, cellHeight: 256, row: 0, frames: 6, frameRate: 14, visualScale: 0.7 }
    },
    assist2: {
      name: "Blue Fireball",
      imageKey: "ezraBlueBurst",
      damage: 86,
      cooldown: 8.2,
      speed: 920,
      xOffset: 78,
      yOffset: -188,
      hitbox: { w: 96, h: 96 },
      spawn: "hand",
      motion: "HEAVY_PUNCH",
      render: "handFireball"
    }
  },
  DETROIT_LENS: {
    assist1: {
      name: "Flash Drone",
      imageKey: "hitSpark",
      damage: 74,
      cooldown: 7.4,
      speed: 860,
      yOffset: -184,
      hitbox: { w: 94, h: 82 },
      motion: "SPECIAL_START",
      sheet: { sourceX: 0, sourceY: 0, cellWidth: 256, cellHeight: 256, row: 0, frames: 8, frameRate: 16, visualScale: 0.58 }
    },
    assist2: {
      name: "Frame Guard",
      imageKey: "blockShield",
      damage: 0,
      cooldown: 8.6,
      speed: 0,
      yOffset: -132,
      hitbox: { w: 120, h: 160 },
      motion: "BLOCK_HIGH",
      shield: true
    }
  },
  AMARA_VALENTINE: {
    assist1: {
      name: "Heartline Pulse",
      imageKey: "ezraBlueBurst",
      damage: 78,
      cooldown: 7.5,
      speed: 720,
      xOffset: 88,
      yOffset: -156,
      hitbox: { w: 108, h: 96 },
      spawn: "hand",
      motion: "SPECIAL_START",
      render: "lovePulse"
    },
    assist2: {
      name: "Devotion Guard",
      imageKey: "blockShield",
      damage: 0,
      cooldown: 8.3,
      speed: 0,
      yOffset: -132,
      hitbox: { w: 126, h: 166 },
      motion: "BLOCK_HIGH",
      shield: true
    }
  }
};

ASSISTS.DETROIT_LENS_NOIR = ASSISTS.DETROIT_LENS;
