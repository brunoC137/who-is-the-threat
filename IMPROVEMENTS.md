# Guerreiros do Segundo Lugar — Improvement Suggestions

A curated list of feature ideas and technical improvements for the app. Items are grouped by category and ordered roughly by impact.

---

## 🃏 MTG / Commander Game Features

### High Impact

- **Energy Counter tracking** — Add a per-player energy counter (⚡) alongside life and poison. Energy has become a staple mechanic in modern Commander sets.
- **Experience Counter tracking** — Similar to energy; certain commanders (e.g., Mizzix, Meren) accumulate experience counters that should be tracked separately from life.
- **Monarch & Dungeon tokens** — One-tap toggle to mark which player currently holds The Monarch or has entered The Dungeon, with visual flair on their panel.
- **Storm Count / Spellcast Counter** — A shared counter in the center of the table that any player can increment during their turn.
- **Infect / Proliferate shortcut** — A dedicated "Proliferate" button that increments all active counters (poison, energy, etc.) of all players by 1 simultaneously.
- **Commander Tax tracker** — Track how many times each commander has been cast (+2 mana each time). Toggle per-panel with a `Cmd Tax: +N` badge.
- **Treasure / Clue / Food token counters** — Quick-tap buttons to add temporary token counts visible on the panel for the turn.
- **Partner / Background commander support** — Allow a deck to have two commanders and track commander damage from each independently.

### Medium Impact

- **Game log / Timeline** — A scrollable chronological log of all life changes, poison additions, and eliminations (already partially tracked in `history`; expose it as a slide-in panel).
- **Mana rocks / Ramp indicator** — Informal tracker letting players note how many mana sources they have in play (3-drop, Sol Ring, etc.) to help the table gauge threat level.
- **Who's the Threat indicator** — A single tap lets any player nominate another as "The Threat" — their panel gets a ⚠️ highlight visible to all (fun and thematic for the app name).
- **Concede vs. Eliminate distinction** — When recording an elimination, offer "Eliminated" vs. "Conceded" so the post-game breakdown is more accurate.
- **Draw / Two-Headed Giant mode** — Support for 2v2 team games where life totals are shared between teammates.
- **Archenemy mode** — One player has 40 life and an Archenemy indicator; others have 20 life each.
- **Planechase die roller** — A Chaos Orb / Planar die result picker (Planeswalk, Chaos, or blank faces) accessible from the dice menu.

### Quality of Life

- **Starting life selector** — Let players choose between 20, 30, 40 (default EDH), or custom starting life during setup.
- **Random seating** — A "Shuffle Seats" button in the setup phase that randomly assigns the four player slots.
- **Card search modal** — Type a commander name to fetch the card image from Scryfall API for use as deck art (instead of entering a URL).
- **Auto-fill commander name from deck** — When editing a deck, query Scryfall/Moxfield to validate the commander name and autocomplete.
- **Favorite commanders** — Star a commander on a deck card; starred commanders sort to the top of the deck selector in Battle Mode setup.
- **Color identity auto-detect** — When the user types a commander name, query Scryfall to auto-populate `colorIdentity`.

---

## 📊 Stats & History

- **Deck win-rate chart** — Per-deck bar/pie chart showing win % across all recorded games, accessible from the deck detail page.
- **Head-to-head stats** — "You vs. Player X" breakdown: total games, wins, who eliminated whom most.
- **Commander archetype heatmap** — A grid showing which archetypes (Combo, Control, Aggro) win most often across all games.
- **Average game duration** — Display mean and median game length on the stats page and per-player profile.
- **Longest winning streak** — A leaderboard of the longest consecutive win streaks per player.
- **Elimination matrix** — A NxN table showing how many times Player A eliminated Player B across all games.
- **"Nemesis" badge** — Automatically highlight the player who eliminated a given user most often on their profile.
- **First-player win rate** — Track whether going first (as set by the dice roll) correlates with winning.
- **CSV export** — Export all game history as a `.csv` file for offline analysis or sharing.

---

## 🎨 UI / UX Improvements

### Battle Mode (Current Game)

- **Haptic feedback on life change** — Use `navigator.vibrate()` for short pulses on `+1` / `-1` taps on mobile.
- **Long-press for bulk life change** — Hold `+5` / `-5` to continuously increment every 150 ms.
- **Swipe gesture on life total** — Swipe up/down on the life number area to increment/decrement (in addition to buttons).
- **Damage split quick-action** — A tap-and-drag from one panel to another to record commander damage between them without opening the modal.
- **Sound effects toggle** — Optional low-volume sound effects: coin flip for dice roll, bell for game start, horn for elimination.
- **Panel color themes** — Let players pick a custom color accent for their panel (overrides the deck color identity theme).
- **Animated life change flash** — Brief green/red flash on the life number when it changes, for quick visual feedback at a glance.
- **Spectator mode** — A read-only view (shareable URL) that shows the current game state without allowing edits; useful for streaming or observers.
- **"Pass turn" button** — A simple indicator of whose turn it currently is, cycling through players in order.

