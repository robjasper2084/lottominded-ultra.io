const DIFFICULTY = {
  easy: { reaction: 0.32, comboSteps: 1, parry: false },
  normal: { reaction: 0.18, comboSteps: 2, parry: true },
  hard: { reaction: 0.09, comboSteps: 3, parry: true }
};

const tap = (actions) => ({ duration: 1 / 60, actions });
const wait = (duration) => ({ duration, actions: {} });
const hold = (actions, duration) => ({ duration, actions });

export class CpuController {
  constructor() {
    this.reset();
  }

  reset() {
    this.plan = [];
    this.step = null;
    this.stepTimer = 0;
    this.reactionTimer = 0;
    this.cadence = 0;
  }

  queue(steps) {
    this.plan.push(...steps);
  }

  runPlan(dt) {
    if (!this.step && this.plan.length) {
      this.step = this.plan.shift();
      this.stepTimer = this.step.duration;
    }
    if (!this.step) return null;
    const actions = { ...this.step.actions };
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) this.step = null;
    return actions;
  }

  next(dt, { cpu, player, projectiles, difficulty = "normal", world }) {
    if (!cpu || !player || cpu.isKO) return {};
    const planned = this.runPlan(dt);
    if (planned) return planned;

    this.reactionTimer = Math.max(0, this.reactionTimer - dt);
    if (this.reactionTimer > 0) return {};

    const tune = DIFFICULTY[difficulty] ?? DIFFICULTY.normal;
    const dist = player.x - cpu.x;
    const abs = Math.abs(dist);
    const toward = dist > 0 ? "right" : "left";
    const away = dist > 0 ? "left" : "right";
    const canAct = !cpu.currentAttack && !cpu.hitstun && !cpu.blockstun && !cpu.knockdown;
    const archetype = cpu.config.archetype ?? (cpu.config.manifestKey === "KALYX" ? "rushdown" : "control");
    const incoming = projectiles.find((projectile) => (
      projectile.owner.slot !== cpu.slot &&
      !projectile.dead &&
      Math.sign(cpu.x - projectile.x) === projectile.direction &&
      Math.abs(cpu.x - projectile.x) < 420
    ));
    const minX = world.left + (cpu.config.stageMargin ?? 0);
    const maxX = world.right - (cpu.config.stageMargin ?? 0);
    const nearEdge = cpu.x < minX + 42 || cpu.x > maxX - 42;

    this.cadence += 1;
    this.reactionTimer = tune.reaction;

    if (incoming) {
      if (archetype === "control" && tune.parry && canAct && cpu.meter >= (cpu.config.skillCost ?? 15)) {
        return { down: true, special: true };
      }
      if (archetype === "precision" && canAct && cpu.meter >= (cpu.config.skillCost ?? 20) && abs < 320) {
        return { down: true, special: true };
      }
      if (archetype === "heartline" && tune.parry && canAct && cpu.meter >= (cpu.config.skillCost ?? 20)) {
        return { down: true, special: true };
      }
      if (archetype === "heartline" && canAct && this.cadence % 3 === 0) return { assist2: true };
      return { [away]: true, down: incoming.y > cpu.y - 150 };
    }

    if (!player.grounded && canAct && abs < 190) {
      return archetype === "control" || archetype === "heartline" ? { heavyKick: true } : { heavyPunch: true };
    }

    if (player.currentAttack && abs < (player.currentAttack.data?.reach ?? 100) + 120) {
      const attack = player.currentAttack.data;
      const activeEnd = attack.active?.[1] ?? attack.startup ?? 0.12;
      if (player.currentAttack.elapsed <= activeEnd) {
        if (archetype === "control" && tune.parry && canAct && cpu.meter >= (cpu.config.skillCost ?? 15) && this.cadence % 3 === 0) {
          return { down: true, special: true };
        }
        if (archetype === "precision" && canAct && cpu.meter >= (cpu.config.skillCost ?? 20) && abs < 300) {
          return { down: true, special: true };
        }
        if (archetype === "heartline" && tune.parry && canAct && cpu.meter >= (cpu.config.skillCost ?? 20) && this.cadence % 2 === 0) {
          return { down: true, special: true };
        }
        if (archetype === "heartline" && canAct && this.cadence % 3 === 0) return { assist2: true };
        return { [away]: true, down: attack.level === "low" };
      }
      if (canAct) {
        const chain = archetype === "rushdown"
          ? [tap({ lightPunch: true }), wait(0.06), tap({ heavyPunch: true }), wait(0.08), tap({ heavyKick: true })]
          : archetype === "precision"
            ? [tap({ lightPunch: true }), wait(0.07), tap({ heavyPunch: true }), wait(0.1), tap({ special: true })]
            : archetype === "heartline"
              ? [tap({ lightPunch: true }), wait(0.06), tap({ lightKick: true }), wait(0.08), tap({ heavyKick: true })]
              : [tap({ lightKick: true }), wait(0.09), tap({ heavyPunch: true })];
        this.queue(chain.slice(0, tune.comboSteps * 2 - 1));
        return abs > 118 ? { [toward]: true, dash: archetype === "rushdown" } : this.runPlan(dt) ?? {};
      }
    }

    if (nearEdge) return { [toward]: true, dash: archetype === "rushdown" && canAct };

    if (archetype === "rushdown") {
      if (abs > 300 && canAct && cpu.meter >= 25 && this.cadence % 4 === 0) return { down: true, special: true };
      if (abs > 190) return { [toward]: true, dash: canAct && this.cadence % 3 === 0 };
      if (abs < 68) return { [away]: true };
      if (canAct && cpu.meter >= 100 && this.cadence % 5 === 0) return { super: true };
      if (canAct) {
        this.queue([tap({ lightPunch: true }), wait(0.055), tap({ heavyPunch: true }), wait(0.075), tap({ heavyKick: true })].slice(0, tune.comboSteps * 2 - 1));
        return this.runPlan(dt) ?? {};
      }
    } else if (archetype === "precision") {
      if (abs < 132) return { [away]: true, down: this.cadence % 2 === 0 };
      if (canAct && cpu.meter >= 100 && abs > 210 && this.cadence % 4 === 0) return { super: true };
      if (canAct && abs >= 220 && abs <= 520 && this.cadence % 2 === 0) return { special: true };
      if (abs > 480) return { [toward]: true };
      if (abs < 210) return { [away]: true };
      if (canAct && this.cadence % 5 === 0) return { assist1: true };
      return hold({ [away]: true }, 0.07).actions;
    } else if (archetype === "heartline") {
      if (canAct && (player.charmedTimer ?? 0) > 0) {
        if (abs > 154) return { [toward]: true, dash: abs > 250 };
        this.queue([
          tap({ lightPunch: true, heavyPunch: true }),
          wait(0.07),
          tap({ heavyKick: true }),
          wait(0.08),
          tap({ special: true })
        ].slice(0, tune.comboSteps * 2 - 1));
        return this.runPlan(dt) ?? {};
      }
      if (abs < 92) return { [away]: true, down: this.cadence % 2 === 0 };
      if (canAct && cpu.meter >= 100 && abs >= 140 && abs <= 360 && this.cadence % 4 === 0) return { super: true };
      if (canAct && abs >= 220 && abs <= 520 && this.cadence % 5 === 0) return { assist1: true };
      if (canAct && abs >= 210 && abs <= 480 && this.cadence % 2 === 0) return { special: true };
      if (abs > 360) return { [toward]: true, dash: canAct && this.cadence % 4 === 0 };
      if (canAct && cpu.meter >= (cpu.config.skillCost ?? 20) && player.currentAttack && this.cadence % 2 === 0) {
        return { down: true, special: true };
      }
      if (canAct) {
        this.queue([tap({ lightPunch: true }), wait(0.06), tap({ lightKick: true }), wait(0.08), tap({ heavyKick: true })].slice(0, tune.comboSteps * 2 - 1));
        return this.runPlan(dt) ?? {};
      }
    } else {
      if (abs < 150) return { [away]: true, down: this.cadence % 2 === 0 };
      if (canAct && cpu.meter >= 100 && abs > 175 && this.cadence % 4 === 0) return { super: true };
      if (canAct && abs > 245 && this.cadence % 2 === 0) return { special: true };
      if (abs > 360) return { [toward]: true };
      if (canAct && this.cadence % 3 === 0) return { assist1: true };
      return hold({ [away]: true }, 0.08).actions;
    }

    return {};
  }
}
