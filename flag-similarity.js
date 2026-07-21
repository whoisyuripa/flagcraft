const VISUAL_FAMILIES = [
  ['dk', 'no', 'se', 'fi', 'is'],
  ['id', 'mc', 'pl'],
  ['ro', 'td', 'md', 'ad'],
  ['nl', 'lu', 'ru', 'sk', 'si', 'hr', 'rs', 'py'],
  ['fr', 'it', 'ie', 'be', 'ro', 'td', 'ml', 'gn', 'ci'],
  ['ie', 'ci'],
  ['ml', 'gn', 'sn'],
  ['co', 'ec', 've'],
  ['eg', 'iq', 'sy', 'ye', 'sd', 'jo', 'ps', 'ae', 'kw'],
  ['ru', 'sk', 'si', 'hr', 'rs', 'cz'],
  ['us', 'lr', 'my'],
  ['au', 'nz', 'fj', 'tv', 'gb'],
  ['au', 'nz', 'pg', 'ws'],
  ['gt', 'hn', 'ni', 'sv', 'ar', 'uy'],
  ['jp', 'bd', 'pw'],
  ['tr', 'tn', 'pk', 'dz', 'az', 'sg', 'mr', 'ly'],
  ['cn', 'vn', 'ma', 'tr', 'tn'],
  ['ua', 'kz', 'ba', 'pw', 'se'],
  ['ch', 'ge', 'dk', 'to'],
  ['et', 'gh', 'sn', 'ml', 'gn', 'cm', 'bj', 'bf', 'tg', 'cg', 'gw', 'st', 'zw', 'bo'],
  ['et', 'gh', 'bo'],
  ['mw', 'ke', 'af', 'ly', 'sd'],
  ['it', 'mx', 'ir', 'bg', 'hu', 'tj'],
  ['hu', 'bg', 'ir', 'tj'],
  ['cz', 'cu', 'pr', 'ph', 'bs', 'tl', 'za', 'gy', 'sd', 'jo', 'ps', 'kw', 'ae'],
  ['ag', 'bs', 'kn', 'lc', 'vc', 'tt', 'gd', 'bb', 'dm'],
  ['tt', 'tz', 'na', 'cg', 'sb', 'pg'],
  ['ad', 'sm', 'va', 'li', 'mc', 'mt', 'cy', 'md'],
  ['sa', 'mr', 'pk', 'bd', 'ng', 'tm', 'ly'],
  ['om', 'kw', 'ae', 'jo', 'ps', 'sd'],
  ['do', 'pa', 'ht', 'cu', 'cr'],
  ['gm', 'sl', 'lr', 'gh', 'gw'],
  ['bw', 'ls', 'sz', 'za', 'na'],
  ['qa', 'bh', 'tn', 'tr', 'sg'],
  ['kh', 'th', 'cr', 'kp', 'la'],
  ['ee', 'bw', 'bs', 'bb'],
  ['rw', 'sc', 'mu', 'ga', 'cf'],
  ['bn', 'bt', 'lk', 'np', 'mv'],
  ['uz', 'tj', 'tm', 'az', 'kz'],
  ['am', 'lt', 'mm', 'bo', 'gh'],
  ['cl', 'cu', 'pr', 'lr', 'us'],
  ['gr', 'uy', 'hn', 'il', 'fi'],
  ['mk', 'kg', 'jp', 'bd', 'ar'],
  ['ng', 'ci', 'ie', 'mx', 'it'],
  ['al', 'me', 'rs', 'mk', 'ba'],
  ['at', 'lv', 'lb', 'pe', 'ca'],
  ['be', 'de', 'ug', 'ao'],
  ['so', 'vn', 'gh', 'cl', 'lr'],
  ['ne', 'in', 'ie', 'ci'],
  ['cm', 'sn', 'ml', 'gn'],
  ['cr', 'kp', 'th', 'la', 'kh'],
  ['sl', 'lr', 'my', 'us'],
  ['jm', 'za', 'vu', 'sb'],
  ['br', 'dm', 'gd', 'mz'],
  ['cy', 'xk', 'ba', 'kz'],
  ['pt', 'es', 'ad', 'sm'],
  ['gb', 'no', 'is', 'au', 'nz'],
];

