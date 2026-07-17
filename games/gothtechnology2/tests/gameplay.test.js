import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { attackIntentFromActions, resolveCancelAttack } from "../src/gameplay/commands.js";
import { ASSET_URLS, COMMERCIAL_URLS, FIGHTERS, MOTION_PLAYBACK } from "../src/config/assets.js";
import { ARCADE_LADDER, COMMAND_LISTS, GAME_MODES, ROSTER_CARD_LAYOUT, ROSTER_IDS, STAGES, arcadeRouteFor } from "../src/config/content.js";
import { GROUND_Y } from "../src/config/constants.js";
import { Fighter } from "../src/gameplay/fighter.js";
import { applyHit, resolveMelee } from "../src/gameplay/combat.js";
import { CpuController } from "../src/gameplay/cpu.js";
import { LovePulseEffect } from "../src/gameplay/effects.js";
import { registerAttackHit, sliceAttackForHit } from "../src/gameplay/hits.js";
import { BoerboelStrike, Projectile } from "../src/gameplay/projectiles.js";
import { applyRoundOutcomeMotions, resolveRoundOutcome } from "../src/gameplay/rounds.js";

const motionManifest = JSON.parse(readFileSync(new URL("../assets/motion-atlases/motion-atlas-manifest.json", import.meta.url), "utf8"));
const boerboelManifest = JSON.parse(readFileSync(new URL("../assets/user-effects/detroit-boerboel-atlas.json", import.meta.url), "utf8"));
const companionManifest = JSON.parse(readFileSync(new URL("../assets/user-assists/companion-projectiles.json", import.meta.url), "utf8"));
const EXPECTED_MOTIONS = [
  "IDLE", "READY_STANCE", "CROUCH_IDLE", "CROUCH_WALK", "DASH_BACK", "DASH_FORWARD",
  "JUMP_FALL", "JUMP_PEAK", "JUMP_RISE", "JUMP_START", "LANDING", "RUN_BACK", "RUN_FORWARD",
  "WALK_BACK", "WALK_FORWARD", "AIR_ATTACK", "COMBO_1", "COMBO_2", "CROUCH_ATTACK",
  "HEAVY_KICK", "HEAVY_PUNCH", "LIGHT_KICK", "LIGHT_PUNCH", "SPECIAL_PROJECTILE",
  "SPECIAL_RECOVER", "SPECIAL_START", "SUPER_CHARGE", "SUPER_RELEASE", "THROW_FINISH",
  "THROW_GRAB", "BLOCK_HIGH", "BLOCK_LOW", "DEFEAT", "GET_UP", "HURT_HEAVY",
  "HURT_LIGHT", "KNOCKDOWN", "TAUNT", "VICTORY"
];

const makeGame = () => ({
  assets: { images: { dust: null, hitSpark: null, blockShield: null } },
  audio: { beep() {} },
  effects: [],
  hitstop: 0,
  shake: 0,
  slowMo: 0,
  spawnAssist() {},
  spawnProjectile() {},
  spawnFighterVfx() {},
  recordCombatEvent() {}
});

const animation = (durationMs = 90) => ({
  frames: Array.from({ length: 6 }, () => ({ duration_ms: durationMs }))
});

const completeAnimations = Object.fromEntries(Object.keys(FIGHTERS).map((characterId) => [
  characterId,
  new Proxy({}, { get: () => animation() })
]));

const makeFighter = (id = "KALYX", x = 360, facing = 1, animations = {}) => {
  const config = FIGHTERS[id];
  return new Fighter({ id, slot: 1, config: { ...config }, assets: { animations }, x, facing });
};

test("stable motion frames keep fixed visual height and grounded pose ratios", () => {
  assert.equal(motionManifest.stabilizationVersion, 1);
  for (const character of Object.values(motionManifest.characters)) {
    const stableMotions = new Set(character.stabilization.stableHeightMotions);
    for (const [motionName, motion] of Object.entries(character.motions)) {
      const heights = motion.frames.map((frame) => frame.content.visibleH * frame.content.scale);
      assert.ok(heights.every((height) => height > 0), `${motionName} has invalid stabilized height`);
      if (stableMotions.has(motionName)) {
        assert.ok(Math.max(...heights) - Math.min(...heights) < 0.05, `${motionName} still pulses`);
      }
    }
    const averageHeight = (motionName) => {
      const heights = character.motions[motionName].frames.map((frame) => frame.content.visibleH * frame.content.scale);
      return heights.reduce((sum, height) => sum + height, 0) / heights.length;
    };
    const idleHeight = averageHeight("IDLE");
    assert.ok(Math.abs(averageHeight("CROUCH_IDLE") / idleHeight - 0.72) < 0.02);
    assert.ok(Math.abs(averageHeight("RUN_FORWARD") / idleHeight - 0.90) < 0.02);
  }
});

test("Ezra crouches without shrinking his entire body", () => {
  assert.equal(FIGHTERS.MASTER_EZRA.motionScaleOverrides.CROUCH_IDLE, 1.18);
  assert.equal(FIGHTERS.MASTER_EZRA.motionScaleOverrides.CROUCH_WALK, 1.18);
});

test("Detroit Lens keeps full body scale while firing the eye laser", () => {
  assert.equal(FIGHTERS.DETROIT_LENS_NOIR.motionScaleOverrides.SUPER_RELEASE, 1.38);
});

test("double KO and tied timeout are neutral draws", () => {
  assert.deepEqual(resolveRoundOutcome(0, 0, 32), { draw: true, winnerIndex: null, reason: "double_KO" });
  assert.deepEqual(resolveRoundOutcome(500, 500, 0), { draw: true, winnerIndex: null, reason: "timeout" });
});

