import { COUNTRIES } from './countries.js';
import { storageGet, storageSet } from './storage.js';
import { CAPITALS } from './capitals.js';
import { chooseSmartDistractors, chooseCapitalDistractors } from './flag-similarity.js';
import { createBalancedAnswerPlan, takeBalancedAnswerPosition } from './answer-balance.js';
import { saveScore, getScores, getPersonalBest, clearLocalScores } from './leaderboard-service.js';
import {
  THEMES,
  loadProfile,
  saveProfile,
  addXp,
  getRank,
  setTheme,
  unlockStoredAchievement,
  updateStats,
  resetProfile,
  xpRequired,
} from './profile-service.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const APP_VERSION = '2.4.0';

const capitalMap = new Map(CAPITALS.map((capital) => [capital.code, capital]));
const GAME_COUNTRIES = COUNTRIES.map((country) => ({ ...country, capital: capitalMap.get(country.code) })).filter((country) => country.capital);

const els = {
  body: document.body,
  homeView: $('#homeView'), gameView: $('#gameView'), resultsView: $('#resultsView'),
  appVersion: $('#appVersion'),
  homeButton: $('#homeButton'), userButton: $('#userButton'), settingsButton: $('#settingsButton'),
  languageButton: $('#languageButton'), languageLabel: $('#languageLabel'), headerUsername: $('#headerUsername'), headerLevel: $('#headerLevel'),
  quizTypeControl: $('#quizTypeControl'), difficultyControl: $('#difficultyControl'), difficultyDescription: $('#difficultyDescription'), modeGrid: $('#modeGrid'), startButton: $('#startButton'),
  profileUsername: $('#profileUsername'), avatarInitial: $('#avatarInitial'), rankChip: $('#rankChip'), editUsernameButton: $('#editUsernameButton'),
  levelValue: $('#levelValue'), totalXpValue: $('#totalXpValue'), xpFill: $('#xpFill'), xpProgressText: $('#xpProgressText'), personalBest: $('#personalBest'), achievementSummary: $('#achievementSummary'),
  leaderboardButton: $('#leaderboardButton'), achievementsButton: $('#achievementsButton'),
  quitButton: $('#quitButton'), scoreValue: $('#scoreValue'), streakValue: $('#streakValue'), gameXpValue: $('#gameXpValue'), livesPill: $('#livesPill'), livesValue: $('#livesValue'), overallPill: $('#overallPill'), overallValue: $('#overallValue'),
  progressText: $('#progressText'), progressFill: $('#progressFill'), timerPanel: $('#timerPanel'), timerValue: $('#timerValue'), timerFill: $('#timerFill'),
  promptStage: $('#promptStage'), flagLoader: $('#flagLoader'), flagImage: $('#flagImage'), capitalPrompt: $('#capitalPrompt'), capitalFlag: $('#capitalFlag'), capitalCountryName: $('#capitalCountryName'),
  questionNumber: $('#questionNumber'), questionTitle: $('#questionTitle'), answerGrid: $('#answerGrid'), comboPop: $('#comboPop'),
  resultHeadline: $('#resultHeadline'), resultSubline: $('#resultSubline'), finalScore: $('#finalScore'), finalXp: $('#finalXp'), correctStat: $('#correctStat'), accuracyStat: $('#accuracyStat'), bestStreakStat: $('#bestStreakStat'), resultRank: $('#resultRank'), resultLevel: $('#resultLevel'), resultXpText: $('#resultXpText'), resultXpFill: $('#resultXpFill'),
  reviewPanel: $('#reviewPanel'), reviewList: $('#reviewList'), playAgainButton: $('#playAgainButton'), homeResultButton: $('#homeResultButton'), resultLeaderboardButton: $('#resultLeaderboardButton'),
  usernameModal: $('#usernameModal'), usernameForm: $('#usernameForm'), usernameInput: $('#usernameInput'), usernameNote: $('#usernameNote'),
  leaderboardModal: $('#leaderboardModal'), closeLeaderboardButton: $('#closeLeaderboardButton'), leaderboardQuizTabs: $('#leaderboardQuizTabs'), leaderboardModeTabs: $('#leaderboardModeTabs'), leaderboardDifficultyTabs: $('#leaderboardDifficultyTabs'), leaderboardStatus: $('#leaderboardStatus'), leaderboardList: $('#leaderboardList'), backendNote: $('#backendNote'),
  settingsModal: $('#settingsModal'), closeSettingsButton: $('#closeSettingsButton'), soundToggle: $('#soundToggle'), motionToggle: $('#motionToggle'), themeGrid: $('#themeGrid'), resetScoresButton: $('#resetScoresButton'), resetProgressButton: $('#resetProgressButton'),
  achievementsModal: $('#achievementsModal'), closeAchievementsButton: $('#closeAchievementsButton'), achievementList: $('#achievementList'),
  quitModal: $('#quitModal'), cancelQuitButton: $('#cancelQuitButton'), confirmQuitButton: $('#confirmQuitButton'),
  toast: $('#toast'), achievementToast: $('#achievementToast'), achievementToastTitle: $('#achievementToastTitle'),
};