const CONFUSABLE_PAIRS = new Map([
  ['id:mc', 100],
  ['ro:td', 100],
  ['nl:lu', 98],
  ['ie:ci', 98],
  ['au:nz', 96],
  ['co:ec', 94],
  ['co:ve', 93],
  ['ec:ve', 92],
  ['ml:gn', 94],
  ['ru:sk', 91],
  ['ru:si', 89],
  ['sk:si', 92],
  ['hr:rs', 88],
  ['no:is', 91],
  ['dk:no', 88],
  ['fi:se', 88],
  ['qa:bh', 93],
  ['gt:hn', 91],
  ['hn:ni', 94],
  ['ni:sv', 92],
  ['gt:sv', 89],
  ['eg:ye', 91],
  ['iq:sy', 88],
  ['jo:ps', 98],
  ['ae:kw', 86],
  ['us:lr', 91],
  ['my:us', 84],
  ['nz:tv', 83],
  ['au:fj', 82],
  ['tr:tn', 91],
  ['pk:mr', 84],
  ['jp:bd', 83],
  ['ar:uy', 86],
  ['at:lv', 84],
  ['ch:to', 78],
  ['cz:ph', 76],
  ['cu:pr', 92],
  ['kn:ag', 78],
  ['lc:vc', 80],
  ['om:ae', 86],
  ['om:kw', 82],
  ['mx:it', 76],
  ['mx:ir', 73],
  ['hu:bg', 76],
  ['hu:ir', 72],
  ['gm:sl', 80],
  ['bj:gn', 72],
  ['sn:ml', 84],
  ['gh:bo', 78],
  ['bw:ls', 75],
  ['xk:cy', 70],
]);

const FAMILY_SETS = VISUAL_FAMILIES.map((family) => new Set(family));

function pairKey(codeA, codeB) {
  return [codeA, codeB].sort().join(':');
}

