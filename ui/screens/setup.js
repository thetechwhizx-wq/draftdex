/**
 * Match Setup Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/match_setup/code.html
 */

export function renderSetupScreen({ settings, activePreset = 'standard', selectedGens = [1, 2, 3, 4, 5, 6, 7, 8, 9], famousMix = false, lockedFields = new Set(), isAdvancedOpen = false }) {
  const isQuick = activePreset === 'quick';
  const isStandard = activePreset === 'standard';
  const isMarathon = activePreset === 'marathon';

  const gensList = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)] pt-safe">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Back" id="btn-setup-back" class="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary-container transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <img alt="Apex Draft Arena Logo" class="h-8 w-auto object-contain" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"/>
          <h1 class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">Lobby Config</h1>
        </div>
        <div class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-col w-full pb-space-xl pt-14">
      <!-- Status & Context Pill -->
      <div class="flex items-center justify-between py-space-sm mb-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
          <span class="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">Lobby Config</span>
        </div>
        <span class="font-tabular-stats text-tabular-stats text-outline">Tier 1 · Competitive</span>
      </div>

      <!-- Section Title -->
      <div class="flex items-baseline justify-between mb-space-sm">
        <h2 class="font-headline-sm text-headline-sm uppercase text-primary tracking-wide">Pace Presets</h2>
        <span class="font-label-caps text-label-caps uppercase text-outline">Select Format</span>
      </div>

      <!-- Preset Selector Stack -->
      <div class="flex flex-col gap-space-sm mb-space-lg" id="preset-group">
        <!-- Preset 1: Quick -->
        <div class="preset-card relative p-space-md rounded-xl ${isQuick ? 'bg-surface-container-high shadow-md shadow-primary-container/10' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'} transition-all cursor-pointer" id="card-quick" data-preset="quick">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-md">
              <div class="w-10 h-10 rounded-lg ${isQuick ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-outline'} flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <div class="flex flex-col">
                <span class="font-headline-sm text-headline-sm uppercase ${isQuick ? 'text-primary-container' : 'text-on-surface'}">Quick</span>
                <span class="font-tabular-stats text-tabular-stats ${isQuick ? 'text-on-surface' : 'text-outline'}">15m · 4 PKMN</span>
              </div>
            </div>
            <div class="check-indicator w-6 h-6 rounded-full ${isQuick ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-surface-dim'} flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
          </div>
        </div>

        <!-- Preset 2: Standard -->
        <div class="preset-card relative p-space-md rounded-xl ${isStandard ? 'bg-surface-container-high shadow-md shadow-primary-container/10' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'} transition-all cursor-pointer" id="card-standard" data-preset="standard">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-md">
              <div class="icon-box w-10 h-10 rounded-lg ${isStandard ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-outline'} flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">timer</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-space-xs">
                  <span class="title-text font-headline-sm text-headline-sm uppercase ${isStandard ? 'text-primary-container' : 'text-on-surface'}">Standard</span>
                  <span class="badge-text px-1.5 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-label-caps text-[10px] uppercase">Default</span>
                </div>
                <span class="font-tabular-stats text-tabular-stats ${isStandard ? 'text-on-surface' : 'text-outline'}">35m · 6 PKMN</span>
              </div>
            </div>
            <div class="check-indicator w-6 h-6 rounded-full ${isStandard ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-surface-dim'} flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
          </div>
        </div>

        <!-- Preset 3: Marathon -->
        <div class="preset-card relative p-space-md rounded-xl ${isMarathon ? 'bg-surface-container-high shadow-md shadow-primary-container/10' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'} transition-all cursor-pointer" id="card-marathon" data-preset="marathon">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-md">
              <div class="w-10 h-10 rounded-lg ${isMarathon ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-outline'} flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">military_tech</span>
              </div>
              <div class="flex flex-col">
                <span class="font-headline-sm text-headline-sm uppercase ${isMarathon ? 'text-primary-container' : 'text-on-surface'}">Marathon</span>
                <span class="font-tabular-stats text-tabular-stats ${isMarathon ? 'text-on-surface' : 'text-outline'}">60m · 10 PKMN</span>
              </div>
            </div>
            <div class="check-indicator w-6 h-6 rounded-full ${isMarathon ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-surface-dim'} flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Dropdown Header Accordion -->
      <div class="rounded-xl bg-surface-container-low shadow-sm mb-space-lg overflow-hidden">
        <button id="btn-toggle-advanced" class="w-full min-h-[48px] px-space-md py-space-sm flex items-center justify-between text-left hover:bg-surface-container transition-colors" type="button">
          <div class="flex items-center gap-space-sm">
            <span class="material-symbols-outlined text-outline text-[20px]">tune</span>
            <span class="font-headline-sm text-headline-sm uppercase text-on-surface">Advanced Parameters</span>
          </div>
          <div class="flex items-center gap-space-xs text-outline">
            <span class="font-label-caps text-label-caps uppercase" id="advanced-status-label">${isAdvancedOpen ? 'Close' : 'Adjust'}</span>
            <span class="material-symbols-outlined text-[20px] transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}" id="advanced-chevron">expand_more</span>
          </div>
        </button>

        <!-- Collapsible Advanced Drawer Content -->
        <div class="${isAdvancedOpen ? 'flex' : 'hidden'} px-space-md pb-space-md flex-col gap-space-md bg-surface-container-low" id="advanced-drawer">
          <div class="w-full h-px bg-surface-container-highest mb-space-xs"></div>
          
          <!-- Generations Filter Chips -->
          <div class="flex flex-col gap-space-xs">
            <span class="font-label-caps text-label-caps uppercase text-outline">Eligible Generations</span>
            <div class="flex flex-wrap gap-1.5" id="gen-chips-container">
              ${gensList.map(g => {
                const active = selectedGens.includes(g) && !famousMix;
                return `
                  <button class="chip-gen min-h-[44px] px-3 rounded-full ${active ? 'bg-surface-container-highest text-primary' : 'bg-surface-container text-outline'} font-label-caps text-label-caps uppercase flex items-center gap-1 active:scale-95 transition-transform shadow-sm" data-gen="${g}" type="button">
                    <span class="material-symbols-outlined text-[16px] ${active ? 'text-primary-container' : 'text-outline/40'} chip-icon">check</span>
                    <span>Gen ${g}</span>
                  </button>
                `;
              }).join('')}
              <button class="chip-famous min-h-[44px] px-3 rounded-full ${famousMix ? 'bg-surface-container-highest text-primary border border-primary-container/40' : 'bg-surface-container text-outline'} font-label-caps text-label-caps uppercase flex items-center gap-1 active:scale-95 transition-transform shadow-sm" id="chip-famous" type="button">
                <span class="material-symbols-outlined text-[16px] ${famousMix ? 'text-primary-container' : 'text-outline/40'} chip-icon">check</span>
                <span>Famous Mix</span>
              </button>
            </div>
          </div>

          <!-- Advanced Inputs (2x2 Grid) -->
          <div class="grid grid-cols-2 gap-space-sm pt-space-xs">
            <!-- Team size -->
            <div class="flex flex-col gap-1 p-space-sm bg-surface-container rounded-lg">
              <div class="flex items-center justify-between text-outline">
                <span class="font-label-caps text-[11px] uppercase">Team Size</span>
                <button aria-label="Toggle lock team size" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${lockedFields.has('teamSize') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="teamSize" type="button">
                  <span class="material-symbols-outlined text-[14px]">${lockedFields.has('teamSize') ? 'lock' : 'lock_open'}</span>
                </button>
              </div>
              <div class="flex items-center">
                <input id="input-team-size" class="w-full bg-transparent font-numeral-lg text-numeral-lg text-primary placeholder:text-outline focus:outline-none" value="${settings.teamSize}" type="number" min="1" max="12"/>
              </div>
            </div>

            <!-- Budget -->
            <div class="flex flex-col gap-1 p-space-sm bg-surface-container rounded-lg">
              <div class="flex items-center justify-between text-outline">
                <span class="font-label-caps text-[11px] uppercase">Budget</span>
                <button aria-label="Toggle lock budget" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${lockedFields.has('budget') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="budget" type="button">
                  <span class="material-symbols-outlined text-[14px]">${lockedFields.has('budget') ? 'lock' : 'lock_open'}</span>
                </button>
              </div>
              <div class="flex items-center">
                <span class="font-numeral-lg text-numeral-lg text-primary-container mr-1">$</span>
                <input id="input-budget" class="w-full bg-transparent font-numeral-lg text-numeral-lg text-primary placeholder:text-outline focus:outline-none" value="${settings.budget}" type="number" min="10"/>
              </div>
            </div>

            <!-- Starting Bid -->
            <div class="flex flex-col gap-1 p-space-sm bg-surface-container rounded-lg">
              <div class="flex items-center justify-between text-outline">
                <span class="font-label-caps text-[11px] uppercase">Starting Bid</span>
                <button aria-label="Toggle lock starting bid" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${lockedFields.has('startBid') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="startBid" type="button">
                  <span class="material-symbols-outlined text-[14px]">${lockedFields.has('startBid') ? 'lock' : 'lock_open'}</span>
                </button>
              </div>
              <div class="flex items-center">
                <span class="font-numeral-lg text-numeral-lg text-primary-container mr-1">$</span>
                <input id="input-start-bid" class="w-full bg-transparent font-numeral-lg text-numeral-lg text-primary placeholder:text-outline focus:outline-none" value="${settings.startBid}" type="number" min="1"/>
              </div>
            </div>

            <!-- Bid Timer -->
            <div class="flex flex-col gap-1 p-space-sm bg-surface-container rounded-lg">
              <div class="flex items-center justify-between text-outline">
                <span class="font-label-caps text-[11px] uppercase">Bid Timer</span>
                <button aria-label="Toggle lock bid timer" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${lockedFields.has('bidTimer') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="bidTimer" type="button">
                  <span class="material-symbols-outlined text-[14px]">${lockedFields.has('bidTimer') ? 'lock' : 'lock_open'}</span>
                </button>
              </div>
              <div class="flex items-center">
                <input id="input-bid-timer" class="w-full bg-transparent font-numeral-lg text-numeral-lg text-primary placeholder:text-outline focus:outline-none" value="${settings.bidTimer}s" type="text"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto Balancing Summary Banner -->
      <div class="flex items-center justify-between p-space-md rounded-xl bg-surface-container mb-space-lg shadow-sm">
        <div class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary-container">
            <span class="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <div class="flex flex-col">
            <span class="font-headline-sm text-headline-sm uppercase text-on-surface">Auto Balancing</span>
            <span class="font-body-sm text-body-sm text-outline">Role-coverage check active</span>
          </div>
        </div>
        <div class="w-3 h-3 rounded-full bg-primary-container shadow-sm"></div>
      </div>

      <!-- Primary Create Button -->
      <div class="w-full mt-auto">
        <button id="btn-create-match" class="w-full min-h-[52px] bg-primary-container text-on-primary-container rounded-xl font-headline-md text-headline-md uppercase tracking-wider flex items-center justify-center gap-space-sm active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 hover:brightness-105" type="button">
          <span class="material-symbols-outlined text-[24px]">sports_esports</span>
          <span>Create</span>
        </button>
      </div>
    </div>
  `;
}
