# CLAUDE.md

Guidance for Claude Code when working in this repository.

This file has two kinds of content:

- **Product intent and architectural direction** (sections 1–17). This file is the source of truth for these.
- **Repository reality** (sections 18–26): commands, actual file layout, actual endpoints, conventions and known gotchas. **The repository is the source of truth here** — verify before relying on it.

When implementation and intent differ, identify the discrepancy, decide whether it is intentional evolution or technical debt, and **do not silently rewrite working behavior just to match this document**. Features that are intentionally planned-but-unbuilt, along with known gotchas, are listed in §26.

---

# PART I — PRODUCT INTENT

## 1. Project Identity

Project: `guerreiros-do-segundo-lugar` (the git directory is named `who-is-the-threat`).

A mobile-first web application for tracking Magic: The Gathering Commander (EDH) games played by a recurring group of friends.

It is not a generic match logger. Its purpose is to build a persistent history of the group's Commander games:

- Who played
- Which decks were used
- Who won
- How each player performed
- How each deck performed
- Which commanders and decks are played most often
- How the group's metagame develops over time

Recording a game must be quick enough to realistically do **while people are playing Commander**. Historical data then turns individual games into statistics, comparisons, rankings, and memories.

## 2. Core Product Model

Four primary concepts: **Players**, **Decks**, **Games**, and **Statistics derived from games**.

```text
Player
  └── owns Decks

Game
  ├── Participant { Player, Deck, Placement }
  ├── Participant
  ├── Participant
  └── Participant

Game History → Statistics → Players / Decks / Commanders / Group
```

Games are the central historical record. Most statistics should be **derived from games**, not maintained as independent stored values.

## 3. Product Principles

### 3.1 Mobile first

The app is used from phones, including during real Commander sessions. Important actions must work comfortably on small screens. Do not design desktop-first and compress afterward. Touch targets, forms, cards, navigation, dialogs, and selection flows must all be usable on mobile.

### 3.2 Recording a game must be fast

Minimize typing and repeated selections. Where information already exists — players, decks, commanders — prefer **selecting** existing data over re-entering it.

### 3.3 Historical data matters

A game is not disposable. Changes to game-related models or APIs must consider historical games, statistics, deleted/changed decks, deleted/changed users, incomplete legacy data, and backward compatibility.

Do not assume every historical record contains perfect current data. Frontend code displaying history must fail gracefully when associated data is missing — a historical participant may have a null deck, so never write `participant.deck.name` unguarded.

### 3.4 Statistics should be understandable

This is for a group of friends, not tournament analytics. Statistics should answer recognizable questions: Who wins the most? Which deck wins the most? What deck does this player use most? How many games has this deck played? What is this player's win rate? Which commanders appear most often? What have our recent games looked like?

Avoid complexity that produces numbers without helping users understand their games.

## 4. Authentication and Roles

Email/password auth, bcrypt password hashing, JWT sessions.

**Regular users** can: view players, decks, game history and statistics; manage their own profile; create/edit/delete their own decks; create games; edit games they created (subject to business rules). They must not silently gain permission to edit another player's personal data.

**Administrators** can manage players, decks, games, and other administrative data. Admin capabilities must stay explicit rather than leaking into normal user behavior.

## 5. Player Profiles

A player represents a member of the Commander group: name, nickname/display name, email, password hash, profile image, admin status, owned decks.

Nickname and profile image matter — the app should feel like a representation of the actual playgroup, not an anonymous database.

A player page should function as a personal Commander profile: games played, wins, win rate, favorite/most-played decks, recent games, deck collection, and other player-specific statistics.

## 6. Guest Players (planned)

The product should support guest players: recording games involving occasional participants without forcing them to register.

Guests should be usable in game creation, game history, match results, and player statistics, without forcing authentication/account concepts onto someone who is only being represented as a participant.

When modifying Player/User models, keep the distinction between **a person represented in game history** and **an authenticated account able to log in**.

> **Status: intended feature, planned for a later date.** Its absence from the current code is deliberate, not an oversight — do not treat it as a bug or implement it as a side effect of unrelated work. See §26 for what implementing it will touch.

## 7. Deck Management

Decks belong to players. A deck represents a real Commander deck used by someone in the group: owner, deck name, commander, decklist URL (e.g. Moxfield), deck image/artwork, color identity, tags/archetypes, creation metadata.