test("non-tied rounds select the correct winner", () => {
  assert.equal(resolveRoundOutcome(0, 250, 12).winnerIndex, 1);
  assert.equal(resolveRoundOutcome(700, 400, 0).winnerIndex, 0);
  assert.equal(resolveRoundOutcome(700, 400, 12), null);
});

test("combo inputs and cancel chains reach configured combo attacks", () => {
  assert.equal(attackIntentFromActions({ lightPunch: true, heavyPunch: true, grounded: true }), "combo1");
  assert.equal(attackIntentFromActions({ lightPunch: true, lightKick: true, grounded: true }), "combo2");
  assert.equal(resolveCancelAttack("lightPunch", "heavyPunch"), "combo1");
  assert.equal(resolveCancelAttack("combo1", "heavyKick"), "combo2");
});

test("multi-hit registration honors count and interval", () => {
  const state = {};
  const attack = { active: [0.1, 0.5], multiHit: 3, hitInterval: 0.08 };
  assert.deepEqual(registerAttackHit(state, "target", attack, 0.1), { hitIndex: 1, maxHits: 3 });
  assert.equal(registerAttackHit(state, "target", attack, 0.14), null);
  assert.deepEqual(registerAttackHit(state, "target", attack, 0.18), { hitIndex: 2, maxHits: 3 });
  assert.deepEqual(registerAttackHit(state, "target", attack, 0.26), { hitIndex: 3, maxHits: 3 });
  assert.equal(registerAttackHit(state, "target", attack, 0.4), null);
});

test("multi-hit slices preserve configured total damage", () => {
  const attack = { damage: 245, chip: 42, meter: 18, knockback: 510, multiHit: 3 };
  const slices = [1, 2, 3].map((hitIndex) => sliceAttackForHit(attack, hitIndex));
  assert.equal(slices.reduce((sum, slice) => sum + slice.damage, 0), 245);
  assert.equal(slices.reduce((sum, slice) => sum + slice.chip, 0), 42);
  assert.equal(slices.reduce((sum, slice) => sum + slice.meter, 0), 18);
  assert.equal(slices.reduce((sum, slice) => sum + slice.knockback, 0), 510);
});

test("locomotion states reach walk, run, crouch-walk, and distinct dashes", () => {
  const fighter = makeFighter();
  const opponent = makeFighter("MASTER_EZRA", 900, -1);
  const game = makeGame();

  fighter.update(1 / 60, { right: true }, opponent, game);
  assert.equal(fighter.motion, "WALK_FORWARD");
  for (let frame = 0; frame < 24; frame += 1) fighter.update(1 / 60, { right: true }, opponent, game);
  assert.equal(fighter.motion, "RUN_FORWARD");

  fighter.resetRound(360, 1);
  fighter.update(1 / 60, { right: true, down: true }, opponent, game);
  assert.equal(fighter.motion, "CROUCH_WALK");

  fighter.resetRound(360, 1);
  fighter.update(1 / 60, { right: true, dash: true }, opponent, game);
  assert.equal(fighter.motion, "DASH_FORWARD");

  fighter.resetRound(360, 1);
  fighter.update(1 / 60, { left: true, dash: true }, opponent, game);
  assert.equal(fighter.motion, "DASH_BACK");
});

test("runtime animations meet minimum unique-frame requirements", () => {
  for (const [characterId, character] of Object.entries(motionManifest.characters)) {
    assert.equal(FIGHTERS[characterId].airScale, undefined, `${characterId} must not change scale in the air`);
    assert.deepEqual(Object.keys(character.motions).sort(), [...EXPECTED_MOTIONS].sort(), `${characterId} is missing a runtime motion`);
    for (const [motion, data] of Object.entries(character.motions)) {
      assert.equal(data.frameCount, 6, `${characterId} ${motion} is incomplete`);
      assert.ok(data.uniqueFrames >= 6, `${characterId} ${motion} lacks distinct motion frames`);
    }
  }
});

test("Kalyx and Ezra launch complete Higgsfield companion weapons", () => {
  assert.equal(companionManifest.provider, "Higgsfield Nano Banana Pro");
  assert.equal(FIGHTERS.KALYX.specialName, "Shadow Raven Strike");
  assert.equal(FIGHTERS.MASTER_EZRA.specialName, "Arcane Owl Dive");
  assert.match(ASSET_URLS.assists.raven, /kalyx-shadow-raven-strike\.webp/);
  assert.match(ASSET_URLS.assists.owl, /ezra-arcane-owl-strike\.webp/);
  assert.equal(COMMAND_LISTS.KALYX.commands.some((command) => command.name === "SHADOW RAVEN STRIKE"), true);
  assert.equal(COMMAND_LISTS.MASTER_EZRA.commands.some((command) => command.name === "ARCANE OWL DIVE"), true);
  for (const companion of Object.values(companionManifest.companions)) {
    assert.equal(companion.frames, 6);
    assert.equal(companion.uniqueFrames, 6);
    assert.deepEqual(companion.sourceFigureCounts, [3, 3]);
  }
});

