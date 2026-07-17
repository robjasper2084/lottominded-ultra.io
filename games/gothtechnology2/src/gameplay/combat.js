import { rectsOverlap } from "../engine/math.js?v=heartline36-leash-wrist";
import { ATTACKS } from "../config/moves.js?v=heartline36-leash-wrist";
import { FloatingText, LovePulseEffect, SpriteEffect } from "./effects.js?v=heartline36-leash-wrist";
import { registerAttackHit, sliceAttackForHit } from "./hits.js?v=heartline36-leash-wrist";

export function resolveMelee(attacker, defender, game) {
  const attackState = attacker.currentAttack;
  if (!attackState || defender.invulnerable > 0 || defender.isKO) return;
  const attack = attackState.data;
  if (!attack.active) return;
  const elapsed = attackState.elapsed;
  if (elapsed < attack.active[0] || elapsed > attack.active[1]) return;
  if (attack.activeFrames?.length && !attack.activeFrames.includes(attacker.getMotionFrameIndex())) return;
  const box = attacker.getAttackBox();
  if (!box || !rectsOverlap(box, defender.hurtbox)) return;
  if (attackState.name === "throw" && Math.abs(attacker.x - defender.x) > 76) return;
  const hit = registerAttackHit(attackState, defender.id, attack, elapsed);
  if (!hit) return;
  if (attackState.name === "throw" && defender.throwTechTimer > 0) {
    attacker.currentAttack = null;
    defender.currentAttack = null;
    attacker.vx -= attacker.facing * 150;
    defender.vx += attacker.facing * 150;
    game.hitstop = Math.max(game.hitstop, 0.045);
    game.shake = Math.max(game.shake ?? 0, 4);
    game.effects.push(new FloatingText("TECH", (attacker.x + defender.x) / 2, defender.y - 168, "#9ed8ff"));
    game.audio.beep("block");
    game.recordCombatEvent?.({ type: "throwTech", attacker, defender });
    return;
  }
  game.resolveIncomingHit(attacker, defender, sliceAttackForHit(attack, hit.hitIndex), {
    box,
    projectile: false,
    level: attack.level,
    sourceName: attackState.name,
    hitIndex: hit.hitIndex,
    maxHits: hit.maxHits
  });
}

