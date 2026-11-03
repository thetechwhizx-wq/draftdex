/**
 * Auction Room Screen
 * Visual source: design-v2/auction_room_phone/code.html & design-v2/auction_room_desktop_1280px/code.html
 * Tactical Arena & Draft Terminal theme
 */

import { getNextMinimumBid, validateBid, getMinIncrement } from '../../engine/auction.js';
import { POKEMON_TYPES, getTypeEffectiveness } from '../../engine/types.js';

// 18-Type styling map matching Tactical Arena design tokens
const TYPE_STYLES = {
  normal:   { bg: 'bg-[#9FA19F]/20', text: 'text-[#9FA19F]', border: 'border-[#9FA19F]/40' },
  fire:     { bg: 'bg-type-fire/20', text: 'text-type-fire', border: 'border-type-fire/40' },
  water:    { bg: 'bg-type-water/20', text: 'text-type-water', border: 'border-type-water/40' },
  grass:    { bg: 'bg-type-grass/20', text: 'text-type-grass', border: 'border-type-grass/40' },
  electric: { bg: 'bg-type-electric/20', text: 'text-type-electric', border: 'border-type-electric/40' },
  ice:      { bg: 'bg-type-ice/20', text: 'text-type-ice', border: 'border-type-ice/40' },
  fighting: { bg: 'bg-type-fighting/20', text: 'text-type-fighting', border: 'border-type-fighting/40' },
  poison:   { bg: 'bg-type-poison/20', text: 'text-type-poison', border: 'border-type-poison/40' },
  ground:   { bg: 'bg-type-ground/20', text: 'text-type-ground', border: 'border-type-ground/40' },
  flying:   { bg: 'bg-type-flying/20', text: 'text-type-flying', border: 'border-type-flying/40' },
  psychic:  { bg: 'bg-type-psychic/20', text: 'text-type-psychic', border: 'border-type-psychic/40' },
  bug:      { bg: 'bg-type-bug/20', text: 'text-type-bug', border: 'border-type-bug/40' },
  rock:     { bg: 'bg-type-rock/20', text: 'text-type-rock', border: 'border-type-rock/40' },
  ghost:    { bg: 'bg-type-ghost/20', text: 'text-type-ghost', border: 'border-type-ghost/40' },
  dragon:   { bg: 'bg-type-dragon/20', text: 'text-type-dragon', border: 'border-type-dragon/40' },
  steel:    { bg: 'bg-type-steel/20', text: 'text-type-steel', border: 'border-type-steel/40' },
  dark:     { bg: 'bg-type-dark/20', text: 'text-type-dark', border: 'border-type-dark/40' },
  fairy:    { bg: 'bg-type-fairy/20', text: 'text-type-fairy', border: 'border-type-fairy/40' }
};

