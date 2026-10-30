# DraftDex v2: Plan

Read this file before every task. The battle has its own plan in `BATTLE-PLAN.md`.
Work on ONE phase at a time. Do not start the next phase until the tests pass and the owner signs off.

---

## 1. What was found in the code (root causes)

| # | Problem you reported | Root cause found | Fixed in |
|---|---|---|---|
| 1 | Unticking Famous Mix ticks every gen, unticking a gen turns Famous Mix on | The setup treats "Famous Mix" and "Gens" as one either/or choice. A gen tap forces `famousMix = false`, and Famous Mix hides the gen ticks (`active = selected && !famousMix`). They are modelled as rivals instead of two independent filters | Phase 1 |
| 2 | Custom settings (5s timer, gens 1-2) don't reach the auction | The input boxes have no change listeners. Typing does nothing. The Create button then uses the auto-recommended values calculated before you typed | Phase 1 |
| 3 | Pokémon from other gens appear | Related to #1 and #2, plus the pool builder quietly falls back to ALL gens when it can't fill role coverage from the chosen gens | Phase 1 + 2 |
| 4 | Only about 24 Pokémon in an auction, a thin game | The dataset contains only **122 Pokémon** (about 13 per generation) and only 89 moves. "Gen 1-9" is mostly empty | Phase 2 |
| 5 | Images missing in places | Every image is hotlinked from GitHub with no fallback (no `onerror` anywhere). Some paths (trainer sprites in the lobby) may not exist | Phase 2 |
| 6 | Can't scroll, have to use arrows | **Not reproduced.** The app locks to a 390px column, hides every scrollbar, and disables overscroll. My test environment can't load Tailwind (internet), so I could not see the real layout. Phase 0 reproduces it first | Phase 0 + 3 |
| 7 | UI looks bad, phone-only layout | Screens were built by pasting Stitch's HTML into render functions, with a hard 390px/768px width cap | Phase 3 |
| 8 | No lobby with a code and player list, no clear vs-Bot / Host split | Setup has one "Create" button that always starts a bot match | Phase 4 |
| 9 | Battle is dull | The battle screen is a static form: pick a move, read a log. No scene, no animation events | BATTLE-PLAN.md |

Also confirmed earlier: errors only appear in the browser console, so the Create bug stayed invisible for hours.

---

## 2. Decisions

- Networking: P2P (PeerJS). Bot mode always works offline.
- **Devices: PC and phone are equal targets.** Phone is not the primary layout any more.
- New visual design replaces the old Stitch design (section 6).
- Settings are one object. What you set is what the match uses.
- No Nintendo audio or ripped game assets. Sprites come from the PokeAPI sprite set and are cached locally (fan project, non-commercial).

## 3. Architecture rules (apply to every phase)

1. **One settings object** (`matchSettings`) created at Setup, saved with the match, read by the engine, shown in the lobby and the auction. No screen reads "recommended" values after the user has edited.
2. Game rules stay in `engine/`, with no DOM or networking imports.
3. Screens only render state. Colours, fonts and spacing come from theme tokens (`ui/theme.css`), never hard-coded.
4. **Errors must be visible.** A global `window.onerror` / `unhandledrejection` handler shows a toast ("Something went wrong: Create failed"), and a "Copy error details" button. No more silent crashes.
5. Save after every action. Every screen has a URL.
6. Responsive by default: every screen is checked at **390px, 768px and 1280px**.
7. No runtime calls to PokeAPI. Data and images are cached into the project by a script.
8. Every phase ends with the automatic UI smoke test (Phase 0) passing, as well as its own tests.

---

## 4. Phases

### Phase 0: Safety net and reproduction

**Goal:** make bugs impossible to hide, and see the scroll bug for real.

Tasks:
- Add the global error toast (rule 4).
- Add `tests/ui-smoke.mjs` (Playwright): plays a whole bot match (setup > create > lobby > auction > breaks > scout > squad > countdown > battle > result) at 390px and 1280px, fails if any JS error happens. Add `npm run test:ui`.
- Add screenshot capture of every screen at 390 / 768 / 1280 into `tests/screens/`.
- Reproduce the scroll problem on a real browser with real Tailwind. Write down which screens can't scroll and why in PROGRESS.md. Do **not** fix it yet.
- Install Tailwind properly (build step, compiled CSS file) instead of the CDN script, so the app also works offline and the tests see real styling.

Tests:
1. `npm run test:ui` passes on the current build.
2. Break something on purpose (rename a function). The test fails and the toast appears.
3. Screenshots exist for every screen at three widths.

### Phase 1: Settings that actually work

**Goal:** fix problems 1, 2 and 3.