Archetype tags (Combo, Control, Aggro, Group Hug, …) are descriptive metadata and should not constrain future categorization.

## 8. Deck Creation

Creating a deck should feel like adding to a Commander collection, not filling a database form. Minimum: the deck, its commander, optional decklist link, optional artwork, optional colors/tags.

The new deck must immediately become available for game tracking:

```text
Create Deck → Deck belongs to Player → Deck selectable when that Player joins a Game
   → Games using Deck → Deck Statistics
```

Deck CRUD is not an isolated administrative feature.

## 9. Deck Pages and Deck Statistics

A deck becomes more valuable as it accumulates games: games played, wins, win rate, owner, commander, recent games, performance history.

Deck pages should answer "How has this deck actually performed?", not merely display metadata.

## 10. Commander Information

The commander is one of a deck's primary identities and is meaningful product data, not decorative text. It supports deck browsing, filtering, statistics, commander popularity, game history, and visual deck identification.

Distinguish **deck statistics** from **commander statistics** — the same commander can appear in multiple decks or versions.

## 11. Game Tracking

A game records a Commander session with multiple participants, normally 2–6 players, typically multiplayer Commander. Each participant associates `Player + Deck + Result`.

```ts
Game {
  createdBy
  date
  players: [{ player, deck, placement }]
  durationMinutes?
  notes?
}
```

## 12. Creating a Game

Follow how people actually prepare a Commander game:

1. **Choose players** — select participants.
2. **Assign decks** — for each player, pick their deck; constrain to decks that make sense for that player wherever possible.
3. **Record the result** — finishing placements (1st, 2nd, 3rd, 4th…).
4. **Optional info** — date, duration, notes, highlights.
5. **Save** — the game joins game history, player statistics, deck statistics, and group statistics.

## 13. Game Data Validation

A game should not normally be created with invalid participant information:

- A participant must reference a player.
- A participant should normally reference a valid deck.
- The deck should belong to the appropriate player unless a feature explicitly allows otherwise (see borrowed decks, §21).
- Placements must represent a valid outcome.
- Duplicate participants must be prevented.

**Creation is strict; rendering historical data is defensive.** Do not solve historical-data problems by allowing new invalid data.

## 14. Game Results

After recording, the result should be visually easy to understand. Primary: winner, placements, players, decks/commanders, date. Secondary: duration, notes/highlights. Prioritize the story of the game over raw database fields.

## 15. Game History

Users should browse previous games and understand them without opening every record. History cards should surface date, winner, participants, decks/commanders, placements.

History should support filtering/sorting by date, player, winner, deck, and commander.

## 16. Statistics

Derived primarily from game history.

- **Player**: games played, wins, win rate, most-used/favorite deck, deck usage, recent performance.
- **Deck**: games played, wins, win rate, recent games, owner.
- **Group/global**: most successful players, most successful decks, most played decks, most played commanders, total games, recent activity. Leaderboards are a natural extension.

Avoid storing values that can be reliably calculated from canonical game data unless performance requirements justify aggregation/caching.

## 17. Other Product Areas

### Dashboard

Answers "What has been happening in our Commander group?" — recent games, quick player statistics, deck performance, win rates, most-used decks, group activity. It should not merely duplicate navigation links; favor useful snapshots and routes into deeper information.

### Randomness / "Chaos Deck" tools (planned)

Secondary social/tabletop tools for random events, challenges, and decisions. Treat them as complementary rather than part of the canonical game-statistics model. **Core game tracking must never depend on Chaos Deck functionality.**

> **Status: intended feature, planned for a later date.** Deliberately absent from the current code — do not scaffold it as part of unrelated work.

### Visual direction

The interface should feel related to tabletop gaming, friendly competition, Commander, and statistics/history — bold and recognizable, without becoming an elaborate fantasy UI that sacrifices usability. This is a tool used repeatedly: readability and interaction clarity beat decoration.

The established palette is a **dark, modern gaming theme** — deep navy foundations with a blue primary and a violet secondary accent. Dark mode is the shipped theme (`layout.tsx` hardcodes `className="dark"`); the light block exists but is not reachable through the UI.

