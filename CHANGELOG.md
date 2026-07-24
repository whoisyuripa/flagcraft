# FlagCraft 2.4 — Final Sync & Quality Update

## Main-menu version

- Added a visible, bilingual version badge to the main menu.
- Kept the displayed version synchronized with the runtime and package version.

## Immediate interface audio

- Prepared and decoded local sounds during startup whenever the browser permits it.
- Trimmed silent MP3 lead-in frames so the Minecraft click begins at the press moment.
- Scheduled prepared audio directly during the browser resume gesture instead of waiting for a later click.
- Added an immediate keyboard-activation sound and prevented disabled controls from playing a click.

## Language and reliability

- Corrected the Turkish global-ranking wording and clarified how usernames are used.
- Improved the English Survival and Time Attack descriptions.
- Added regression coverage for version synchronization and the zero-delay audio path.

---

# FlagCraft 2.3 — Progress & Polish Update

## Interface and localization

- Removed the full-screen answer flash while preserving answer-button feedback.
- Replaced the first-visit username logo with the Golden Apple.
- Moved Themes from Settings to the main-menu progress column.
- Completed the remaining Turkish interface text and corrected awkward or untranslated rank, accuracy, credit, and status labels.

## Audio responsiveness

- Added the Minecraft XP-orb sound from Myinstants for correct answers.
- Stored all three sound effects locally and decoded them into Web Audio buffers.
- Sounds now start at the input event; an immediate synthesized fallback covers first-use or decoding failures.

## XP balance

- Increased correct-answer XP from 10 to 20.
- Added 100 XP for every completed game and increased the perfect Classic bonus from 50 to 75.
- Reduced the Level 2 requirement from 1,125 to 600 XP and softened later level requirements.
- A typical player now reaches Level 2 after two runs; a lower-scoring player should reach it after roughly three.
- Existing profiles are recalculated from total XP so the new curve never discards previously earned progress.

## Reliability

- Added regression tests for the removed overlay, local correct-answer sound, main-menu Themes placement, and new XP curve.
- Embedded the local audio files in the standalone build so it remains portable.

---

# FlagCraft 2.2 — Exit & Fairness Update

## Gameplay fixes

- Replaced the unreliable browser confirm prompt with a dedicated in-game exit dialog.
- Opening the exit dialog pauses both the 20-second question timer and the 60-second Time Attack clock.
- Continuing resumes from the exact remaining time; confirming exit safely clears every active timer and returns to the main menu.
- Escape opens the exit dialog during gameplay, and Escape/backdrop/cancel resumes the game.

## Answer-position fairness

- Classic runs now use a hidden 20-question answer-position plan.
- Each of the four positions is correct 4–6 times per run.
- The exact totals vary between 6/5/5/4 and 6/6/4/4 patterns, then are shuffled, so players cannot rely on a fixed five-per-position count.
- Replays still avoid repeating the same correct position for the same country whenever the balanced plan permits it.

## Interface and language

- Added the Minecraft Diamond image to the main-menu Achievements card, with an offline-safe local diamond fallback.
- Added complete Turkish and English text for the exit dialog and flag alternative text.
- The browser description and level abbreviation now update with the selected language.
- Added `aria-pressed` state to quiz, difficulty, and mode controls.

## Verification

- Tested all 197 countries for both quiz types and both difficulties.
- Ran 100 deterministic answer-plan tests to verify every position remains within the 4–6 range.
- Browser-tested timer pause/resume, confirmed exit, English text, Diamond fallback, all six themes, desktop layout, and mobile gameplay.