### General

- **Dark / Light theme toggle** — A proper light theme for bright environments.
- **PWA install prompt** — Prompt the user to install the app to their home screen with a native install banner.
- **Offline support** — Cache the current game state and basic UI so Battle Mode works without internet (service worker).
- **Drag-and-drop deck ordering** — Let users reorder their decks by dragging on the deck list page.
- **Keyboard shortcuts** — When used on desktop/tablet, support shortcuts like `Space` to pause, `Z` to undo, number keys to select a panel.
- **Avatar upload** — Let users upload a profile picture directly instead of entering a URL, using a file picker → base64 or cloud upload.
- **Deck image gallery view** — A mosaic grid of deck art images on the Decks page, vs. the current list view; toggle between the two.

---

## ⚙️ Technical Improvements

### Performance

- **React Query / SWR for data fetching** — Replace manual `fetch` + `useState` loading patterns with a caching client (React Query) to reduce redundant API calls and simplify loading/error states.
- **Optimistic UI updates** — Update life totals in the UI instantly on tap; reconcile with server-state in the background.
- **Memoize `PlayerPanelView`** — Wrap the component in `React.memo` to prevent re-renders of unchanged panels when only one player's life changes.
- **Debounce localStorage writes** — Instead of writing to `localStorage` on every state change, debounce the write to every 500 ms to reduce main-thread pressure.
- **Image lazy-loading** — Use `loading="lazy"` and/or Next.js `<Image>` for deck and profile images to reduce initial payload.

### Architecture

- **Zustand or Jotai for game state** — Migrate the `useReducer` + prop-drilling pattern to a lightweight global store, making it easier to access game state from nested components without prop chains.
- **Websocket multiplayer** — Allow multiple phones to connect to the same game session; each player controls their own panel from their device. Use Socket.IO or Partykit.
- **Game state snapshots / replay** — Store the full `history` array with the saved game so the user can step through the game move-by-move after it ends.
- **Zod schema validation** — Add Zod to both frontend form inputs and backend request bodies for consistent, type-safe validation.
- **API rate limiting** — Add express-rate-limit on the backend to prevent abuse of the public endpoints.
- **Unit tests for the game reducer** — The `gameReducer` function is pure and easy to test. Add Jest unit tests for elimination, life change, undo, and end-game actions.
- **E2E tests with Playwright** — Smoke-test the Battle Mode setup → play → save flow to catch regressions.
- **Docker Compose dev environment** — A `docker-compose.yml` with MongoDB, the Express API, and the Next.js frontend so new contributors can run the full stack with a single command.
- **Environment-specific configs** — Separate `.env.development`, `.env.staging`, `.env.production` files with clear documentation on required variables.
- **API versioning** — Prefix routes with `/api/v1/` to allow future breaking changes without disrupting existing clients.

### Security & Auth

- **Refresh token rotation** — Implement refresh tokens alongside JWTs so sessions don't expire abruptly mid-game.
- **OAuth / "Sign in with Google"** — Let users authenticate via Google OAuth in addition to email/password.
- **Password strength meter** — Show a visual strength indicator on the register/change-password form.
- **CSRF protection** — Add CSRF tokens to mutating API requests (especially relevant if cookies are ever used).
- **Input sanitization** — Ensure all user-supplied strings (deck names, notes, commander names) are sanitized before rendering to prevent XSS.

---

## 🚀 Future / Bigger Features

- **Moxfield / Archidekt import** — Fetch deck data (commander, colors, deck image) directly from a Moxfield URL using their public API.
- **Tournament bracket mode** — Organize multiple games into a bracket or Swiss-style tournament with automatic standings.
- **Discord integration** — Post a summary of finished games to a Discord channel via webhook (player standings, winner, duration).
- **AI "threat assessment"** — A fun feature that analyzes current board state (life totals, commander damage, poison) and suggests which player is the biggest threat.
- **Highlight clips / Notes timeline** — Let players attach timestamped notes to specific game moments (e.g., "Combo assembled at 45:00"), visible in the post-game summary.
- **Public player profiles** — Optional public profile pages (shareable link) showing overall stats, favorite decks, and recent games.
- **Friends / Groups** — Let users create a play group, so the players list is pre-filtered to group members during game setup.
- **Mobile notifications** — Push notification when a friend records a game result or when you're tagged as "The Threat."
