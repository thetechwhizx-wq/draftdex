# DraftDex Battle: Plan

Read together with `PLAN-v2.md`. The battle is built after the data foundation (Phase 2 of PLAN-v2) and the new design shell (Phase 3). One battle phase (B0, B1, ...) per prompt. Do not skip ahead.

---

## 1. Goal

A battle that feels like playing a real Pokémon game: a scene with both Pokémon, sprites that move, attacks with effects, HP bars that drain, text boxes that type out line by line, and rules that match modern competitive Pokémon (Pokémon Champions-inspired). Works with mouse and keyboard on PC and with touch on a phone.

**Honest scope:** this is a second game inside the project. It is the biggest piece of work in DraftDex. Plan for it to take as long as the auction and everything else combined. Ship it in stages so something playable exists early.

## 2. The one idea that makes it work: engine writes the script, screen performs it

Think of a theatre. The **engine** is the referee who writes a script of exactly what happened this turn:

```
1. Pikachu used Thunderbolt
2. It's super effective: Gyarados lost 62 HP (HP 140 > 78)
3. Gyarados used Waterfall
4. Pikachu lost 31 HP (HP 90 > 59)
5. Gyarados's Speed fell
```

The **screen** is the actors. It reads the script line by line and performs each line with animation and text. The engine never knows about animations, and the screen never decides rules. This gives you:
- Animations that can be added or changed without touching the rules.
- Multiplayer for free: the host sends the same script to both players, and both screens perform it identically.
- Replays, skip-animation, and speed settings (1x / 2x / instant).
- Rule bugs that can be found with plain tests, without watching animations.

Each script line is an **event** with a type (`move_used`, `damage`, `heal`, `status_applied`, `stat_change`, `faint`, `switch_out`, `switch_in`, `weather`, `crit`, `miss`, `effectiveness`, `text`, `battle_end`). The screen has one handler per event type.

## 3. Rules (version 1 target)

**Important:** I only know Pokémon Champions at a high level. The list below is the standard modern competitive core. Before B1, write down in `docs/battle-rules-checked.md` every rule you have seen in the real game that differs, and the agent follows that file.

Version 1 (singles, 6 vs 6):
- Both players secretly choose an action each turn (commit-then-reveal in multiplayer).
- **Order:** priority bracket first, then Speed (including stat stages and paralysis), ties random.
- Level 50 stats from base stats using a standard training spread per role. No stat editor yet.
- Damage: the standard formula (level, power, attack/defense, STAB 1.5, type effectiveness, random 85-100%, critical hits 1.5x, burn halving, spread rules later).
- All 18 types, full chart, immunities.
- 4 moves per Pokémon, PP, accuracy, priority, physical/special/status category.
- Status: burn, paralysis, poison, toxic, sleep, freeze, plus confusion and flinch. Stat stages -6 to +6.
- Switching takes the turn and happens before moves.
- Fainting forces a switch. Win by knocking out all.
- **Turn timer** set in match settings (15 / 30 / 45 / 60 / 90 s, default 30). On timeout: auto-pick the best-damage move. Optional "Unlimited" for local play only, with a "request forfeit" button for multiplayer.

Later versions: abilities (start with the 40 most impactful), held items, weather and terrain, entry hazards, doubles, Mega or other special mechanics from the real game.

## 4. Scene and animation design

### 4.1 The scene (like FireRed / Emerald)
- Layered scene: sky or arena background by theme, two ground platforms, opponent top-right (front sprite), player bottom-left (back sprite), info boxes with name, level, HP bar, status badge.
- Text box at the bottom with typewriter text; menu appears after the text finishes: **Fight / Pokémon / Forfeit** (and Info). On PC, arrow keys and Enter work like a game controller; on phone, big touch targets.
- Layout scales: the scene keeps a fixed 16:9 stage inside the screen. On phone portrait the stage sits at the top and the menu below; on PC the stage is large with the move panel beside or beneath it.

### 4.2 Animation catalogue (build in this order)
1. **Send-out:** Poké Ball flash, sprite scales in, name banner.
2. **Idle:** gentle bob or breathing.
3. **Attack lunge:** attacker steps toward the target and back.
4. **Hit reaction:** target flashes white and shakes; bigger shake for critical hits.
5. **HP bar:** smooth drain over about 0.8 s, green > yellow > red; number counts down; damage popup.
6. **Effectiveness text:** "It's super effective!" / "It's not very effective…" / "It doesn't affect…", with a distinct sound and screen punch for super effective.
7. **Move effects by type** (CSS and canvas particles, no video): fire, water, electric, grass, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy, normal. Start with 6 types, add the rest later.
8. **Status effects:** burn flames, paralysis sparks, poison bubbles, sleep "Zzz", freeze tint.
9. **Stat change arrows:** up/down chevrons over the sprite.
10. **Faint:** sprite sinks and fades, "X fainted!".
11. **Switch:** recall beam, new Pokémon sent out.
12. **Weather overlays** (later).
13. **Victory / defeat sequence:** banner, camera zoom, result screen.

### 4.3 Feel rules (this is what makes it feel real)
- Every event has a time budget: text line about 0.6-1.0 s, move animation 0.4-0.8 s, HP drain about 0.8 s. A whole turn should take 4-8 s, never over 12 s.
- Settings: **Battle speed** (Normal / Fast / Instant) and **Reduce motion** toggle. Tapping or pressing Enter skips the current text.
- Always show whose turn it is and the timer.
- Sounds for hit, super effective, faint, menu move, confirm (see section 7 for licence).

