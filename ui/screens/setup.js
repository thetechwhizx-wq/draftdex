/**
 * Match Setup Screen
 * Visual source: design-v2/setup_phone/code.html & design-v2/setup_desktop_1280px/code.html
 * Tactical Arena & Draft Terminal theme
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
    <div class="flex flex-col w-full py-4 sm:py-6 lg:py-8">
      
      <!-- Top Tactical Header / Sub-HUD -->
      <div class="flex items-center justify-between pb-5 mb-6 border-b border-tactical-navy-light/60">
        <div class="flex items-center gap-3">
          <button
            id="btn-setup-back"
            type="button"
            aria-label="Back to Terminal"
            class="w-10 h-10 rounded-lg bg-tactical-navy hover:bg-tactical-navy-light border border-tactical-navy-light text-text-dim hover:text-text-high flex items-center justify-center transition-all active:scale-95"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex flex-col">
            <span class="font-mono text-[10px] text-primary-yellow font-bold uppercase tracking-widest leading-none">PRE-DRAFT COCKPIT</span>
            <h1 class="font-display font-bold text-xl uppercase tracking-wider text-text-high mt-1">DRAFT SETUP</h1>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-2 bg-tactical-navy px-3 py-1.5 rounded-lg border border-tactical-navy-light">
            <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            <span class="font-mono text-xs font-bold text-status-success uppercase tracking-wider">CONFIG READY</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-tactical-navy border border-tactical-navy-light flex items-center justify-center text-primary-yellow">
            <span class="material-symbols-outlined text-[20px]">tune</span>
          </div>
        </div>
      </div>

      <!-- Main Layout: 1 Column on Mobile (<1024px), 2 Columns on Desktop (1280px) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        <!-- Left Column: Presets, Advanced Drawer, Error Banner (lg:col-span-7) -->
        <div class="lg:col-span-7 flex flex-col gap-5">
          
          <!-- Section 1: Presets -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-yellow text-[16px]">tune</span>
                <span>PACE PROTOCOL PRESETS</span>
              </span>
              <span class="font-mono text-[11px] text-text-dim uppercase tracking-wider">SELECT FORMAT</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="preset-group">
              
              <!-- Preset 1: Quick -->
              <div
                id="card-quick"
                data-preset="quick"
                role="button"
                tabindex="0"
                class="preset-card p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                  isQuick
                    ? 'bg-tactical-card border-2 border-primary-yellow shadow-[0_0_15px_rgba(245,186,20,0.2)]'
                    : 'bg-tactical-navy border border-tactical-navy-light hover:bg-tactical-card hover:border-tactical-navy-light/80'
                }"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] ${isQuick ? 'text-primary-yellow' : 'text-text-dim'}">bolt</span>
                    <span class="font-display font-bold text-sm uppercase ${isQuick ? 'text-primary-yellow' : 'text-text-high'}">Quick</span>
                  </div>
                  <div class="w-5 h-5 rounded-full flex items-center justify-center ${isQuick ? 'bg-primary-yellow text-slate-950' : 'bg-tactical-base text-text-dim/40'}">
                    <span class="material-symbols-outlined text-[14px] font-bold">check</span>
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs font-mono pt-1 border-t border-tactical-navy-light/40">
                  <span class="text-text-dim">15m</span>
                  <span class="text-text-dim">4 PKMN</span>
                  <span class="${isQuick ? 'text-primary-yellow font-bold' : 'text-text-high'}">\$${isQuick ? settings.budget : 70}</span>
                </div>
              </div>

              <!-- Preset 2: Standard -->
              <div
                id="card-standard"
                data-preset="standard"
                role="button"
                tabindex="0"
                class="preset-card p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                  isStandard
                    ? 'bg-tactical-card border-2 border-primary-yellow shadow-[0_0_15px_rgba(245,186,20,0.2)]'
                    : 'bg-tactical-navy border border-tactical-navy-light hover:bg-tactical-card hover:border-tactical-navy-light/80'
                }"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] ${isStandard ? 'text-primary-yellow' : 'text-text-dim'}">timer</span>
                    <span class="font-display font-bold text-sm uppercase ${isStandard ? 'text-primary-yellow' : 'text-text-high'}">Standard</span>
                  </div>
                  <div class="w-5 h-5 rounded-full flex items-center justify-center ${isStandard ? 'bg-primary-yellow text-slate-950' : 'bg-tactical-base text-text-dim/40'}">
                    <span class="material-symbols-outlined text-[14px] font-bold">check</span>
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs font-mono pt-1 border-t border-tactical-navy-light/40">
                  <span class="text-text-dim">35m</span>
                  <span class="text-text-dim">6 PKMN</span>
                  <span class="${isStandard ? 'text-primary-yellow font-bold' : 'text-text-high'}">\$${isStandard ? settings.budget : 100}</span>
                </div>
              </div>

              <!-- Preset 3: Marathon -->
              <div
                id="card-marathon"
                data-preset="marathon"
                role="button"
                tabindex="0"
                class="preset-card p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                  isMarathon
                    ? 'bg-tactical-card border-2 border-primary-yellow shadow-[0_0_15px_rgba(245,186,20,0.2)]'
                    : 'bg-tactical-navy border border-tactical-navy-light hover:bg-tactical-card hover:border-tactical-navy-light/80'
                }"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] ${isMarathon ? 'text-primary-yellow' : 'text-text-dim'}">military_tech</span>
                    <span class="font-display font-bold text-sm uppercase ${isMarathon ? 'text-primary-yellow' : 'text-text-high'}">Marathon</span>
                  </div>
                  <div class="w-5 h-5 rounded-full flex items-center justify-center ${isMarathon ? 'bg-primary-yellow text-slate-950' : 'bg-tactical-base text-text-dim/40'}">
                    <span class="material-symbols-outlined text-[14px] font-bold">check</span>
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs font-mono pt-1 border-t border-tactical-navy-light/40">
                  <span class="text-text-dim">60m</span>
                  <span class="text-text-dim">10 PKMN</span>
                  <span class="${isMarathon ? 'text-primary-yellow font-bold' : 'text-text-high'}">\$${isMarathon ? settings.budget : 170}</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 2: Advanced Configuration Module (Collapsible Drawer) -->
          <div class="rounded-xl bg-tactical-navy border border-tactical-navy-light overflow-hidden shadow-xl">
            
            <!-- Drawer Toggle Bar -->
            <button
              id="btn-toggle-advanced"
              type="button"
              class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-tactical-card/60 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-tactical-base border border-tactical-navy-light flex items-center justify-center text-accent-cyan">
                  <span class="material-symbols-outlined text-[18px]">settings_suggest</span>
                </div>
                <div>
                  <span class="font-display font-bold text-sm uppercase tracking-wider text-text-high block leading-tight">ADVANCED PARAMETERS</span>
                  <span class="font-mono text-[11px] text-text-dim block">Filters, Reserve Timers & Overrides</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2 text-text-dim">
                <span class="font-mono text-xs uppercase tracking-wider text-accent-cyan font-bold" id="advanced-status-label">
                  ${isAdvancedOpen ? 'Close' : 'Adjust'}
                </span>
                <span class="material-symbols-outlined text-[20px] transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180 text-accent-cyan' : ''}" id="advanced-chevron">
                  expand_more
                </span>
              </div>
            </button>

            <!-- Collapsible Advanced Drawer Content -->
            <div class="${isAdvancedOpen ? 'flex' : 'hidden'} px-5 pb-5 flex-col gap-5 border-t border-tactical-navy-light/60 bg-tactical-base/40" id="advanced-drawer">
              
              <!-- Active Pool Scope & Counter Strip -->
              <div class="flex items-center justify-between bg-tactical-card border border-tactical-navy-light p-3.5 rounded-lg mt-3">
                <div class="flex flex-col">
                  <span class="font-mono text-[10px] uppercase tracking-wider text-text-dim">ACTIVE POOL SCOPE</span>
                  <span class="text-xs text-text-high font-mono font-bold" id="pool-summary-text">${poolSummaryText || 'Configured Generations'}</span>
                </div>
                <div class="flex items-center gap-2 bg-tactical-base px-3 py-1 rounded-full border border-tactical-navy-light">
                  <span class="w-2 h-2 rounded-full ${availablePoolCount >= 24 ? 'bg-status-success' : 'bg-status-danger'} animate-pulse"></span>
                  <span class="font-mono text-xs font-bold ${availablePoolCount >= 24 ? 'text-status-success' : 'text-status-danger'}" id="pool-counter">
                    ${availablePoolCount} available
                  </span>
                </div>
              </div>

              <!-- Generation Selector Chips -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[11px] uppercase tracking-wider text-text-dim">GENERATION SELECTOR</span>
                  <button id="btn-select-all-gens" type="button" class="text-xs text-accent-cyan hover:underline uppercase font-mono font-bold">
                    Select All
                  </button>
                </div>
                <div class="grid grid-cols-5 sm:grid-cols-9 gap-1.5" id="gen-chips-container">
                  ${gensList.map(g => {
                    const active = selectedGens.includes(g);
                    return `
                      <button
                        type="button"
                        class="chip-gen h-10 rounded-lg ${
                          active
                            ? 'bg-tactical-card border-2 border-primary-yellow text-primary-yellow font-bold shadow-sm'
                            : 'bg-tactical-navy border border-tactical-navy-light text-text-dim hover:text-text-high'
                        } font-mono text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                        data-gen="${g}"
                      >
                        <span>Gen ${g}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Famous Only Filter Switch -->
              <div class="flex items-center justify-between bg-tactical-card border border-tactical-navy-light p-3.5 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-primary-yellow/15 flex items-center justify-center text-primary-yellow">
                    <span class="material-symbols-outlined text-[18px]">star</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high">Famous Only</span>
                    <span class="text-[11px] text-text-dim font-body">Limit pool to iconic & fan favorites</span>
                  </div>
                </div>

                <button
                  id="chip-famous"
                  type="button"
                  class="h-9 px-4 rounded-full ${
                    famousMix
                      ? 'bg-primary-yellow text-slate-950 font-black shadow-[0_0_10px_rgba(245,186,20,0.3)]'
                      : 'bg-tactical-base border border-tactical-navy-light text-text-dim'
                  } font-mono text-xs uppercase flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <span class="material-symbols-outlined text-[16px]">${famousMix ? 'check' : 'remove'}</span>
                  <span>${famousMix ? 'Active' : 'Off'}</span>
                </button>
              </div>

              <!-- Numerical Parameters Grid with Lock Overrides -->
              <div class="flex flex-col gap-2 pt-1">
                <span class="font-mono text-[11px] uppercase tracking-wider text-text-dim">PARAMETRIC OVERRIDES & TIMERS</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <!-- Team Size -->
                  <div class="p-3 bg-tactical-card border border-tactical-navy-light rounded-lg flex flex-col gap-1">
                    <div class="flex items-center justify-between text-text-dim">
                      <span class="font-mono text-[11px] uppercase">Team Size</span>
                      <button
                        type="button"
                        aria-label="Toggle lock team size"
                        class="btn-lock p-1 rounded hover:bg-tactical-base ${locked.has('teamSize') ? 'text-primary-yellow font-bold' : 'text-text-dim'}"
                        data-field="teamSize"
                      >
                        <span class="material-symbols-outlined text-[15px]">${locked.has('teamSize') ? 'lock' : 'lock_open'}</span>
                      </button>
                    </div>
                    <div class="flex items-center">
                      <input
                        id="input-team-size"
                        type="number"
                        min="1"
                        max="12"
                        value="${settings.teamSize}"
                        class="w-full bg-transparent font-mono text-lg font-bold text-text-high focus:outline-none"
                      />
                    </div>
                  </div>

                  <!-- Budget -->
                  <div class="p-3 bg-tactical-card border border-tactical-navy-light rounded-lg flex flex-col gap-1">
                    <div class="flex items-center justify-between text-text-dim">
                      <span class="font-mono text-[11px] uppercase">Budget</span>
                      <button
                        type="button"
                        aria-label="Toggle lock budget"
                        class="btn-lock p-1 rounded hover:bg-tactical-base ${locked.has('budget') ? 'text-primary-yellow font-bold' : 'text-text-dim'}"
                        data-field="budget"
                      >
                        <span class="material-symbols-outlined text-[15px]">${locked.has('budget') ? 'lock' : 'lock_open'}</span>
                      </button>
                    </div>
                    <div class="flex items-center">
                      <span class="font-mono text-lg font-bold text-primary-yellow mr-1">\$</span>
                      <input
                        id="input-budget"
                        type="number"
                        min="10"
                        value="${settings.budget}"
                        class="w-full bg-transparent font-mono text-lg font-bold text-text-high focus:outline-none"
                      />
                    </div>
                  </div>

                  <!-- Starting Bid -->
                  <div class="p-3 bg-tactical-card border border-tactical-navy-light rounded-lg flex flex-col gap-1">
                    <div class="flex items-center justify-between text-text-dim">
                      <span class="font-mono text-[11px] uppercase">Starting Bid</span>
                      <button
                        type="button"
                        aria-label="Toggle lock starting bid"
                        class="btn-lock p-1 rounded hover:bg-tactical-base ${locked.has('startBid') ? 'text-primary-yellow font-bold' : 'text-text-dim'}"
                        data-field="startBid"
                      >
                        <span class="material-symbols-outlined text-[15px]">${locked.has('startBid') ? 'lock' : 'lock_open'}</span>
                      </button>
                    </div>
                    <div class="flex items-center">
                      <span class="font-mono text-lg font-bold text-primary-yellow mr-1">\$</span>
                      <input
                        id="input-start-bid"
                        type="number"
                        min="1"
                        value="${settings.startBid}"
                        class="w-full bg-transparent font-mono text-lg font-bold text-text-high focus:outline-none"
                      />
                    </div>
                  </div>

                  <!-- Bid Timer -->
                  <div class="p-3 bg-tactical-card border border-tactical-navy-light rounded-lg flex flex-col gap-1">
                    <div class="flex items-center justify-between text-text-dim">
                      <span class="font-mono text-[11px] uppercase">Bid Deliberation Timer</span>
                      <button
                        type="button"
                        aria-label="Toggle lock bid timer"
                        class="btn-lock p-1 rounded hover:bg-tactical-base ${locked.has('bidTimer') ? 'text-primary-yellow font-bold' : 'text-text-dim'}"
                        data-field="bidTimer"
                      >
                        <span class="material-symbols-outlined text-[15px]">${locked.has('bidTimer') ? 'lock' : 'lock_open'}</span>
                      </button>
                    </div>
                    <div class="flex items-center">
                      <input
                        id="input-bid-timer"
                        type="number"
                        min="3"
                        value="${settings.bidTimer}"
                        class="w-full bg-transparent font-mono text-lg font-bold text-text-high focus:outline-none"
                      />
                      <span class="font-mono text-sm text-text-dim ml-1">s</span>
                    </div>
                  </div>

                  <!-- Open Timer -->
                  <div class="p-3 bg-tactical-card border border-tactical-navy-light rounded-lg flex flex-col gap-1 sm:col-span-2">
                    <div class="flex items-center justify-between text-text-dim">
                      <span class="font-mono text-[11px] uppercase">Auction Lot Opening Timer</span>
                      <button
                        type="button"
                        aria-label="Toggle lock open timer"
                        class="btn-lock p-1 rounded hover:bg-tactical-base ${locked.has('openTimer') ? 'text-primary-yellow font-bold' : 'text-text-dim'}"
                        data-field="openTimer"
                      >
                        <span class="material-symbols-outlined text-[15px]">${locked.has('openTimer') ? 'lock' : 'lock_open'}</span>
                      </button>
                    </div>
                    <div class="flex items-center">
                      <input
                        id="input-open-timer"
                        type="number"
                        min="5"
                        value="${settings.openTimer || 18}"
                        class="w-full bg-transparent font-mono text-lg font-bold text-text-high focus:outline-none"
                      />
                      <span class="font-mono text-sm text-text-dim ml-1">s</span>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Battle Turn Timer Selector Chips -->
              <div class="p-3.5 bg-tactical-card border border-tactical-navy-light rounded-lg flex flex-col gap-2">
                <div class="flex items-center justify-between text-text-dim">
                  <span class="font-mono text-[11px] uppercase">Battle Turn Timer</span>
                  <button
                    type="button"
                    aria-label="Toggle lock battle turn timer"
                    class="btn-lock p-1 rounded hover:bg-tactical-base ${locked.has('battleTurnTimer') ? 'text-primary-yellow font-bold' : 'text-text-dim'}"
                    data-field="battleTurnTimer"
                  >
                    <span class="material-symbols-outlined text-[15px]">${locked.has('battleTurnTimer') ? 'lock' : 'lock_open'}</span>
                  </button>
                </div>
                <div class="grid grid-cols-5 gap-1.5" id="battle-timer-chips">
                  ${battleTimers.map(t => {
                    const active = currentBattleTimer === t;
                    return `
                      <button
                        type="button"
                        class="chip-battle-timer h-9 rounded-lg ${
                          active
                            ? 'bg-primary-yellow text-slate-950 font-black shadow-md'
                            : 'bg-tactical-base border border-tactical-navy-light text-text-dim hover:text-text-high'
                        } font-mono text-xs flex items-center justify-center transition-all active:scale-95"
                        data-timer="${t}"
                      >
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
            <div id="setup-error-banner" class="flex items-center gap-3 p-4 rounded-xl bg-status-danger/20 border border-status-danger text-status-danger shadow-lg">
              <span class="material-symbols-outlined text-[22px] shrink-0 text-status-danger">error</span>
              <div class="flex flex-col">
                <span class="font-display font-bold text-xs uppercase tracking-wider">Invalid Configuration</span>
                <span class="text-xs font-mono text-text-high mt-0.5" id="setup-error-text">${errorMessage}</span>
              </div>
            </div>
          ` : ''}

          <!-- Auto Balancing Telemetry Pill -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-tactical-navy border border-tactical-navy-light shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-tactical-card border border-tactical-navy-light flex items-center justify-center text-primary-yellow">
                <span class="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <div class="flex flex-col">
                <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high">Autonomous Role Balancer</span>
                <span class="font-mono text-[11px] text-text-dim">Guarantees all 5 core combat archetypes</span>
              </div>
            </div>
            <div class="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse shadow-[0_0_8px_#00e5a3]"></div>
          </div>

          <!-- Bottom Action: Create Match Button -->
          <div class="w-full pt-1">
            <button
              id="btn-create-match"
              type="button"
              class="w-full h-14 bg-primary-yellow hover:bg-primary-yellow-hover text-slate-950 rounded-xl font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(245,186,20,0.25)]"
            >
              <span class="material-symbols-outlined text-[24px] text-slate-950 font-bold">sports_esports</span>
              <span class="font-black text-slate-950">CREATE MATCH</span>
            </button>
          </div>

        </div>

        <!-- Right Column: Tactical Roster Radar & Intel Cockpit (lg:col-span-5, responsive on desktop 1280px) -->
        <div class="lg:col-span-5 flex flex-col gap-5">
          
          <div class="rounded-xl bg-tactical-navy border border-tactical-navy-light p-5 shadow-xl flex flex-col gap-4">
            
            <div class="flex items-center justify-between pb-3 border-b border-tactical-navy-light/60">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-yellow text-[20px]">analytics</span>
                <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high">TACTICAL ROSTER RADAR</span>
              </div>
              <span class="font-mono text-[10px] text-accent-cyan font-bold uppercase">META OU</span>
            </div>

            <!-- Pool Distribution Summary -->
            <div class="grid grid-cols-2 gap-2.5">
              <div class="p-3 rounded-lg bg-tactical-card border border-tactical-navy-light/80">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider block">ACTIVE POOL</span>
                <span class="font-mono font-bold text-xl text-primary-yellow block mt-0.5">${availablePoolCount}</span>
                <span class="font-body text-[11px] text-text-dim">Species available</span>
              </div>
              <div class="p-3 rounded-lg bg-tactical-card border border-tactical-navy-light/80">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider block">TEAM SLOTS</span>
                <span class="font-mono font-bold text-xl text-text-high block mt-0.5">${settings.teamSize}</span>
                <span class="font-body text-[11px] text-text-dim">Lots per trainer</span>
              </div>
              <div class="p-3 rounded-lg bg-tactical-card border border-tactical-navy-light/80">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider block">STARTING PURSE</span>
                <span class="font-mono font-bold text-xl text-status-success block mt-0.5">\$${settings.budget}</span>
                <span class="font-body text-[11px] text-text-dim">Starting budget</span>
              </div>
              <div class="p-3 rounded-lg bg-tactical-card border border-tactical-navy-light/80">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider block">MIN OPEN BID</span>
                <span class="font-mono font-bold text-xl text-accent-cyan block mt-0.5">\$${settings.startBid}</span>
                <span class="font-body text-[11px] text-text-dim">Base reserve</span>
              </div>
            </div>

            <!-- Core Combat Archetype Coverage Indicator -->
            <div class="flex flex-col gap-2 pt-2 border-t border-tactical-navy-light/60">
              <span class="font-mono text-[11px] uppercase tracking-wider text-text-dim">MANDATORY ROLE CHECK</span>
              <div class="grid grid-cols-5 gap-1.5 text-center">
                <div class="p-1.5 rounded bg-tactical-base border border-tactical-navy-light/80">
                  <span class="font-mono text-[9px] text-text-dim uppercase block">PHYS</span>
                  <span class="material-symbols-outlined text-primary-yellow text-[16px]">swords</span>
                </div>
                <div class="p-1.5 rounded bg-tactical-base border border-tactical-navy-light/80">
                  <span class="font-mono text-[9px] text-text-dim uppercase block">SPEC</span>
                  <span class="material-symbols-outlined text-accent-cyan text-[16px]">flare</span>
                </div>
                <div class="p-1.5 rounded bg-tactical-base border border-tactical-navy-light/80">
                  <span class="font-mono text-[9px] text-text-dim uppercase block">SPEED</span>
                  <span class="material-symbols-outlined text-status-success text-[16px]">bolt</span>
                </div>
                <div class="p-1.5 rounded bg-tactical-base border border-tactical-navy-light/80">
                  <span class="font-mono text-[9px] text-text-dim uppercase block">TANK</span>
                  <span class="material-symbols-outlined text-text-high text-[16px]">shield</span>
                </div>
                <div class="p-1.5 rounded bg-tactical-base border border-tactical-navy-light/80">
                  <span class="font-mono text-[9px] text-text-dim uppercase block">SUPP</span>
                  <span class="material-symbols-outlined text-primary-yellow text-[16px]">all_inclusive</span>
                </div>
              </div>
              <p class="font-body text-[11px] text-text-dim leading-snug mt-1">
                The referee automatically ensures enough species of each archetype exist to supply every participant.
              </p>
            </div>

            <!-- Rules Summary -->
            <div class="p-3 rounded-lg bg-tactical-base/70 border border-tactical-navy-light/60 flex flex-col gap-1 text-xs font-mono text-text-dim">
              <span class="text-text-high font-bold uppercase">BUDGET RESERVE RULE:</span>
              <p class="text-[11px] leading-relaxed">
                Max bid = <span class="text-primary-yellow">Purse - (Empty Slots - 1) * \$${settings.startBid}</span>. Bids that starve remaining squad requirements are rejected.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}
