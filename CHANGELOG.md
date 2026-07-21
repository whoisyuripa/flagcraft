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