### 4.4 Sprites: honest limits
- PokeAPI's sprite repo has front and back sprites for all Pokémon, and **animated** Gen 5 sprites only for roughly Pokémon #1-649. Newer ones are static.
- Plan: animated sprites where they exist, static sprites with CSS motion (bob, lunge, shake) for the rest. Phase B2 first checks coverage by script and lists the Pokémon with no back sprite so we can decide what to do.
- I could not verify the exact file paths from here: the build script must test each URL and report failures.

## 5. Phases

### B0: Specification
Tasks: write `docs/battle-rules-checked.md` (owner), a **move and mechanic coverage list** (which moves exist in v1), the event type list with fields, the screen layouts for phone and PC (design in Stitch: scene frames for 390px and 1280px, no extra features).
Tests: owner signs off the rules file and designs. No code.

### B1: Battle engine v2 (no UI)
Tasks: rebuild or extend `engine/battle.js` to **output events** (section 2). Use the full move and type data from PLAN-v2 Phase 2. Implement the v1 rules in section 3. Deterministic: same seed plus same choices gives the same event list.
Tests:
1. **Known-value damage tests:** pick 10 matchups, compute by hand or with an online damage calculator, and assert the engine's min and max damage match.
2. Speed order, priority, paralysis speed drop, tie handling (1,000 seeds, about 50/50).
3. Each status's effect and end condition.
4. Stat stage maths including accuracy and evasion.
5. Switching, forced switch, last Pokémon fainting, double KO on recoil.
6. 5,000 random auto-battles: no crash, always ends, no negative HP.
7. Replaying the saved choice log reproduces the same events.

### B2: Moves and team building
Tasks: after the auction (and before Team Preview), each player's chosen Pokémon get a **moveset**: auto-built default from the learnset (two same-type attacks, one coverage, one utility), with an optional editor to pick 4 moves from the learnset. Show type coverage and weakness warnings.
Tests: every auctioned Pokémon gets 4 legal moves; learnset rule enforced; editor can't pick an illegal move.

### B3: Battle scene (static)
Tasks: build the stage and layout at three widths, info boxes, HP bars, text box, menu (Fight / Pokémon / Forfeit), move panel with type, power, PP, accuracy. Connect to engine events with **no animation yet** (text and HP just update).
Tests: complete a full battle in the UI at 390px and 1280px, using mouse and keyboard only on PC and touch on phone; nothing overflows; text is readable.

### B4: Animation pass 1 (the "feels like Pokémon" release)
Tasks: event player with queue, speeds, skip. Animations 1-6 from section 4.2 plus faint, switch, text typewriter, and the first 6 move-type effects. Sounds (synth).
Tests: event player plays the sample script from section 2 in order; skip works; Instant speed gives the same final state as Normal; frame rate stays near 60 on PC and above 30 on a mid-range phone (measure and write down).

### B5: Animation pass 2 and polish
Tasks: remaining type effects, status effects, stat arrows, critical-hit flash, victory/defeat sequence, background themes, battle-speed and reduce-motion settings, accessibility.
Tests: all 18 types have an effect; reduced motion removes shaking and flashing; no animation leaves the scene in a wrong state when skipped halfway.

### B6: Multiplayer battle
Tasks: commit-then-reveal over P2P (each player sends a hash of their choice, then the real choice), the host runs the engine and **sends the event list** to both players, both screens perform it. Turn timer synced. Disconnect handling: 30 s grace, then forfeit option. Refresh mid-battle restores the same state.
Tests:
1. Host cannot see the guest's choice before locking its own (inspect the messages).
2. Both screens show the same text, damage and result for 20 battles.
3. Refresh host mid-turn: battle resumes. Refresh guest: same.
4. Timeout auto-move works on both sides.

### B7: Battle AI (for vs Bot)
Tasks: bot picks moves by expected damage, type matchup, KO chance, and switches when badly matched. Difficulty levels: Easy (often random), Normal (greedy damage), Hard (looks one turn ahead, avoids obvious losses). Bot personality from the auction carries over (the Aggressive bot attacks more, the Strategist switches smarter).
Tests: Hard beats Easy at least 80% over 500 simulated battles; no illegal moves; no infinite switching loops.

### B8 (later): Depth
Abilities, items, weather and hazards, doubles, spectators, replays, rematch stats. Each is its own mini-phase.

## 6. Risks and how we handle them

| Risk | Handling |
|---|---|
| Rules are huge and easy to get subtly wrong | Known-value damage tests, small rule set first, rules file you approve |
| Animations become spaghetti | Engine/screen split and one event player; one handler per event |
| Phone performance | CSS transforms and sprite sheets, test on a real mid-range phone, Reduce motion option |
| Missing sprites for new Pokémon | Coverage script in B3/B4, static-sprite fallback with CSS motion |
| P2P cheating in battle | Commit-then-reveal; accepted that the host could still inspect memory |
| Scope creep | Anything not in a phase goes in B8 |

## 7. Assets and licensing (honest note)
- Pokémon names, sprites and music belong to Nintendo, Game Freak and The Pokémon Company. This is a non-commercial fan project, so don't sell it, don't run ads on it, and don't use ripped game audio or ROM assets.
- Sounds: use synthesized sounds (you already have Web Audio) or free-licence packs with the licence file saved in the repo.
- Keep a short `CREDITS.md` listing data and sprite sources (PokeAPI and its sprite repo).

## 8. Common mistakes to avoid
- Starting with animations before the rules are tested.
- Letting the screen decide anything about the outcome of a turn.
- Giving the agent B3 and B4 in one prompt.
- Testing only on PC.
- Checking only "it looks cool", and not "same inputs, same result".

## 9. Questions for the owner (answer before B0)
1. Singles only first, or do you want doubles early?
2. Any mechanic from Pokémon Champions you want in v1 (list what you know of)?
3. Which feel matters most: Emerald/FireRed retro look, or a modern Champions look?
4. Sound: synth effects only for now, or do you want to source music?
