# FlagCraft

FlagCraft is a Turkish/English browser quiz for learning world flags and capitals. It is designed for static hosting and works without an installer.

## Included gameplay

- Flag quiz and capital quiz with separate leaderboards
- Easy and Hard difficulty
- Classic, Survival, and 60-second Time Attack modes
- 20-second timer for every question
- Smart visual or linguistic distractors
- Shuffled questions and balanced answer positions on every run (each slot is correct 4–6 times in Classic)
- XP: +20 per correct answer, +100 per completed game, +75 for a perfect Classic game, +100 for a newly unlocked achievement
- Levels, nine ranks, eight achievements, and six unlockable themes (all unlocked by Level 10)
- Subtle visual-only combo feedback at 5× and 10×
- Turkish and English interface, including dynamic game/result text
- Keyboard answers with 1–4
- Reliable in-game exit dialog that pauses and resumes active timers
- Local leaderboard by default; optional shared Supabase leaderboard
- Responsive desktop and mobile layouts
- Responsive local audio: UI click, correct-answer XP orb, and level-up

## Run locally

Because the modular version uses JavaScript modules, serve the folder:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

The optional `flagcraft-standalone.html` file can also be opened directly without a local server. Rebuild it with `npm run build:standalone`.

## Publish

Read `DEPLOY_GITHUB.md`. GitHub Pages can publish the root folder directly, with `index.html` as the entry file.

## Global leaderboard

1. Create a Supabase project.
2. Run the SQL in `SUPABASE_SETUP.md`.
3. Add the project URL and anon key to `config.js`.
4. Publish the folder.

## Security and reliability

- Usernames and remote/local score records are validated and rendered as text rather than HTML.
- Local storage is treated as untrusted input and normalized before use.
- The Content Security Policy limits scripts, images, media, and network connections.
- Local UI, correct-answer, and level-up audio are decoded into Web Audio buffers, with an immediate synthesized fallback.
- Flag images have a no-crash emoji fallback.
- Supabase Row Level Security and database constraints reject malformed records.
- A fully cheat-proof global ranking requires server-authoritative score verification; browser-only games cannot guarantee that.

See `THIRD_PARTY_NOTICES.md` for runtime assets and fan-project information.