const i18n = {
  tr: {
    appDescription: 'FlagCraft — bayrak ve başkent bilme oyunu.', homeAria: 'Ana sayfa', languageAria: 'Dili değiştir', settingsAria: 'Ayarlar', closeAria: 'Kapat', quizTypeAria: 'Oyun türü', difficultyAria: 'Zorluk',
    eyebrow: 'BİLGİNİ GÖSTER · SERİNİ BÜYÜT', heroTitle: 'Dünyayı tanı.<br><span>Efsaneni inşa et.</span>', heroSubtitle: 'Bayrakları ve başkentleri bil, XP kazan, temaları aç ve FlagCraft sıralamasında yüksel.', versionLabel: 'Sürüm',
    buildGame: 'OYUNUNU KUR', chooseChallenge: 'Mücadele biçimini seç.', quizType: 'Oyun türü', flags: 'Bayraklar', flagsDesc: 'Bayrağı gör, ülkeyi bul', capitals: 'Başkentler', capitalsDesc: 'Ülkeyi gör, başkenti bul',
    difficulty: 'Zorluk', easy: 'Kolay', hard: 'Zor',
    flagsEasyDesc: 'Daha bilinen ülkeler ve rahat ayırt edilen seçenekler.', flagsHardDesc: 'Nadir ülkeler ve birbirine çok benzeyen bayraklar.',
    capitalsEasyDesc: 'Bilinen ülkeler ve birbirinden uzak başkent seçenekleri.', capitalsHardDesc: 'Nadir ülkeler ve adı ya da bölgesi yakın güçlü çeldiriciler.',
    gameMode: 'Oyun modu', classic: 'Klasik', classicDesc: '20 soru · soru başına 20 saniye', survival: 'Hayatta Kalma', survivalDesc: '3 can · dayanabildiğin kadar', blitz: 'Zamana Karşı', blitzDesc: '60 saniyede en yüksek skor',
    startGame: 'Oyuna Başla', playingAs: 'Oyuncu adı', edit: 'Düzenle', level: 'Seviye', totalXp: 'Toplam XP', personalBest: 'Kişisel Rekor', leaderboardLabel: 'LİDERLİK TABLOSU', seeTopPlayers: 'En iyi oyuncuları gör', achievements: 'Başarımlar',
    quit: 'Çık', leaveGameLabel: 'OYUNDAN ÇIK', quitGameTitle: 'Ana menüye dönmek istiyor musun?', quitGameBody: 'Bu turdaki puanın ve ilerlemen kaydedilmeyecek.', stayInGame: 'Oyuna Devam Et', leaveGame: 'Oyundan Çık', score: 'Puan', combo: 'Kombo', earnedXp: 'XP', lives: 'Can', overallTime: 'Toplam', timeLeft: 'KALAN SÜRE', secondsShort: 'sn', findCapital: 'BAŞKENTİ BUL', keyboardHint: '1–4 tuşlarıyla da cevaplayabilirsin.',
    whichCountry: 'Bu bayrak hangi ülkeye ait?', capitalQuestion: '{country} ülkesinin başkenti hangisi?', question: 'SORU',
    correctFeedback: 'Doğru!', wrongFeedback: 'Yanlış!', timeUp: 'Süre doldu!', comboLabel: '{count}× KOMBO',
    gameComplete: 'OYUN TAMAMLANDI', totalScore: 'TOPLAM PUAN', xpEarnedResult: 'Bu tur kazanılan XP', correct: 'Doğru', accuracy: 'Doğruluk', bestCombo: 'En İyi Kombo', rank: 'Rütbe', reviewMistakes: 'Yanlışlarını incele', playAgain: 'Tekrar Oyna', mainMenu: 'Ana Menü', leaderboard: 'Liderlik Tablosu',
    resultGreat: 'Efsane seri!', resultGood: 'Sağlam tur!', resultPractice: 'Bir tur daha?', resultGreatFlags: 'Bayrak bilgisini gerçekten iyi işlemişsin.', resultGoodFlags: 'Dünya haritasında zirveye yaklaşıyorsun.', resultPracticeFlags: 'Nadir bayraklar zorlayabilir; sonraki tur senin.', resultGreatCapitals: 'Başkent bilgisinde haritayı domine ettin.', resultGoodCapitals: 'Başkent ustalığına çok az kaldı.', resultPracticeCapitals: 'Bir tur daha ve şehirler yerine oturacak.',
    yourAnswer: 'Senin cevabın', correctAnswer: 'Doğru cevap', timedOutLabel: 'Süre doldu',
    welcome: "FLAGCRAFT'A HOŞ GELDİN", chooseUsername: 'Oyuncu adını seç.', usernameInfo: 'Skorların bu isimle kaydedilecek ve liderlik tablosunda gösterilecek.', username: 'Kullanıcı adı', usernameRules: '2–16 karakter; harf, rakam, boşluk, _ ve - kullanabilirsin.', continue: 'Devam Et', invalidUsername: '2–16 karakterlik geçerli bir kullanıcı adı gir.',
    worldRanking: 'DÜNYA SIRALAMASI', localLeaderboard: 'Şu anda bu cihazdaki skorlar gösteriliyor.', globalLeaderboard: 'Genel sıralamadaki skorlar gösteriliyor.', loading: 'Skorlar yükleniyor…', noScores: 'Henüz skor yok. İlk sırayı sen alabilirsin.', questions: 'soru', seconds: 'sn',
    preferences: 'TERCİHLER', settings: 'Ayarlar', sound: 'Ses efektleri', soundDesc: 'Anında arayüz, doğru cevap ve seviye atlama sesleri', motion: 'Animasyonlar', motionDesc: 'Hafif geçişler ve geri bildirimler', themes: 'Temalar', themesDesc: 'Seviye atlayarak yeni renk paletlerini aç.', unlockAt: 'Seviye {level} ile açılır', unlocked: 'Açık', selected: 'Seçili', resetScores: 'Yerel skorları sıfırla', resetProgress: 'XP ve ilerlemeyi sıfırla', fanDisclaimer: 'FlagCraft bağımsız bir hayran projesidir; Mojang veya Microsoft ile bağlantılı değildir.', credit: '<strong>“whoisyuripa”</strong> tarafından tasarlandı ve geliştirildi',
    progress: 'İLERLEME', achievementUnlocked: 'BAŞARIM AÇILDI', locked: 'Kilitli',
    flagAlt: 'Tahmin edilecek ülke bayrağı', levelShort: 'Sv.', scoreSaved: 'Skorun genel sıralamaya kaydedildi.', scoreLocal: 'Skorun bu cihaza kaydedildi.', newHighScore: 'Yeni kişisel rekor!', levelUp: 'Seviye {level} oldun!', themeUnlocked: 'Yeni tema açıldı: {theme}', scoresResetConfirm: 'Bu cihazdaki tüm FlagCraft skorları silinsin mi?', scoresResetDone: 'Yerel skorlar silindi.', progressResetConfirm: 'XP, seviye, başarımlar ve temalar sıfırlansın mı?', progressResetDone: 'İlerlemen sıfırlandı.', quitConfirm: 'Mevcut oyundan çıkmak istediğine emin misin?',
    themeGolden: 'Golden Apple', themeDark: 'Karanlık', themeSakura: 'Sakura', themeJapan: 'Japonya', themeSpace: 'Uzay', themeMinecraft: 'Minecraft',
    rankBronze: 'Bronz', rankSilver: 'Gümüş', rankGold: 'Altın', rankPlatinum: 'Platin', rankDiamond: 'Elmas', rankMaster: 'Usta', rankGrandmaster: 'Büyük Usta', rankChampion: 'Şampiyon', rankLegend: 'Efsane',
    achievementFirstName: 'İlk Blok', achievementFirstDesc: 'İlk doğru cevabını ver.', achievementCombo5Name: 'Seri Üretim', achievementCombo5Desc: '5× kombo yap.', achievementCombo10Name: 'Nether Serisi', achievementCombo10Desc: '10× kombo yap.', achievementPerfectFlagsName: 'Bayrak Ustası', achievementPerfectFlagsDesc: 'Klasik bayrak turunu 20/20 bitir.', achievementPerfectCapitalsName: 'Başkent Ustası', achievementPerfectCapitalsDesc: 'Klasik başkent turunu 20/20 bitir.', achievementFlag100Name: 'Atlas Madencisi', achievementFlag100Desc: 'Toplam 100 bayrak bil.', achievementCapital100Name: 'Şehir Mimarı', achievementCapital100Desc: 'Toplam 100 başkent bil.', achievementSurvivalName: 'Son Kalp', achievementSurvivalDesc: 'Hayatta Kalma modunda 15 doğruya ulaş.',
  },
  en: {
    appDescription: 'FlagCraft — a flag and capital quiz game.', homeAria: 'Home', languageAria: 'Change language', settingsAria: 'Settings', closeAria: 'Close', quizTypeAria: 'Quiz type', difficultyAria: 'Difficulty',
    eyebrow: 'CRAFT KNOWLEDGE · BUILD YOUR STREAK', heroTitle: 'Know the world.<br><span>Build your legend.</span>', heroSubtitle: 'Solve flags and capitals, earn XP, unlock themes, and climb the FlagCraft rankings.', versionLabel: 'Version',
    buildGame: 'BUILD YOUR GAME', chooseChallenge: 'Choose your challenge.', quizType: 'Quiz type', flags: 'Flags', flagsDesc: 'See the flag, find the country', capitals: 'Capitals', capitalsDesc: 'See the country, find its capital',
    difficulty: 'Difficulty', easy: 'Easy', hard: 'Hard',
    flagsEasyDesc: 'Familiar countries with clearly different choices.', flagsHardDesc: 'Rare countries and highly similar flag distractors.',
    capitalsEasyDesc: 'Familiar countries with clearly separated capital choices.', capitalsHardDesc: 'Rare countries with strong name- and region-based distractors.',
    gameMode: 'Game mode', classic: 'Classic', classicDesc: '20 questions · 20 seconds each', survival: 'Survival', survivalDesc: '3 lives · survive as long as you can', blitz: 'Time Attack', blitzDesc: 'Score as high as possible in 60 seconds',
    startGame: 'Start Game', playingAs: 'Playing as', edit: 'Edit', level: 'Level', totalXp: 'Total XP', personalBest: 'Personal Best', leaderboardLabel: 'LEADERBOARD', seeTopPlayers: 'See the top players', achievements: 'Achievements',
    quit: 'Quit', leaveGameLabel: 'LEAVE GAME', quitGameTitle: 'Return to the main menu?', quitGameBody: 'Your score and progress from this run will not be saved.', stayInGame: 'Continue Playing', leaveGame: 'Leave Game', score: 'Score', combo: 'Combo', earnedXp: 'XP', lives: 'Lives', overallTime: 'Overall', timeLeft: 'TIME LEFT', secondsShort: 'sec', findCapital: 'FIND THE CAPITAL', keyboardHint: 'You can also answer with the 1–4 keys.',
    whichCountry: 'Which country does this flag belong to?', capitalQuestion: 'What is the capital of {country}?', question: 'QUESTION',
    correctFeedback: 'Correct!', wrongFeedback: 'Wrong!', timeUp: "Time's up!", comboLabel: '{count}× COMBO',
    gameComplete: 'GAME COMPLETE', totalScore: 'TOTAL SCORE', xpEarnedResult: 'XP earned this run', correct: 'Correct', accuracy: 'Accuracy', bestCombo: 'Best Combo', rank: 'Rank', reviewMistakes: 'Review your misses', playAgain: 'Play Again', mainMenu: 'Main Menu', leaderboard: 'Leaderboard',
    resultGreat: 'Legendary streak!', resultGood: 'Solid run!', resultPractice: 'One more round?', resultGreatFlags: 'You have crafted some serious flag knowledge.', resultGoodFlags: 'You are getting close to the top of the world map.', resultPracticeFlags: 'Rare flags can be tough. The next run is yours.', resultGreatCapitals: 'You dominated the map of world capitals.', resultGoodCapitals: 'Capital mastery is within reach.', resultPracticeCapitals: 'One more run and those cities will click.',
    yourAnswer: 'Your answer', correctAnswer: 'Correct answer', timedOutLabel: 'Time ran out',
    welcome: 'WELCOME TO FLAGCRAFT', chooseUsername: 'Choose your username.', usernameInfo: 'Your scores will be saved under this name and shown on the leaderboard.', username: 'Username', usernameRules: '2–16 characters; letters, numbers, spaces, _ and - are allowed.', continue: 'Continue', invalidUsername: 'Enter a valid username between 2 and 16 characters.',
    worldRanking: 'WORLD RANKING', localLeaderboard: 'Scores from this device are currently shown.', globalLeaderboard: 'Global scores are shown.', loading: 'Loading scores…', noScores: 'No scores yet. You can take first place.', questions: 'questions', seconds: 'sec',
    preferences: 'PREFERENCES', settings: 'Settings', sound: 'Sound effects', soundDesc: 'Instant interface, correct-answer, and level-up sounds', motion: 'Animations', motionDesc: 'Light transitions and feedback', themes: 'Themes', themesDesc: 'Level up to unlock new color palettes.', unlockAt: 'Unlocks at Level {level}', unlocked: 'Unlocked', selected: 'Selected', resetScores: 'Reset local scores', resetProgress: 'Reset XP and progress', fanDisclaimer: 'FlagCraft is an independent fan project and is not affiliated with Mojang or Microsoft.', credit: 'Made and developed by <strong>“whoisyuripa”</strong>',
    progress: 'PROGRESS', achievementUnlocked: 'ACHIEVEMENT UNLOCKED', locked: 'Locked',
    flagAlt: 'Country flag to identify', levelShort: 'Lv.', scoreSaved: 'Your score was saved to the global ranking.', scoreLocal: 'Your score was saved on this device.', newHighScore: 'New personal best!', levelUp: 'You reached Level {level}!', themeUnlocked: 'New theme unlocked: {theme}', scoresResetConfirm: 'Delete all FlagCraft scores on this device?', scoresResetDone: 'Local scores deleted.', progressResetConfirm: 'Reset XP, levels, achievements, and themes?', progressResetDone: 'Your progress was reset.', quitConfirm: 'Are you sure you want to leave the current game?',
    themeGolden: 'Golden Apple', themeDark: 'Dark', themeSakura: 'Sakura', themeJapan: 'Japan', themeSpace: 'Space', themeMinecraft: 'Minecraft',
    rankBronze: 'Bronze', rankSilver: 'Silver', rankGold: 'Gold', rankPlatinum: 'Platinum', rankDiamond: 'Diamond', rankMaster: 'Master', rankGrandmaster: 'Grandmaster', rankChampion: 'Champion', rankLegend: 'Legend',
    achievementFirstName: 'First Block', achievementFirstDesc: 'Answer your first question correctly.', achievementCombo5Name: 'Mass Production', achievementCombo5Desc: 'Reach a 5× combo.', achievementCombo10Name: 'Nether Streak', achievementCombo10Desc: 'Reach a 10× combo.', achievementPerfectFlagsName: 'Flag Master', achievementPerfectFlagsDesc: 'Finish a Classic flag run with 20/20.', achievementPerfectCapitalsName: 'Capital Master', achievementPerfectCapitalsDesc: 'Finish a Classic capital run with 20/20.', achievementFlag100Name: 'Atlas Miner', achievementFlag100Desc: 'Answer 100 flag questions correctly.', achievementCapital100Name: 'City Architect', achievementCapital100Desc: 'Answer 100 capital questions correctly.', achievementSurvivalName: 'Last Heart', achievementSurvivalDesc: 'Reach 15 correct answers in Survival.',
  },
};

