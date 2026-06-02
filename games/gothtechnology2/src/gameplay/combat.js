import { rectsOverlap } from "../engine/math.js";
import { ATTACKS } from "../config/moves.js?v=fighter-prop1";
import { FloatingText, SpriteEffect } from "./effects.js";

export function resolveMelee(attacker, defender, game) {
  const attackState = attacker.currentAttack;
  if (!attackState || attackState.hitTargets.has(defender.id) || defender.invulnerable > 0 || defender.isKO) return;
  const attack = attackState.data;
  if (!attack.active) return;
  const elapsed = attackState.elapsed;
  if (elapsed < attack.active[0] || elapsed > attack.active[1]) return;
  const box = attacker.getAttackBox();
  if (!box || !rectsOverlap(box, defender.hurtbox)) return;
  if (attackState.name === "throw" && Math.abs(attacker.x - defender.x) > 76) return;
  attackState.hitTargets.add(defender.id);
  if (attackState.name === "throw" && defender.throwTechTimer > 0) {
    attacker.currentAttack = null;
    defender.currentAttack = null;
    attacker.vx -= attacker.facing * 150;
    defender.vx += attacker.facing * 150;
    game.hitstop = Math.max(game.hitstop, 0.045);
    game.shake = Math.max(game.shake ?? 0, 4);
    game.effects.push(new FloatingText("TECH", (attacker.x + defender.x) / 2, defender.y - 168, "#9ed8ff"));
    game.audio.beep("block");
    return;
  }
  game.resolveIncomingHit(attacker, defender, attack, {
    box,
    projectile: false,
    level: attack.level,
    sourceName: attackState.name
  });
}

export function applyHit(attacker, defender, attack, game, meta = {}) {
  const isBlocked = defender.isBlocking(meta.level ?? attack.level, attacker);
  const activeStart = defender.currentAttack?.data?.active?.[0] ?? defender.currentAttack?.data?.startup ?? 0;
  const counterHit = !isBlocked && meta.sourceName !== "throw" && defender.currentAttack && defender.currentAttack.elapsed < Math.max(0.12, activeStart + 0.03);
  const perfectBlock = isBlocked && defender.guardTapTimer > 0 && meta.sourceName !== "super";
  const comboScale = Math.max(0.52, 1 - Math.max(0, attacker.comboHits) * 0.1);
  const rawDamage = Math.round((attack.damage ?? 50) * (counterHit ? 1.18 : 1));
  const baseDamage = isBlocked ? (perfectBlock ? 0 : attack.chip ?? 0) : Math.round(rawDamage * comboScale);
  const damage = isBlocked ? (perfectBlock ? 0 : Math.max(1, baseDamage)) : Math.max(8, baseDamage);
  const stun = isBlocked
    ? (perfectBlock ? (attack.blockstun ?? 0.2) * 0.45 : attack.blockstun ?? 0.2)
    : (attack.stun ?? 0.25) + (counterHit ? 0.07 : 0);
  const direction = attacker.x < defender.x ? 1 : -1;
  const knockback = direction * (isBlocked ? (attack.knockback ?? 160) * (perfectBlock ? 0.18 : 0.32) : (attack.knockback ?? 180) * (counterHit ? 1.12 : 1));

  defender.takeHit({
    damage,
    stun,
    knockback,
    attackName: meta.sourceName,
    blocked: isBlocked,
    chipOnly: isBlocked,
    perfectBlock
  });

  attacker.meter = Math.min(100, attacker.meter + (attack.meter ?? 8));
  if (isBlocked) defender.meter = Math.min(100, defender.meter + (perfectBlock ? 11 : 5));

  if (!isBlocked) {
    attacker.comboHits += 1;
    attacker.comboDamage = (attacker.comboDamage ?? 0) + damage;
    attacker.comboTimer = 1.25;
    game.hitstop = Math.max(game.hitstop, meta.sourceName === "super" ? 0.065 : 0.03);
    if (counterHit) game.hitstop = Math.max(game.hitstop, 0.052);
    game.shake = Math.max(game.shake ?? 0, meta.sourceName === "super" ? 18 : (damage > 80 ? 10 : 5));
    game.slowMo = Math.max(game.slowMo ?? 0, meta.sourceName === "super" ? 0.18 : 0);
    if (counterHit) game.effects.push(new FloatingText("COUNTER", defender.x, defender.y - 204, "#ffcf67"));
    game.effects.push(new FloatingText(`${damage}`, defender.x, defender.y - 178, "#ffd66d"));
    game.effects.push(new SpriteEffect({
      x: meta.box?.x + (meta.box?.w ?? 0) / 2 || defender.x,
      y: meta.box?.y + 96 || defender.y - 120,
      image: game.assets.images.hitSpark,
      duration: 0.28,
      scale: meta.sourceName === "super" ? 0.68 : 0.42,
      flip: direction < 0
    }));
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
