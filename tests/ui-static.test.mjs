import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const match = appSource.match(/const i18n = (\{[\s\S]*?\n\});\n\nconst ACHIEVEMENTS/);
assert(match, 'i18n object should be extractable');
const i18n = Function(`"use strict"; return (${match[1]});`)();
assert(i18n.tr && i18n.en, 'Both Turkish and English dictionaries are required');

const trKeys = Object.keys(i18n.tr).sort();
const enKeys = Object.keys(i18n.en).sort();
assert.deepEqual(enKeys, trKeys, 'Turkish and English translation keys must match');

const htmlKeys = [...html.matchAll(/data-i18n(?:-html|-aria|-content)?="([^"]+)"/g)].map((item) => item[1]);
for (const key of new Set(htmlKeys)) {
  assert(key in i18n.tr, `Missing Turkish translation: ${key}`);
  assert(key in i18n.en, `Missing English translation: ${key}`);
}

assert(!html.includes('data-difficulty="medium"'), 'Medium difficulty must not exist in the interface');
assert.equal((html.match(/id="difficultyControl"[\s\S]*?<\/div>/)?.[0].match(/data-difficulty=/g) || []).length, 2, 'Home difficulty control should have two options');
assert.equal((html.match(/id="leaderboardDifficultyTabs"[\s\S]*?<\/div>/)?.[0].match(/data-difficulty=/g) || []).length, 2, 'Leaderboard difficulty control should have two options');

for (const forbidden of ['steve-old-hurt', 'challenge_complete', 'minecraft-totem', "playSound('wrong')", "playSound('combo')", "playSound('achievement')"]) {
  assert(!appSource.includes(forbidden), `Forbidden sound reference remains: ${forbidden}`);
}

assert(html.includes('Golden_Apple_JE1_BE1.png'), 'The original Golden Apple logo should be restored');
assert(html.includes('Diamond_JE3_BE3.png'), 'The achievements card should use the Minecraft diamond icon');
assert(appSource.includes("correct: './assets/sounds/minecraft-xp-orb.mp3'") && appSource.includes("playSound('correct')"), 'The local correct-answer sound should be wired into gameplay');
assert(html.includes('id="appVersion"') && html.includes(`>${packageJson.version}</strong>`), 'The main menu should show the package version');
assert(appSource.includes(`const APP_VERSION = '${packageJson.version}'`), 'The runtime version should match package.json');
assert(appSource.includes('trimAudioBuffer(decoded)') && appSource.includes('void decodePreparedAudio()'), 'Audio should be decoded early and trimmed for immediate playback');
assert(!appSource.includes("audioContext.state !== 'running'"), 'Prepared click audio must be schedulable during the resume gesture');
assert(!html.includes('id="answerFlash"') && !appSource.includes("classList.add(correct ? 'correct' : 'wrong')"), 'The full-screen answer flash should be removed');
assert(html.indexOf('id="themeGrid"') < html.indexOf('id="gameView"'), 'Themes should appear in the main-menu side column');
assert(html.includes('id="quitModal"') && html.includes('id="confirmQuitButton"'), 'A reliable in-app quit dialog is required');
assert(appSource.includes('createBalancedAnswerPlan') && appSource.includes('takeBalancedAnswerPosition'), 'Balanced answer positioning must be wired into gameplay');
console.log(`Static UI tests passed: ${trKeys.length} bilingual keys, two difficulties, quit dialog, diamond icon, and balanced answer placement.`);