test("Detroit Lens Noir ships a complete guardian kit, Boerboel command list, and six approved stages", () => {
  const fighter = FIGHTERS.DETROIT_LENS_NOIR;
  assert.equal(fighter.manifestKey, "DETROIT_LENS_NOIR");
  assert.equal(fighter.archetype, "precision");
  assert.equal(fighter.specialName, "Boerboel Rush");
  assert.equal(fighter.superName, "Red-Eye Exposure");
  assert.equal(fighter.costumePalette, "black-black");
  assert.equal(fighter.palette, "#9ca3ad");
  assert.equal(Object.keys(motionManifest.characters.DETROIT_LENS_NOIR.motions).length, 39);
  assert.deepEqual(ROSTER_IDS, ["KALYX", "MASTER_EZRA", "DETROIT_LENS_NOIR", "AMARA_VALENTINE"]);
  assert.equal(ROSTER_CARD_LAYOUT.length, ROSTER_IDS.length);
  assert.deepEqual(Object.keys(ASSET_URLS.rosterPortraits), ["kalyx", "masterEzra", "detroitLensNoir", "amaraValentine"]);
  assert.equal(new Set(ROSTER_IDS.map((id) => FIGHTERS[id].rosterPortraitKey)).size, ROSTER_IDS.length);
  assert.ok(!Object.hasOwn(FIGHTERS, "KALYX_ECLIPSE"));
  assert.ok(!Object.hasOwn(FIGHTERS, "EZRA_ASCENDANT"));
  assert.ok(!Object.hasOwn(COMMAND_LISTS, "KALYX_ECLIPSE"));
  assert.ok(!Object.hasOwn(COMMAND_LISTS, "EZRA_ASCENDANT"));
  assert.ok(!ARCADE_LADDER.includes("DETROIT_LENS"));
  assert.ok(ARCADE_LADDER.includes("DETROIT_LENS_NOIR"));
  assert.ok(COMMAND_LISTS.DETROIT_LENS_NOIR.commands.some((command) => command.name === "BOERBOEL RUSH"));
  assert.ok(STAGES.some((stage) => stage.id === "detroit-midnight-mile"));
  assert.ok(STAGES.some((stage) => stage.id === "motor-city-assembly"));
  assert.ok(STAGES.some((stage) => stage.id === "detroit-riverfront"));
  assert.ok(STAGES.some((stage) => stage.id === "eastern-market-after-dark"));
  assert.ok(STAGES.some((stage) => stage.id === "michigan-central-concourse"));
  assert.equal(STAGES.length, 6);
  assert.ok(!STAGES.some((stage) => stage.id === "ember-gate"));
  assert.ok(!STAGES.some((stage) => stage.id === "moon-shrine"));
  assert.equal(boerboelManifest.frameCount, 24);
  assert.deepEqual(Object.keys(boerboelManifest.motions), ["SUMMON", "RUN", "ATTACK", "RECOVER"]);
  for (const motion of Object.values(boerboelManifest.motions)) {
    assert.equal(motion.frames, 6);
    assert.ok(motion.uniqueFrames >= 5);
    assert.deepEqual(motion.sourceFigureCounts, [3, 3]);
  }
});

test("Amara Valentine ships 39 complete motions and a distinct love-power combat identity", () => {
  const fighter = FIGHTERS.AMARA_VALENTINE;
  assert.equal(fighter.manifestKey, "AMARA_VALENTINE");
  assert.equal(fighter.archetype, "heartline");
  assert.equal(fighter.costumePalette, "cobalt-rose");
  assert.equal(fighter.specialName, "Heartline Pulse");
  assert.equal(fighter.superName, "Heartbreak Nova");
  assert.ok(fighter.attackOverrides.special.knockback < 0, "Heartline Pulse should attract on hit");
  assert.ok(fighter.attackOverrides.special.charmDuration > 0, "Heartline Pulse should apply charm");
  assert.ok(fighter.attackOverrides.super.knockback > 0, "Heartbreak Nova should repel on hit");
  assert.equal(fighter.attackOverrides.super.multiHit, 4);
  assert.equal(Object.keys(motionManifest.characters.AMARA_VALENTINE.motions).length, 39);
  assert.equal(motionManifest.characters.AMARA_VALENTINE.motions.JUMP_PEAK.repair, "amara-aerial-v1");
  assert.equal(motionManifest.characters.AMARA_VALENTINE.motions.AIR_ATTACK.repair, "amara-aerial-v1");
  assert.match(ASSET_URLS.rosterPortraits.amaraValentine, /amara-valentine-idle\.webp/);
  assert.ok(COMMAND_LISTS.AMARA_VALENTINE.commands.some((command) => command.name === "CHARM COUNTER"));
  assert.ok(COMMAND_LISTS.AMARA_VALENTINE.commands.some((command) => command.name === "HEARTLINE PULSE"));
  assert.ok(COMMAND_LISTS.AMARA_VALENTINE.commands.some((command) => command.name === "HEARTBREAK NOVA"));

  const game = makeGame();
  const amara = makeFighter("AMARA_VALENTINE", 400, 1, completeAnimations);
  const attacker = makeFighter("KALYX", 650, -1, completeAnimations);
  amara.meter = 100;
  assert.equal(amara.useCharacterSkill(attacker, game), true);
  assert.ok(amara.parryTimer > 0);
  assert.equal(amara.motion, "SPECIAL_START");
  assert.equal(attacker.vx, 0, "Charm Counter must not pull before an attack is parried");
  applyHit(attacker, amara, { damage: 90, stun: 0.25, knockback: 180, meter: 6, level: "mid" }, game, { sourceName: "heavyPunch" });
  assert.equal(amara.parryTimer, 0);
  assert.ok(attacker.hitstun >= 0.3);
  assert.ok(attacker.vx < 0, "a charmed attacker should be pulled toward Amara");
  assert.ok(attacker.charmedTimer > 0, "a countered attacker should be visibly charmed");

  const pulseTarget = makeFighter("MASTER_EZRA", 650, -1, completeAnimations);
  applyHit(amara, pulseTarget, fighter.attackOverrides.special, game, { sourceName: "special", projectile: true });
  assert.equal(pulseTarget.charmedTimer, fighter.attackOverrides.special.charmDuration);

  const linkTarget = makeFighter("MASTER_EZRA", 520, -1, completeAnimations);
  linkTarget.charmedTimer = 1;
  amara.comboHits = 0;
  const healthBefore = linkTarget.health;
  applyHit(amara, linkTarget, { damage: 100, stun: 0.2, recovery: 0.1, knockback: 120, meter: 0, level: "mid" }, game, { sourceName: "heavyPunch", projectile: false });
  assert.equal(healthBefore - linkTarget.health, 116);
  assert.equal(linkTarget.charmedTimer, 0, "a clean Heartlink strike should consume charm");
  assert.equal(game.trainingReadout.outcome, "HEARTLINK");
});