| Token | Dark (shipped) | Light | Role |
| --- | --- | --- | --- |
| `--background` | `222 47% 11%` | `220 17% 97%` | page foundation (deep navy) |
| `--card` / `--popover` | `222 47% 14%` | `0 0% 100%` | raised surfaces |
| `--primary` | `217 91% 60%` | `221 83% 53%` | blue — primary actions, links, `chart-1` |
| `--accent` | `262 83% 58%` | `262 83% 58%` | violet — secondary accent, `chart-2` |
| `--secondary` / `--muted` | `222 47% 18%` / `20%` | `220 14% 96%` | subdued surfaces |
| `--success` | `142 71% 45%` | `142 76% 36%` | wins, positive deltas |
| `--warning` | `38 92% 50%` | `38 92% 50%` | amber — highlights, podium/ranking emphasis |
| `--destructive` | `0 63% 31%` | `0 84% 60%` | eliminations, destructive actions |
| `--border` / `--input` | `222 47% 20%` | `220 13% 91%` | hairlines and fields |
| `--radius` | `0.75rem` | `0.75rem` | corner rounding |

Supporting details: MTG mana colors (`mana.white/blue/black/red/green/colorless`) are exposed as Tailwind colors for color identity; `shadow-glow-*` utilities and the `glow` / `shimmer` / `gradient-shift` animations provide the "gaming" feel. Amber/`warning` is the accent to reach for on trophies, placements, and leaderboard emphasis.

Always use the semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`) rather than raw hex or ad-hoc Tailwind palette colors, so the theme stays consistent.

### PWA / app identity

Should work well as an installable mobile/PWA experience. Icon direction: a recognizable tabletop/competition/statistics symbol such as a crowned D20 combined with statistical bars. Icons must stay recognizable at 192×192 and 512×512, work with Android maskable/rounded treatment, use simple silhouettes, keep ~15% safe padding, and avoid details that vanish at app-icon scale.

### Mobile information density

Do not assume a card should fill the mobile viewport just because the screen is narrow. Browsing 20–30 decks should not mean scrolling 20–30 full-screen cards. Prioritize scannability, touch-friendly controls, compact but readable cards, clear hierarchy, fast selection, and minimal vertical scrolling. Desktop may expose more; mobile must stay fully functional.

### Future features (do not introduce into unrelated work)

Global leaderboards, commander statistics, CSV export, game highlights/gallery, Moxfield integration/import, expanded Chaos Deck tools, additional historical filters, deeper deck/player comparisons.

---

# PART II — REPOSITORY REALITY

## 18. Commands

No workspace tooling at the root — install and run each package separately.

Backend (from `backend/`):

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` and `npm start` both run `node server.js` (nodemon is a devDependency but is not wired up). `npm test` runs Jest, but **there are no test files in the repo**.

Frontend (from `frontend/`):

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

The frontend dev server runs on **port 3001** (`next dev -p 3001`).

### Environment

Backend `.env` (see `backend/.env.example`): `PORT` (example uses `5001`; `server.js` defaults to `5000` when unset — set it explicitly), `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `FRONTEND_URL`, plus optional `ENABLE_EMAIL_SENDING` and `EMAIL_*` for password-reset email. With email sending disabled, the reset link is printed to the server console (see `backend/EMAIL_SETUP.md`).

Frontend `.env.local` (see `frontend/.env.example`): `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5001`), `NEXT_PUBLIC_APP_NAME`.

## 19. Layout

```text
/
├── backend/
│   ├── server.js                  # express app, helmet/CORS/rate-limit, mongoose connect, route mounting
│   └── src/
│       ├── models/                # Player.js, Deck.js, Game.js
│       ├── routes/                # auth.js, players.js, decks.js, games.js, stats.js
│       ├── middleware/            # auth.js (protect/adminOnly/ownerOrAdmin), errorHandler.js
│       └── utils/                 # auth.js (JWT helpers), sendEmail.js
└── frontend/
    └── src/
        ├── app/                   # Next.js App Router pages
        ├── components/            # Navigation, MetricInfo, PWA bits, ui/ (shadcn-style)
        ├── context/               # AuthContext.tsx, LanguageContext.tsx
        ├── hooks/                 # usePWAInstall.ts
        ├── lib/                   # api.ts (axios + endpoint map), translations.ts, utils.ts
        └── middleware.ts          # HTTPS redirect + security headers
