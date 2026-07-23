import assert from 'node:assert/strict';
import { COUNTRIES } from '../countries.js';
import { CAPITALS } from '../capitals.js';
import { chooseSmartDistractors, chooseCapitalDistractors } from '../flag-similarity.js';
import { RANKS, THEMES, xpRequired, getRank, loadProfile } from '../profile-service.js';
import { createBalancedAnswerPlan, takeBalancedAnswerPosition } from '../answer-balance.js';

assert.equal(COUNTRIES.length, 197, 'Expected 197 countries');
assert.equal(CAPITALS.length, 197, 'Expected 197 capitals');
assert.equal(new Set(COUNTRIES.map(c => c.code)).size, 197, 'Country codes must be unique');
assert.equal(new Set(CAPITALS.map(c => c.code)).size, 197, 'Capital codes must be unique');
const capitals = new Map(CAPITALS.map(c => [c.code, c]));
const gameCountries = COUNTRIES.map(c => ({ ...c, capital: capitals.get(c.code) }));
assert(gameCountries.every(c => c.capital), 'Every country needs a capital');

for (const difficulty of ['easy', 'hard']) {
  for (const country of gameCountries) {
    for (let seed = 0; seed < 5; seed++) {
      // deterministic pseudo-random sequence for repeatable coverage
      let value = (seed + 1) * 997 + country.code.charCodeAt(0) * 31 + country.code.charCodeAt(1);
      const random = () => ((value = (value * 48271) % 2147483647) / 2147483647);
      const flagChoices = chooseSmartDistractors(country, gameCountries, difficulty, random);
      assert.equal(flagChoices.length, 3, `${country.code}/${difficulty}: flag distractor count`);
      assert.equal(new Set(flagChoices.map(c => c.code)).size, 3, `${country.code}/${difficulty}: flag distractors unique`);
      assert(!flagChoices.some(c => c.code === country.code), `${country.code}/${difficulty}: correct flag cannot distract`);

      const capitalChoices = chooseCapitalDistractors(country, gameCountries, difficulty, 'en', random);
      assert.equal(capitalChoices.length, 3, `${country.code}/${difficulty}: capital distractor count`);
      assert.equal(new Set(capitalChoices.map(c => c.code)).size, 3, `${country.code}/${difficulty}: capital distractors unique`);
      assert(!capitalChoices.some(c => c.code === country.code), `${country.code}/${difficulty}: correct capital cannot distract`);
    }
  }
}

assert.equal(xpRequired(1), 600, 'Level 2 should be reachable after roughly two or three normal runs');
assert.equal(xpRequired(12), 1700, 'Later levels should remain progressive without becoming grindy');
assert.deepEqual(THEMES.map(({ id, unlockLevel }) => [id, unlockLevel]), [['golden',1],['space',2],['minecraft',4],['dark',6],['sakura',8],['japan',10]], 'Theme unlock schedule');
assert(THEMES.every((theme) => theme.unlockLevel <= 10), 'All themes must unlock by Level 10');
for (let i = 1; i < RANKS.length; i++) assert(RANKS[i].minXp > RANKS[i-1].minXp, 'Rank thresholds must increase');
for (let i = 1; i < THEMES.length; i++) assert(THEMES[i].unlockLevel >= THEMES[i-1].unlockLevel, 'Theme levels must not decrease');
assert.equal(getRank(0).id, 'bronze');
assert.equal(getRank(50_000).id, 'legend');

globalThis.window = {
  localStorage: {
    getItem: () => JSON.stringify({
      level: 1,
      levelXp: 1_000,
      totalXp: 1_000,
      theme: 'space',
      achievements: [],
      stats: {},
    }),
    setItem: () => {},
    removeItem: () => {},
  },
};
const migratedProfile = loadProfile();
assert.equal(migratedProfile.level, 2, 'Stored profiles should migrate to the new XP curve from total XP');
assert.equal(migratedProfile.levelXp, 400, 'Migrated profiles should preserve XP beyond the new level threshold');
assert.equal(migratedProfile.theme, 'space', 'A theme unlocked by the migrated level should remain selected');
delete globalThis.window;


for (let seed = 1; seed <= 100; seed++) {
  let value = seed * 7919;
  const random = () => ((value = (value * 48271) % 2147483647) / 2147483647);
  const plan = createBalancedAnswerPlan(random);
  assert.equal(plan.length, 20, 'Answer position plan should cover a Classic run');
  const counts = [0, 0, 0, 0];
  plan.forEach((position) => {
    assert(position >= 0 && position <= 3, 'Answer position should be between 0 and 3');
    counts[position] += 1;
  });
  assert(counts.every((count) => count >= 4 && count <= 6), `Balanced counts expected, got ${counts}`);
  assert.notDeepEqual(counts, [5, 5, 5, 5], 'Exact 5/5/5/5 distribution should vary to prevent counting exploits');
}

const avoidancePlan = [2, 2, 1, 3];
assert.equal(takeBalancedAnswerPosition(avoidancePlan, 2), 1, 'Previous answer position should be avoided when the plan permits it');
assert.deepEqual(avoidancePlan.sort(), [2, 2, 3], 'Avoiding a repeat must preserve remaining position totals');

console.log(`Data tests passed: ${COUNTRIES.length} countries × 2 difficulties × 2 quiz types, plus balanced answer positions.`);