test("Amara love charge effects retain their authored skill and super offsets", () => {
  const owner = { x: 400, y: 650, facing: -1 };
  const superCharge = new LovePulseEffect({ owner, offsetX: 48, offsetY: -132 });
  superCharge.update(1 / 60);
  assert.equal(superCharge.x, 352);
  assert.equal(superCharge.y, 518);

  const skillCharge = new LovePulseEffect({ owner, offsetX: 36, offsetY: -112 });
  skillCharge.update(1 / 60);
  assert.equal(skillCharge.x, 364);
  assert.equal(skillCharge.y, 538);
});

test("Amara normals and love projectile register through live collision paths", () => {
  const animations = {
    AMARA_VALENTINE: motionManifest.characters.AMARA_VALENTINE.motions,
    MASTER_EZRA: motionManifest.characters.MASTER_EZRA.motions
  };
  const meleeMoves = ["lightPunch", "heavyPunch", "lightKick", "heavyKick", "crouchAttack", "airAttack", "combo1", "combo2"];

  for (const move of meleeMoves) {
    const amara = makeFighter("AMARA_VALENTINE", 400, 1, animations);
    const defender = makeFighter("MASTER_EZRA", 620, -1, animations);
    const game = {
      ...makeGame(),
      resolveIncomingHit(attacker, target, attack, meta) {
        applyHit(attacker, target, attack, this, meta);
      }
    };
    amara.invulnerable = 0;
    defender.invulnerable = 0;
    if (move === "airAttack") amara.y = GROUND_Y - 96;
    const healthBefore = defender.health;
    assert.equal(amara.beginAttack(move, game), true, `${move} should start`);
    for (let frame = 0; frame < 48 && defender.health === healthBefore; frame += 1) {
      amara.update(1 / 60, {}, defender, game);
      resolveMelee(amara, defender, game);
    }
    assert.ok(defender.health < healthBefore, `${move} should connect at visible contact range`);
  }

  const amara = makeFighter("AMARA_VALENTINE", 400, 1, animations);
  const defender = makeFighter("MASTER_EZRA", 620, -1, animations);
  const game = {
    ...makeGame(),
    fighters: [amara, defender],
    resolveIncomingHit(attacker, target, attack, meta) {
      applyHit(attacker, target, attack, this, meta);
    }
  };
  amara.invulnerable = 0;
  defender.invulnerable = 0;
  const special = amara.getAttackData("special");
  const pulse = new Projectile({
    owner: amara,
    x: amara.x + 124,
    y: amara.y - 142,
    direction: 1,
    attack: special,
    image: null,
    kind: "heartline-pulse",
    color: "#ff58bd"
  });
  const healthBefore = defender.health;
  pulse.update(1 / 60, game);
  assert.ok(defender.health < healthBefore, "Heartline Pulse should damage through projectile collision");
  assert.ok(defender.charmedTimer > 0, "Heartline Pulse should charm on collision");
});

test("title menu exposes only the four approved modes", () => {
  assert.deepEqual(Object.keys(GAME_MODES), ["versus", "arcade", "training", "replay"]);
});

test("Arcade routes provide five staged matches and alternating commercial breaks", () => {
  assert.equal(COMMERCIAL_URLS.length, 2);
  for (const playerId of ROSTER_IDS) {
    const route = arcadeRouteFor(playerId);
    assert.equal(route.length, 5);
    assert.deepEqual(route.map((node) => node.stageIndex), [1, 2, 3, 4, 5]);
    assert.ok(route.every((node) => ROSTER_IDS.includes(node.opponentId)));
    assert.equal(route.at(-1).difficulty, "hard");
  }
});

test("Kalyx uses the approved black and crimson costume identity", () => {
  assert.equal(FIGHTERS.KALYX.costumePalette, "black-crimson");
  assert.equal(FIGHTERS.KALYX.palette, "#c51f35");
  assert.equal(FIGHTERS.KALYX.accent, "#ff5b68");
});

test("Detroit Lens keeps only the original black costume atlas", () => {
  const noir = FIGHTERS.DETROIT_LENS_NOIR;
  assert.ok(!Object.hasOwn(FIGHTERS, "DETROIT_LENS"));
  assert.ok(!Object.hasOwn(motionManifest.characters, "DETROIT_LENS"));
  assert.equal(noir.costumePalette, "black-black");
  assert.equal(noir.manifestKey, "DETROIT_LENS_NOIR");
  assert.equal(noir.motionRemap.SPECIAL_START, "SPECIAL_PROJECTILE");
  assert.equal(motionManifest.characters.DETROIT_LENS_NOIR.motions.SPECIAL_PROJECTILE.source, "higgsfield-v4-body-only");
  assert.equal(Object.keys(motionManifest.characters.DETROIT_LENS_NOIR.motions).length, 39);
  for (const motion of Object.values(motionManifest.characters.DETROIT_LENS_NOIR.motions)) {
    assert.match(motion.sheet, /detroit-lens-noir-/);
  }
});

