# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # start dev server at localhost:5173
yarn build        # production build
yarn preview      # preview production build
yarn lint         # ESLint on src/

# Integration tests (require a running dev server on :5173)
yarn test:randomiser   # hit /api/route/generate/<game>.json for every game
yarn test:pokemon      # hit /api/pokemon/<game>.json for every game
yarn test:league       # validate league data with Deno
```

## Code style

Prettier config (enforced via `prettier-plugin-svelte`): single quotes, no semicolons, no trailing commas, arrow parens always. Run `prettier --write` on `.svelte`/`.ts`/`.js` files before committing.

## Architecture

**SvelteKit** app deployed to Vercel via `@sveltejs/adapter-vercel`. Routing uses two layout groups:
- `src/routes/(app)/` — the main tracker UI (home, game, box, graveyard, saves, new)
- `src/routes/(guides)/guides/` — static game guides

**State lives entirely in `localStorage`** — there is no user-facing backend database. `src/lib/store.js` exports writable Svelte stores that sync to `localStorage` under keys like `nuzlocke`, `nuzlocke.<id>`, `nuzlocke.saves`. The `IDS` object is the canonical key registry.

**Data layer** (`src/lib/data/`):
- `games.json` — master list of supported games. `games.js` re-exports it with an `Expanded` map that flattens difficulty variants (e.g. `radred` → `radredN`, `radredH`) and a `RegionMap` helper.
- `routes.json` — per-game arrays of `{type: "route"|"gym", name, encounters[]}` entries. Keys match game IDs from `games.json`.
- `league.json` — per-game boss/leader data with Pokémon, moves, abilities.
- `patches.json` — ROM hack overrides keyed by `patchId`. Contains `move`, `ability`, `item`, `pokemon` (stat changes), and `fakemon` (new Pokémon) sections. Applied on top of base data at API request time.
- `legacy.js` — type remappings for pre-Gen-6 games (`pregen6`, `pregen2`) and the physical/special split map used before Gen 4.

**API routes** (`src/routes/api/`):
- `/api/pokemon.json` — full base Pokémon list
- `/api/pokemon/[game].json` — game-specific list with patches applied (stat overrides, type patches, fakemon injected)
- `/api/route/[gen].json` — raw route list for a game
- `/api/route/generate/[gen].json` — randomised Nuzlocke run (one Pokémon per route, no duplicate evolution lines)
- `/api/battle/[gen]/[id].json` — boss battle data fetched from PokeAPI and merged with `league.json` + patch overrides
- `/api/[game]/trainers.json` — trainer list
- `/api/box/advice.json`, `/api/box/analysis.json` — team analysis using `@smogon/calc`
- `/api/store/[doc]` — POST-only BigQuery analytics sink (saves, teams, boss fights); not user-facing

**Path aliases** (defined in `vite.config.js`):
- `$lib` → `src/lib`
- `$utils` → `src/lib/utils`
- `$data` → `src/lib/data`
- `$store` → `src/lib/store.js`
- `$icons` → `src/lib/components/icons/IconSet.ts`
- `$c` → `src/lib/components`

**Pokémon capture states** are defined in `src/lib/data/states.js` as `NuzlockeStates` (1–7: Captured, Received, Shiny, Traded, Missed, Dead, Trash) and `NuzlockeGroups` which bundles states into logical sets (e.g. `Available`, `Dead`, `Dupes`).

## Save export & sharing

All game state lives in `localStorage`. Two URL-based export mechanisms exist, both using browser-native `CompressionStream('deflate-raw')` + base64url encoding in the URL `#fragment` (never sent to the server). Implementation in `src/lib/utils/codec.js` (`compress` / `decompress`).

**Backup link** (`/drop#<encoded>`) — encodes the full save (`{ save: metadata, data: gameJSON }`). Visiting the URL imports the save into localStorage and redirects to `/saves`. The index route `src/routes/drop/+page.svelte` handles decoding; the existing `src/routes/drop/[id]/+page.svelte` handles the legacy QR code flow and is untouched.

**Share card** (`/share#<encoded>`) — encodes a minimal read-only subset (`{ meta, team, dead, beaten }`). Rendered at `src/routes/share/+page.svelte` as a standalone dark-mode card with Pokémon sprites from `img.nuzlocke.app`. No auth or server required.

Both buttons live in `src/lib/components/save.svelte` (saves page). The backup link button also appears on the game page (`src/routes/(app)/game/+page.svelte`) alongside a share card button.

## Local development note

`pokemon-assets@0.6.0` was removed from the npm registry. A stub is provided at `local_modules/pokemon-assets/` (empty CSS files) and `package.json` points to it via `file:` protocol. This only affects item sprite CSS in the guides section — all other functionality works normally.

## Adding a new game

A new game needs entries in at minimum three files:
1. `src/lib/data/games.json` — metadata (pid, lid, gen, region, logo, etc.)
2. `src/lib/data/routes.json` — route/encounter data keyed by game id
3. `src/lib/data/league.json` — boss/leader data keyed by game lid

ROM hacks additionally need a patch entry in `src/lib/data/patches.json` and `patched: true` plus a `patchId` in `games.json`. See README for the raw `.txt` format used as a source and the `nuzlocke.data` repo for extensive examples.
