/**
 * Lobby Screen
 * Visual source: design-v2/host_lobby_phone/code.html & design-v2/host_lobby_desktop_1280px/code.html
 * Tactical Arena & Draft Terminal theme
 */

export function renderLobbyScreen({ matchState, copied = false, isHost = true }) {
  const room = matchState.room || 'POKE01';
  const players = matchState.players || [];
  const totalSlots = players.length;
  const settings = matchState.settings || {};

  const presetName = settings.preset ? (settings.preset.charAt(0).toUpperCase() + settings.preset.slice(1)) : 'Standard';
  const genScopeText = settings.famousMix
    ? 'Famous Only'
    : (settings.generations?.length === 9 ? 'All Gens (1-9)' : `Gen ${settings.generations?.join(',')}`);

  return `
    <div class="flex flex-col w-full py-4 sm:py-6 lg:py-8">
      
      <!-- Top Tactical Header / Sub-HUD -->
      <div class="flex items-center justify-between pb-5 mb-6 border-b border-tactical-navy-light/60">
        <div class="flex items-center gap-3">
          <button
            id="btn-lobby-back"
            type="button"
            aria-label="Back to Terminal"
            class="w-10 h-10 rounded-lg bg-tactical-navy hover:bg-tactical-navy-light border border-tactical-navy-light text-text-dim hover:text-text-high flex items-center justify-center transition-all active:scale-95"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex flex-col">
            <span class="font-mono text-[10px] text-primary-yellow font-bold uppercase tracking-widest leading-none">ARENA PRE-DRAFT</span>
            <h1 class="font-display font-bold text-xl uppercase tracking-wider text-text-high mt-1">
              ${isHost ? 'HOST COMMAND LOBBY' : 'GUEST PARTICIPANT LOBBY'}
            </h1>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-tactical-navy px-3 py-1.5 rounded-lg border border-tactical-navy-light">
            <span class="w-2 h-2 rounded-full bg-status-success animate-pulse shadow-[0_0_8px_#00e5a3]"></span>
            <span class="font-mono text-xs font-bold text-status-success uppercase tracking-wider">P2P SYNCHRONIZED</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-tactical-navy border border-tactical-navy-light flex items-center justify-center text-primary-yellow">
            <span class="material-symbols-outlined text-[20px]">${isHost ? 'cell_tower' : 'gavel'}</span>
          </div>
        </div>
      </div>

      <!-- Main Layout: 1 Column on Mobile (<1024px), 2 Columns on Desktop (1280px) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        <!-- Left Column: Room Code Card, Squad Roster, Start Action (lg:col-span-7) -->
        <div class="lg:col-span-7 flex flex-col gap-5">
          
          <!-- Broadcast Room Card -->
          <div class="relative bg-tactical-navy border border-tactical-navy-light rounded-xl p-5 shadow-xl flex flex-col items-center justify-center text-center overflow-hidden">
            <div class="absolute -right-12 -top-12 w-32 h-32 bg-primary-yellow/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
              <span class="font-mono text-[11px] uppercase tracking-widest text-accent-cyan font-bold">BROADCAST ROOM CODE</span>
            </div>

            <!-- Big High-Voltage Room Code -->
            <div
              id="roomCode"
              class="font-display text-4xl sm:text-5xl tracking-widest text-primary-yellow uppercase select-all my-2 font-bold drop-shadow-[0_0_15px_rgba(255,224,51,0.3)]"
            >
              ${escapeHtml(room)}
            </div>

            <!-- Quick Action Controls -->
            <div class="grid grid-cols-2 gap-3 w-full max-w-sm mt-3">
              <button
                id="copyBtn"
                type="button"
                aria-label="Copy Room Code"
                class="h-11 flex items-center justify-center gap-2 rounded-lg bg-tactical-card hover:bg-tactical-navy-light border border-tactical-navy-light text-text-high hover:text-primary-yellow active:scale-95 transition-all font-mono text-xs font-bold uppercase shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]" id="copyIcon">${copied ? 'check' : 'content_copy'}</span>
                <span>Copy Code</span>
              </button>

              <button
                id="btn-share-room"
                type="button"
                aria-label="Share Room Link"
                onclick="if(navigator.share){navigator.share({title:'Join Pokemon Draft Arena',url:window.location.href}).catch(()=>{})}else{navigator.clipboard?.writeText(window.location.href)}"
                class="h-11 flex items-center justify-center gap-2 rounded-lg bg-tactical-card hover:bg-tactical-navy-light border border-tactical-navy-light text-text-high hover:text-accent-cyan active:scale-95 transition-all font-mono text-xs font-bold uppercase shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]">share</span>
                <span>Share Link</span>
              </button>
            </div>
          </div>

          <!-- Arena Rules Quick-Filter Chips -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
            <div class="shrink-0 px-3 py-1.5 rounded-lg bg-tactical-card border border-tactical-navy-light text-text-high flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px] text-primary-yellow">timer</span>
              <span>${presetName} Pace</span>
            </div>
            <div class="shrink-0 px-3 py-1.5 rounded-lg bg-tactical-card border border-tactical-navy-light text-text-high flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px] text-accent-cyan">catching_pokemon</span>
              <span>${settings.teamSize || 4} PKMN</span>
            </div>
            <div class="shrink-0 px-3 py-1.5 rounded-lg bg-tactical-card border border-tactical-navy-light text-text-high flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px] text-status-success">payments</span>
              <span>\$${settings.budget || 100} Cap</span>
            </div>
            <div class="shrink-0 px-3 py-1.5 rounded-lg bg-tactical-card border border-tactical-navy-light text-text-high flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px] text-text-dim">speed</span>
              <span>${settings.bidTimer || 10}s Bids</span>
            </div>
            <div class="shrink-0 px-3 py-1.5 rounded-lg bg-tactical-card border border-tactical-navy-light text-text-high flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px] text-primary-yellow">layers</span>
              <span>${genScopeText}</span>
            </div>
          </div>

          <!-- Live Roster Management Stack -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between px-1">
              <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high flex items-center gap-2">
                <span class="material-symbols-outlined text-accent-cyan text-[16px]">groups</span>
                <span>WAR ROOM SQUAD (${players.length} / ${totalSlots})</span>
              </span>
              <span class="font-mono text-[11px] text-status-success font-bold flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                <span>ALL SYSTEMS READY</span>
              </span>
            </div>

            <!-- Player Grid -->
            <div class="flex flex-col gap-2.5">
              ${players.map((p, index) => {
                const isHostPlayer = index === 0 || p.isHost;
                const avatarUrl = isHostPlayer
                  ? './assets/trainers/red.svg'
                  : './assets/trainers/blue.svg';

                return `
                  <div class="bg-tactical-card border border-tactical-navy-light rounded-xl p-3.5 flex items-center justify-between shadow-md">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="relative w-12 h-12 rounded-lg bg-tactical-base border border-tactical-navy-light flex items-center justify-center shrink-0 overflow-hidden p-1">
                        <img class="w-full h-full object-contain" src="${avatarUrl}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                        <div class="absolute bottom-0.5 right-0.5 w-3 h-3 bg-tactical-base rounded-full flex items-center justify-center">
                          <span class="w-2 h-2 rounded-full bg-status-success shadow-[0_0_6px_#00e5a3]"></span>
                        </div>
                      </div>

                      <div class="flex flex-col min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-display font-bold text-sm text-text-high tracking-tight truncate">${escapeHtml(p.name)}</span>
                          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isHostPlayer
                              ? 'bg-primary-yellow text-slate-950 font-bold'
                              : 'bg-tactical-base border border-tactical-navy-light text-accent-cyan'
                          }">
                            ${isHostPlayer ? 'HOST' : (p.isBot ? 'BOT' : 'CHALLENGER')}
                          </span>
                        </div>
                        <span class="font-mono text-xs text-text-dim flex items-center gap-1 mt-0.5">
                          ${isHostPlayer ? 'Terminal Alpha · Commander' : (p.isBot ? 'DexBot Autonomous Engine' : 'Guest Peer Connected')}
                        </span>
                      </div>
                    </div>

                    <div class="px-3 py-1 rounded-lg bg-tactical-base border border-tactical-navy-light text-status-success font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span class="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Ready</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Primary Action Button: Start Auction (Host) / Waiting (Guest) -->
          <div class="w-full pt-2">
            ${isHost ? `
              <button
                id="btn-start-auction"
                type="button"
                class="w-full h-14 bg-primary-yellow hover:bg-primary-yellow-hover text-slate-950 rounded-xl font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(245,186,20,0.25)]"
              >
                <span class="material-symbols-outlined text-[24px] text-slate-950 font-bold">gavel</span>
                <span class="font-black text-slate-950">START AUCTION DRAFT</span>
              </button>
            ` : `
              <button
                disabled
                type="button"
                class="w-full h-14 bg-tactical-navy border border-tactical-navy-light text-text-dim rounded-xl font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
              >
                <span class="material-symbols-outlined text-[24px] animate-spin text-accent-cyan">sync</span>
                <span>WAITING FOR HOST TO START...</span>
              </button>
            `}
          </div>

        </div>

        <!-- Right Column: Match Settings Terminal & Rules Briefing (lg:col-span-5, responsive on desktop 1280px) -->
        <div class="lg:col-span-5 flex flex-col gap-5">
          
          <!-- Match Settings Summary Box -->
          <div class="rounded-xl bg-tactical-navy border border-tactical-navy-light p-5 shadow-xl flex flex-col gap-4" id="lobby-settings-summary">
            
            <div class="flex items-center justify-between pb-3 border-b border-tactical-navy-light/60">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-yellow text-[20px]">tune</span>
                <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high">MATCH SETTINGS</span>
              </div>
              <span class="font-mono text-xs text-primary-yellow font-bold uppercase">${presetName} Mode</span>
            </div>

            <!-- 3 Stat Blocks -->
            <div class="grid grid-cols-3 gap-2.5 text-center">
              <div class="bg-tactical-card border border-tactical-navy-light p-3 rounded-lg">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider block">BUDGET</span>
                <span class="font-mono font-bold text-lg text-primary-yellow block mt-0.5">\$${settings.budget}</span>
              </div>
              <div class="bg-tactical-card border border-tactical-navy-light p-3 rounded-lg">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider block">SQUAD</span>
                <span class="font-mono font-bold text-lg text-text-high block mt-0.5">${settings.teamSize} PKMN</span>
              </div>
              <div class="bg-tactical-card border border-tactical-navy-light p-3 rounded-lg">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider block">START BID</span>
                <span class="font-mono font-bold text-lg text-accent-cyan block mt-0.5">\$${settings.startBid}</span>
              </div>
            </div>

            <!-- Deliberation Timers & Pool Scope Sub-strip -->
            <div class="flex flex-col gap-2 p-3 bg-tactical-base/80 border border-tactical-navy-light rounded-lg text-xs font-mono">
              <div class="flex items-center justify-between text-text-dim">
                <span>Lot Open Timer:</span>
                <span class="text-text-high font-bold">${settings.openTimer || 18}s</span>
              </div>
              <div class="flex items-center justify-between text-text-dim">
                <span>Bid Deliberation:</span>
                <span class="text-text-high font-bold">${settings.bidTimer || 10}s</span>
              </div>
              <div class="flex items-center justify-between text-text-dim">
                <span>Battle Turn Deliberation:</span>
                <span class="text-text-high font-bold">${settings.battleTurnTimer || 30}s</span>
              </div>
              <div class="flex items-center justify-between text-text-dim pt-1 border-t border-tactical-navy-light/60">
                <span>Species Scope:</span>
                <span class="text-primary-yellow font-bold">${genScopeText}</span>
              </div>
            </div>

            <!-- Auction Rules Briefing -->
            <div class="p-3 rounded-lg bg-tactical-card/70 border border-tactical-navy-light/60 flex flex-col gap-1.5 text-xs font-mono text-text-dim">
              <div class="flex items-center gap-1.5 text-text-high font-bold uppercase">
                <span class="material-symbols-outlined text-primary-yellow text-[16px]">info</span>
                <span>AUCTION PROTOCOL RULES</span>
              </div>
              <ul class="list-disc list-inside space-y-1 text-[11px] leading-relaxed pt-1">
                <li>Every lot begins at starting bid \$${settings.startBid}.</li>
                <li>Bidding resets timer to ${settings.bidTimer}s.</li>
                <li>Budget reserve rule prevents bids that starve remaining slots.</li>
                <li>Unsold lots route to discounted accelerated round.</li>
              </ul>
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