test("Kalyx aerial atlas keeps one bounded unique figure in every frame", () => {
  for (const motionName of ["JUMP_START", "JUMP_RISE", "JUMP_PEAK", "JUMP_FALL", "LANDING", "AIR_ATTACK"]) {
    const motion = motionManifest.characters.KALYX.motions[motionName];
    assert.equal(motion.frames.length, 6);
    assert.ok(motion.uniqueFrames >= 5);
    if (motionName === "AIR_ATTACK") assert.equal(motion.source, "higgsfield-v4-body-only");
    else assert.match(motion.source, /^higgsfield-v3-body-vfx$/);
    for (const frame of motion.frames) {
      assert.ok(frame.content.w < 190, `${motionName} retained a full-cell divider or duplicate silhouette`);
      assert.ok(frame.content.h <= 184);
    }
  }
});

test("special and super releases use body-only runtime frames with layered engine effects", () => {
  for (const characterId of ["KALYX", "MASTER_EZRA"]) {
    for (const motionName of ["SPECIAL_START", "SPECIAL_PROJECTILE", "SPECIAL_RECOVER", "SUPER_CHARGE", "SUPER_RELEASE"]) {
      assert.equal(motionManifest.characters[characterId].motions[motionName].source, "higgsfield-v4-body-only");
    }
  }
  for (const motionName of ["SPECIAL_PROJECTILE", "SPECIAL_RECOVER", "SUPER_CHARGE", "SUPER_RELEASE"]) {
    assert.equal(motionManifest.characters.DETROIT_LENS_NOIR.motions[motionName].source, "higgsfield-v4-body-only");
  }
});

test("runtime locomotion playback retains at least four distinct poses", () => {
  for (const characterId of Object.keys(FIGHTERS)) {
    for (const motion of ["RUN_FORWARD", "RUN_BACK"]) {
      const order = MOTION_PLAYBACK[characterId]?.[motion] ?? [0, 1, 2, 3, 4, 5];
      assert.ok(new Set(order).size >= 4);
      assert.notEqual(order[0], order[order.length - 1]);
    }
  }
  assert.deepEqual(MOTION_PLAYBACK.KALYX.KNOCKDOWN, [0, 1, 3, 4, 2, 5]);
});

test("Master Ezra jump keeps takeoff, advances once through each air phase, and lands cleanly", () => {
  const ezraAnimations = new Proxy({}, {
    get: (_target, motion) => ({
      ...animation(78),
      playbackOrder: MOTION_PLAYBACK.MASTER_EZRA[motion] ?? null
    })
  });
  const fighter = makeFighter("MASTER_EZRA", 360, 1, { MASTER_EZRA: ezraAnimations });
  const opponent = makeFighter("KALYX", 900, -1);
  const game = makeGame();
  const airMotions = ["JUMP_START", "JUMP_RISE", "JUMP_PEAK", "JUMP_FALL"];
  const seen = new Set();
  const lastPlaybackPosition = new Map();

  fighter.update(1 / 60, { up: true }, opponent, game);
  assert.equal(fighter.motion, "JUMP_START");

  for (let frame = 0; frame < 120; frame += 1) {
    if (airMotions.includes(fighter.motion)) {
      seen.add(fighter.motion);
      const order = MOTION_PLAYBACK.MASTER_EZRA[fighter.motion];
      const position = order.indexOf(fighter.getMotionFrameIndex());
      assert.ok(position >= (lastPlaybackPosition.get(fighter.motion) ?? 0), `${fighter.motion} looped backward`);
      lastPlaybackPosition.set(fighter.motion, position);
    }
    if (fighter.motion === "LANDING") seen.add("LANDING");
    fighter.update(1 / 60, {}, opponent, game);
    if (fighter.grounded && fighter.motion === "IDLE") break;
  }

  assert.deepEqual([...seen], ["JUMP_START", "JUMP_RISE", "JUMP_PEAK", "JUMP_FALL", "LANDING"]);
  assert.deepEqual(MOTION_PLAYBACK.MASTER_EZRA.LANDING, [1, 0, 4, 5]);
});

test("Kalyx aerial states use dedicated rise, peak, fall, attack, and landing motion", () => {
  const kalyxAnimations = new Proxy({}, {
    get: (_target, motion) => ({
      ...animation(78),
      playbackOrder: MOTION_PLAYBACK.KALYX[motion] ?? null
    })
  });
  const fighter = makeFighter("KALYX", 360, 1, { KALYX: kalyxAnimations });
  const opponent = makeFighter("MASTER_EZRA", 900, -1);
  const game = makeGame();
  const seen = new Set();

  fighter.update(1 / 60, { up: true }, opponent, game);
  for (let frame = 0; frame < 120; frame += 1) {
    seen.add(fighter.motion);
    const action = fighter.motion === "JUMP_FALL" && !seen.has("AIR_ATTACK") ? { lightKick: true } : {};
    fighter.update(1 / 60, action, opponent, game);
    if (fighter.grounded && fighter.motion === "IDLE") break;
  }

  for (const motion of ["JUMP_START", "JUMP_RISE", "AIR_ATTACK", "JUMP_PEAK", "JUMP_FALL", "LANDING"]) {
    assert.ok(seen.has(motion), `${motion} was unreachable`);
  }
  assert.equal(fighter.currentAttack, null, "air attack should end when the fighter touches down");
  assert.deepEqual(MOTION_PLAYBACK.KALYX.LANDING, [2, 3, 4, 5]);
});

