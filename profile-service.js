import { storageGet, storageSet, storageRemove } from './storage.js';
const PROFILE_KEY = 'flagcraft_profile_v1';

export const RANKS = [
  { id: 'bronze', minXp: 0 },
  { id: 'silver', minXp: 1_000 },
  { id: 'gold', minXp: 2_500 },
  { id: 'platinum', minXp: 5_000 },
  { id: 'diamond', minXp: 9_000 },
  { id: 'master', minXp: 14_000 },
  { id: 'grandmaster', minXp: 22_000 },
  { id: 'champion', minXp: 32_000 },
  { id: 'legend', minXp: 50_000 },
];

export const THEMES = [
  { id: 'golden', unlockLevel: 1 },
  { id: 'space', unlockLevel: 2 },
  { id: 'minecraft', unlockLevel: 4 },
  { id: 'dark', unlockLevel: 6 },
  { id: 'sakura', unlockLevel: 8 },
  { id: 'japan', unlockLevel: 10 },
];

const DEFAULT_PROFILE = Object.freeze({
  level: 1,
  levelXp: 0,
  totalXp: 0,
  theme: 'golden',
  achievements: [],
  stats: {
    games: 0,
    correct: 0,
    flagsCorrect: 0,
    capitalsCorrect: 0,
    bestCombo: 0,
    perfectGames: 0,
  },
});

function int(value, min, max, fallback = min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function normalize(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const totalXp = int(source.totalXp, 0, 100_000_000, 0);
  let level = 1;
  let levelXp = totalXp;
  while (level < 999 && levelXp >= xpRequired(level)) {
    levelXp -= xpRequired(level);
    level += 1;
  }
  levelXp = int(levelXp, 0, xpRequired(level) - 1, 0);
  const availableThemes = THEMES.filter((theme) => level >= theme.unlockLevel).map((theme) => theme.id);
  const theme = availableThemes.includes(source.theme) ? source.theme : 'golden';
  const stats = source.stats && typeof source.stats === 'object' ? source.stats : {};
  const achievements = Array.isArray(source.achievements)
    ? [...new Set(source.achievements.map(String).filter((item) => /^[a-z0-9_-]{1,40}$/i.test(item)))].slice(0, 100)
    : [];

  return {
    level,
    levelXp,
    totalXp,
    theme,
    achievements,
    stats: {
      games: int(stats.games, 0, 10_000_000, 0),
      correct: int(stats.correct, 0, 100_000_000, 0),
      flagsCorrect: int(stats.flagsCorrect, 0, 100_000_000, 0),
      capitalsCorrect: int(stats.capitalsCorrect, 0, 100_000_000, 0),
      bestCombo: int(stats.bestCombo, 0, 100_000, 0),
      perfectGames: int(stats.perfectGames, 0, 1_000_000, 0),
    },
  };
}

export function xpRequired(level) {
  return Math.min(12_000, 500 + (Math.max(1, Number(level)) * 100));
}

export function loadProfile() {
  try {
    return normalize(JSON.parse(storageGet(PROFILE_KEY, 'null') || 'null'));
  } catch {
    return structuredClone(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile) {
  const safe = normalize(profile);
  try {
    storageSet(PROFILE_KEY, JSON.stringify(safe));
  } catch {
    // Storage can be disabled; the active session still works.
  }
  return safe;
}

export function getRank(totalXp) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (totalXp >= rank.minXp) current = rank;
    else break;
  }
  return current;
}

export function addXp(profile, amount) {
  const next = normalize(profile);
  let remaining = int(amount, 0, 1_000_000, 0);
  const levelUps = [];
  next.totalXp = int(next.totalXp + remaining, 0, 100_000_000, 0);

  while (remaining > 0) {
    const needed = xpRequired(next.level) - next.levelXp;
    if (remaining < needed) {
      next.levelXp += remaining;
      remaining = 0;
    } else {
      remaining -= needed;
      next.level += 1;
      next.levelXp = 0;
      levelUps.push(next.level);
    }
  }

  return { profile: saveProfile(next), levelUps };
}

export function unlockStoredAchievement(profile, achievementId) {
  const next = normalize(profile);
  if (next.achievements.includes(achievementId)) return { profile: next, unlocked: false };
  next.achievements.push(achievementId);
  return { profile: saveProfile(next), unlocked: true };
}

export function setTheme(profile, themeId) {
  const next = normalize(profile);
  const theme = THEMES.find((item) => item.id === themeId);
  if (!theme || next.level < theme.unlockLevel) return { profile: next, changed: false };
  next.theme = theme.id;
  return { profile: saveProfile(next), changed: true };
}

export function updateStats(profile, result) {
  const next = normalize(profile);
  next.stats.games += 1;
  next.stats.correct += int(result.correct, 0, 100_000, 0);
  if (result.quizType === 'capitals') next.stats.capitalsCorrect += int(result.correct, 0, 100_000, 0);
  else next.stats.flagsCorrect += int(result.correct, 0, 100_000, 0);
  next.stats.bestCombo = Math.max(next.stats.bestCombo, int(result.bestStreak, 0, 100_000, 0));
  if (result.perfect) next.stats.perfectGames += 1;
  return saveProfile(next);
}

export function resetProfile() {
  storageRemove(PROFILE_KEY);
  return structuredClone(DEFAULT_PROFILE);
}