const ACHIEVEMENTS = [
  { id: 'first_correct', icon: '▣', name: 'achievementFirstName', desc: 'achievementFirstDesc' },
  { id: 'combo_5', icon: '⑤', name: 'achievementCombo5Name', desc: 'achievementCombo5Desc' },
  { id: 'combo_10', icon: '⑩', name: 'achievementCombo10Name', desc: 'achievementCombo10Desc' },
  { id: 'perfect_flags', icon: '⚑', name: 'achievementPerfectFlagsName', desc: 'achievementPerfectFlagsDesc' },
  { id: 'perfect_capitals', icon: '⌂', name: 'achievementPerfectCapitalsName', desc: 'achievementPerfectCapitalsDesc' },
  { id: 'flags_100', icon: '◎', name: 'achievementFlag100Name', desc: 'achievementFlag100Desc' },
  { id: 'capitals_100', icon: '◇', name: 'achievementCapital100Name', desc: 'achievementCapital100Desc' },
  { id: 'survival_15', icon: '✦', name: 'achievementSurvivalName', desc: 'achievementSurvivalDesc' },
];

const THEME_SWATCHES = {
  golden: 'linear-gradient(135deg,#ffd84d,#f29e23,#79c84a)',
  dark: 'linear-gradient(135deg,#69dcff,#6d8dff,#111722)',
  sakura: 'linear-gradient(135deg,#ff8fbc,#ff5b86,#30101d)',
  japan: 'linear-gradient(135deg,#f1e4c8,#e14940,#271c18)',
  space: 'linear-gradient(135deg,#b28cff,#5ed7ff,#15103a)',
  minecraft: 'linear-gradient(135deg,#78be4a,#98704c,#304128)',
};

const SOUND_URLS = {
  click: './assets/sounds/minecraft-click.mp3',
  correct: './assets/sounds/minecraft-xp-orb.mp3',
  levelUp: './assets/sounds/minecraft-level-up.mp3',
};

const modeConfig = {
  classic: { total: 20 },
  survival: { total: Infinity, lives: 3 },
  blitz: { total: Infinity, overallSeconds: 60 },
};
const difficultyMultiplier = { easy: 1, hard: 1.42 };
const XP_REWARDS = Object.freeze({
  correct: 20,
  completedGame: 100,
  perfectClassic: 75,
  achievement: 100,
});
const preferences = {
  lang: storageGet('flagcraft_lang') === 'en' ? 'en' : 'tr',
  sound: storageGet('flagcraft_sound') !== 'false',
  motion: storageGet('flagcraft_motion') !== 'false',
};