test("fighter identity skills reach Kalyx shadow step and Ezra parry", () => {
  const game = makeGame();
  const kalyx = makeFighter("KALYX", 400, 1, completeAnimations);
  const ezra = makeFighter("MASTER_EZRA", 680, -1, completeAnimations);
  kalyx.meter = 100;
  assert.equal(kalyx.useCharacterSkill(ezra, game), true);
  assert.ok(kalyx.x > ezra.x);
  assert.ok(kalyx.invulnerable > 0);

  ezra.meter = 100;
  assert.equal(ezra.useCharacterSkill(kalyx, game), true);
  assert.ok(ezra.parryTimer > 0);
  applyHit(kalyx, ezra, { damage: 90, stun: 0.25, knockback: 180, meter: 6, level: "mid" }, game, { sourceName: "heavyPunch" });
  assert.equal(ezra.parryTimer, 0);
  assert.ok(kalyx.hitstun >= 0.3);
});

test("Detroit Lens Guardian Intercept calls the Boerboel and interrupts nearby pressure", () => {
  const hits = [];
  const vfx = [];
  const game = {
    ...makeGame(),
    resolveIncomingHit(attacker, defender, attack, meta) { hits.push({ attacker, defender, attack, meta }); },
    spawnFighterVfx(_fighter, name, phase) { vfx.push({ name, phase }); }
  };
  const detroit = makeFighter("DETROIT_LENS_NOIR", 420, 1, completeAnimations);
  const opponent = makeFighter("KALYX", 660, -1, completeAnimations);
  detroit.meter = 100;
  assert.equal(detroit.useCharacterSkill(opponent, game), true);
  assert.equal(detroit.motion, "SPECIAL_START");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].meta.sourceName, "guardianIntercept");
  assert.equal(hits[0].meta.projectile, false);
  assert.deepEqual(vfx, [{ name: "skill", phase: "charge" }]);
});

test("Boerboel Rush advances through summon, run, bite hit, and recovery", () => {
  const hits = [];
  const owner = makeFighter("DETROIT_LENS_NOIR", 300, 1, completeAnimations);
  const target = makeFighter("KALYX", 600, -1, completeAnimations);
  const game = {
    ...makeGame(),
    fighters: [owner, target],
    resolveIncomingHit(attacker, defender, attack, meta) { hits.push({ attacker, defender, attack, meta }); }
  };
  const dog = new BoerboelStrike({
    owner,
    x: owner.x - 72,
    y: owner.y,
    direction: 1,
    attack: owner.getAttackData("special"),
    image: null
  });

  dog.update(0.25, game);
  assert.equal(dog.phase, "run");
  dog.update(0.36, game);
  assert.equal(dog.phase, "attack");
  dog.update(0.16, game);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].meta.sourceName, "boerboelRush");
  dog.update(0.32, game);
  assert.equal(dog.phase, "recover");
  dog.update(0.45, game);
  assert.equal(dog.dead, true);
});

test("Detroit Lens precision projectiles gain bonus meter at long range", () => {
  const game = makeGame();
  const detroit = makeFighter("DETROIT_LENS_NOIR", 300, 1, completeAnimations);
  const opponent = makeFighter("KALYX", 720, -1, completeAnimations);
  const baseMeter = detroit.meter;
  applyHit(detroit, opponent, { damage: 30, meter: 5, stun: 0.2, knockback: 80 }, game, {
    projectile: true,
    level: "mid",
    sourceName: "special"
  });
  assert.equal(detroit.meter - baseMeter, 9);
});

test("perfect blocks negate chip and throw tech breaks the grab", () => {
  const events = [];
  const game = { ...makeGame(), recordCombatEvent(event) { events.push(event.type); } };
  const attacker = makeFighter("KALYX", 420, 1, completeAnimations);
  const defender = makeFighter("MASTER_EZRA", 470, -1, completeAnimations);
  defender.slot = 2;
  defender.lastActions = { right: true };
  defender.guardTapTimer = 0.1;
  const health = defender.health;
  applyHit(attacker, defender, { damage: 80, chip: 12, stun: 0.25, blockstun: 0.2, recovery: 0.16, knockback: 120, level: "mid" }, game, { sourceName: "heavyPunch" });
  assert.equal(defender.health, health);
  assert.equal(game.trainingReadout.outcome, "PERFECT BLOCK");
  assert.ok(events.includes("perfectBlock"));

  defender.lastActions = {};
  defender.throwTechTimer = 0.18;
  attacker.beginAttack("throw", game);
  attacker.currentAttack.elapsed = 0.12;
  attacker.motionElapsed = attacker.getMotionPlaybackDuration("THROW_GRAB") * 0.28;
  resolveMelee(attacker, defender, { ...game, resolveIncomingHit() {} });
  assert.equal(attacker.currentAttack, null);
  assert.ok(events.includes("throwTech"));
});