export function applyHit(attacker, defender, attack, game, meta = {}) {
  if (defender.parryTimer > 0 && meta.sourceName !== "throw") {
    const charmCounter = defender.config.archetype === "heartline";
    defender.parryTimer = 0;
    defender.shieldTimer = 0;
    defender.guardFlash = 0.3;
    defender.meter = Math.min(100, defender.meter + (defender.config.perfectBlockMeterBonus ?? 16));
    attacker.currentAttack = null;
    attacker.hitstun = Math.max(attacker.hitstun, 0.3);
    attacker.vx = charmCounter
      ? Math.sign(defender.x - attacker.x) * 340
      : attacker.vx - attacker.facing * 260;
    if (charmCounter) attacker.charmedTimer = Math.max(attacker.charmedTimer ?? 0, 0.95);
    game.hitstop = Math.max(game.hitstop, 0.055);
    game.shake = Math.max(game.shake ?? 0, 7);
    game.effects.push(new FloatingText(charmCounter ? "CHARMED" : "PARRY", defender.x, defender.y - 190, charmCounter ? "#ff72c8" : "#9ed8ff"));
    if (charmCounter) {
      game.effects.push(new LovePulseEffect({
        x: defender.x,
        y: defender.y - 118,
        duration: 0.42,
        scale: 1,
        direction: defender.facing,
        burst: true
      }));
    }
    game.audio.beep("block");
    game.recordCombatEvent?.({ type: "parry", attacker, defender });
    return;
  }
  const isBlocked = defender.isBlocking(meta.level ?? attack.level, attacker);
  const activeStart = defender.currentAttack?.data?.active?.[0] ?? defender.currentAttack?.data?.startup ?? 0;
  const forcedCounter = game.training && game.trainingCounterHit && defender.slot === 2;
  const counterHit = !isBlocked && meta.sourceName !== "throw" && (forcedCounter || (defender.currentAttack && defender.currentAttack.elapsed < Math.max(0.12, activeStart + 0.03)));
  const perfectBlock = isBlocked && defender.guardTapTimer > 0 && meta.sourceName !== "super";
  const heartlinkConfirm = !isBlocked
    && !meta.projectile
    && meta.sourceName !== "throw"
    && attacker.config.archetype === "heartline"
    && (defender.charmedTimer ?? 0) > 0;
  const comboScale = Math.max(0.52, 1 - Math.max(0, attacker.comboHits) * 0.1);
  const heartlinkScale = heartlinkConfirm ? 1 + (attacker.config.heartlinkDamageBonus ?? 0.16) : 1;
  const rawDamage = Math.round((attack.damage ?? 50) * (counterHit ? 1.18 : 1) * heartlinkScale);
  const baseDamage = isBlocked ? (perfectBlock ? 0 : attack.chip ?? 0) : Math.round(rawDamage * comboScale);
  const damage = isBlocked ? (perfectBlock ? 0 : Math.max(1, baseDamage)) : Math.max(8, baseDamage);
  const stun = isBlocked
    ? (perfectBlock ? (attack.blockstun ?? 0.2) * 0.45 : attack.blockstun ?? 0.2)
    : (attack.stun ?? 0.25) + (counterHit ? 0.07 : 0);
  const direction = attacker.x < defender.x ? 1 : -1;
  const knockback = direction * (isBlocked ? (attack.knockback ?? 160) * (perfectBlock ? 0.18 : 0.32) : (attack.knockback ?? 180) * (counterHit ? 1.12 : 1));

  if (meta.sourceName === "throw" && !isBlocked) {
    defender.beginThrown(attacker, { damage, knockback });
  } else {
    defender.takeHit({
      damage,
      stun,
      knockback,
      attackName: meta.sourceName,
      blocked: isBlocked,
      chipOnly: isBlocked,
      perfectBlock
    });
  }

  if (!isBlocked && heartlinkConfirm) {
    defender.charmedTimer = 0;
    attacker.meter = Math.min(100, attacker.meter + 4);
  }
  if (!isBlocked && attack.charmDuration) {
    defender.charmedTimer = Math.max(defender.charmedTimer ?? 0, attack.charmDuration);
  }

  const precisionRangeBonus = attacker.config.archetype === "precision" && meta.projectile && Math.abs(attacker.x - defender.x) >= 260
    ? (attacker.config.precisionRangeMeterBonus ?? 4)
    : 0;
  attacker.meter = Math.min(100, attacker.meter + (attack.meter ?? 8) + precisionRangeBonus);
  if (isBlocked) defender.meter = Math.min(100, defender.meter + (perfectBlock ? (defender.config.perfectBlockMeterBonus ?? 11) : 5));

  const advantageFrames = Math.round((stun - (attack.recovery ?? 0)) * 60);
  game.trainingReadout = {
    outcome: perfectBlock ? "PERFECT BLOCK" : isBlocked ? "BLOCK" : heartlinkConfirm ? "HEARTLINK" : counterHit ? "COUNTER HIT" : "HIT",
    damage,
    comboScale,
    advantageFrames,
    level: meta.level ?? attack.level ?? "mid"
  };
  game.recordCombatEvent?.({
    type: perfectBlock ? "perfectBlock" : meta.sourceName === "super" && !isBlocked ? "superHit" : "hit",
    attacker,
    defender,
    damage,
    comboHits: attacker.comboHits + (isBlocked ? 0 : 1),
    blocked: isBlocked,
    counterHit,
    heartlinkConfirm
  });

  if (!isBlocked) {
    attacker.comboHits += 1;
    attacker.comboDamage = (attacker.comboDamage ?? 0) + damage;
    attacker.comboTimer = 1.25;
    game.hitstop = Math.max(game.hitstop, meta.sourceName === "super" ? 0.065 : 0.03);
    if (counterHit) game.hitstop = Math.max(game.hitstop, 0.052);
    game.shake = Math.max(game.shake ?? 0, meta.sourceName === "super" ? 18 : (damage > 80 ? 10 : 5));
    game.slowMo = Math.max(game.slowMo ?? 0, meta.sourceName === "super" ? 0.18 : 0);
    if (counterHit) game.effects.push(new FloatingText("COUNTER", defender.x, defender.y - 204, "#ffcf67"));
    if (heartlinkConfirm) game.effects.push(new FloatingText("HEARTLINK", defender.x, defender.y - 204, "#ff72c8"));
    game.effects.push(new FloatingText(`${damage}`, defender.x, defender.y - 178, "#ffd66d"));
    const hitX = meta.box?.x + (meta.box?.w ?? 0) / 2 || defender.x;
    const hitY = meta.box?.y + 96 || defender.y - 120;
    if (attacker.config.archetype === "heartline") {
      game.effects.push(new LovePulseEffect({
        x: hitX,
        y: hitY,
        duration: meta.sourceName === "super" ? 0.46 : 0.28,
        scale: meta.sourceName === "super" ? 1.18 : 0.62,
        direction,
        burst: meta.sourceName === "super"
      }));
    } else {
      game.effects.push(new SpriteEffect({
        x: hitX,
        y: hitY,
        image: game.assets.images.hitSpark,
        duration: 0.28,
        scale: meta.sourceName === "super" ? 0.68 : 0.42,
        flip: direction < 0
      }));
    }
    game.audio.beep(meta.sourceName === "super" ? "super" : "hit");
  } else {
    game.shake = Math.max(game.shake ?? 0, perfectBlock ? 4 : 2.5);
    game.hitstop = Math.max(game.hitstop, perfectBlock ? 0.042 : 0.022);
    game.effects.push(new FloatingText(perfectBlock ? "JUST GUARD" : "BLOCK", defender.x, defender.y - 165, perfectBlock ? "#ffd66d" : "#9ed8ff"));
    game.effects.push(new SpriteEffect({
      x: defender.x + direction * -28,
      y: defender.y - 22,
      image: game.assets.images.blockShield,
      duration: 0.28,
      scale: 0.48,
      flip: direction < 0
    }));
    game.audio.beep("block");
  }
}

export function attackFromName(name) {
  return ATTACKS[name];
}