let username = storageGet('flagcraft_username') || '';
let playerId = storageGet('flagcraft_player_id') || '';
if (!playerId) {
  playerId = crypto.randomUUID?.() || `player-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storageSet('flagcraft_player_id', playerId);
}

let profile = loadProfile();
let selectedQuiz = storageGet('flagcraft_quiz') === 'capitals' ? 'capitals' : 'flags';
let selectedMode = modeConfig[storageGet('flagcraft_mode')] ? storageGet('flagcraft_mode') : 'classic';
let selectedDifficulty = storageGet('flagcraft_difficulty') === 'hard' ? 'hard' : 'easy';
let leaderboardFilters = { quizType: selectedQuiz, mode: selectedMode, difficulty: selectedDifficulty };
let state = null;
let previousRun = null;
let lastResult = null;
let timerId = null;
let nextQuestionTimeout = null;
let nextQuestionDueAt = null;
let pendingAdvance = null;
let toastTimeout = null;
let achievementToastTimeout = null;
let audioContext = null;
let soundGestureUnlocked = false;
let audioPreparationPromise = null;
let audioDecodePromise = null;
const encodedSounds = new Map();
const audioBuffers = new Map();

function t(key, variables = {}) {
  let output = i18n[preferences.lang]?.[key] ?? i18n.en[key] ?? key;
  Object.entries(variables).forEach(([name, value]) => { output = output.replaceAll(`{${name}}`, String(value)); });
  return output;
}

function locale() { return preferences.lang === 'tr' ? 'tr-TR' : 'en-US'; }
function countryName(country) { return country?.[preferences.lang] || country?.en || '—'; }
function capitalName(country) { return country?.capital?.[preferences.lang] || country?.capital?.en || '—'; }
function optionLabel(country, quizType = state?.quizType || selectedQuiz) { return quizType === 'capitals' ? capitalName(country) : countryName(country); }
function rankName(rankId) { return t(`rank${rankId.charAt(0).toUpperCase()}${rankId.slice(1)}`); }
function themeName(themeId) { return t(`theme${themeId.charAt(0).toUpperCase()}${themeId.slice(1)}`); }

function randomFloat() {
  if (crypto.getRandomValues) {
    const buffer = new Uint32Array(1); crypto.getRandomValues(buffer); return buffer[0] / 4294967296;
  }
  return Math.random();
}

function shuffle(array) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFloat() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function switchView(view) {
  [els.homeView, els.gameView, els.resultsView].forEach((item) => item.classList.remove('active'));
  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: preferences.motion ? 'smooth' : 'auto' });
}

function setLanguage(lang) {
  // Hide transient text from the previous language before repainting the UI.
  els.toast.classList.remove('show');
  els.achievementToast.classList.remove('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  if (achievementToastTimeout) clearTimeout(achievementToastTimeout);
  preferences.lang = lang === 'en' ? 'en' : 'tr';
  storageSet('flagcraft_lang', preferences.lang);
  document.documentElement.lang = preferences.lang;
  els.languageLabel.textContent = preferences.lang === 'tr' ? 'Türkçe' : 'English';
  $$('[data-i18n]').forEach((node) => {
    const value = i18n[preferences.lang]?.[node.dataset.i18n];
    if (value !== undefined) node.textContent = value;
  });
  $$('[data-i18n-html]').forEach((node) => {
    const value = i18n[preferences.lang]?.[node.dataset.i18nHtml];
    if (value !== undefined) node.innerHTML = value;
  });
  $$('[data-i18n-aria]').forEach((node) => {
    const value = i18n[preferences.lang]?.[node.dataset.i18nAria];
    if (value !== undefined) node.setAttribute('aria-label', value);
  });
  $$('[data-i18n-content]').forEach((node) => {
    const value = i18n[preferences.lang]?.[node.dataset.i18nContent];
    if (value !== undefined) node.setAttribute('content', value);
  });
  updateDifficultyDescription();
  renderProfile();
  renderThemes();
  renderAchievements();
  updateQuestionCopy();
  if (state?.options) renderAnswers();
  if (lastResult) renderResults(lastResult);
  if (els.leaderboardModal.open) renderLeaderboard();
}

function normalizeUsername(value) { return String(value || '').trim().replace(/\s+/g, ' '); }
function validateUsername(value) {
  const cleaned = normalizeUsername(value);
  return cleaned.length >= 2 && cleaned.length <= 16 && /^[\p{L}\p{N}_ -]+$/u.test(cleaned);
}

function setUser(value) {
  username = normalizeUsername(value);
  storageSet('flagcraft_username', username);
  els.headerUsername.textContent = username;
  els.profileUsername.textContent = username;
  els.avatarInitial.textContent = [...username][0]?.toUpperCase() || 'P';
  updatePersonalBest();
}

function openUsernameModal() {
  els.usernameInput.value = username;
  els.usernameNote.textContent = t('usernameRules');
  els.usernameNote.classList.remove('error');
  if (!els.usernameModal.open) els.usernameModal.showModal();
  setTimeout(() => els.usernameInput.focus(), 40);
}

function selectQuiz(quizType) {
  if (!['flags', 'capitals'].includes(quizType)) return;
  selectedQuiz = quizType;
  storageSet('flagcraft_quiz', selectedQuiz);
  $$('.quiz-type-button').forEach((button) => {
    const selected = button.dataset.quiz === selectedQuiz;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  updateDifficultyDescription();
  updatePersonalBest();
}

function selectMode(mode) {
  if (!modeConfig[mode]) return;
  selectedMode = mode;
  storageSet('flagcraft_mode', selectedMode);
  $$('.mode-card').forEach((card) => {
    const selected = card.dataset.mode === selectedMode;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  updatePersonalBest();
}

function selectDifficulty(difficulty) {
  if (!difficultyMultiplier[difficulty]) return;
  selectedDifficulty = difficulty;
  storageSet('flagcraft_difficulty', selectedDifficulty);
  $$('.difficulty-button').forEach((button) => {
    const selected = button.dataset.difficulty === selectedDifficulty;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  updateDifficultyDescription();
  updatePersonalBest();
}

function updateDifficultyDescription() {
  const prefix = selectedQuiz === 'flags' ? 'flags' : 'capitals';
  const difficulty = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
  els.difficultyDescription.textContent = t(`${prefix}${difficulty}Desc`);
}

function applyTheme(themeId) {
  const safe = THEMES.some((theme) => theme.id === themeId) ? themeId : 'golden';
  els.body.dataset.theme = safe;
  const themeColor = getComputedStyle(document.body).getPropertyValue('--bg').trim();
  $('meta[name="theme-color"]')?.setAttribute('content', themeColor || '#171006');
}

function renderProfile() {
  const rank = getRank(profile.totalXp);
  const requirement = xpRequired(profile.level);
  const percentage = Math.max(0, Math.min(100, (profile.levelXp / requirement) * 100));
  els.headerLevel.textContent = `${t('levelShort')} ${profile.level}`;
  els.levelValue.textContent = profile.level.toLocaleString(locale());
  els.totalXpValue.textContent = profile.totalXp.toLocaleString(locale());
  els.xpFill.style.width = `${percentage}%`;
  els.xpProgressText.textContent = `${profile.levelXp.toLocaleString(locale())} / ${requirement.toLocaleString(locale())} XP`;
  els.rankChip.textContent = rankName(rank.id);
  els.achievementSummary.textContent = `${profile.achievements.length} / ${ACHIEVEMENTS.length}`;
  applyTheme(profile.theme);
}

function renderThemes() {
  els.themeGrid.replaceChildren();
  THEMES.forEach((theme) => {
    const unlocked = profile.level >= 10 || profile.level >= theme.unlockLevel;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `theme-button sound-click${profile.theme === theme.id ? ' selected' : ''}${unlocked ? '' : ' locked'}`;
    button.dataset.theme = theme.id;
    button.disabled = !unlocked;
    const swatch = document.createElement('div'); swatch.className = 'theme-swatch'; swatch.style.setProperty('--swatch', THEME_SWATCHES[theme.id]);
    const title = document.createElement('strong'); title.textContent = themeName(theme.id);
    const detail = document.createElement('small'); detail.textContent = profile.theme === theme.id ? t('selected') : unlocked ? t('unlocked') : t('unlockAt', { level: theme.unlockLevel });
    button.append(swatch, title, detail);
    if (!unlocked) { const lock = document.createElement('span'); lock.className = 'theme-lock'; lock.textContent = '▣'; button.append(lock); }
    els.themeGrid.append(button);
  });
}

function renderAchievements() {
  els.achievementList.replaceChildren();
  ACHIEVEMENTS.forEach((achievement) => {
    const unlocked = profile.achievements.includes(achievement.id);
    const item = document.createElement('div'); item.className = `achievement-item${unlocked ? '' : ' locked'}`;
    const icon = document.createElement('span'); icon.className = 'achievement-icon'; icon.textContent = unlocked ? achievement.icon : '▣';
    const copy = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = t(achievement.name);
    const desc = document.createElement('small'); desc.textContent = t(achievement.desc);
    copy.append(name, desc); item.append(icon, copy); els.achievementList.append(item);
  });
}

function updatePersonalBest() {
  const best = getPersonalBest({ quizType: selectedQuiz, mode: selectedMode, difficulty: selectedDifficulty });
  els.personalBest.textContent = best.toLocaleString(locale());
}

function countryPoolForDifficulty(difficulty) {
  if (difficulty === 'easy') return GAME_COUNTRIES.filter((country) => !country.obscure);
  return GAME_COUNTRIES;
}

function countryWeight(country, difficulty) {
  if (difficulty === 'hard') return country.obscure ? 3.4 : .72;
  return 1;
}

function weightedDeck(difficulty) {
  const remaining = countryPoolForDifficulty(difficulty).map((country) => ({ country, weight: countryWeight(country, difficulty) }));
  const deck = [];
  while (remaining.length) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    let roll = randomFloat() * totalWeight;
    let chosen = 0;
    for (let index = 0; index < remaining.length; index += 1) {
      roll -= remaining[index].weight;
      if (roll <= 0) { chosen = index; break; }
    }
    deck.push(remaining.splice(chosen, 1)[0].country);
  }
  return deck;
}

function buildQuestionDeck(difficulty, previousCodes = []) {
  let deck = weightedDeck(difficulty);
  if (previousCodes.length && deck[0]?.code === previousCodes[0]) {
    const index = deck.findIndex((country, i) => i > 0 && country.code !== previousCodes[0]);
    if (index > 0) [deck[0], deck[index]] = [deck[index], deck[0]];
  }
  const compareLength = Math.min(12, deck.length, previousCodes.length);
  const same = deck.slice(0, compareLength).filter((country, index) => country.code === previousCodes[index]).length;
  if (compareLength >= 5 && same > compareLength / 2) deck = [...deck.slice(4), ...deck.slice(0, 4)];
  return deck;
}

function getNextCountry() {
  if (!state.questionDeck.length) {
    state.questionDeck = buildQuestionDeck(state.difficulty, state.questionHistory.slice(-10));
    if (state.currentCountry && state.questionDeck[0]?.code === state.currentCountry.code) state.questionDeck.push(state.questionDeck.shift());
  }
  return state.questionDeck.shift();
}

function fillUniqueDistractors(correct, picks) {
  const labels = new Set([optionLabel(correct, state.quizType)]);
  const output = [];
  for (const candidate of picks) {
    const label = optionLabel(candidate, state.quizType);
    if (!labels.has(label)) { labels.add(label); output.push(candidate); }
  }
  if (output.length < 3) {
    for (const candidate of shuffle(GAME_COUNTRIES)) {
      if (candidate.code === correct.code) continue;
      const label = optionLabel(candidate, state.quizType);
      if (labels.has(label)) continue;
      labels.add(label); output.push(candidate);
      if (output.length === 3) break;
    }
  }
  return output.slice(0, 3);
}

function buildOptions(correct) {
  const raw = state.quizType === 'flags'
    ? chooseSmartDistractors(correct, GAME_COUNTRIES, state.difficulty, randomFloat)
    : chooseCapitalDistractors(correct, GAME_COUNTRIES, state.difficulty, preferences.lang, randomFloat);
  const distractors = fillUniqueDistractors(correct, raw);
  const key = `${state.quizType}:${correct.code}`;
  const previousPosition = previousRun?.positionsByKey?.[key];
  if (!state.answerPositionPlan.length) state.answerPositionPlan = createBalancedAnswerPlan(randomFloat);
  const plannedPosition = takeBalancedAnswerPosition(state.answerPositionPlan, previousPosition);
  const correctPosition = Number.isInteger(plannedPosition) ? plannedPosition : Math.floor(randomFloat() * 4);
  const options = new Array(4);
  options[correctPosition] = correct;
  const shuffled = shuffle(distractors);
  let index = 0;
  for (let position = 0; position < 4; position += 1) if (!options[position]) options[position] = shuffled[index++];
  state.positionsByKey[key] = correctPosition;
  return options;
}

function startGame() {
  if (!username || !validateUsername(username)) { openUsernameModal(); return; }
  // Do not let a result toast from the previous run cover the first answers.
  els.toast.classList.remove('show');
  els.achievementToast.classList.remove('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  if (achievementToastTimeout) clearTimeout(achievementToastTimeout);
  clearTimers();
  const config = modeConfig[selectedMode];
  state = {
    quizType: selectedQuiz,
    mode: selectedMode,
    difficulty: selectedDifficulty,
    total: config.total,
    lives: config.lives ?? null,
    score: 0, correct: 0, answered: 0, streak: 0, bestStreak: 0, xpEarned: 0,
    questionIndex: 0, questionDeck: buildQuestionDeck(selectedDifficulty, previousRun?.questionCodes || []), questionHistory: [], currentCountry: null, options: [],
    positionsByKey: {}, answerPositionPlan: createBalancedAnswerPlan(randomFloat), mistakes: [], locked: false, ending: false, pausedForQuit: false, quitPause: null, startedAt: performance.now(), questionEndsAt: 0,
    overallEndsAt: config.overallSeconds ? performance.now() + config.overallSeconds * 1000 : null,
    warningPlayed: false,
  };
  els.scoreValue.textContent = '0'; els.streakValue.textContent = '0'; els.gameXpValue.textContent = '0';
  els.livesPill.hidden = selectedMode !== 'survival'; els.overallPill.hidden = selectedMode !== 'blitz';
  updateLives();
  switchView(els.gameView);
  nextQuestion();
}

function shouldEndBeforeQuestion() {
  if (!state || state.ending) return true;
  if (state.mode === 'classic' && state.questionIndex >= state.total) return true;
  if (state.mode === 'survival' && state.lives <= 0) return true;
  if (state.mode === 'blitz' && performance.now() >= state.overallEndsAt) return true;
  return false;
}

function nextQuestion() {
  clearQuestionTimer();
  if (shouldEndBeforeQuestion()) { endGame(); return; }
  state.locked = false;
  state.warningPlayed = false;
  state.currentCountry = getNextCountry();
  state.options = buildOptions(state.currentCountry);
  state.questionIndex += 1;
  state.questionHistory.push(state.currentCountry.code);
  renderQuestion();
  state.questionEndsAt = performance.now() + 20_000;
  updateTimer();
  timerId = setInterval(updateTimer, 50);
}

function flagUrl(code, width = 640) { return `https://flagcdn.com/w${width}/${code}.png`; }
function countryFlagEmoji(code) {
  if (code === 'xk') return '🇽🇰';
  return code.toUpperCase().replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}

function renderQuestion() {
  const isFlags = state.quizType === 'flags';
  els.flagImage.hidden = !isFlags; els.flagLoader.hidden = !isFlags; els.capitalPrompt.hidden = isFlags;
  if (isFlags) {
    els.flagLoader.classList.remove('hidden'); els.flagImage.classList.remove('loaded');
    els.flagImage.alt = t('flagAlt');
    els.flagImage.src = flagUrl(state.currentCountry.code);
  } else {
    els.capitalCountryName.textContent = countryName(state.currentCountry);
    els.capitalFlag.src = flagUrl(state.currentCountry.code, 640);
    els.capitalFlag.alt = '';
  }
  updateQuestionCopy();
  renderAnswers();
  updateGameStats();
}

function updateQuestionCopy() {
  if (!state?.currentCountry) return;
  els.questionNumber.textContent = `${t('question')} ${String(state.questionIndex).padStart(2, '0')}`;
  els.questionTitle.textContent = state.quizType === 'flags'
    ? t('whichCountry')
    : t('capitalQuestion', { country: countryName(state.currentCountry) });
  if (state.mode === 'classic') {
    els.progressText.textContent = `${state.questionIndex} / ${state.total}`;
    els.progressFill.style.width = `${Math.min(100, ((state.questionIndex - 1) / state.total) * 100)}%`;
  } else {
    els.progressText.textContent = `${state.correct} ${t('correct').toLocaleLowerCase(locale())}`;
    els.progressFill.style.width = `${Math.min(100, (state.correct % 20) * 5)}%`;
  }
}

function renderAnswers() {
  if (!state?.options) return;
  els.answerGrid.replaceChildren();
  state.options.forEach((country, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'answer-button'; button.dataset.code = country.code;
    const number = document.createElement('span'); number.className = 'answer-index'; number.textContent = String(index + 1);
    const label = document.createElement('span'); label.className = 'answer-label'; label.textContent = optionLabel(country, state.quizType);
    const status = document.createElement('span'); status.className = 'answer-similarity'; status.textContent = '';
    button.append(number, label, status); button.addEventListener('click', () => answer(country.code)); els.answerGrid.append(button);
  });
}

function updateGameStats() {
  if (!state) return;
  els.scoreValue.textContent = state.score.toLocaleString(locale());
  els.streakValue.textContent = state.streak.toLocaleString(locale());
  els.gameXpValue.textContent = state.xpEarned.toLocaleString(locale());
  updateLives();
}

function updateLives() {
  if (!state || state.mode !== 'survival') return;
  els.livesValue.textContent = `${'♥'.repeat(Math.max(0, state.lives))}${'♡'.repeat(Math.max(0, 3 - state.lives))}`;
}

function clearQuestionTimer() { if (timerId) clearInterval(timerId); timerId = null; }
function clearAdvanceTimer({ keepCallback = false } = {}) {
  if (nextQuestionTimeout) clearTimeout(nextQuestionTimeout);
  nextQuestionTimeout = null;
  nextQuestionDueAt = null;
  if (!keepCallback) pendingAdvance = null;
}
function clearTimers() {
  clearQuestionTimer();
  clearAdvanceTimer();
}
function scheduleAdvance(callback, delay) {
  clearAdvanceTimer();
  pendingAdvance = callback;
  const safeDelay = Math.max(0, Number(delay) || 0);
  nextQuestionDueAt = performance.now() + safeDelay;
  nextQuestionTimeout = setTimeout(() => {
    const run = pendingAdvance;
    nextQuestionTimeout = null;
    nextQuestionDueAt = null;
    pendingAdvance = null;
    run?.();
  }, safeDelay);
}

function updateTimer() {
  if (!state || state.locked || state.ending) return;
  const now = performance.now();
  const questionRemaining = Math.max(0, (state.questionEndsAt - now) / 1000);
  els.timerValue.textContent = questionRemaining.toFixed(1);
  els.timerFill.style.width = `${Math.max(0, Math.min(100, questionRemaining / 20 * 100))}%`;
  els.timerPanel.classList.toggle('danger', questionRemaining <= 5);
  if (state.mode === 'blitz') {
    const overall = Math.max(0, (state.overallEndsAt - now) / 1000);
    els.overallValue.textContent = overall.toFixed(1);
    if (overall <= 0) { endGame(); return; }
  }
  if (questionRemaining <= 0) resolveAnswer({ selectedCode: null, timedOut: true });
}

function answer(code) {
  if (!state || state.locked || state.ending) return;
  resolveAnswer({ selectedCode: code, timedOut: false });
}

function calculateScore(remaining, streak) {
  const base = 100;
  const speedBonus = Math.round(Math.max(0, Math.min(100, remaining * 5)));
  const comboMultiplier = 1 + Math.min(1.5, Math.floor(Math.max(0, streak - 1) / 2) * .15);
  return Math.round((base + speedBonus) * comboMultiplier * difficultyMultiplier[state.difficulty]);
}

function awardXp(amount) {
  const safeAmount = Math.max(0, Math.round(amount));
  if (!safeAmount) return;
  const beforeLevel = profile.level;
  const result = addXp(profile, safeAmount);
  profile = result.profile;
  if (state) state.xpEarned += safeAmount;
  renderProfile(); renderThemes(); updateGameStats();
  if (result.levelUps.length) {
    playSound('levelUp');
    showToast(t('levelUp', { level: profile.level }));
    const newlyAvailable = THEMES.filter((theme) => theme.unlockLevel > beforeLevel && theme.unlockLevel <= profile.level);
    newlyAvailable.forEach((theme, index) => setTimeout(() => showToast(t('themeUnlocked', { theme: themeName(theme.id) })), 900 + index * 900));
  }
}

function unlockAchievement(id) {
  const definition = ACHIEVEMENTS.find((item) => item.id === id);
  if (!definition) return false;
  const result = unlockStoredAchievement(profile, id);
  profile = result.profile;
  if (!result.unlocked) return false;
  awardXp(XP_REWARDS.achievement);
  renderAchievements();
  showAchievementToast(t(definition.name));
  return true;
}

function resolveAnswer({ selectedCode, timedOut }) {
  if (!state || state.locked || state.ending) return;
  state.locked = true; clearQuestionTimer();
  const remaining = Math.max(0, (state.questionEndsAt - performance.now()) / 1000);
  const isCorrect = selectedCode === state.currentCountry.code;
  state.answered += 1;
  let gained = 0;

  if (isCorrect) {
    playSound('correct');
    state.correct += 1; state.streak += 1; state.bestStreak = Math.max(state.bestStreak, state.streak);
    gained = calculateScore(remaining, state.streak); state.score += gained;
    awardXp(XP_REWARDS.correct);
    unlockAchievement('first_correct');
    if ([5, 10].includes(state.streak)) showCombo(state.streak);
    if (state.streak === 5) unlockAchievement('combo_5');
    if (state.streak === 10) unlockAchievement('combo_10');

  } else {
    const selectedCountry = GAME_COUNTRIES.find((country) => country.code === selectedCode) || null;
    state.mistakes.push({ correctCountry: state.currentCountry, selectedCountry, timedOut });
    state.streak = 0;
    if (state.mode === 'survival') state.lives -= 1;
  }

  revealAnswer(selectedCode, timedOut, gained);
  updateGameStats();
  const delay = preferences.motion ? 930 : 420;
  scheduleAdvance(() => {
    if (!state || state.ending) return;
    if ((state.mode === 'classic' && state.questionIndex >= state.total) || (state.mode === 'survival' && state.lives <= 0)) endGame();
    else nextQuestion();
  }, delay);
}

function revealAnswer(selectedCode, timedOut, gained) {
  const correctCode = state.currentCountry.code;
  $$('.answer-button', els.answerGrid).forEach((button) => {
    button.disabled = true;
    if (button.dataset.code === correctCode) button.classList.add('correct');
    else if (button.dataset.code === selectedCode) button.classList.add('wrong');
    else button.classList.add('dimmed');
  });
  const correct = selectedCode === correctCode;
  showToast(correct ? `${t('correctFeedback')} +${gained.toLocaleString(locale())}` : timedOut ? t('timeUp') : t('wrongFeedback'));
}

function showCombo(count) {
  els.comboPop.textContent = t('comboLabel', { count });
  els.comboPop.classList.remove('show');
  void els.comboPop.offsetWidth;
  els.comboPop.classList.add('show');
}

async function endGame() {
  if (!state || state.ending) return;
  state.ending = true; clearTimers();
  const finalState = state;
  const total = Math.max(1, finalState.answered);
  const perfect = finalState.mode === 'classic' && finalState.correct === 20 && total === 20;
  awardXp(XP_REWARDS.completedGame);
  if (perfect) {
    awardXp(XP_REWARDS.perfectClassic);
    unlockAchievement(finalState.quizType === 'flags' ? 'perfect_flags' : 'perfect_capitals');
  }

  profile = updateStats(profile, {
    correct: finalState.correct, quizType: finalState.quizType, bestStreak: finalState.bestStreak, perfect,
  });
  if (profile.stats.flagsCorrect >= 100) unlockAchievement('flags_100');
  if (profile.stats.capitalsCorrect >= 100) unlockAchievement('capitals_100');
  if (finalState.mode === 'survival' && finalState.correct >= 15) unlockAchievement('survival_15');
  profile = saveProfile(profile);

  const duration = Math.max(1, Math.round((performance.now() - finalState.startedAt) / 1000));
  const filters = { quizType: finalState.quizType, mode: finalState.mode, difficulty: finalState.difficulty };
  const oldBest = getPersonalBest(filters);
  const result = {
    ...filters,
    score: finalState.score, correct: finalState.correct, total, duration, bestStreak: finalState.bestStreak, mistakes: finalState.mistakes,
    xpEarned: finalState.xpEarned, perfect, positionsByKey: finalState.positionsByKey, questionCodes: finalState.questionHistory,
  };
  previousRun = { positionsByKey: finalState.positionsByKey, questionCodes: finalState.questionHistory };
  lastResult = result;
  renderResults(result);
  state = null;
  switchView(els.resultsView);

  const saveResult = await saveScore({ playerId, username, ...result, createdAt: new Date().toISOString() });
  updatePersonalBest();
  if (result.score > oldBest && result.score > 0) { showToast(t('newHighScore')); }
  else showToast(saveResult.remote ? t('scoreSaved') : t('scoreLocal'));
}

function renderResults(result) {
  const accuracy = Math.round((result.correct / Math.max(1, result.total)) * 100);
  const tier = accuracy >= 85 ? 'Great' : accuracy >= 55 ? 'Good' : 'Practice';
  els.resultHeadline.textContent = t(`result${tier}`);
  const typeSuffix = result.quizType === 'capitals' ? 'Capitals' : 'Flags';
  els.resultSubline.textContent = t(`result${tier}${typeSuffix}`);
  els.finalScore.textContent = result.score.toLocaleString(locale());
  els.finalXp.textContent = result.xpEarned.toLocaleString(locale());
  els.correctStat.textContent = result.mode === 'classic' ? `${result.correct}/${result.total}` : result.correct.toLocaleString(locale());
  els.accuracyStat.textContent = `${accuracy}%`;
  els.bestStreakStat.textContent = `${result.bestStreak}×`;
  els.resultRank.textContent = rankName(getRank(profile.totalXp).id);
  els.resultLevel.textContent = profile.level.toLocaleString(locale());
  const requirement = xpRequired(profile.level);
  els.resultXpText.textContent = `${profile.levelXp.toLocaleString(locale())} / ${requirement.toLocaleString(locale())} XP`;
  els.resultXpFill.style.width = `${Math.max(0, Math.min(100, profile.levelXp / requirement * 100))}%`;
  renderReview(result.mistakes, result.quizType);
}

function renderReview(mistakes, quizType) {
  els.reviewList.replaceChildren();
  const safe = Array.isArray(mistakes) ? mistakes : [];
  els.reviewPanel.hidden = safe.length === 0; els.reviewPanel.open = false;
  safe.slice(0, 30).forEach((mistake) => {
    const item = document.createElement('div'); item.className = 'review-item';
    const image = document.createElement('img'); image.src = flagUrl(mistake.correctCountry.code, 80); image.alt = ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
    const copy = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = quizType === 'capitals' ? countryName(mistake.correctCountry) : countryName(mistake.correctCountry);
    const detail = document.createElement('small');
    if (mistake.timedOut) detail.textContent = `${t('timedOutLabel')} · ${t('correctAnswer')}: ${optionLabel(mistake.correctCountry, quizType)}`;
    else detail.textContent = `${t('yourAnswer')}: ${mistake.selectedCountry ? optionLabel(mistake.selectedCountry, quizType) : '—'} · ${t('correctAnswer')}: ${optionLabel(mistake.correctCountry, quizType)}`;
    copy.append(title, detail); item.append(image, copy); els.reviewList.append(item);
  });
}

function openLeaderboard(filters = {}) {
  leaderboardFilters = {
    quizType: filters.quizType || selectedQuiz,
    mode: filters.mode || selectedMode,
    difficulty: filters.difficulty || selectedDifficulty,
  };
  if (!els.leaderboardModal.open) els.leaderboardModal.showModal();
  renderLeaderboard();
}

function updateLeaderboardTabs() {
  $$('button[data-quiz]', els.leaderboardQuizTabs).forEach((button) => button.classList.toggle('active', button.dataset.quiz === leaderboardFilters.quizType));
  $$('button[data-mode]', els.leaderboardModeTabs).forEach((button) => button.classList.toggle('active', button.dataset.mode === leaderboardFilters.mode));
  $$('button[data-difficulty]', els.leaderboardDifficultyTabs).forEach((button) => button.classList.toggle('active', button.dataset.difficulty === leaderboardFilters.difficulty));
}

async function renderLeaderboard() {
  updateLeaderboardTabs();
  els.leaderboardStatus.textContent = t('loading'); els.leaderboardList.replaceChildren();
  const result = await getScores(leaderboardFilters);
  els.leaderboardStatus.textContent = ''; els.backendNote.textContent = result.remote ? t('globalLeaderboard') : t('localLeaderboard');
  if (!result.scores.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = t('noScores'); els.leaderboardList.append(empty); return; }
  result.scores.forEach((entry, index) => {
    const row = document.createElement('div'); row.className = `leader-row${entry.username === username ? ' me' : ''}`;
    const rank = document.createElement('span'); rank.className = 'rank-badge'; rank.textContent = String(index + 1);
    const nameBlock = document.createElement('span'); nameBlock.className = 'leader-name';
    const name = document.createElement('strong'); name.textContent = entry.username;
    const detail = document.createElement('small'); detail.textContent = `${entry.correct}/${entry.total || entry.correct} · ${entry.duration} ${t('seconds')} · ${t(entry.difficulty)}`;
    nameBlock.append(name, detail);
    const scoreBlock = document.createElement('span'); scoreBlock.className = 'leader-score';
    const score = document.createElement('strong'); score.textContent = entry.score.toLocaleString(locale());
    const label = document.createElement('small'); label.textContent = t('score'); scoreBlock.append(score, label);
    row.append(rank, nameBlock, scoreBlock); els.leaderboardList.append(row);
  });
}

function closeDialogOnBackdrop(dialog, event) { if (event.target === dialog) dialog.close(); }

function showToast(message) {
  els.toast.textContent = message; els.toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function showAchievementToast(title) {
  els.achievementToastTitle.textContent = title; els.achievementToast.classList.add('show');
  if (achievementToastTimeout) clearTimeout(achievementToastTimeout);
  achievementToastTimeout = setTimeout(() => els.achievementToast.classList.remove('show'), 3200);
}

function prepareAudio() {
  if (audioPreparationPromise) return audioPreparationPromise;
  audioPreparationPromise = Promise.all(Object.entries(SOUND_URLS).map(async ([type, url]) => {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Sound could not be loaded: ${type}`);
    encodedSounds.set(type, await response.arrayBuffer());
  })).catch(() => {
    // Immediate synthesized sounds remain available if an asset cannot be loaded.
  });
  return audioPreparationPromise;
}

function decodePreparedAudio() {
  if (!audioContext || audioDecodePromise) return audioDecodePromise;
  audioDecodePromise = prepareAudio().then(async () => {
    await Promise.all([...encodedSounds.entries()].map(async ([type, data]) => {
      if (audioBuffers.has(type)) return;
      try {
        const decoded = await audioContext.decodeAudioData(data.slice(0));
        audioBuffers.set(type, trimAudioBuffer(decoded));
      } catch {
        // The synthesized fallback will be used for this sound.
      }
    }));
  });
  return audioDecodePromise;
}

function trimAudioBuffer(buffer) {
  const threshold = .0025;
  let firstAudibleFrame = buffer.length;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let frame = 0; frame < firstAudibleFrame; frame += 1) {
      if (Math.abs(samples[frame]) >= threshold) {
        firstAudibleFrame = frame;
        break;
      }
    }
  }
  if (firstAudibleFrame === 0 || firstAudibleFrame === buffer.length) return buffer;
  const startFrame = Math.max(0, firstAudibleFrame - Math.round(buffer.sampleRate * .002));
  const trimmed = audioContext.createBuffer(buffer.numberOfChannels, buffer.length - startFrame, buffer.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    trimmed.copyToChannel(buffer.getChannelData(channel).subarray(startFrame), channel);
  }
  return trimmed;
}

function unlockSoundGesture() {
  soundGestureUnlocked = true;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') void audioContext.resume();
    void decodePreparedAudio();
  } catch { /* optional */ }
}

function synthSound(type) {
  if (!preferences.sound || !soundGestureUnlocked) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain); gain.connect(audioContext.destination);
    const map = { click: [245, 320, .045], correct: [660, 880, .09], levelUp: [420, 980, .34] };
    const [start, end, duration] = map[type] || map.click;
    oscillator.type = type === 'click' ? 'square' : 'sine';
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, end), now + duration);
    gain.gain.setValueAtTime(type === 'click' ? .018 : .05, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.start(now); oscillator.stop(now + duration + .01);
  } catch { /* no audio support */ }
}

function playSound(type) {
  if (!preferences.sound || !soundGestureUnlocked) return;
  const buffer = audioBuffers.get(type);
  if (!audioContext || !buffer) { synthSound(type); return; }
  try {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    gain.gain.value = type === 'click' ? .2 : type === 'correct' ? .34 : .38;
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start(audioContext.currentTime);
  } catch { synthSound(type); }
}

function pauseForQuit() {
  if (!state || state.ending || els.quitModal.open) return;
  const now = performance.now();
  state.quitPause = {
    questionRemainingMs: Math.max(0, state.questionEndsAt - now),
    overallRemainingMs: state.overallEndsAt ? Math.max(0, state.overallEndsAt - now) : null,
    advanceRemainingMs: nextQuestionDueAt ? Math.max(0, nextQuestionDueAt - now) : null,
  };
  state.pausedForQuit = true;
  clearQuestionTimer();
  if (nextQuestionTimeout) clearAdvanceTimer({ keepCallback: true });
  els.quitModal.showModal();
  setTimeout(() => els.cancelQuitButton.focus(), 30);
}

function resumeAfterQuitCancel() {
  if (!state) { if (els.quitModal.open) els.quitModal.close(); return; }
  const pause = state.quitPause || {};
  const now = performance.now();
  state.pausedForQuit = false;
  state.quitPause = null;
  if (els.quitModal.open) els.quitModal.close();
  if (state.ending) return;
  if (state.locked && pendingAdvance) {
    scheduleAdvance(pendingAdvance, pause.advanceRemainingMs ?? 0);
    return;
  }
  state.questionEndsAt = now + Math.max(0, pause.questionRemainingMs ?? 20_000);
  if (state.mode === 'blitz' && pause.overallRemainingMs !== null) state.overallEndsAt = now + Math.max(0, pause.overallRemainingMs);
  updateTimer();
  timerId = setInterval(updateTimer, 50);
}

function goHome() {
  if (els.quitModal.open) els.quitModal.close();
  clearTimers();
  state = null;
  switchView(els.homeView);
  updatePersonalBest();
}

function requestQuit() {
  if (!state) { goHome(); return; }
  pauseForQuit();
}

els.flagImage.addEventListener('load', () => { els.flagLoader.classList.add('hidden'); els.flagImage.classList.add('loaded'); });
els.flagImage.addEventListener('error', () => {
  els.flagLoader.classList.add('hidden');
  const emoji = countryFlagEmoji(state?.currentCountry?.code || '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="100%" height="100%" rx="20" fill="#211606"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="180">${emoji || '🏳️'}</text></svg>`;
  els.flagImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});
els.capitalFlag.addEventListener('error', () => { els.capitalFlag.hidden = true; });
els.capitalFlag.addEventListener('load', () => { els.capitalFlag.hidden = false; });

function clickableSoundTarget(event) {
  const target = event.target.closest?.('.sound-click');
  return target && !target.matches(':disabled, [aria-disabled="true"]') ? target : null;
}

document.addEventListener('pointerdown', (event) => {
  unlockSoundGesture();
  if (clickableSoundTarget(event)) playSound('click');
}, { passive: true });
document.addEventListener('click', (event) => {
  if (event.detail !== 0 || !clickableSoundTarget(event)) return;
  unlockSoundGesture();
  playSound('click');
});
els.languageButton.addEventListener('click', () => setLanguage(preferences.lang === 'tr' ? 'en' : 'tr'));
els.homeButton.addEventListener('click', () => state ? requestQuit() : goHome());
els.userButton.addEventListener('click', openUsernameModal); els.editUsernameButton.addEventListener('click', openUsernameModal);
els.quizTypeControl.addEventListener('click', (event) => { const button = event.target.closest('[data-quiz]'); if (button) selectQuiz(button.dataset.quiz); });
els.difficultyControl.addEventListener('click', (event) => { const button = event.target.closest('[data-difficulty]'); if (button) selectDifficulty(button.dataset.difficulty); });
els.modeGrid.addEventListener('click', (event) => { const button = event.target.closest('[data-mode]'); if (button) selectMode(button.dataset.mode); });
els.startButton.addEventListener('click', startGame); els.playAgainButton.addEventListener('click', startGame); els.homeResultButton.addEventListener('click', goHome); els.quitButton.addEventListener('click', requestQuit);
els.leaderboardButton.addEventListener('click', () => openLeaderboard()); els.resultLeaderboardButton.addEventListener('click', () => openLeaderboard(lastResult || {}));
els.achievementsButton.addEventListener('click', () => { renderAchievements(); if (!els.achievementsModal.open) els.achievementsModal.showModal(); });
els.settingsButton.addEventListener('click', () => { renderThemes(); if (!els.settingsModal.open) els.settingsModal.showModal(); });

els.usernameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateUsername(els.usernameInput.value)) { els.usernameNote.textContent = t('invalidUsername'); els.usernameNote.classList.add('error'); return; }
  setUser(els.usernameInput.value); els.usernameModal.close();
});
els.usernameModal.addEventListener('cancel', (event) => { if (!username) event.preventDefault(); });
els.usernameModal.addEventListener('click', (event) => { if (event.target === els.usernameModal && username) els.usernameModal.close(); });

[
  [els.leaderboardModal, els.closeLeaderboardButton], [els.settingsModal, els.closeSettingsButton], [els.achievementsModal, els.closeAchievementsButton],
].forEach(([dialog, close]) => { close.addEventListener('click', () => dialog.close()); dialog.addEventListener('click', (event) => closeDialogOnBackdrop(dialog, event)); });

els.cancelQuitButton.addEventListener('click', resumeAfterQuitCancel);
els.confirmQuitButton.addEventListener('click', goHome);
els.quitModal.addEventListener('cancel', (event) => { event.preventDefault(); resumeAfterQuitCancel(); });
els.quitModal.addEventListener('click', (event) => { if (event.target === els.quitModal) resumeAfterQuitCancel(); });

els.leaderboardQuizTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-quiz]'); if (button) { leaderboardFilters.quizType = button.dataset.quiz; renderLeaderboard(); } });
els.leaderboardModeTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-mode]'); if (button) { leaderboardFilters.mode = button.dataset.mode; renderLeaderboard(); } });
els.leaderboardDifficultyTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-difficulty]'); if (button) { leaderboardFilters.difficulty = button.dataset.difficulty; renderLeaderboard(); } });

