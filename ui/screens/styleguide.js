/**
 * ui/screens/styleguide.js
 * Phase 3: Interactive Style Guide & Token Showcase
 * Route: #/styleguide
 * Sourced directly from design-v2/style_guide_pok_mon_draft_arena/code.html
 */

export function renderStyleGuideScreen() {
  return `
    <div class="w-full max-w-[1280px] mx-auto py-6 px-4 text-on-surface">
      <!-- Style Guide Header -->
      <header class="border-b-2 border-border-subtle pb-6 mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="font-heading font-extrabold text-2xl md:text-3xl uppercase tracking-wider text-white">
              Style Guide · Pokémon Draft Arena
            </h1>
            <span class="bg-primary-yellow text-primary-yellow-text font-numbers font-bold text-xs px-2.5 py-1 rounded-md tracking-wider">
              V2 SYSTEM
            </span>
          </div>
          <p class="font-heading text-sm text-text-muted uppercase tracking-wider mt-2">
            Direction: <span class="text-primary-yellow font-bold">Tactical Arena · Draft Terminal</span> (Phone & Desktop)
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a href="#/home" class="btn-tactical-secondary px-4 py-2 text-xs">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to App
          </a>
        </div>
      </header>

      <!-- 1. Color Palette -->
      <section class="card mb-6">
        <div class="card-header">
          <h2 class="card-title">1. Color Palette (Tactical Arena Surfaces & Accents)</h2>
          <span class="spec-label">DESIGN TOKENS</span>
        </div>
        <div class="swatch-grid">
          <div class="swatch">
            <div class="swatch-color" style="background: #080d18;"></div>
            <div class="swatch-meta">
              <div class="swatch-name">Background Base</div>
              <div class="swatch-hex">#080d18</div>
            </div>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="background: #10192a;"></div>
            <div class="swatch-meta">
              <div class="swatch-name">Surface Default</div>
              <div class="swatch-hex">#10192a</div>
            </div>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="background: #162238;"></div>
            <div class="swatch-meta">
              <div class="swatch-name">Surface Elevated</div>
              <div class="swatch-hex">#162238</div>
            </div>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="background: #1e2e4a;"></div>
            <div class="swatch-meta">
              <div class="swatch-name">Surface High</div>
              <div class="swatch-hex">#1e2e4a</div>
            </div>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="background: #ffe033;"></div>
            <div class="swatch-meta">
              <div class="swatch-name text-primary-yellow font-bold">Brand Primary</div>
              <div class="swatch-hex">#ffe033</div>
            </div>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="background: #ef4444;"></div>
            <div class="swatch-meta">
              <div class="swatch-name">Accent Red</div>
              <div class="swatch-hex">#ef4444</div>
            </div>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="background: #22c55e;"></div>
            <div class="swatch-meta">
              <div class="swatch-name">Live Green</div>
              <div class="swatch-hex">#22c55e</div>
            </div>
          </div>
          <div class="swatch">
            <div class="swatch-color" style="background: #06b6d4;"></div>
            <div class="swatch-meta">
              <div class="swatch-name">Accent Cyan</div>
              <div class="swatch-hex">#06b6d4</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Typography & Numbers -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">2. Typography Scale</h2>
            <span class="spec-label">CHAKRA PETCH + PLUS JAKARTA SANS</span>
          </div>
          <div class="type-sample-box">
            <div class="font-row">
              <div class="font-title">Display Hero / Big Titles (Chakra Petch Bold)</div>
              <div class="sample-heading">CHARIZARD #006</div>
            </div>
            <div class="font-row">
              <div class="font-title">Body / System (Plus Jakarta Sans)</div>
              <p class="text-sm text-text-secondary">
                A competitive Pokémon auction and draft terminal. Built for simultaneous multi-device bidding, strategic scout judge reports, and authentic turn-based battle execution.
              </p>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h2 class="card-title">3. High-Contrast Numeral Tokens</h2>
            <span class="spec-label">JETBRAINS MONO</span>
          </div>
          <div class="type-sample-box">
            <div class="font-row">
              <div class="font-title">Auction Purse / Bidding Counter</div>
              <div class="sample-numbers">$125.00</div>
            </div>
            <div class="font-row">
              <div class="font-title">Deliberation Timer (Urgent & Regular)</div>
              <div class="flex items-center gap-4">
                <span class="font-numbers font-extrabold text-2xl text-primary-yellow">18.4s</span>
                <span class="font-numbers font-extrabold text-2xl text-accent-red animate-pulse">04.8s URGENT</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 4. Interactive Components & Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">4. Button Component Library</h2>
            <span class="spec-label">MIN 44PX TOUCH TARGETS</span>
          </div>
          <div class="flex flex-col gap-3">
            <button class="btn-tactical-primary h-12 w-full" type="button">
              <span class="material-symbols-outlined text-[20px]">gavel</span>
              Primary Action · Bid +$5
            </button>
            <button class="btn-tactical-secondary h-12 w-full" type="button">
              <span class="material-symbols-outlined text-[20px]">visibility</span>
              Secondary Action · Scout Report
            </button>
            <button class="btn-tactical-danger h-12 w-full" type="button">
              <span class="material-symbols-outlined text-[20px]">close</span>
              Pass Lot · Forfeit Bidding
            </button>
            <button disabled class="btn-tactical-primary h-12 w-full" type="button">
              Disabled · Insufficient Budget
            </button>
          </div>
        </section>

        <!-- 5. Status Gauges & Circular Timer -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">5. Timer Ring & Stat Bars</h2>
            <span class="spec-label">SVG CIRCLE + LIVE FEEDBACK</span>
          </div>
          <div class="flex items-center justify-around py-2">
            <!-- Timer SVG Ring -->
            <div class="relative w-24 h-24 flex items-center justify-center">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#243552" stroke-width="6"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke="#ffe033" stroke-width="6"
                  stroke-dasharray="213.6" stroke-dashoffset="64" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-numbers font-bold text-xl text-primary-yellow">12</span>
                <span class="font-heading text-[9px] uppercase tracking-wider text-text-muted">SECONDS</span>
              </div>
            </div>

            <!-- Urgent Red Timer -->
            <div class="relative w-24 h-24 flex items-center justify-center">
              <svg class="w-full h-full -rotate-90 animate-pulse" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#243552" stroke-width="6"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke="#ef4444" stroke-width="6"
                  stroke-dasharray="213.6" stroke-dashoffset="170" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-numbers font-bold text-xl text-accent-red">03</span>
                <span class="font-heading text-[9px] uppercase tracking-wider text-accent-red font-bold">URGENT</span>
              </div>
            </div>
          </div>

          <!-- Stat Bars -->
          <div class="mt-4 flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs font-numbers">
              <span class="text-text-muted">HP: 80 / 80</span>
              <span class="text-accent-green font-bold">100%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
              <div class="h-full bg-accent-green rounded-full" style="width: 100%;"></div>
            </div>
            <div class="flex items-center justify-between text-xs font-numbers mt-1">
              <span class="text-text-muted">Attack (Phys Sweeper): 134</span>
              <span class="text-primary-yellow font-bold">Tier 1</span>
            </div>
            <div class="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
              <div class="h-full bg-primary-yellow rounded-full" style="width: 78%;"></div>
            </div>
          </div>
        </section>
      </div>

      <!-- 6. 18 Pokémon Type Chips -->
      <section class="card mb-6">
        <div class="card-header">
          <h2 class="card-title">6. 18 Pokémon Type Chips</h2>
          <span class="spec-label">HIGH CONTRAST & ACCESSIBLE</span>
        </div>
        <div class="chips-grid">
          <span class="type-chip" style="background: var(--type-normal);">Normal</span>
          <span class="type-chip" style="background: var(--type-fire);">Fire</span>
          <span class="type-chip" style="background: var(--type-water);">Water</span>
          <span class="type-chip" style="background: var(--type-grass);">Grass</span>
          <span class="type-chip chip-electric" style="background: var(--type-electric);">Electric</span>
          <span class="type-chip chip-ice" style="background: var(--type-ice);">Ice</span>
          <span class="type-chip" style="background: var(--type-fighting);">Fighting</span>
          <span class="type-chip" style="background: var(--type-poison);">Poison</span>
          <span class="type-chip" style="background: var(--type-ground);">Ground</span>
          <span class="type-chip" style="background: var(--type-flying);">Flying</span>
          <span class="type-chip" style="background: var(--type-psychic);">Psychic</span>
          <span class="type-chip" style="background: var(--type-bug);">Bug</span>
          <span class="type-chip" style="background: var(--type-rock);">Rock</span>
          <span class="type-chip" style="background: var(--type-ghost);">Ghost</span>
          <span class="type-chip" style="background: var(--type-dragon);">Dragon</span>
          <span class="type-chip" style="background: var(--type-steel);">Steel</span>
          <span class="type-chip" style="background: var(--type-dark);">Dark</span>
          <span class="type-chip" style="background: var(--type-fairy);">Fairy</span>
        </div>
      </section>

      <!-- 7. Role Badges -->
      <section class="card mb-8">
        <div class="card-header">
          <h2 class="card-title">7. Tactical Role Archetypes</h2>
          <span class="spec-label">COMPETITIVE ARCHETYPES</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="role-chip primary">
            <span class="material-symbols-outlined text-[16px]">swords</span>
            Physical Sweeper
          </span>
          <span class="role-chip primary">
            <span class="material-symbols-outlined text-[16px]">bolt</span>
            Special Sweeper
          </span>
          <span class="role-chip primary">
            <span class="material-symbols-outlined text-[16px]">speed</span>
            Speedster
          </span>
          <span class="role-chip">
            <span class="material-symbols-outlined text-[16px]">shield</span>
            Tank/Wall
          </span>
          <span class="role-chip">
            <span class="material-symbols-outlined text-[16px]">handshake</span>
            Support
          </span>
          <span class="role-chip">
            <span class="material-symbols-outlined text-[16px]">military_tech</span>
            All-rounder
          </span>
        </div>
      </section>
    </div>
  `;
}