test("assists and supers reach their release states", () => {
  let assists = 0;
  let projectiles = 0;
  const game = {
    ...makeGame(),
    spawnAssist() { assists += 1; },
    spawnProjectile() { projectiles += 1; }
  };
  const fighter = makeFighter("KALYX", 420, 1, completeAnimations);
  const opponent = makeFighter("MASTER_EZRA", 760, -1, completeAnimations);
  fighter.useAssist("assist1", game);
  fighter.useAssist("assist2", game);
  assert.equal(assists, 2);

  fighter.meter = 100;
  assert.equal(fighter.beginAttack("super", game), true);
  assert.equal(fighter.motion, "SUPER_CHARGE");
  fighter.update(fighter.currentAttack.spawnAt + 0.01, {}, opponent, game);
  assert.equal(fighter.motion, "SUPER_RELEASE");
  assert.equal(projectiles, 1);
});

test("CPU decisions are deterministic and use anti-air and projectile defense", () => {
  const player = makeFighter("KALYX", 500, 1);
  const cpu = makeFighter("MASTER_EZRA", 620, -1);
  cpu.slot = 2;
  const world = { left: 0, right: 1280 };
  player.y = GROUND_Y - 120;
  const a = new CpuController().next(1 / 60, { cpu, player, projectiles: [], difficulty: "hard", world });
  const b = new CpuController().next(1 / 60, { cpu, player, projectiles: [], difficulty: "hard", world });
  assert.deepEqual(a, b);
  assert.equal(a.heavyKick, true);

  player.y = GROUND_Y;
  cpu.meter = 100;
  const projectile = { owner: { slot: 1 }, dead: false, x: 360, y: cpu.y - 80, direction: 1 };
  const defense = new CpuController().next(1 / 60, { cpu, player, projectiles: [projectile], difficulty: "hard", world });
  assert.deepEqual(defense, { down: true, special: true });
});

test("Amara CPU uses Heartlink confirms and both devotion assists", () => {
  const world = { left: 0, right: 1280 };
  const player = makeFighter("KALYX", 500, 1);
  const cpu = makeFighter("AMARA_VALENTINE", 620, -1);
  cpu.slot = 2;
  player.charmedTimer = 1;
  const confirm = new CpuController().next(1 / 60, { cpu, player, projectiles: [], difficulty: "hard", world });
  assert.deepEqual(confirm, { lightPunch: true, heavyPunch: true });

  player.charmedTimer = 0;
  player.x = 320;
  const pulseController = new CpuController();
  pulseController.cadence = 4;
  const pulseAssist = pulseController.next(1 / 60, { cpu, player, projectiles: [], difficulty: "hard", world });
  assert.deepEqual(pulseAssist, { assist1: true });

  const guardController = new CpuController();
  guardController.cadence = 2;
  const projectile = { owner: { slot: 1 }, dead: false, x: 430, y: cpu.y - 80, direction: 1 };
  const guardAssist = guardController.next(1 / 60, { cpu, player, projectiles: [projectile], difficulty: "hard", world });
  assert.deepEqual(guardAssist, { assist2: true });
});

test("melee boxes are authored by animation frame and disappear in recovery", () => {
  const fighter = makeFighter("KALYX", 420, 1, completeAnimations);
  fighter.beginAttack("heavyKick", makeGame());
  const frameDuration = fighter.getMotionPlaybackDuration("HEAVY_KICK") / 6;

  fighter.motionElapsed = frameDuration * 1.5;
  assert.equal(fighter.getAttackBox(), null);

  fighter.motionElapsed = frameDuration * 2.5;
  const firstActive = fighter.getAttackBox();
  assert.ok(firstActive);

  fighter.motionElapsed = frameDuration * 3.5;
  const secondActive = fighter.getAttackBox();
  assert.ok(secondActive.w > firstActive.w);

  fighter.motionElapsed = frameDuration * 4.5;
  assert.equal(fighter.getAttackBox(), null);
});

test("attack and throw state machines reach start, release, and finish motions", () => {
  const opponent = makeFighter("MASTER_EZRA", 900, -1);
  const game = makeGame();
  const attackMotions = {
    lightPunch: "LIGHT_PUNCH",
    heavyPunch: "HEAVY_PUNCH",
    lightKick: "LIGHT_KICK",
    heavyKick: "HEAVY_KICK",
    crouchAttack: "CROUCH_ATTACK",
    airAttack: "AIR_ATTACK",
    combo1: "COMBO_1",
    combo2: "COMBO_2"
  };
  for (const [attack, motion] of Object.entries(attackMotions)) {
    const fighter = makeFighter();
    assert.equal(fighter.beginAttack(attack, game), true);
    assert.equal(fighter.motion, motion);
  }

  const special = makeFighter();
  special.beginAttack("special", game);
  assert.equal(special.motion, "SPECIAL_START");
  special.update(0.2, {}, opponent, game);
  assert.equal(special.motion, "SPECIAL_PROJECTILE");

  const throwing = makeFighter();
  throwing.beginAttack("throw", game);
  assert.equal(throwing.motion, "THROW_GRAB");
  throwing.update(0.2, {}, opponent, game);
  assert.equal(throwing.motion, "THROW_FINISH");
});

