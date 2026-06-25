const FORGE_RULES = {
  signal_wav: {
    id: "signal_wav",
    displayName: "Signal WAV",
    shortName: "WAV",
    format: "balls",
    main: { count: 5, minimum: 1, maximum: 84, unique: true, sort: true },
    special: { label: "Core", minimum: 1, maximum: 24 }
  },
  pick3: {
    id: "pick3",
    displayName: "3-Digit",
    shortName: "3D",
    format: "digits",
    main: { count: 3, minimum: 0, maximum: 9, unique: false, sort: false, preserveLeadingZeroes: true },
    special: null
  },
  pick4: {
    id: "pick4",
    displayName: "4-Digit",
    shortName: "4D",
    format: "digits",
    main: { count: 4, minimum: 0, maximum: 9, unique: false, sort: false, preserveLeadingZeroes: true },
    special: null
  },
  mega_millions: {
    id: "mega_millions",
    displayName: "Mega Millions",
    shortName: "Mega",
    format: "balls",
    main: { count: 5, minimum: 1, maximum: 70, unique: true, sort: true },
    special: { label: "Mega Ball", shortLabel: "MB", minimum: 1, maximum: 24 }
  },
  powerball: {
    id: "powerball",
    displayName: "Powerball",
    shortName: "Power",
    format: "balls",
    main: { count: 5, minimum: 1, maximum: 69, unique: true, sort: true },
    special: { label: "Powerball", shortLabel: "PB", minimum: 1, maximum: 26 }
  }
};

const DEFAULT_FORGE_GAMES = ["mega_millions", "powerball", "pick3", "pick4"];

export function secureUInt32() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("A Web Crypto implementation is required");
  }
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0] >>> 0;
}

export function seededUInt32(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x20842084;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };
}

export function uniformClosed(minimum, maximum, source = secureUInt32) {
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum > maximum) {
    throw new RangeError("minimum and maximum must be ordered integers");
  }

  const range = maximum - minimum + 1;
  const sourceSpan = 0x100000000;
  const acceptedSpan = sourceSpan - (sourceSpan % range);
  let value;
  do {
    value = source() >>> 0;
  } while (value >= acceptedSpan);
  return minimum + (value % range);
}

export function generateForgeDraw(game = "signal_wav", source = secureUInt32) {
  const rules = FORGE_RULES[game];
  if (!rules) throw new Error(`Unknown number forge game: ${game}`);
  const main = [];

  if (rules.main.unique) {
    const pool = Array.from(
      { length: rules.main.maximum - rules.main.minimum + 1 },
      (_, index) => rules.main.minimum + index
    );
    for (let index = 0; index < rules.main.count; index += 1) {
      const swapIndex = uniformClosed(index, pool.length - 1, source);
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
      main.push(pool[index]);
    }
  } else {
    for (let index = 0; index < rules.main.count; index += 1) {
      main.push(uniformClosed(rules.main.minimum, rules.main.maximum, source));
    }
  }

  if (rules.main.sort) main.sort((left, right) => left - right);

  const special = rules.special
    ? uniformClosed(rules.special.minimum, rules.special.maximum, source)
    : undefined;

  return special === undefined ? { rules, main } : { rules, main, special };
}

export function formatForgeDraw(draw) {
  if (draw.rules.format === "digits") return draw.main.join("");
  const main = draw.main.map((value) => String(value).padStart(2, "0")).join(" ");
  return draw.special === undefined
    ? main
    : `${main} | ${draw.rules.special.shortLabel.toUpperCase()} ${String(draw.special).padStart(2, "0")}`;
}

export function makeForgeSeed({ score = 0, levelIndex = 0, killed = 0, multiplier = 1, players = 1, salt = 0 } = {}) {
  let seed = 0x2084f06e;
  seed ^= Math.imul((score >>> 0) + 0x9e3779b9, 0x85ebca6b);
  seed ^= Math.imul((levelIndex + 1) >>> 0, 0xc2b2ae35);
  seed ^= Math.imul((killed + 17) >>> 0, 0x27d4eb2d);
  seed ^= ((multiplier & 0xff) << 16) >>> 0;
  seed ^= ((players & 0xff) << 24) >>> 0;
  seed ^= salt >>> 0;
  return seed >>> 0;
}

export function createForgeReadout(input = {}) {
  const baseSeed = makeForgeSeed(input);
  const lines = (input.games ?? DEFAULT_FORGE_GAMES).map((game, index) => {
    const salt = Math.imul(index + 1, 0x9e3779b9) >>> 0;
    const draw = generateForgeDraw(game, seededUInt32((baseSeed ^ salt) >>> 0));
    return {
      game,
      label: draw.rules.shortName,
      text: formatForgeDraw(draw),
      draw
    };
  });
  return {
    label: "DRAW",
    text: lines.map((line) => `${line.label}: ${line.text}`).join("\n"),
    lines
  };
}
