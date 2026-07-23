# FlagCraft 2.3 Test Report

Validated before publishing:

- JavaScript syntax checks for the application and profile service
- 197 countries and 197 capitals
- Easy and Hard distractors for both quiz types
- 100 deterministic 20-question answer-position plans
- Every answer slot appears 4–6 times per Classic run
- Turkish and English dictionaries contain the same 160 keys
- All translated HTML bindings resolve in both languages
- Turkish rank, accuracy, status, credit, game, result, and settings copy
- Correct-answer feedback marks only the answer button; no flag-area flash overlay remains
- Local Minecraft click, XP-orb, and level-up MP3 files are present and wired to immediate Web Audio playback with a synthesized fallback
- XP rewards, 600 XP Level 2 target, completed-game bonus, and old-profile migration from total XP
- Themes render in the main-menu progress column and remain selectable at their unlock levels
- First-visit Golden Apple logo and fallback handling
- In-game exit pauses and resumes active timers and returns safely to the main menu
- No duplicate HTML IDs
- All six themes at Level 10
- Desktop and 390×844 mobile layouts with no horizontal overflow
- Standalone HTML generation with embedded sound assets
- Independent headless Edge/Playwright regression suite
