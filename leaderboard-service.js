import { storageGet, storageSet, storageRemove } from './storage.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const STORAGE_KEY = 'flagcraft_scores_v3';
const LEGACY_KEYS = ['flagcraft_scores_v2', 'flagrush_scores_v1'];
const MODES = new Set(['classic', 'survival', 'blitz']);
const DIFFICULTIES = new Set(['easy', 'hard']);
const QUIZ_TYPES = new Set(['flags', 'capitals']);

function boundedInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function validRemoteConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const url = new URL(SUPABASE_URL);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

const hasRemote = validRemoteConfig();

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const username = String(entry.username || '').trim().replace(/\s+/g, ' ').slice(0, 16);
  const playerId = String(entry.playerId || entry.player_id || '').slice(0, 96);
  const mode = MODES.has(entry.mode) ? entry.mode : 'classic';
  const difficulty = entry.difficulty === 'hard' ? 'hard' : 'easy';
  const quizType = QUIZ_TYPES.has(entry.quizType || entry.quiz_type) ? (entry.quizType || entry.quiz_type) : 'flags';
  if (!username || !playerId) return null;

  return {
    playerId,
    username,
    score: boundedInteger(entry.score, 0, 50_000_000),
    correct: boundedInteger(entry.correct, 0, 100_000),
    total: boundedInteger(entry.total, 0, 100_000),
    duration: boundedInteger(entry.duration, 0, 86_400),
    mode,
    difficulty,
    quizType,
    createdAt: typeof entry.createdAt === 'string'
      ? entry.createdAt
      : typeof entry.created_at === 'string'
        ? entry.created_at
        : new Date().toISOString(),
  };
}

function readRaw(key) {
  try {
    const parsed = JSON.parse(storageGet(key, '[]') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocal() {
  const current = readRaw(STORAGE_KEY);
  const legacy = current.length ? [] : LEGACY_KEYS.flatMap(readRaw);
  const normalized = [...current, ...legacy].map(normalizeEntry).filter(Boolean);
  if (!current.length && normalized.length) writeLocal(normalized);
  return normalized;
}

function writeLocal(scores) {
  try {
    storageSet(STORAGE_KEY, JSON.stringify(scores.slice(0, 600)));
  } catch {
    // Storage is optional; gameplay must never fail because of it.
  }
}

function sortScores(scores) {
  return [...scores].sort((a, b) => b.score - a.score || b.correct - a.correct || a.duration - b.duration);
}

function sameBoard(a, b) {
  return a.playerId === b.playerId
    && a.mode === b.mode
    && a.difficulty === b.difficulty
    && a.quizType === b.quizType;
}

function localUpsert(rawEntry) {
  const entry = normalizeEntry(rawEntry);
  if (!entry) return;
  const scores = readLocal();
  const index = scores.findIndex((item) => sameBoard(item, entry));
  if (index === -1) scores.push(entry);
  else if (entry.score > scores[index].score) scores[index] = entry;
  writeLocal(sortScores(scores));
}

function authHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

async function remoteFetch({ mode, difficulty, quizType }) {
  const url = new URL('/rest/v1/flagcraft_scores', SUPABASE_URL);
  url.searchParams.set('mode', `eq.${mode}`);
  url.searchParams.set('difficulty', `eq.${difficulty}`);
  url.searchParams.set('quiz_type', `eq.${quizType}`);
  url.searchParams.set('select', 'username,score,correct,total,duration,mode,difficulty,quiz_type,created_at');
  url.searchParams.set('order', 'score.desc,correct.desc,duration.asc');
  url.searchParams.set('limit', '50');
  const response = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!response.ok) throw new Error(`Leaderboard fetch failed: ${response.status}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

async function remoteUpsert(rawEntry) {
  const entry = normalizeEntry(rawEntry);
  if (!entry) throw new Error('Invalid score payload');

  const existingUrl = new URL('/rest/v1/flagcraft_scores', SUPABASE_URL);
  existingUrl.searchParams.set('player_id', `eq.${entry.playerId}`);
  existingUrl.searchParams.set('mode', `eq.${entry.mode}`);
  existingUrl.searchParams.set('difficulty', `eq.${entry.difficulty}`);
  existingUrl.searchParams.set('quiz_type', `eq.${entry.quizType}`);
  existingUrl.searchParams.set('select', 'score');
  existingUrl.searchParams.set('limit', '1');
  const existingResponse = await fetch(existingUrl, { headers: authHeaders(), cache: 'no-store' });
  if (!existingResponse.ok) throw new Error(`Leaderboard check failed: ${existingResponse.status}`);
  const existing = await existingResponse.json();
  if (existing[0] && Number(existing[0].score) >= entry.score) return;

  const payload = {
    player_id: entry.playerId,
    username: entry.username,
    score: entry.score,
    correct: entry.correct,
    total: entry.total,
    duration: entry.duration,
    mode: entry.mode,
    difficulty: entry.difficulty,
    quiz_type: entry.quizType,
    created_at: entry.createdAt,
  };

  const url = new URL('/rest/v1/flagcraft_scores', SUPABASE_URL);
  url.searchParams.set('on_conflict', 'player_id,mode,difficulty,quiz_type');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Leaderboard save failed: ${response.status}`);
}

export async function saveScore(entry) {
  localUpsert(entry);
  if (!hasRemote) return { remote: false };
  try {
    await remoteUpsert(entry);
    return { remote: true };
  } catch (error) {
    console.warn(error);
    return { remote: false, error };
  }
}

export async function getScores(filters = {}) {
  const safe = {
    mode: MODES.has(filters.mode) ? filters.mode : 'classic',
    difficulty: filters.difficulty === 'hard' ? 'hard' : 'easy',
    quizType: QUIZ_TYPES.has(filters.quizType) ? filters.quizType : 'flags',
  };

  if (hasRemote) {
    try {
      const rows = await remoteFetch(safe);
      return {
        scores: rows.map((row, index) => normalizeEntry({
          ...row,
          playerId: `remote-${index}-${row.username}-${row.created_at}`,
        })).filter(Boolean),
        remote: true,
      };
    } catch (error) {
      console.warn(error);
    }
  }

  return {
    scores: sortScores(readLocal().filter((item) => (
      item.mode === safe.mode
      && item.difficulty === safe.difficulty
      && item.quizType === safe.quizType
    ))).slice(0, 50),
    remote: false,
  };
}

export function getPersonalBest(filters = {}) {
  const safe = {
    mode: MODES.has(filters.mode) ? filters.mode : 'classic',
    difficulty: filters.difficulty === 'hard' ? 'hard' : 'easy',
    quizType: QUIZ_TYPES.has(filters.quizType) ? filters.quizType : 'flags',
  };
  const scores = readLocal().filter((item) => (
    item.mode === safe.mode
    && item.difficulty === safe.difficulty
    && item.quizType === safe.quizType
  ));
  return scores.length ? Math.max(...scores.map((item) => item.score)) : 0;
}

export function clearLocalScores() {
  storageRemove(STORAGE_KEY);
  LEGACY_KEYS.forEach((key) => storageRemove(key));
}