els.soundToggle.addEventListener('change', () => { preferences.sound = els.soundToggle.checked; storageSet('flagcraft_sound', String(preferences.sound)); if (preferences.sound) { unlockSoundGesture(); playSound('click'); } });
els.motionToggle.addEventListener('change', () => { preferences.motion = els.motionToggle.checked; storageSet('flagcraft_motion', String(preferences.motion)); els.body.classList.toggle('no-motion', !preferences.motion); });
els.themeGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-theme]'); if (!button || button.disabled) return;
  const result = setTheme(profile, button.dataset.theme); profile = result.profile; if (result.changed) { renderProfile(); renderThemes(); }
});
els.resetScoresButton.addEventListener('click', () => { if (!window.confirm(t('scoresResetConfirm'))) return; clearLocalScores(); updatePersonalBest(); showToast(t('scoresResetDone')); els.settingsModal.close(); });
els.resetProgressButton.addEventListener('click', () => { if (!window.confirm(t('progressResetConfirm'))) return; profile = resetProfile(); renderProfile(); renderThemes(); renderAchievements(); showToast(t('progressResetDone')); els.settingsModal.close(); });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state && !state.ending && els.gameView.classList.contains('active') && !els.quitModal.open) {
    event.preventDefault();
    requestQuit();
    return;
  }
  if (!state || state.locked || state.ending || state.pausedForQuit || !els.gameView.classList.contains('active')) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < state.options.length) answer(state.options[index].code);
});

function initialize() {
  prepareAudio();
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    void decodePreparedAudio();
  } catch { /* optional */ }
  els.appVersion.textContent = APP_VERSION;
  $$('.asset-golden-apple, .asset-diamond').forEach((image) => image.addEventListener('error', () => { image.src = image.dataset.fallback || './favicon.svg'; }, { once: true }));
  els.soundToggle.checked = preferences.sound; els.motionToggle.checked = preferences.motion; els.body.classList.toggle('no-motion', !preferences.motion);
  selectQuiz(selectedQuiz); selectMode(selectedMode); selectDifficulty(selectedDifficulty); setLanguage(preferences.lang);
  renderProfile(); renderThemes(); renderAchievements();
  if (username && validateUsername(username)) setUser(username); else { username = ''; setTimeout(openUsernameModal, 180); }
}

initialize();
