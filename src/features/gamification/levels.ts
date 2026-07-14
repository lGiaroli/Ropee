export const levelThreshold = (level: number) => {
  if (level <= 1) return 0;
  const fixed: Record<number, number> = {
    2: 200,
    3: 500,
    4: 900,
    5: 1400,
  };
  if (fixed[level]) return fixed[level];
  return Math.round(1400 + (level - 5) * (level - 4) * 170);
};

export const levelForXp = (xp: number) => {
  let level = 1;
  while (levelThreshold(level + 1) <= xp) {
    level += 1;
  }
  return level;
};

export const progressToNextLevel = (xp: number) => {
  const level = levelForXp(xp);
  const current = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return {
    level,
    current,
    next,
    progress: Math.min(1, Math.max(0, (xp - current) / (next - current))),
    remaining: Math.max(0, next - xp),
  };
};
