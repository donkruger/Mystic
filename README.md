# Mystic

A fantasy strategy board game of conquest — summon creatures, claim land across nine biomes, and complete your chain of connected tiles to control the realm.

## Contents

- `site/` — the marketing website (vanilla HTML/CSS/JS, GSAP + Lenis), deployed to [mysticmaneuvers.com](https://mysticmaneuvers.com) via Netlify
- `MYSTIC_MECHANICS.md` — full game-mechanics knowledge base (rules, card anatomy, biome synergies, win condition)
- `netlify.toml` — Netlify configuration; publishes `site/`

## Develop

Serve the site locally:

```sh
cd site && python3 -m http.server 8000
```

## Deploy

Netlify reads `netlify.toml` and publishes the `site/` folder — no build step required.

Source design assets (artwork, playbook PDFs/SVGs) are intentionally not tracked in this repo; see `.gitignore`.
