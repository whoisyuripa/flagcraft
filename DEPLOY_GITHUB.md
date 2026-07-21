# Publish FlagCraft with GitHub Pages

FlagCraft is a static site. It does not need an `.exe`, installer, server, or build command.

## Fastest method

1. Create a **public** GitHub repository named `flagcraft`.
2. Upload the contents of this folder so `index.html` is at the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main** and **/(root)**, then save.
6. After deployment finishes, the project URL will normally be:

   `https://YOUR-USERNAME.github.io/flagcraft/`

Opening that URL launches the game directly in the browser.

## Updating the game

Replace the changed files in the same repository and commit them to `main`. GitHub Pages republishes the selected source automatically.

## Global leaderboard

The game works immediately with a local leaderboard. To make scores shared by all players, follow `SUPABASE_SETUP.md` before publishing and place the public project URL and anon key in `config.js`.

Never place a Supabase service-role key, GitHub token, password, or other private secret in this repository.