Tasks:
- **Famous Mix becomes a filter, not a mode.** Generation chips and "Famous only" combine: `famous only ∩ selected gens`. Tapping one never changes the other. Rules: at least one gen must stay selected; show the resulting pool size ("Gen 1-2, Famous only: 24 available").
- Bind every input (team size, budget, start bid, bid timer, **battle turn timer**) to `matchSettings` with change listeners. Editing a field locks it; unlocked fields keep following the recommender.
- Create/Host/Play read `matchSettings` only.
- The pool builder must **never** silently add Pokémon from outside the chosen gens. If the chosen gens can't make a valid pool, show a message ("Gen 3 only has 14 available, need 24: add a gen or lower team size") and stop.
- Show a compact settings summary in the lobby and in the auction header.
- Add new settings: battle turn timer (15 / 30 / 45 / 60 / 90 s, default 30), auction open timer, bid timer.

Tests (add to engine tests + UI smoke):
1. Gens [1,2], timer 5s: every Pokémon in the pool has gen 1 or 2, and the auction timer starts at 5s.
2. Famous only + gen 3: only famous gen 3 Pokémon appear.
3. Untick Famous: gen ticks stay as they were. Untick a gen: Famous stays as it was.
4. Last gen can't be unticked.
5. Impossible pool shows the message and doesn't create a match.
6. Saved match restores the same settings after refresh.

### Phase 2: Real data and images

**Goal:** fix problems 4 and 5. This is the foundation for both the auction and the battle.

Tasks:
- `scripts/build-data.mjs`: run once on your PC (needs internet). Fetches from PokeAPI and writes static files: `data/pokemon.json` (about 1,000+ species with stats, types, gen, evolution info, legendary/mythical flags), `data/moves.json`, `data/learnsets.json`, `data/abilities.json`. Be gentle with the API (rate limit, cache responses on disk, resume if interrupted). Commit the output.
- `data/famous.json`: a hand-curated list (starters and finals, mascots, legendaries, pseudo-legendaries, fan favourites). **You review this list.**
- Recompute roles, tiers and base prices over the full data. Keep the tests that prove role coverage per pool.
- `scripts/build-images.mjs`: download and resize sprites into `assets/` (card art about 256px WebP, battle front and back sprites, small icons). Target under 25 MB total.
- Image component with fallback: loading shimmer, then image, then a type-coloured placeholder with the Pokémon's name if it fails. No bare `<img>` tags anywhere.
- Replace the trainer sprites and the pokeball hotlinks with local assets.

Tests:
1. `data/pokemon.json` has the expected count per gen; spot-check 10 Pokémon against PokeAPI by hand.
2. Every Pokémon id in the data has a local card image. A script lists any missing file.
3. Turn off the internet and play a full match: no broken images.
4. Pool for gens [1,2] famous-only has at least the target size; for tiny selections the message from Phase 1 appears.

### Phase 3: New design system and responsive shell

**Goal:** fix problems 6 and 7. How to apply the design is in section 6.

Tasks:
- Design tokens (`ui/theme.css`), a small component library (button, card, chip, stat bar, timer ring, modal, toast, tab bar), and a **style guide page** at `#/styleguide`. Owner approves the style guide before any screen is changed.
- App shell with proper responsive behaviour:
  - Phone (under 768px): one column, bottom action bar.
  - Tablet (768-1023px): wider single column with two-column cards.
  - PC (1024px and up): multi-panel layouts, e.g. the auction has a lot panel, a bid and history panel, and a squads panel side by side.
- **Native scrolling.** The page scrolls with finger, wheel and keyboard. Visible, slim scrollbar on PC. Sticky headers and bottom bars only where the design needs them. No scroll-lock containers. Panels that scroll internally get a visible scrollbar.
- Keyboard and mouse support on PC: Tab order, Enter/Space on buttons, shortcuts in the auction (B = bid, P = pass), hover states.
- Re-skin screens one at a time in this order: Home, Setup, Lobby, Auction, Set Break, Scout Report, Squad Select, Countdown, Result. (The Battle screen is re-built in BATTLE-PLAN.md.)

Tests:
1. At 390 / 768 / 1280px, every screen: no horizontal scroll, all buttons reachable by scroll, nothing cut off.
2. Mouse wheel, touch swipe and keyboard (PageDown, Space) all scroll.
3. Keyboard-only run through setup > create.
4. Screenshot diff review by the owner.

### Phase 4: Entry flow and lobby

**Goal:** fix problem 8.

Flow:
- **Home:** "Join Room" (code box with a big Join button) is first. Below it: "New Match" and "Resume".
- **Setup:** presets and Advanced settings. At the bottom, two buttons:
  - **Play vs Bot** (opens a short bot picker: personality, number of bots) and starts straight away.
  - **Host a Game** creates a P2P room and opens the multiplayer lobby.
- **Host lobby:** big room code with a Copy button and a Share link; live list of players (host, then each joined friend with a connection dot and "Ready"); empty seats shown as "Waiting for player…"; settings summary; "Start" enabled only when the minimum player count is reached; Kick button for the host.
- **Guest lobby:** shows the host's settings, players, and a "Ready" toggle. If the host leaves, a clear message and a way home.
- Joining by a share link (`#/join/CODE`) fills the code automatically.
- Errors are visible: "Room not found", "Room is full", "Couldn't reach host".

