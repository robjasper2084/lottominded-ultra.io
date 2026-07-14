const targetKey = (targetId) => String(targetId);

export const registerAttackHit = (attackState, targetId, attack, elapsed) => {
  attackState.hitCounts ??= new Map();
  attackState.lastHitAt ??= new Map();
  const key = targetKey(targetId);
  const maxHits = Math.max(1, Math.floor(attack.multiHit ?? 1));
  const hitCount = attackState.hitCounts.get(key) ?? 0;
  if (hitCount >= maxHits) return null;

  const activeStart = attack.active?.[0] ?? attack.startup ?? 0;
  const activeEnd = attack.active?.[1] ?? activeStart + 0.12;
  const defaultInterval = Math.max(0.055, (activeEnd - activeStart) / maxHits * 0.72);
  const interval = attack.hitInterval ?? defaultInterval;
  const lastHitAt = attackState.lastHitAt.get(key) ?? -Infinity;
  const timingEpsilon = 1e-9;
  if (hitCount > 0 && elapsed - lastHitAt + timingEpsilon < interval) return null;

  const nextHitCount = hitCount + 1;
  attackState.hitCounts.set(key, nextHitCount);
  attackState.lastHitAt.set(key, elapsed);
  return { hitIndex: nextHitCount, maxHits };
};

const splitIntegerTotal = (value, hits, hitIndex) => {
  const total = Math.max(0, Math.round(value ?? 0));
  const base = Math.floor(total / hits);
  return base + (hitIndex <= total % hits ? 1 : 0);
};

export const sliceAttackForHit = (attack, hitIndex = 1) => {
  const hits = Math.max(1, Math.floor(attack.multiHit ?? 1));
  if (hits === 1) return attack;
  const index = Math.min(hits, Math.max(1, Math.floor(hitIndex)));
  return {
    ...attack,
    damage: splitIntegerTotal(attack.damage, hits, index),
    chip: splitIntegerTotal(attack.chip, hits, index),
    meter: Math.max(0, (attack.meter ?? 0) / hits),
    knockback: Math.max(0, (attack.knockback ?? 0) / hits),
    multiHit: 1
  };
};
