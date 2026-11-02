/**
 * Match Setup Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/match_setup/code.html & design-v2
 */

export function renderSetupScreen({
  settings,
  activePreset = 'standard',
  selectedGens = [1, 2, 3, 4, 5, 6, 7, 8, 9],
  famousMix = false,
  lockedFields = new Set(),
  isAdvancedOpen = false,
  availablePoolCount = 122,
  poolSummaryText = '',
  errorMessage = null
}) {
  const isQuick = activePreset === 'quick';
  const isStandard = activePreset === 'standard';
  const isMarathon = activePreset === 'marathon';

  const gensList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const battleTimers = [15, 30, 45, 60, 90];
  const currentBattleTimer = Number(settings.battleTurnTimer || 30);

  const locked = lockedFields instanceof Set ? lockedFields : new Set(lockedFields || []);

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)] pt-safe">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Back" id="btn-setup-back" class="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary-container transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <img alt="DraftDex Logo" class="h-8 w-auto object-contain" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"/>
          <h1 class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">Draft Setup</h1>
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
          <span class="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">Format Selector</span>
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
        <div class="preset-card relative p-space-md rounded-xl ${isQuick ? 'bg-surface-container-high shadow-md shadow-primary-container/10 ring-1 ring-primary-container' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'} transition-all cursor-pointer" id="card-quick" data-preset="quick">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-md">
              <div class="w-10 h-10 rounded-lg ${isQuick ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-outline'} flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <div class="flex flex-col">
                <span class="font-headline-sm text-headline-sm uppercase ${isQuick ? 'text-primary-container' : 'text-on-surface'}">Quick</span>
                <span class="font-tabular-stats text-tabular-stats ${isQuick ? 'text-on-surface' : 'text-outline'}">15m · 4 PKMN · $${isQuick ? settings.budget : 70}</span>
              </div>
            </div>
            <div class="check-indicator w-6 h-6 rounded-full ${isQuick ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-surface-dim'} flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
          </div>
        </div>

        <!-- Preset 2: Standard -->
        <div class="preset-card relative p-space-md rounded-xl ${isStandard ? 'bg-surface-container-high shadow-md shadow-primary-container/10 ring-1 ring-primary-container' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'} transition-all cursor-pointer" id="card-standard" data-preset="standard">
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
                <span class="font-tabular-stats text-tabular-stats ${isStandard ? 'text-on-surface' : 'text-outline'}">35m · 6 PKMN · $${isStandard ? settings.budget : 100}</span>
              </div>
            </div>
            <div class="check-indicator w-6 h-6 rounded-full ${isStandard ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-surface-dim'} flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
          </div>
        </div>

        <!-- Preset 3: Marathon -->
        <div class="preset-card relative p-space-md rounded-xl ${isMarathon ? 'bg-surface-container-high shadow-md shadow-primary-container/10 ring-1 ring-primary-container' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'} transition-all cursor-pointer" id="card-marathon" data-preset="marathon">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-md">
              <div class="w-10 h-10 rounded-lg ${isMarathon ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-outline'} flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">military_tech</span>
              </div>
              <div class="flex flex-col">
                <span class="font-headline-sm text-headline-sm uppercase ${isMarathon ? 'text-primary-container' : 'text-on-surface'}">Marathon</span>
                <span class="font-tabular-stats text-tabular-stats ${isMarathon ? 'text-on-surface' : 'text-outline'}">60m · 10 PKMN · $${isMarathon ? settings.budget : 170}</span>
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
          
          <!-- Pool Scope and Counter Strip -->
          <div class="flex items-center justify-between bg-surface-container p-space-sm rounded-lg shadow-inner">
            <div class="flex flex-col">
              <span class="font-label-caps text-[11px] uppercase text-outline">Active Pool Scope</span>
              <span class="text-xs text-on-surface font-headline-sm" id="pool-summary-text">${poolSummaryText || 'Configured Generations'}</span>
            </div>
            <div class="flex items-center gap-1.5 bg-surface-container-highest px-2.5 py-1 rounded-full">
              <span class="w-2 h-2 rounded-full ${availablePoolCount >= 24 ? 'bg-primary-container' : 'bg-status-urgent'} animate-pulse"></span>
              <span class="font-label-caps text-[11px] font-bold ${availablePoolCount >= 24 ? 'text-primary-container' : 'text-status-urgent'}" id="pool-counter">${availablePoolCount} available</span>
            </div>
          </div>

          <!-- Generations Filter Chips -->
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center justify-between">
              <span class="font-label-caps text-label-caps uppercase text-outline">Eligible Generations</span>
              <button id="btn-select-all-gens" class="text-xs text-primary-container hover:underline uppercase font-label-caps" type="button">Select All</button>
            </div>
            <div class="flex flex-wrap gap-1.5" id="gen-chips-container">
              ${gensList.map(g => {
                const active = selectedGens.includes(g);
                return `
                  <button class="chip-gen min-h-[40px] px-3 rounded-lg ${active ? 'bg-surface-container-highest text-primary-container ring-1 ring-primary-container/40' : 'bg-surface-container text-outline opacity-60'} font-label-caps text-label-caps uppercase flex items-center gap-1 active:scale-95 transition-transform shadow-sm" data-gen="${g}" type="button">
                    <span class="material-symbols-outlined text-[16px] ${active ? 'text-primary-container' : 'text-outline/40'} chip-icon">${active ? 'check' : 'add'}</span>
                    <span>Gen ${g}</span>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Famous Only Filter -->
            <div class="flex items-center justify-between bg-surface-container p-space-sm rounded-lg mt-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-container text-[18px]">star</span>
                <div class="flex flex-col">
                  <span class="font-headline-sm text-xs uppercase text-on-surface">Famous only</span>
                  <span class="text-[11px] text-outline">Filter to iconic fan favorites</span>
                </div>
              </div>
              <button id="chip-famous" class="min-h-[36px] px-3 rounded-full ${famousMix ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-surface-container-highest text-outline'} font-label-caps text-[11px] uppercase flex items-center gap-1 active:scale-95 transition-all shadow-sm" type="button">
                <span class="material-symbols-outlined text-[15px]">${famousMix ? 'check' : 'remove'}</span>
                <span>${famousMix ? 'Active' : 'Off'}</span>
              </button>
            </div>
          </div>

          <!-- Advanced Numeric Inputs (Grid) -->
          <div class="grid grid-cols-2 gap-space-sm pt-space-xs">
            <!-- Team size -->
            <div class="flex flex-col gap-1 p-space-sm bg-surface-container rounded-lg">
              <div class="flex items-center justify-between text-outline">
                <span class="font-label-caps text-[11px] uppercase">Team Size</span>
                <button aria-label="Toggle lock team size" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${locked.has('teamSize') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="teamSize" type="button">
                  <span class="material-symbols-outlined text-[14px]">${locked.has('teamSize') ? 'lock' : 'lock_open'}</span>
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
                <button aria-label="Toggle lock budget" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${locked.has('budget') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="budget" type="button">
                  <span class="material-symbols-outlined text-[14px]">${locked.has('budget') ? 'lock' : 'lock_open'}</span>
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
                <button aria-label="Toggle lock starting bid" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${locked.has('startBid') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="startBid" type="button">
                  <span class="material-symbols-outlined text-[14px]">${locked.has('startBid') ? 'lock' : 'lock_open'}</span>
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
                <button aria-label="Toggle lock bid timer" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${locked.has('bidTimer') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="bidTimer" type="button">
                  <span class="material-symbols-outlined text-[14px]">${locked.has('bidTimer') ? 'lock' : 'lock_open'}</span>
                </button>
              </div>
              <div class="flex items-center">
                <input id="input-bid-timer" class="w-full bg-transparent font-numeral-lg text-numeral-lg text-primary placeholder:text-outline focus:outline-none" value="${settings.bidTimer}" type="number" min="3"/>
                <span class="font-body-sm text-outline ml-1">s</span>
              </div>
            </div>

            <!-- Open Timer -->
            <div class="flex flex-col gap-1 p-space-sm bg-surface-container rounded-lg col-span-2">
              <div class="flex items-center justify-between text-outline">
                <span class="font-label-caps text-[11px] uppercase">Auction Open Timer</span>
                <button aria-label="Toggle lock open timer" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${locked.has('openTimer') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="openTimer" type="button">
                  <span class="material-symbols-outlined text-[14px]">${locked.has('openTimer') ? 'lock' : 'lock_open'}</span>
                </button>
              </div>
              <div class="flex items-center">
                <input id="input-open-timer" class="w-full bg-transparent font-numeral-lg text-numeral-lg text-primary placeholder:text-outline focus:outline-none" value="${settings.openTimer || 18}" type="number" min="5"/>
                <span class="font-body-sm text-outline ml-1">s</span>
              </div>
            </div>
          </div>

          <!-- Battle Turn Timer Selector Chips -->
          <div class="flex flex-col gap-space-xs bg-surface-container p-space-sm rounded-lg">
            <div class="flex items-center justify-between text-outline">
              <span class="font-label-caps text-[11px] uppercase">Battle Turn Timer</span>
              <button aria-label="Toggle lock battle turn timer" class="btn-lock min-w-[24px] min-h-[24px] flex items-center justify-center ${locked.has('battleTurnTimer') ? 'text-primary-container font-bold' : 'text-outline hover:text-primary'} transition-colors" data-field="battleTurnTimer" type="button">
                <span class="material-symbols-outlined text-[14px]">${locked.has('battleTurnTimer') ? 'lock' : 'lock_open'}</span>
              </button>
            </div>
            <div class="grid grid-cols-5 gap-1.5" id="battle-timer-chips">
              ${battleTimers.map(t => {
                const active = currentBattleTimer === t;
                return `
                  <button class="chip-battle-timer h-9 rounded ${active ? 'bg-primary-container text-on-primary-container font-bold shadow-md' : 'bg-surface-container-highest text-outline'} font-label-caps text-xs flex items-center justify-center transition-all active:scale-95" data-timer="${t}" type="button">
                    ${t}s
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message Banner (if impossible pool or constraint violation) -->
      ${errorMessage ? `
        <div id="setup-error-banner" class="flex items-center gap-space-sm p-space-md rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 mb-space-lg shadow-lg">
          <span class="material-symbols-outlined text-red-400 text-[20px] flex-shrink-0">error</span>
          <div class="flex flex-col">
            <span class="font-headline-sm text-xs uppercase font-bold text-red-300">Invalid Configuration</span>
            <span class="text-xs text-red-200" id="setup-error-text">${errorMessage}</span>
          </div>
        </div>
      ` : ''}

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