Tests:
1. Host on one browser window, guest on a second profile: the host sees the guest appear within 3 seconds; leaving removes them.
2. Wrong code shows "Room not found".
3. Refresh the host in the lobby: same code, same players return.
4. Bot match starts from Setup in one click and never touches PeerJS.

### Phase 5: Auction depth

**Goal:** make the auction informative and fun, without clutter. Use `IPL-Auction-Showdown-Ultimate-v54-MERGED.html` as reference for flow (marquee set, accelerated round, purse display, unsold list).

Add (shown as compact chips, bars and an expandable "Details" panel, not paragraphs):
- Lot card: stat bars, type chips, **role and secondary role**, tier, base price, speed rank in the pool, signature moves (from the new data).
- **Defensive type chart** chips: weak to, resists, immune.
- **Your squad needs:** roles you still lack, shared weaknesses so far.
- **Budget clarity:** your purse, your **maximum allowed bid** (after the reserve rule), slots left.
- **Bid history:** last 5 bids with names.
- **Up next:** the next 3 lots, and a set list with sold / unsold marks.
- **Other players:** compact squad and purse per player.
- Optional fair-value hint (toggle in settings).
- PC: Details and history sit in side panels. Phone: bottom sheet.

Tests:
1. Every field above renders with real data for 20 random Pokémon.
2. Max-bid display matches the engine's reserve rule in 100 random states.
3. No overflow at 390 / 768 / 1280px.

### Phase 6: Multiplayer hardening

**Goal:** make P2P trustworthy. Test on **two real devices** (phone + PC counts).

Tasks: reconnect after refresh (host and guest), save after every action, connection-status indicator, handling of a host that sleeps (guests see "Host disconnected, waiting 30s"), duplicate-seat protection, room-code collision handling with a visible error.

Tests:
1. Refresh the host mid-auction: resumes in 10s with the same squads and budgets.
2. Refresh the guest: gets the same seat back.
3. Put the host phone to sleep for 20s and wake it.
4. Two guests join the same room (if player count allows) and one leaves.
5. Run on different networks (home Wi-Fi vs mobile data) and write down what failed.

### Phase 7: Battle (see BATTLE-PLAN.md)

Eight battle phases, run after Phase 5. Phase 6 can run in parallel with the first battle phases, since both need the multiplayer layer.

### Phase 8: Bots, Scout Report and polish

Tasks: re-tune bot personalities on the larger pool and re-run the 200-auction proof, improve the Scout Report with the new move data, accessibility pass (contrast, tap targets, reduced motion), performance pass on a mid-range phone.

---

## 5. Common mistakes to avoid

- Giving the agent several phases in one prompt. It did this last time, and the Create bug went unnoticed.
- Accepting "all tests passed" without running `npm run test:ui` yourself.
- Letting the agent "also fix" other things in the same phase.
- Redesigning screens before the data and settings are real.
- Testing only on your PC. Check both devices from Phase 3 on.

---

## 6. How to apply the new design

**Why it was painful last time:** the Stitch screens were pasted as finished HTML into each screen's code, so the colours and spacing are scattered everywhere. Changing the design means rewriting every screen. Fix: tokens first, then screens.

Steps:
1. **Design in Stitch for both sizes.** Ask for each screen at phone (390px) and desktop (1280px). Say "Visual design only. Do not add features, sections or buttons." Start with a style-guide frame (colours, fonts, buttons, cards, chips, bars, timer ring) before any screen.
2. **Save it.** Rename the old `design/` folder to `design-old/` (don't delete it). Put the new export in `design-v2/`. Add `design-v2/README.md` listing each screen, its file, and "design-v2 replaces design-old".
3. **Tokens first.** The agent's first task (Phase 3) is the token file and the `#/styleguide` page. You look at it on your phone and PC and approve or ask for changes. Like choosing paint colours from a swatch board before painting rooms.
4. **Screens one at a time**, smallest first, each with before/after screenshots at the three widths.
5. **Prompt to use:**

> Read PLAN-v2.md and PROGRESS.md. We are on Phase 3. The new design is in design-v2/ and replaces design-old/. Task: build the theme tokens and the style guide page only. Do not touch any screen yet. Take colours, fonts, radius and spacing from design-v2/. When done, run `npm run test:ui`, update PROGRESS.md and stop.

---

## 7. Open questions for the owner

1. Which new design direction do you want? (You said the old one was your choice and a mistake. Describe the look in 3 words, e.g. "clean, bright, game-like", and tell me a game UI you like.)
2. How many players should a match support: 2 only, or up to 4?
3. How many bots can join a multiplayer match?
4. Review the famous list when Phase 2 produces it.
