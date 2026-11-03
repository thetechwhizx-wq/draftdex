/**
 * Home / Terminal Hub Screen
 * Visual source: design-v2/home_phone/code.html & design-v2/home_desktop_1280px/code.html
 * Tactical Arena & Draft Terminal theme
 */

export function renderHomeScreen({ savedMatch, errorNotice, onNewMatch, onResumeMatch, onJoinRoom }) {
  const hasSaved = !!savedMatch;
  const roomCode = savedMatch?.room || '';
  const currentSet = (savedMatch?.currentSetIndex || 0) + 1;
  const currentLot = (savedMatch?.currentLotIndex || 0) + 1;
  const teamSize = savedMatch?.settings?.teamSize || 4;
  const userPurchases = savedMatch?.userPurchases?.length || 0;
  const userBudget = savedMatch?.userBudget ?? (savedMatch?.settings?.budget || 100);
  const totalBudget = savedMatch?.settings?.budget || 100;

  return `
    <div class="flex flex-col w-full py-4 sm:py-6 lg:py-8">
      ${errorNotice ? `
        <div class="mb-6 p-4 rounded-xl bg-status-danger/15 border border-status-danger/40 flex items-center gap-3 text-status-danger">
          <span class="material-symbols-outlined text-[22px] shrink-0">warning</span>
          <span class="font-body text-sm font-medium">${escapeHtml(errorNotice)}</span>
        </div>
      ` : ''}

      <!-- Top Tactical Header / PDA HUD -->
      <div class="flex items-center justify-between pb-6 mb-6 border-b border-tactical-navy-light/60">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary-yellow flex items-center justify-center text-tactical-navy shadow-[0_0_15px_rgba(255,224,51,0.3)]">
            <span class="material-symbols-outlined text-[24px] font-bold">sports_esports</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-display font-bold text-lg uppercase tracking-wider text-text-high">DRAFT ARENA</span>
              <span class="px-2 py-0.5 rounded bg-primary-yellow/15 border border-primary-yellow/40 text-primary-yellow font-display font-semibold text-[10px] tracking-widest uppercase">WAR-ROOM V2.4</span>
            </div>
            <span class="font-mono text-[11px] text-text-dim tracking-wider uppercase block">TACTICAL AUCTION TERMINAL</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="px-3 py-1 rounded-full bg-tactical-navy-light/80 border border-tactical-navy-light flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            <span class="font-mono text-[11px] font-bold text-status-success uppercase tracking-wider">SYNC READY</span>
          </div>
          <a href="#/styleguide" id="link-styleguide" class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-tactical-navy hover:bg-tactical-navy-light border border-tactical-navy-light text-text-dim hover:text-primary-yellow font-mono text-xs transition-colors">
            <span class="material-symbols-outlined text-[16px]">palette</span>
            <span>Style Guide</span>
          </a>
        </div>
      </div>

      <!-- Main Layout: 1 Column on Mobile, 2 Columns on Desktop (1280px) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        <!-- Left Column: Access Controls & Session Actions (col-span-5 on desktop) -->
        <div class="lg:col-span-5 flex flex-col gap-5">
          
          <!-- Card 1: WAR-ROOM ACCESS (Join Room) -->
          <div class="relative w-full overflow-hidden rounded-xl bg-tactical-card border border-tactical-navy-light p-5 shadow-xl">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-primary-yellow animate-ping"></span>
                <span class="font-display font-bold text-sm uppercase tracking-wider text-primary-yellow">WAR-ROOM ACCESS</span>
              </div>
              <span class="font-mono text-[11px] uppercase tracking-widest text-text-dim">SECURE P2P LINK</span>
            </div>

            <div class="flex flex-col gap-3">
              <div class="relative flex items-center bg-tactical-base border border-tactical-navy-light/80 rounded-lg px-3 h-14">
                <span class="material-symbols-outlined text-text-dim mr-2 text-[20px]">tag</span>
                <input
                  id="room-code-input"
                  type="text"
                  maxlength="6"
                  placeholder="ENTER CODE"
                  spellcheck="false"
                  autocomplete="off"
                  autocapitalize="characters"
                  class="w-full bg-transparent text-text-high font-mono text-lg font-bold uppercase tracking-widest placeholder:text-text-dim/40 focus:outline-none"
                />
                <button
                  id="paste-code-btn"
                  type="button"
                  title="Paste Code"
                  class="p-2 text-text-dim hover:text-primary-yellow hover:bg-tactical-navy rounded transition-colors"
                >
                  <span class="material-symbols-outlined text-[20px]">content_paste</span>
                </button>
              </div>

              <button
                id="btn-join-room"
                type="button"
                class="w-full h-14 rounded-lg bg-tactical-navy border border-tactical-navy-light text-text-dim font-display font-bold text-base tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md"
              >
                <span>JOIN ARENA</span>
                <span class="material-symbols-outlined text-[22px]">login</span>
              </button>
            </div>
          </div>

          <!-- Card 2: NEW MATCH BUTTON -->
          <div class="w-full">
            <button
              id="btn-new-match"
              type="button"
              class="w-full h-16 rounded-xl bg-primary-yellow hover:bg-primary-yellow-hover text-tactical-navy font-display font-bold text-base uppercase tracking-wider transition-all flex items-center justify-between px-5 shadow-[0_0_20px_rgba(255,224,51,0.25)] active:scale-[0.98]"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-tactical-navy/15 flex items-center justify-center text-tactical-navy">
                  <span class="material-symbols-outlined text-[24px]">add_circle</span>
                </div>
                <span>NEW MATCH</span>
              </div>
              <span class="material-symbols-outlined text-[26px]">arrow_forward</span>
            </button>
          </div>

          <!-- Card 3: ACTIVE DRAFT SESSION (Resume Card if saved session exists) -->
          ${hasSaved ? `
            <div
              id="btn-resume-match"
              role="button"
              tabindex="0"
              class="w-full bg-tactical-card hover:bg-tactical-card-hover border border-tactical-navy-light rounded-xl p-5 flex flex-col gap-3 cursor-pointer transition-all shadow-xl active:scale-[0.99] group"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-status-success"></span>
                  <span class="font-mono text-[11px] font-bold text-status-success uppercase tracking-wider">ACTIVE DRAFT SESSION</span>
                </div>
                <span class="font-mono text-xs text-text-dim uppercase tracking-wider font-bold">#${escapeHtml(roomCode)}</span>
              </div>

              <div class="flex items-center justify-between pt-1">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-display font-bold text-lg text-text-high tracking-wide">SET ${currentSet}</span>
                    <span class="px-2 py-0.5 rounded bg-tactical-base border border-primary-yellow/30 text-primary-yellow font-mono text-xs font-bold">
                      LOT ${currentLot}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 mt-1.5 text-text-dim text-xs font-mono">
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-[15px] text-primary-yellow">monetization_on</span>
                      CAP: \$${userBudget} / \$${totalBudget}
                    </span>
                    <span class="text-text-dim/40">•</span>
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-[15px] text-accent-cyan">catching_pokemon</span>
                      ${userPurchases}/${teamSize} PKMN
                    </span>
                  </div>
                </div>

                <div class="w-10 h-10 rounded-lg bg-tactical-base border border-tactical-navy-light flex items-center justify-center text-primary-yellow group-hover:translate-x-1 transition-transform">
                  <span class="material-symbols-outlined text-[24px]">play_arrow</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Footer Actions: Reset Data & Mobile Style Guide Link -->
          <div class="flex flex-col items-center gap-2 pt-2">
            <button
              id="btn-clear-data"
              type="button"
              class="font-mono text-xs text-text-dim hover:text-status-danger transition-colors uppercase tracking-wider flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-tactical-card/50"
            >
              <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Reset saved data</span>
            </button>

            <a href="#/styleguide" class="sm:hidden font-mono text-xs text-text-dim hover:text-primary-yellow transition-colors uppercase tracking-wider pt-1">
              Design System Style Guide →
            </a>
          </div>

        </div>

        <!-- Right Column: Tactical Radar & Match Intel Cockpit (Visible on lg / 1280px, responsive) -->
        <div class="lg:col-span-7 flex flex-col gap-5">
          
          <!-- Terminal Overview Hero Panel -->
          <div class="rounded-xl bg-tactical-navy border border-tactical-navy-light p-6 shadow-xl relative overflow-hidden">
            <div class="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-primary-yellow/5 blur-3xl pointer-events-none"></div>

            <div class="flex items-center justify-between pb-4 border-b border-tactical-navy-light/60 mb-5">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary-yellow text-[22px]">radar</span>
                <span class="font-display font-bold text-sm uppercase tracking-wider text-text-high">TACTICAL SPECIFICATIONS</span>
              </div>
              <span class="font-mono text-[11px] text-accent-cyan font-semibold uppercase">SPEC // 2026 REVISION</span>
            </div>

            <!-- 3 Feature Chips -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div class="p-3.5 rounded-lg bg-tactical-card border border-tactical-navy-light/80 flex flex-col gap-1">
                <span class="font-mono text-[11px] text-text-dim uppercase tracking-wider">ROSTER POOL</span>
                <span class="font-display font-bold text-xl text-primary-yellow">1,025</span>
                <span class="font-body text-xs text-text-dim">Gens 1–9 Complete</span>
              </div>
              <div class="p-3.5 rounded-lg bg-tactical-card border border-tactical-navy-light/80 flex flex-col gap-1">
                <span class="font-mono text-[11px] text-text-dim uppercase tracking-wider">MATCH FORMAT</span>
                <span class="font-display font-bold text-xl text-text-high">6 v 6</span>
                <span class="font-body text-xs text-text-dim">Live Auction & Battle</span>
              </div>
              <div class="p-3.5 rounded-lg bg-tactical-card border border-tactical-navy-light/80 flex flex-col gap-1">
                <span class="font-mono text-[11px] text-text-dim uppercase tracking-wider">NETWORKING</span>
                <span class="font-display font-bold text-xl text-status-success">P2P</span>
                <span class="font-body text-xs text-text-dim">Zero Server Relay</span>
              </div>
            </div>

            <!-- Quick Preset Intel Matrix -->
            <div class="flex flex-col gap-2.5">
              <span class="font-mono text-xs font-bold text-text-high uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary-yellow text-[16px]">tune</span>
                CONFIG PRESETS OVERVIEW
              </span>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div class="p-3 rounded-lg bg-tactical-base/80 border border-tactical-navy-light/60">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-display font-bold text-sm text-text-high">Quick</span>
                    <span class="font-mono text-[10px] text-primary-yellow font-bold uppercase">10m</span>
                  </div>
                  <p class="font-body text-xs text-text-dim leading-snug">3 lots/trainer, fast 8s timer, rapid skirmish draft.</p>
                </div>

                <div class="p-3 rounded-lg bg-tactical-base/80 border border-tactical-navy-light/60">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-display font-bold text-sm text-text-high">Standard</span>
                    <span class="font-mono text-[10px] text-accent-cyan font-bold uppercase">25m</span>
                  </div>
                  <p class="font-body text-xs text-text-dim leading-snug">6 lots/trainer, full team building with 15s deliberation.</p>
                </div>

                <div class="p-3 rounded-lg bg-tactical-base/80 border border-tactical-navy-light/60">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-display font-bold text-sm text-text-high">Marathon</span>
                    <span class="font-mono text-[10px] text-text-dim font-bold uppercase">45m</span>
                  </div>
                  <p class="font-body text-xs text-text-dim leading-snug">10 lots/trainer, deep bench strategy, 25s timers.</p>
                </div>
              </div>
            </div>

            <!-- Terminal Shortcuts -->
            <div class="mt-5 pt-4 border-t border-tactical-navy-light/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-text-dim">
              <span class="flex items-center gap-1.5">
                <kbd class="px-1.5 py-0.5 rounded bg-tactical-base border border-tactical-navy-light text-text-high font-bold">Tab</kbd>
                <span>Navigate</span>
              </span>
              <span class="flex items-center gap-1.5">
                <kbd class="px-1.5 py-0.5 rounded bg-tactical-base border border-tactical-navy-light text-text-high font-bold">Enter</kbd>
                <span>Confirm</span>
              </span>
              <span class="flex items-center gap-1.5">
                <kbd class="px-1.5 py-0.5 rounded bg-tactical-base border border-tactical-navy-light text-text-high font-bold">B</kbd>
                <span>Bid</span>
              </span>
              <span class="flex items-center gap-1.5">
                <kbd class="px-1.5 py-0.5 rounded bg-tactical-base border border-tactical-navy-light text-text-high font-bold">P</kbd>
                <span>Pass</span>
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