```

There is **no `backend/src/controllers/`** — all handler logic lives inline in the route files (the README claims otherwise).

Frontend routes: `(auth)/login`, `register`, `forgot-password`, `reset-password/[token]`, `dashboard`, `players` (+ `new`, `[id]`, `[id]/edit`), `decks` (+ `new`, `[id]`, `[id]/edit`), `games` (+ `new`, `[id]`, `[id]/edit`), `current-game`, `eliminations`, `stats`, `profile`, `contact`, `privacy`.

## 20. Data models (`backend/src/models/`)

**Player** — `name` (≤50, required), `nickname` (≤30), `email` (required, unique, lowercased), `password` (required, min 6, bcrypt-hashed in a `pre('save')` hook with salt rounds 12), `profileImage` (URL ending in an image extension), `isAdmin`, `decks: [ObjectId→Deck]`, `resetPasswordToken`/`resetPasswordExpire` (both `select: false`, 10-minute expiry). `toJSON()` strips `password`. Methods: `comparePassword`, `getResetPasswordToken`.

**Deck** — `owner` (required, →Player), `name` (≤100, required), `commander` (≤100, required), `decklistLink` (URL), `deckImage`, `colorIdentity: ['W','U','B','R','G','C']`, `tags` (each ≤30), `archived` (default `false`), `archivedAt`. Indexed on owner, owner+archived, archived, name+owner, commander, colorIdentity, tags. Virtual `gamesCount` counts games via `players.deck`.

> **Archiving replaces deletion.** A deck that was taken apart is archived, never deleted, so every game it appears in keeps a valid deck reference. Archived decks stay in game history and all statistics but are hidden from deck browsing and cannot be chosen for a new game. Legacy decks have no `archived` field at all, which is why the "active" filter is `{ archived: { $ne: true } }` rather than `{ archived: false }`.

**Game** — `createdBy` (required, →Player), `date` (defaults to now), `players[]`, `durationMinutes` (1–600), `notes` (≤500). Each participant: `player` (required), `deck` (required), `placement` (1–6, required), `eliminatedBy` (optional →Player), `borrowedFrom` (optional →Player). Indexed on date, createdBy, players.player, players.deck.

`pre('save')` hooks enforce: unique placements, placements consecutive from 1, the 1st-place player has no `eliminatedBy`, and 2–6 players.

> `eliminatedBy` and `borrowedFrom` are real shipped features (the eliminations page and the borrowed-decks ranking depend on them) and are not described in Part I. Preserve them.

## 21. API

All routes are mounted under `/api` in `server.js`, so the real paths are `/api/auth/...`, `/api/players/...`, etc. Every route except register/login/logout/password-reset requires `protect` (Bearer JWT).

```text
POST   /api/auth/register                    public — also the only way to create a Player
POST   /api/auth/login                       public
POST   /api/auth/logout                      public
GET    /api/auth/me
PUT    /api/auth/updatedetails
PUT    /api/auth/updatepassword
POST   /api/auth/forgotpassword              public
PUT    /api/auth/resetpassword/:resettoken   public

GET    /api/players
GET    /api/players/:id
PUT    /api/players/:id                      self or admin; only admins may set isAdmin
DELETE /api/players/:id                      admin only

GET    /api/decks                            supports query filters; hides archived unless
                                             `archived=true` (only archived) or
                                             `includeArchived=true` (both)
POST   /api/decks                            owner = current user (admins may pass `owner`)
GET    /api/decks/:id
PUT    /api/decks/:id                        owner or admin; ignores archived/archivedAt
PUT    /api/decks/:id/archive                owner or admin
PUT    /api/decks/:id/unarchive              owner or admin
DELETE /api/decks/:id                        owner or admin; 409 if the deck has any games

GET    /api/games                            page, limit (default 25), startDate, endDate, player, deck
POST   /api/games
GET    /api/games/:id
PUT    /api/games/:id                        creator or admin
DELETE /api/games/:id                        creator or admin

GET    /api/stats/player/:id
GET    /api/stats/deck/:id
GET    /api/stats/dashboard
GET    /api/stats/eliminations
GET    /api/stats/global
GET    /api/stats/borrowed-decks
GET    /api/stats/advanced-metrics