export function renderAuctionScreen({ matchState, currentTimerSeconds = 10, totalTimerSeconds = 18, userPlayerId = 'human' }) {
  const lot = matchState.currentLot;
  if (!lot || !lot.pokemon) {
    return `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div class="w-16 h-16 rounded-xl bg-tactical-navy border border-tactical-navy-light flex items-center justify-center text-primary-yellow mb-4 animate-spin">
          <span class="material-symbols-outlined text-[32px]">sync</span>
        </div>
        <h2 class="font-display font-bold text-xl uppercase tracking-wider text-text-high">Loading Next Lot...</h2>
      </div>
    `;
  }

  const p = lot.pokemon;
  const currentSet = matchState.sets[matchState.currentSetIndex] || { name: 'Main Pool', lots: [] };
  const setLotsCount = currentSet.lots?.length || 1;
  const lotIndexInSet = matchState.currentLotIndex + 1;

  // Active user data
  const user = matchState.players.find(x => x.id === userPlayerId) || matchState.players[0];
  const userTeamCount = user?.team?.length || 0;
  const userPurse = user?.budget ?? 0;
  const teamCap = matchState.settings.teamSize || 4;
  const emptySlots = Math.max(0, teamCap - userTeamCount);
  const minReservePerSlot = matchState.settings.startBid || 10;
  const maxAllowedBid = Math.max(0, userPurse - Math.max(0, emptySlots - 1) * minReservePerSlot);

  // Minimum required bid for the active lot
  const minRequired = getNextMinimumBid(matchState);
  const inc = getMinIncrement(lot.currentBid || 0, matchState.settings.minIncrement);
  const jumpBid = minRequired + 3;

  // Validate bids against referee & budget reserve rule
  const valMin = validateBid(matchState, user.id, minRequired);
  const valJump = validateBid(matchState, user.id, jumpBid);

  // Leader info
  const leader = matchState.players.find(x => x.id === lot.leaderId);
  const isUserLeading = lot.leaderId === user.id;
  const hasUserPassed = matchState.passSet?.has(user.id);

  // Timer calculations
  const clampedTimer = Math.max(0, currentTimerSeconds);
  const isUrgent = clampedTimer <= 5;
  const circumference = 188.5; // 2 * PI * 30
  const progressRatio = totalTimerSeconds > 0 ? (clampedTimer / totalTimerSeconds) : 0;
  const dashoffset = circumference * (1 - progressRatio);

  // Artwork image fallback
  const artworkUrl = `./assets/sprites/artwork/${p.id}.png`;

  // Compute Defensive Profile from Type Chart
  const defensiveProfile = computeDefensiveProfile(p.types);

  // Upcoming lots in current set
  const upcomingLots = (currentSet.lots || []).slice(lotIndexInSet, lotIndexInSet + 3);

  // Bid history (last 5 bids)
  const bidHistory = lot.bidHistory || [];
  const recentBids = bidHistory.slice(-5).reverse();

  return `
    <div class="flex flex-col w-full py-4 sm:py-6 lg:py-8">
      
      <!-- Top Tactical Header / Sub-HUD -->
      <div class="flex items-center justify-between pb-5 mb-5 border-b border-tactical-navy-light/60">
        <div class="flex items-center gap-3">
          <button
            id="btn-auction-back"
            type="button"
            aria-label="Back to Terminal"
            class="w-10 h-10 rounded-lg bg-tactical-navy hover:bg-tactical-navy-light border border-tactical-navy-light text-text-dim hover:text-text-high flex items-center justify-center transition-all active:scale-95"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-status-danger animate-ping"></span>
              <span class="font-mono text-[10px] text-status-danger font-bold uppercase tracking-widest leading-none">LIVE ARENA AUCTION</span>
            </div>
            <h1 class="font-display font-bold text-xl uppercase tracking-wider text-text-high mt-1">AUCTION ROOM</h1>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-2 bg-tactical-navy px-3 py-1.5 rounded-lg border border-tactical-navy-light">
            <span class="font-mono text-xs text-text-dim uppercase">ROOM:</span>
            <span class="font-mono text-xs font-bold text-primary-yellow uppercase tracking-wider">${escapeHtml(matchState.room)}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-tactical-navy border border-tactical-navy-light flex items-center justify-center text-primary-yellow">
            <span class="material-symbols-outlined text-[20px]">gavel</span>
          </div>
        </div>
      </div>

      <!-- Top Telemetry & Scope Strip -->
      <div class="bg-tactical-navy border border-tactical-navy-light p-3 rounded-xl mb-5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md" id="auction-settings-summary">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-tactical-card border border-primary-yellow/40 text-primary-yellow font-bold uppercase">
            ${escapeHtml(currentSet.name)}
          </span>
          <span class="text-text-dim">•</span>
          <span class="text-text-high font-bold">LOT ${lotIndexInSet} / ${setLotsCount}</span>
        </div>

        <div class="flex items-center gap-4 text-text-dim">
          <span>Clock: <strong class="text-text-high">${matchState.settings.bidTimer}s</strong></span>
          <span>Starting Purse: <strong class="text-status-success">\$${matchState.settings.budget}</strong></span>
          <span class="flex items-center gap-1.5 text-status-success">
            <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            <span>SYNCED</span>
          </span>
        </div>
      </div>

      <!-- Main Responsive Grid: 1 Column on Mobile, 3 Panels on Desktop (1280px) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT PANEL (Desktop): Franchise Managers Dossier (col-span-3) -->
        <div class="lg:col-span-3 hidden lg:flex flex-col gap-4">
          <div class="bg-tactical-navy border border-tactical-navy-light rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div class="flex items-center justify-between pb-2 border-b border-tactical-navy-light/60">
              <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary-yellow text-[16px]">group</span>
                <span>FRANCHISE MANAGERS</span>
              </span>
              <span class="font-mono text-[10px] text-accent-cyan font-bold">${matchState.players.length} Active</span>
            </div>

            <div class="flex flex-col gap-2.5">
              ${matchState.players.map(pl => {
                const isLeader = lot.leaderId === pl.id;
                const plPurse = pl.budget ?? 0;
                const plTeamCount = pl.team?.length || 0;
                const budgetPct = Math.round((plPurse / matchState.settings.budget) * 100);

                return `
                  <div class="p-2.5 rounded-lg ${isLeader ? 'bg-tactical-card border border-primary-yellow/60' : 'bg-tactical-base/80 border border-tactical-navy-light/60'} flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="w-2 h-2 rounded-full ${isLeader ? 'bg-primary-yellow animate-pulse' : 'bg-status-success'}"></span>
                        <span class="font-display font-bold text-xs truncate ${isLeader ? 'text-primary-yellow' : 'text-text-high'}">
                          ${escapeHtml(pl.name)}
                        </span>
                      </div>
                      <span class="font-mono text-xs font-bold text-primary-yellow">\$${plPurse}</span>
                    </div>

                    <div class="w-full bg-tactical-navy h-1.5 rounded-full overflow-hidden">
                      <div class="h-full rounded-full ${isLeader ? 'bg-primary-yellow' : 'bg-status-success'}" style="width: ${budgetPct}%;"></div>
                    </div>

                    <div class="flex items-center justify-between text-[10px] font-mono text-text-dim">
                      <span>Squad: ${plTeamCount}/${teamCap}</span>
                      <span>${isLeader ? 'HIGH BIDDER' : (pl.isBot ? 'Bot' : 'Manager')}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Pre-Auction Tactical Velocity -->
            <div class="pt-2 border-t border-tactical-navy-light/60 text-xs font-mono text-text-dim flex flex-col gap-1">
              <span class="uppercase text-[10px] text-text-dim">Format Velocity</span>
              <span class="text-text-high font-bold">${matchState.settings.preset?.toUpperCase() || 'STANDARD'} 6V6 DRAFT</span>
            </div>
          </div>
        </div>

        <!-- CENTER PANEL: Active Combat Lot Card & Bidding Action Deck (col-span-6 on Desktop) -->
        <div class="lg:col-span-6 flex flex-col gap-5">
          
          <!-- Primary Combat Lot Card -->
          <div class="bg-tactical-card border border-tactical-navy-light rounded-xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden">
            <div class="absolute -right-12 -top-12 w-48 h-48 bg-primary-yellow/5 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Lot Header: Name, Dual Types, Tier & Base Price -->
            <div class="flex items-start justify-between gap-4 relative z-10">
              <div class="flex flex-col gap-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded bg-primary-yellow/15 border border-primary-yellow/40 text-primary-yellow font-display font-bold text-[10px] uppercase tracking-wider">
                    ${escapeHtml(p.tier || 'TIER 1')}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-tactical-navy border border-tactical-navy-light text-accent-cyan font-mono text-[10px] font-bold uppercase">
                    BST ${p.bst || 500}
                  </span>
                  <span class="font-mono text-[10px] text-text-dim uppercase">LOT #${lotIndexInSet}</span>
                </div>

                <h2 class="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-text-high mt-1 truncate">
                  ${escapeHtml(p.name)}
                </h2>

                <!-- Dual Type Badges -->
                <div class="flex items-center gap-1.5 mt-1">
                  ${p.types.map(t => {
                    const style = TYPE_STYLES[t.toLowerCase()] || { bg: 'bg-tactical-navy', text: 'text-text-high', border: 'border-tactical-navy-light' };
                    return `
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}">
                        ${t}
                      </span>
                    `;
                  }).join('')}
                </div>

                <!-- Roles -->
                <div class="flex items-center gap-1.5 mt-2 text-xs font-mono">
                  <span class="px-2 py-0.5 rounded bg-tactical-base border border-tactical-navy-light/80 text-text-dim">
                    ${escapeHtml(p.role)}
                  </span>
                  ${p.secondaryRole && p.secondaryRole !== 'None' ? `
                    <span class="px-2 py-0.5 rounded bg-tactical-base border border-tactical-navy-light/80 text-text-dim">
                      ${escapeHtml(p.secondaryRole)}
                    </span>
                  ` : ''}
                </div>
              </div>

              <!-- Artwork Display Container -->
              <div class="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 bg-tactical-base border border-tactical-navy-light rounded-xl p-2 flex items-center justify-center shadow-inner">
                <img
                  src="${artworkUrl}"
                  alt="${escapeHtml(p.name)}"
                  class="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                  onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"
                />
                <div class="absolute bottom-1 right-1 bg-tactical-navy/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-tactical-navy-light text-[10px] font-mono font-bold text-primary-yellow">
                  BASE \$${matchState.settings.startBid}
                </div>
              </div>
            </div>

            <!-- 6-Stat Matrix Grid -->
            <div class="bg-tactical-base border border-tactical-navy-light/80 p-3.5 rounded-xl shadow-inner flex flex-col gap-1.5">
              <span class="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-0.5">BASE STAT TELEMETRY</span>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                ${renderStatTelemetry('HP', p.baseStats.hp, 255, 'bg-status-success', 'text-status-success')}
                ${renderStatTelemetry('SPA', p.baseStats.spAttack, 180, 'bg-type-psychic', 'text-type-psychic')}
                ${renderStatTelemetry('ATK', p.baseStats.attack, 180, 'bg-primary-yellow', 'text-primary-yellow')}
                ${renderStatTelemetry('SPD', p.baseStats.spDefense, 180, 'bg-accent-cyan', 'text-accent-cyan')}
                ${renderStatTelemetry('DEF', p.baseStats.defense, 180, 'bg-secondary-container', 'text-secondary-container')}
                ${renderStatTelemetry('SPE', p.baseStats.speed, 200, 'bg-status-danger', 'text-status-danger')}
              </div>
            </div>

            <!-- Defensive Profile Telemetry (Weaknesses, Resistances, Immunities) -->
            <div class="flex flex-col gap-1.5 pt-1 text-xs font-mono">
              <span class="text-[10px] text-text-dim uppercase tracking-wider">DEFENSIVE PROFILE</span>
              
              <!-- Weaknesses -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-status-danger font-bold text-[11px] uppercase mr-1">Weak:</span>
                ${defensiveProfile.weaknesses.length > 0 ? defensiveProfile.weaknesses.map(w => `
                  <span class="px-1.5 py-0.5 rounded bg-status-danger/15 border border-status-danger/30 text-status-danger font-bold text-[11px]">
                    ${w.type} ${w.mult}x
                  </span>
                `).join('') : '<span class="text-text-dim text-[11px]">None</span>'}
              </div>

              <!-- Resistances & Immunities -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-status-success font-bold text-[11px] uppercase mr-1">Resist:</span>
                ${defensiveProfile.resistances.length > 0 ? defensiveProfile.resistances.map(r => `
                  <span class="px-1.5 py-0.5 rounded bg-status-success/15 border border-status-success/30 text-status-success font-bold text-[11px]">
                    ${r.type} ${r.mult}x
                  </span>
                `).join('') : '<span class="text-text-dim text-[11px]">None</span>'}

                ${defensiveProfile.immunities.length > 0 ? `
                  <span class="text-accent-cyan font-bold text-[11px] uppercase ml-2 mr-1">Immune:</span>
                  ${defensiveProfile.immunities.map(im => `
                    <span class="px-1.5 py-0.5 rounded bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan font-bold text-[11px]">
                      ${im} 0x
                    </span>
                  `).join('')}
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Bidding Action Deck & Clock Readout -->
          <div class="bg-tactical-navy border border-tactical-navy-light rounded-xl p-5 shadow-2xl flex flex-col gap-4">
            
            <!-- High-Voltage Current Bid & Circular Pulse Timer -->
            <div class="flex items-center justify-between">
              
              <!-- Bid Amount Display -->
              <div class="flex flex-col">
                <span class="font-mono text-[10px] text-text-dim uppercase tracking-widest font-bold">CURRENT LEADING BID</span>
                <div class="flex items-baseline gap-1 mt-0.5">
                  <span class="font-mono text-3xl sm:text-4xl text-primary-yellow font-bold tracking-tight leading-none" id="current-bid-val">
                    \$${lot.currentBid > 0 ? lot.currentBid : matchState.settings.startBid}
                  </span>
                  <span class="font-mono text-xs text-text-dim uppercase font-bold">PURSE</span>
                </div>
                
                <div class="flex items-center gap-1.5 mt-2">
                  <span class="material-symbols-outlined text-[15px] ${leader ? 'text-status-danger' : 'text-text-dim'}">gavel</span>
                  <span class="font-mono text-xs text-text-dim">
                    Leading: <strong class="${leader ? 'text-text-high' : 'text-text-dim'} font-bold uppercase">${leader ? escapeHtml(leader.name) : 'No Bids'}</strong>
                  </span>
                </div>
              </div>

              <!-- Synchronized Pulse Timer Ring -->
              <div class="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg class="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                  <circle class="text-tactical-base fill-none" cx="36" cy="36" r="30" stroke="currentColor" stroke-width="5"></circle>
                  <circle
                    id="timer-ring"
                    cx="36"
                    cy="36"
                    r="30"
                    stroke="${isUrgent ? '#ff2a5f' : '#ffe033'}"
                    stroke-width="5"
                    stroke-dasharray="188.5"
                    stroke-dashoffset="${dashoffset.toFixed(1)}"
                    stroke-linecap="round"
                    fill="none"
                    class="transition-all duration-300 ${isUrgent ? 'drop-shadow-[0_0_8px_rgba(255,42,95,0.8)]' : 'drop-shadow-[0_0_8px_rgba(255,224,51,0.5)]'}"
                  ></circle>
                </svg>

                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    id="timer-val"
                    class="font-mono text-xl font-bold leading-none ${isUrgent ? 'text-status-danger' : 'text-text-high'}"
                  >
                    ${String(clampedTimer).padStart(2, '0')}s
                  </span>
                  <span class="text-[9px] font-mono tracking-widest text-text-dim uppercase mt-0.5">
                    ${isUrgent ? 'HURRY' : 'CLOCK'}
                  </span>
                </div>
              </div>
            </div>

            <!-- Bidding Action Controls (Respects Budget Reserve Rule) -->
            <div class="grid grid-cols-3 gap-3 pt-1">
              
              <!-- Quick Bid 1 -->
              <button
                id="btn-bid-1"
                type="button"
                data-amount="${minRequired}"
                ${valMin.valid && !isUserLeading ? '' : 'disabled'}
                class="h-14 rounded-xl flex flex-col items-center justify-center p-2 font-display font-black uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                  valMin.valid && !isUserLeading
                    ? 'bg-primary-yellow hover:bg-primary-yellow-hover text-slate-950 font-black shadow-[0_0_15px_rgba(245,186,20,0.3)]'
                    : 'bg-tactical-card border border-tactical-navy-light text-text-dim/40 cursor-not-allowed opacity-50'
                }"
              >
                <span class="text-sm leading-none">+\$${inc}</span>
                <span class="font-mono text-[11px] leading-none opacity-90 mt-1">(\$${minRequired})</span>
              </button>

              <!-- Quick Bid 2 (Jump) -->
              <button
                id="btn-bid-2"
                type="button"
                data-amount="${jumpBid}"
                ${valJump.valid && !isUserLeading ? '' : 'disabled'}
                class="h-14 rounded-xl flex flex-col items-center justify-center p-2 font-display font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                  valJump.valid && !isUserLeading
                    ? 'bg-tactical-card hover:bg-tactical-navy-light border-2 border-primary-yellow text-primary-yellow'
                    : 'bg-tactical-card border border-tactical-navy-light text-text-dim/40 cursor-not-allowed opacity-50'
                }"
              >
                <span class="text-sm leading-none">+JUMP</span>
                <span class="font-mono text-[11px] leading-none opacity-90 mt-1">(\$${jumpBid})</span>
              </button>

              <!-- Pass Button -->
              <button
                id="btn-pass"
                type="button"
                ${!hasUserPassed && !isUserLeading ? '' : 'disabled'}
                class="h-14 rounded-xl flex flex-col items-center justify-center p-2 font-display font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                  !hasUserPassed && !isUserLeading
                    ? 'bg-tactical-card hover:bg-status-danger/20 border border-status-danger/50 text-status-danger'
                    : 'bg-tactical-card border border-tactical-navy-light text-text-dim/40 cursor-not-allowed opacity-50'
                }"
              >
                <span class="material-symbols-outlined text-[18px] leading-none mb-0.5">close</span>
                <span class="text-xs leading-none">${hasUserPassed ? 'PASSED' : 'PASS'}</span>
              </button>
            </div>

            <!-- Reserve Rule Warning Banner if blocked -->
            ${!valMin.valid && !isUserLeading && userTeamCount < teamCap ? `
              <div class="p-2.5 rounded-lg bg-status-danger/15 border border-status-danger/40 text-center">
                <span class="font-mono text-xs text-status-danger font-bold uppercase">
                  ${escapeHtml(valMin.error || 'Cannot bid: Reserve rule active')}
                </span>
              </div>
            ` : ''}

            <!-- Tactical Purse & Allocation Readout Strip -->
            <div class="bg-tactical-base border border-tactical-navy-light/80 p-3.5 rounded-xl flex items-center justify-between font-mono text-xs">
              <div class="flex flex-col">
                <span class="text-[10px] text-text-dim uppercase tracking-wider">YOUR PURSE</span>
                <span class="text-sm font-bold text-status-success">\$${userPurse} Left</span>
              </div>
              <div class="h-6 w-px bg-tactical-navy-light"></div>
              <div class="flex flex-col items-center">
                <span class="text-[10px] text-text-dim uppercase tracking-wider">MAX BID CEILING</span>
                <span class="text-sm font-bold text-primary-yellow">\$${maxAllowedBid} MAX</span>
              </div>
              <div class="h-6 w-px bg-tactical-navy-light"></div>
              <div class="flex flex-col items-end">
                <span class="text-[10px] text-text-dim uppercase tracking-wider">SLOTS LEFT</span>
                <span class="text-sm font-bold text-text-high">${userTeamCount}/${teamCap} PKMN</span>
              </div>
            </div>

          </div>

          <!-- Mobile-only Activity Ledger Drawer -->
          <div class="lg:hidden flex flex-col gap-3">
            ${renderRecentBidsCard(recentBids)}
            ${renderUpcomingLotsCard(upcomingLots)}
          </div>

        </div>

        <!-- RIGHT PANEL (Desktop): Up Next Queue & Activity Ledger (col-span-3) -->
        <div class="lg:col-span-3 hidden lg:flex flex-col gap-4">
          
          <!-- Recent Bids Ledger -->
          ${renderRecentBidsCard(recentBids)}

          <!-- Up Next Queue -->
          ${renderUpcomingLotsCard(upcomingLots)}

          <!-- Squad Requirements Intel -->
          <div class="bg-tactical-navy border border-tactical-navy-light rounded-xl p-4 shadow-xl flex flex-col gap-2.5 text-xs font-mono">
            <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary-yellow text-[16px]">checklist</span>
              <span>SQUAD REQUIREMENTS</span>
            </span>
            <div class="flex items-center justify-between text-text-dim">
              <span>Required Squad Size:</span>
              <span class="text-text-high font-bold">${teamCap} Pokémon</span>
            </div>
            <div class="flex items-center justify-between text-text-dim">
              <span>Reserve Per Empty Slot:</span>
              <span class="text-primary-yellow font-bold">\$${minReservePerSlot}</span>
            </div>
            <p class="text-[11px] text-text-dim leading-relaxed pt-1 border-t border-tactical-navy-light/60">
              The referee strictly enforces the budget reserve rule so you never get stuck unable to fill a required slot.
            </p>
          </div>

        </div>

      </div>
    </div>
  `;
}

/**
 * Render Stat Telemetry Bar with min/max indicator
 */
function renderStatTelemetry(label, val, max, colorBar, colorText) {
  const pct = Math.min(100, Math.max(12, Math.round((val / max) * 100)));
  return `
    <div class="flex items-center gap-2">
      <span class="w-7 text-[11px] font-bold text-text-dim">${label}</span>
      <div class="flex-1 h-1.5 bg-tactical-navy rounded-full overflow-hidden">
        <div class="h-full rounded-full ${colorBar}" style="width: ${pct}%;"></div>
      </div>
      <span class="w-7 text-right font-bold ${colorText}">${val}</span>
    </div>
  `;
}

/**
 * Render Recent Bids Card
 */
function renderRecentBidsCard(recentBids) {
  return `
    <div class="bg-tactical-navy border border-tactical-navy-light rounded-xl p-4 shadow-xl flex flex-col gap-2.5">
      <div class="flex items-center justify-between pb-2 border-b border-tactical-navy-light/60">
        <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high flex items-center gap-1.5">
          <span class="material-symbols-outlined text-primary-yellow text-[16px]">history</span>
          <span>RECENT BIDS (${recentBids.length})</span>
        </span>
        <span class="font-mono text-[10px] text-text-dim uppercase">LIVE FEED</span>
      </div>

      <div class="flex flex-col gap-1.5 font-mono text-xs">
        ${recentBids.length > 0 ? recentBids.map((b, i) => `
          <div class="flex items-center justify-between p-2 rounded ${i === 0 ? 'bg-tactical-card border border-primary-yellow/40' : 'bg-tactical-base/60'}">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-primary-yellow' : 'bg-text-dim/60'}"></span>
              <span class="font-bold truncate ${i === 0 ? 'text-primary-yellow' : 'text-text-high'}">${escapeHtml(b.playerName || b.playerId)}</span>
            </div>
            <span class="font-bold ${i === 0 ? 'text-primary-yellow' : 'text-text-dim'}">\$${b.amount}</span>
          </div>
        `).join('') : `
          <div class="p-3 text-center text-text-dim text-xs font-mono">
            No bids placed on this lot yet.
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Render Up Next Preview Card
 */
function renderUpcomingLotsCard(upcomingLots) {
  return `
    <div class="bg-tactical-navy border border-tactical-navy-light rounded-xl p-4 shadow-xl flex flex-col gap-2.5">
      <div class="flex items-center justify-between pb-2 border-b border-tactical-navy-light/60">
        <span class="font-display font-bold text-xs uppercase tracking-wider text-text-high flex items-center gap-1.5">
          <span class="material-symbols-outlined text-accent-cyan text-[16px]">queue</span>
          <span>UP NEXT IN SET</span>
        </span>
        <span class="font-mono text-[10px] text-text-dim uppercase">${upcomingLots.length} Queued</span>
      </div>

      <div class="grid grid-cols-3 gap-2">
        ${upcomingLots.length > 0 ? upcomingLots.map((l, idx) => `
          <div class="p-2 rounded-lg bg-tactical-card border border-tactical-navy-light/80 flex flex-col items-center text-center gap-1">
            <span class="font-mono text-[9px] text-text-dim uppercase">LOT +${idx + 1}</span>
            <img
              src="./assets/sprites/artwork/${l.pokemon.id}.png"
              alt="${escapeHtml(l.pokemon.name)}"
              class="w-10 h-10 object-contain drop-shadow"
              onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"
            />
            <span class="font-display font-bold text-[11px] text-text-high truncate w-full">${escapeHtml(l.pokemon.name)}</span>
            <span class="font-mono text-[10px] font-bold text-primary-yellow">\$${l.startBid || 10}</span>
          </div>
        `).join('') : `
          <div class="col-span-3 p-3 text-center text-text-dim text-xs font-mono">
            Final lot in this set.
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Compute Defensive Profile: Weaknesses, Resistances, Immunities
 */
function computeDefensiveProfile(defenderTypes) {
  const weaknesses = [];
  const resistances = [];
  const immunities = [];

  for (const atkType of POKEMON_TYPES) {
    try {
      const mult = getTypeEffectiveness(atkType, defenderTypes);
      const capName = atkType.charAt(0).toUpperCase() + atkType.slice(1);
      if (mult === 0) {
        immunities.push(capName);
      } else if (mult > 1) {
        weaknesses.push({ type: capName, mult });
      } else if (mult < 1) {
        resistances.push({ type: capName, mult });
      }
    } catch (_) {}
  }

  // Sort descending by multiplier
  weaknesses.sort((a, b) => b.mult - a.mult);
  resistances.sort((a, b) => a.mult - b.mult);

  return { weaknesses, resistances, immunities };
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