test("attacks preserve all six start, release, throw, and recovery frames", () => {
  const opponent = makeFighter("MASTER_EZRA", 650, -1, completeAnimations);
  let projectileCount = 0;
  const game = { ...makeGame(), spawnProjectile() { projectileCount += 1; } };

  const punch = makeFighter("KALYX", 420, 1, completeAnimations);
  punch.beginAttack("lightPunch", game);
  const punchDuration = punch.getMotionPlaybackDuration("LIGHT_PUNCH");
  assert.ok(punch.currentAttack.duration >= punchDuration);
  punch.update(punchDuration - 0.01, {}, opponent, game);
  assert.equal(punch.motion, "LIGHT_PUNCH");
  assert.ok(punch.currentAttack);

  const special = makeFighter("KALYX", 420, 1, completeAnimations);
  special.beginAttack("special", game);
  const startDuration = special.getMotionPlaybackDuration("SPECIAL_START");
  special.update(startDuration - 0.01, {}, opponent, game);
  assert.equal(special.motion, "SPECIAL_START");
  special.update(0.02, {}, opponent, game);
  assert.equal(special.motion, "SPECIAL_PROJECTILE");
  assert.equal(projectileCount, 1);
  const releaseRemaining = special.currentAttack.duration - special.currentAttack.elapsed;
  special.update(releaseRemaining + 0.001, {}, opponent, game);
  assert.equal(special.motion, "SPECIAL_RECOVER");
  special.update(special.getMotionPlaybackDuration("SPECIAL_RECOVER") - 0.01, { lightPunch: true }, opponent, game);
  assert.equal(special.motion, "SPECIAL_RECOVER");
  assert.equal(special.currentAttack, null);

  const throwing = makeFighter("KALYX", 420, 1, completeAnimations);
  throwing.beginAttack("throw", game);
  const grabDuration = throwing.getMotionPlaybackDuration("THROW_GRAB");
  throwing.update(grabDuration - 0.01, {}, opponent, game);
  assert.equal(throwing.motion, "THROW_GRAB");
  throwing.update(0.02, {}, opponent, game);
  assert.equal(throwing.motion, "THROW_FINISH");
  assert.ok(throwing.currentAttack.duration >= grabDuration + throwing.getMotionPlaybackDuration("THROW_FINISH"));
});

test("throw victims stay attached through grab and launch after finish", () => {
  const game = makeGame();
  const attacker = makeFighter("KALYX", 420, 1, completeAnimations);
  const victim = makeFighter("MASTER_EZRA", 470, -1, completeAnimations);
  attacker.beginAttack("throw", game);
  victim.beginThrown(attacker, { damage: 118, knockback: 360 });

  victim.update(1 / 60, {}, attacker, game);
  assert.equal(victim.x, attacker.x + 52);
  assert.equal(victim.motion, "HURT_HEAVY");

  attacker.update(attacker.getMotionPlaybackDuration("THROW_GRAB") + 0.01, {}, victim, game);
  victim.update(1 / 60, {}, attacker, game);
  assert.equal(attacker.motion, "THROW_FINISH");
  assert.equal(victim.motion, "KNOCKDOWN");
  assert.ok(victim.throwState);

  attacker.update(attacker.currentAttack.duration - attacker.currentAttack.elapsed + 0.01, {}, victim, game);
  victim.update(1 / 60, {}, attacker, game);
  assert.equal(victim.throwState, null);
  assert.ok(victim.knockdown > 0);
  assert.ok(victim.vx > 0);
});

test("backward locomotion remains reachable and shows guard only under threat", () => {
  const defender = makeFighter("KALYX", 420, 1);
  const attacker = makeFighter("MASTER_EZRA", 560, -1);
  const game = makeGame();

  defender.update(1 / 60, { left: true }, attacker, game);
  assert.equal(defender.motion, "WALK_BACK");

  attacker.beginAttack("heavyPunch", game);
  defender.update(1 / 60, { left: true }, attacker, game);
  assert.equal(defender.motion, "BLOCK_HIGH");
  defender.update(1 / 60, { left: true, down: true }, attacker, game);
  assert.equal(defender.motion, "BLOCK_LOW");
});

test("taunt is reachable and uses its complete animation duration", () => {
  const fighter = makeFighter("KALYX", 420, 1, completeAnimations);
  const opponent = makeFighter("MASTER_EZRA", 650, -1, completeAnimations);
  fighter.update(1 / 60, { taunt: true }, opponent, makeGame());
  assert.equal(fighter.motion, "TAUNT");
  assert.equal(fighter.currentAttack.duration, fighter.getMotionPlaybackDuration("TAUNT"));
});

test("hurt, knockdown, get-up, landing, victory, and defeat are reachable", () => {
  const opponent = makeFighter("MASTER_EZRA", 900, -1);
  const game = makeGame();
  const lightHurt = makeFighter();
  lightHurt.takeHit({ damage: 40, stun: 0.2, knockback: 0, attackName: "lightPunch" });
  assert.equal(lightHurt.motion, "HURT_LIGHT");

  const heavyHurt = makeFighter();
  heavyHurt.takeHit({ damage: 90, stun: 0.3, knockback: 0, attackName: "heavyPunch" });
  assert.equal(heavyHurt.motion, "HURT_HEAVY");

  const knockedDown = makeFighter();
  knockedDown.takeHit({ damage: 120, stun: 0.3, knockback: 0, attackName: "heavyKick" });
  assert.equal(knockedDown.motion, "KNOCKDOWN");
  knockedDown.update(1, {}, opponent, game);
  assert.equal(knockedDown.motion, "GET_UP");

  const landing = makeFighter();
  landing.y = GROUND_Y - 10;
  landing.vy = 600;
  landing.update(0.05, {}, opponent, game);
  assert.equal(landing.motion, "LANDING");
  assert.ok(landing.landingLag >= 0.1);

  const winner = { health: 400, motion: "", setMotion(motion) { this.motion = motion; } };
  const loser = { health: 0, motion: "", setMotion(motion) { this.motion = motion; } };
  applyRoundOutcomeMotions([winner, loser], { draw: false, winnerIndex: 0, reason: "KO" });
  assert.equal(winner.motion, "VICTORY");
  assert.equal(loser.motion, "DEFEAT");
});