GET    /api/health
```

Responses follow `{ success, data, ... }`; list endpoints add `count`, `total`, `pagination`. Errors are `{ success: false, message, errors? }` via `src/middleware/errorHandler.js`.

**There is no `POST /api/players`.** The "create player" screen posts to `/api/auth/register`, so every player is a full account — this is the mechanical reason guest players (§6) do not exist yet.

Game write validation (`routes/games.js`) uses express-validator plus manual checks for unique placements, consecutive placements from 1, and no duplicate players. `PUT` additionally validates that `eliminatedBy` references a participant in the same game and that the winner has none; **`POST` does not run those `eliminatedBy` checks**, and neither verb verifies that the chosen deck belongs to the chosen player. Keep that in mind before assuming stored data is fully constrained.

`POST /api/games` also rejects archived decks. `PUT` deliberately does not: a historical game may legitimately reference a deck archived since it was played, and the edit form loads decks with `includeArchived=true` so that selection still renders.

`Guerreiros-API.postman_collection.json` and `API.md` at the root document the API; both can lag behind the code.

## 22. Statistics

All stats are computed on the fly from `Game` documents via Mongoose aggregation in `backend/src/routes/stats.js` (~1100 lines). There are no cached or denormalized aggregate fields — consistent with §16. If you add a metric, add it here rather than storing counters on Player/Deck.

Advanced deck metrics (documented in `ADVANCED_METRICS_IMPLEMENTATION.md`, surfaced on the dashboard and deck pages, explained in the UI by `components/MetricInfo.tsx`):

- **Weighted Win Score (WWS)** = `wins × ln(gamesPlayed + 1)`
- **Bayesian True Win Rate (BTWR)** = `(wins + 1) / (games + 4) × 100`
- **Dominance Index (DI)** = `(firstPlaces + secondPlaces × 0.5) / games`

> These are the formulas the code actually computes. `ADVANCED_METRICS_IMPLEMENTATION.md` and the `MetricInfo` tooltips on the dashboard still describe an earlier set (`winRate × games × 1.5`, a `+5/+10` prior, a std-dev term) that the implementation no longer uses — trust the route, not those.

`/stats/advanced-metrics` computes all three for every deck in a single `Game.aggregate` with a `$facet` that ranks each metric in the database and returns only the top 6 per list. It previously looped over every deck issuing one `Game.find` each; do not reintroduce a per-deck query here.

## 23. Frontend conventions

- **Next.js 14 App Router**, TypeScript, Tailwind, `@/*` path alias to `src/*`. Pages are client components (`'use client'`) that fetch on mount.
- **API access goes through `src/lib/api.ts`** — an axios instance plus the `authAPI` / `playersAPI` / `decksAPI` / `gamesAPI` / `statsAPI` maps. Add new endpoints there rather than calling `fetch` from components. (`AuthContext` currently uses raw `fetch` for login/register; that is a deviation, not the pattern to copy.)
- **Auth** — JWT and the serialized user live in `localStorage`. A request interceptor attaches `Authorization: Bearer <token>`; a response interceptor clears storage and redirects to `/login` on 401. `useAuth()` exposes `user`, `loading`, `login`, `register`, `logout`, `updateUser`, `setUserData`; gate admin UI on `user.isAdmin`.
- **i18n is mandatory for user-facing strings.** `useLanguage()` gives `t('some.nested.key')` with `en` and `pt-BR` dictionaries in `src/lib/translations.ts`. Adding UI text means adding keys to **both** languages; a missing key logs a warning and renders the raw key.
- **UI components** — `src/components/ui/` holds shadcn-style wrappers, but only `avatar`, `badge`, `button`, `card`, `input`, and `tooltip` exist. Several Radix packages are installed without wrappers; if you need dialog/select/tabs/toast, add the wrapper in `ui/` in the same style rather than using Radix ad hoc.
- **Theme** — HSL CSS variables in `src/app/globals.css` with light and `.dark` blocks; `layout.tsx` hardcodes `<html lang="pt-BR" className="dark">`, so dark is effectively the only theme. The full token palette is in §17 (Visual direction) — that table is canonical, and `globals.css` plus `tailwind.config.js` are its implementation. Use the semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`) rather than raw hex.
- **Icons** — `lucide-react`. **Drag & drop** — `@dnd-kit` (used in `games/new` for placement ordering). **Dates** — `date-fns`.
- **PWA** — `public/site.webmanifest`, `public/sw.js`, `ServiceWorkerRegistration`, `PWAInstallBanner`, `usePWAInstall`. Icons are generated by `frontend/scripts/generate-icons.js` from `public/icon.svg` (see `FAVICON_SETUP.md`).

## 24. Security posture

The backend applies helmet (with CSP and HSTS), manual security headers, rate limiting (production only, or `ENABLE_RATE_LIMITING=true`), and a CORS allowlist that also permits any `vercel.app`/localhost origin. `frontend/src/middleware.ts` forces HTTPS in production and sets its own headers. Several root-level docs (`SECURITY.md`, `README_SECURITY.md`, `SECURITY_IMPROVEMENTS.md`, `SECURITY_DEPLOYMENT_CHECKLIST.md`) describe the intended posture — read them before touching auth, CORS, headers, or rate limiting.

## 25. Deployment

Frontend → Vercel (`frontend/vercel.json`). Backend → Render (`backend/render.yaml`). Database → MongoDB Atlas. Deployment details are in `DEPLOYMENT.md`.

## 26. Planned features and known gotchas

### Planned, deliberately not yet built

These are **intended features scheduled for a later date**, not gaps to fill opportunistically. Build them only when explicitly asked.

- **Guest players (§6).** There is no guest concept in the models or API; every participant must be a registered `Player`, since player creation goes through `/api/auth/register`. Implementing this will touch the Player model (or a new model), the auth/players routes, game creation and validation, game history rendering, and every stats aggregation that assumes a full `Player` document.
- **Chaos Deck / randomness tools (§17).** Currently proposed only in `IMPROVEMENTS.md`. When built, keep them isolated from the canonical game/statistics model.

### Gotchas

Do not "fix" these as drive-by changes; they are recorded so you can reason accurately.

- **`frontend/src/app/games/new2/` and `new3/`** are unreferenced alternate game-creation prototypes — nothing links to them. `games/new` (with @dnd-kit ordering) is the live flow. **Leave them in place**; they are kept intentionally for now.
- **`frontend/next.config.updated.js`** sits unused next to the real `next.config.js`.
- **The root `package.json`** contains a stray `next` + `@radix-ui/react-tooltip` + `sharp` dependency set with no scripts; the real packages are `frontend/` and `backend/`.
- **The `players/new` page** creates accounts through `authAPI.register` and is admin-gated in the UI only.
- **Model max placement is hardcoded to 6**, matching the 2–6 player rule in both the schema and the route validators. Changing table size means changing all of them.
- **`.github/instructions/intructions.instructions.md`** is the original project brief. It is historical context, superseded by this file.

## 27. How to approach changes

Before implementing:

1. Understand which product feature is being changed.
2. Inspect the existing implementation.
3. Identify affected frontend **and** backend areas.
4. Identify whether game history or statistics are affected.
5. Preserve permissions (owner vs. participant vs. admin — participating in a game is not owning the game record).
6. Consider mobile behavior.
7. Consider historical and nullable data.
8. Reuse existing patterns and components before introducing new abstractions.
9. Add translation keys for both `en` and `pt-BR`.

**Reason about features, not pages.** "Change deck creation" means:

```text
Deck creation UI → decks API → Deck model → player ownership
   → game deck selection → game history → deck statistics
```

"Change game results" means:

```text
Game creation → Game model → result calculation → game history
   → player stats → deck stats → dashboard
```

Because statistics depend on game history, a small model change can ripple through game history, player profiles, deck profiles, statistics, the dashboard, and filters. Always inspect downstream consumers before changing canonical game data.

## 28. Primary Goal

The application succeeds when the group can **quickly record what happened at the Commander table** and **later explore the history those games created**.

```text
PLAY & RECORD  +  EXPLORE & COMPARE
```

Every major feature should reinforce one of those two activities. When choosing between implementations, prefer the one that makes the core loop simpler and more reliable:

```text
Create Player → Create Decks → Start Game → Select Players → Assign Decks
   → Record Result → Save → Historical Record → Statistics
   → Dashboard + History + Profiles → Play Again
```