function deterministicNoise(codeA, codeB) {
  const source = `${codeA}:${codeB}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return 5 + Math.abs(hash % 13);
}

export function flagSimilarity(correct, candidate) {
  if (!correct || !candidate || correct.code === candidate.code) return 100;

  const explicit = CONFUSABLE_PAIRS.get(pairKey(correct.code, candidate.code));
  if (explicit) return explicit;

  let score = deterministicNoise(correct.code, candidate.code);
  let sharedFamilies = 0;

  for (const family of FAMILY_SETS) {
    if (family.has(correct.code) && family.has(candidate.code)) sharedFamilies += 1;
  }

  if (sharedFamilies) score += Math.min(58, 24 + ((sharedFamilies - 1) * 17));
  if (correct.region === candidate.region) score += 13;
  if (correct.obscure && candidate.obscure) score += 3;

  return Math.max(1, Math.min(97, score));
}

function pickUniqueByRank(ranked, preferredIndexes, usedCodes) {
  for (const index of preferredIndexes) {
    const candidate = ranked[Math.max(0, Math.min(ranked.length - 1, index))];
    if (candidate && !usedCodes.has(candidate.country.code)) {
      usedCodes.add(candidate.country.code);
      return candidate.country;
    }
  }

  const fallback = ranked.find((item) => !usedCodes.has(item.country.code));
  if (!fallback) return null;
  usedCodes.add(fallback.country.code);
  return fallback.country;
}

export function chooseSmartDistractors(correct, countries, difficulty, random = Math.random) {
  const ranked = countries
    .filter((country) => country.code !== correct.code)
    .map((country) => ({ country, score: flagSimilarity(correct, country) }))
    .sort((a, b) => b.score - a.score || a.country.code.localeCompare(b.country.code));

  const maxIndex = Math.max(0, ranked.length - 1);
  const jitter = (amount) => Math.floor(random() * amount);
  const usedCodes = new Set();
  const picks = [];

  if (difficulty === 'hard') {
    picks.push(pickUniqueByRank(ranked, [jitter(4), 4 + jitter(8), 12 + jitter(10)], usedCodes));
    picks.push(pickUniqueByRank(ranked, [8 + jitter(16), 20 + jitter(20), 35 + jitter(20)], usedCodes));
    picks.push(pickUniqueByRank(ranked, [Math.floor(maxIndex * 0.78) + jitter(Math.max(1, Math.floor(maxIndex * 0.2)))], usedCodes));
  } else {
    picks.push(pickUniqueByRank(ranked, [Math.floor(maxIndex * 0.32) + jitter(Math.max(1, Math.floor(maxIndex * 0.2)))], usedCodes));
    picks.push(pickUniqueByRank(ranked, [Math.floor(maxIndex * 0.68) + jitter(Math.max(1, Math.floor(maxIndex * 0.16)))], usedCodes));
    picks.push(pickUniqueByRank(ranked, [Math.floor(maxIndex * 0.84) + jitter(Math.max(1, Math.floor(maxIndex * 0.14)))], usedCodes));
  }

  return picks.filter(Boolean).slice(0, 3);
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = saved;
    }
  }
  return row[right.length];
}

export function capitalSimilarity(correct, candidate, language = 'en') {
  if (!correct || !candidate || correct.code === candidate.code) return 100;
  const a = correct.capital?.[language] || correct.capital?.en || '';
  const b = candidate.capital?.[language] || candidate.capital?.en || '';
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);
  const maxLength = Math.max(1, normalizedA.length, normalizedB.length);
  const editScore = 1 - (levenshtein(a, b) / maxLength);
  let score = Math.max(0, editScore * 55);
  if (correct.region === candidate.region) score += 22;
  if (normalizedA[0] && normalizedA[0] === normalizedB[0]) score += 8;
  if (normalizedA.at(-1) && normalizedA.at(-1) === normalizedB.at(-1)) score += 5;
  if (Math.abs(normalizedA.length - normalizedB.length) <= 2) score += 5;
  if (correct.obscure && candidate.obscure) score += 3;
  return Math.max(1, Math.min(97, Math.round(score)));
}

export function chooseCapitalDistractors(correct, countries, difficulty, language = 'en', random = Math.random) {
  const ranked = countries
    .filter((country) => country.code !== correct.code && country.capital)
    .map((country) => ({ country, score: capitalSimilarity(correct, country, language) }))
    .sort((a, b) => b.score - a.score || a.country.code.localeCompare(b.country.code));

  const maxIndex = Math.max(0, ranked.length - 1);
  const jitter = (amount) => Math.floor(random() * Math.max(1, amount));
  const used = new Set();
  const picks = [];

  const take = (indexes) => {
    const selected = pickUniqueByRank(ranked, indexes, used);
    if (selected) picks.push(selected);
  };

  if (difficulty === 'hard') {
    take([jitter(6), 6 + jitter(10), 15 + jitter(12)]);
    take([8 + jitter(18), 22 + jitter(24), 45 + jitter(20)]);
    take([Math.floor(maxIndex * 0.72) + jitter(Math.max(1, Math.floor(maxIndex * 0.25)))]);
  } else {
    take([Math.floor(maxIndex * 0.38) + jitter(Math.max(1, Math.floor(maxIndex * 0.18)))]);
    take([Math.floor(maxIndex * 0.68) + jitter(Math.max(1, Math.floor(maxIndex * 0.18)))]);
    take([Math.floor(maxIndex * 0.86) + jitter(Math.max(1, Math.floor(maxIndex * 0.12)))]);
  }

  return picks.slice(0, 3);
}
