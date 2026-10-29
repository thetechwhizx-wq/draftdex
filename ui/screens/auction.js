/**
 * Auction Room Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/auction_room/code.html
 */

import { getNextMinimumBid, validateBid, getMinIncrement } from '../../engine/auction.js';

// Canonical Pokémon type color pills
const TYPE_COLORS = {
  normal: { bg: '#4B5563', text: '#E5E7EB' },
  fire: { bg: '#991B1B', text: '#FCA5A5' },
  water: { bg: '#1E40AF', text: '#93C5FD' },
  grass: { bg: '#166534', text: '#86EFAC' },
  electric: { bg: '#854D0E', text: '#FDE047' },
  ice: { bg: '#155E75', text: '#A5F3FC' },
  fighting: { bg: '#831843', text: '#FBCFE8' },
  poison: { bg: '#581C87', text: '#D8B4FE' },
  ground: { bg: '#78350F', text: '#FCD34D' },
  flying: { bg: '#3730A3', text: '#C7D2FE' },
  psychic: { bg: '#831843', text: '#F472B6' },
  bug: { bg: '#3F6212', text: '#BEF264' },
  rock: { bg: '#57534E', text: '#D6D3D1' },
  ghost: { bg: '#3B0764', text: '#E9D5FF' },
  dragon: { bg: '#312E81', text: '#A5B4FC' },
  steel: { bg: '#334155', text: '#CBD5E1' },
  dark: { bg: '#18181B', text: '#A1A1AA' },
  fairy: { bg: '#701A75', text: '#F5D0FE' }
};

export function renderAuctionScreen({ matchState, currentTimerSeconds = 10, totalTimerSeconds = 18, userPlayerId = 'human' }) {
  const lot = matchState.currentLot;
  if (!lot || !lot.pokemon) {
    return `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-space-md">
        <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary mb-4 animate-pulse">
          <span class="material-symbols-outlined text-[32px]">sync</span>
        </div>
        <h2 class="font-headline-md text-headline-md uppercase text-on-surface">Loading Next Lot...</h2>
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
  const teamCap = matchState.settings.teamSize;

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
  // Circumference = 2 * PI * 30 = ~188.5
  const circumference = 188.5;
  const progressRatio = totalTimerSeconds > 0 ? (clampedTimer / totalTimerSeconds) : 0;
  const dashoffset = circumference * (1 - progressRatio);

  // Artwork image fallback
  const artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)] pt-safe">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Back" id="btn-auction-back" class="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary-container transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <img alt="Apex Draft Arena Logo" class="h-8 w-auto object-contain" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"/>
          <h1 class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">Lot Inspector</h1>
        </div>
        <div class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-col w-full pb-6 space-y-space-md pt-14">
      <!-- Set Meta Bar -->
      <div class="flex items-center justify-between bg-surface-container px-gutter py-space-sm rounded-xl">
        <div class="flex items-center space-x-space-sm min-w-0">
          <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse flex-shrink-0"></span>
          <span class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">${escapeHtml(currentSet.name)}</span>
        </div>
        <div class="flex items-center space-x-space-xs bg-surface-container-high px-space-sm py-0.5 rounded-full flex-shrink-0">
          <span class="material-symbols-outlined text-primary-container text-[14px]">token</span>
          <span class="font-label-caps text-label-caps text-on-surface">${lotIndexInSet}/${setLotsCount} LOT</span>
        </div>
      </div>

      <!-- Primary Active Lot Card -->
      <div class="flex flex-col bg-surface-container rounded-xl overflow-hidden shadow-xl">
        <!-- Creature Visual Banner -->
        <div class="relative w-full h-44 bg-surface-container-lowest overflow-hidden flex items-center justify-center">
          <img class="w-40 h-40 object-contain z-10 transition-transform duration-300 hover:scale-105" src="${artworkUrl}" alt="${escapeHtml(p.name)}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/20 to-transparent"></div>
          
          <!-- Role Badge -->
          <div class="absolute top-space-sm left-space-sm bg-surface-container-highest/90 backdrop-blur-md px-space-sm py-1 rounded-full flex items-center space-x-1 z-20">
            <span class="material-symbols-outlined text-primary-container text-[14px]">swords</span>
            <span class="font-label-caps text-label-caps uppercase text-primary">${escapeHtml(p.role)}</span>
          </div>
          
          <!-- Base Price Tag -->
          <div class="absolute top-space-sm right-space-sm bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-1 rounded-full z-20">
            <span class="font-body-sm text-body-sm text-outline">Base</span>
            <span class="font-tabular-stats text-tabular-stats text-primary-container ml-0.5">$${matchState.settings.startBid}</span>
          </div>
        </div>

        <!-- Details & Meta -->
        <div class="px-space-md pt-space-sm pb-space-md flex flex-col space-y-space-md">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <h2 class="font-headline-lg-mobile text-headline-lg-mobile uppercase text-on-surface tracking-wide">${escapeHtml(p.name)}</h2>
              <!-- Type Chips -->
              <div class="flex items-center space-x-space-xs mt-1">
                ${p.types.map(t => {
                  const c = TYPE_COLORS[t.toLowerCase()] || { bg: '#1E293B', text: '#F8FAFC' };
                  return `
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-headline-sm uppercase tracking-wider" style="background-color: ${c.bg}; color: ${c.text};">${t}</span>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- 6-Stat Matrix Grid -->
          <div class="grid grid-cols-2 gap-x-space-md gap-y-1.5 bg-surface-container-lowest p-space-sm rounded-lg">
            ${renderStatBar('HP', p.baseStats.hp, 255, 'bg-primary-container')}
            ${renderStatBar('SPA', p.baseStats.spAttack, 180, 'bg-primary-container')}
            ${renderStatBar('ATK', p.baseStats.attack, 180, 'bg-[#EF4444]')}
            ${renderStatBar('SPD', p.baseStats.spDefense, 180, 'bg-primary-container')}
            ${renderStatBar('DEF', p.baseStats.defense, 180, 'bg-primary-container')}
            ${renderStatBar('SPE', p.baseStats.speed, 200, 'bg-tertiary-fixed-dim')}
          </div>
        </div>
      </div>

      <!-- Bid Readout & Urgent Clock Board -->
      <div class="flex items-center justify-between bg-surface-container p-space-md rounded-xl">
        <!-- Leading Bid Section -->
        <div class="flex flex-col min-w-0">
          <div class="flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full ${leader ? 'bg-[#EF4444]' : 'bg-outline'}"></span>
            <span class="font-label-caps text-label-caps uppercase text-outline">High Bidder</span>
            <span class="font-headline-sm text-headline-sm uppercase ${leader ? 'text-[#EF4444]' : 'text-outline'} font-bold truncate">
              ${leader ? escapeHtml(leader.name) : 'No Bids'}
            </span>
          </div>
          <div class="font-display-auction-mobile text-display-auction-mobile text-primary-container leading-none mt-1" id="current-bid-val">
            $${lot.currentBid > 0 ? lot.currentBid : matchState.settings.startBid}
          </div>
        </div>

        <!-- Circular Timer -->
        <div class="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
          <svg class="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
            <circle class="text-surface-container-high fill-none" cx="36" cy="36" r="30" stroke="currentColor" stroke-width="4.5"></circle>
            <circle class="fill-none ${isUrgent ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]' : ''} transition-all duration-300" cx="36" cy="36" id="timer-ring" r="30" stroke="${isUrgent ? '#EF4444' : '#c8c6c5'}" stroke-dasharray="188.5" stroke-dashoffset="${dashoffset.toFixed(1)}" stroke-linecap="round" stroke-width="5"></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-display-auction-mobile text-[22px] leading-tight ${isUrgent ? 'text-[#EF4444]' : 'text-on-surface'} font-bold tracking-tight" id="timer-val">
              ${String(clampedTimer).padStart(2, '0')}s
            </span>
            <span class="font-label-caps text-[9px] uppercase tracking-widest ${isUrgent ? 'text-[#EF4444]' : 'text-outline'}">
              ${isUrgent ? 'HURRY' : 'CLOCK'}
            </span>
          </div>
        </div>
      </div>

      <!-- Bidding Action Controls (Respects Budget Reserve Rule) -->
      <div class="grid grid-cols-3 gap-space-xs pt-1">
        <!-- Quick Bid 1 -->
        <button class="min-h-[52px] ${valMin.valid && !isUserLeading ? 'bg-primary-container text-on-primary-container hover:brightness-110 active:scale-[0.98]' : 'bg-surface-container text-outline opacity-40 cursor-not-allowed'} transition-transform rounded-lg flex flex-col items-center justify-center p-space-xs" id="btn-bid-1" data-amount="${minRequired}" ${valMin.valid && !isUserLeading ? '' : 'disabled'} type="button">
          <span class="font-headline-sm text-headline-sm leading-none uppercase">+$${inc}</span>
          <span class="font-tabular-stats text-tabular-stats leading-none opacity-85 mt-0.5">($${minRequired})</span>
        </button>

        <!-- Quick Bid 2 (Jump) -->
        <button class="min-h-[52px] ${valJump.valid && !isUserLeading ? 'bg-primary-container text-on-primary-container hover:brightness-110 active:scale-[0.98]' : 'bg-surface-container text-outline opacity-40 cursor-not-allowed'} transition-transform rounded-lg flex flex-col items-center justify-center p-space-xs" id="btn-bid-2" data-amount="${jumpBid}" ${valJump.valid && !isUserLeading ? '' : 'disabled'} type="button">
          <span class="font-headline-sm text-headline-sm leading-none uppercase">+JUMP</span>
          <span class="font-tabular-stats text-tabular-stats leading-none opacity-85 mt-0.5">($${jumpBid})</span>
        </button>

        <!-- Pass Button -->
        <button class="min-h-[52px] ${!hasUserPassed && !isUserLeading ? 'bg-secondary-container/20 text-[#EF4444] hover:bg-secondary-container/30 active:scale-[0.98]' : 'bg-surface-container text-outline opacity-40 cursor-not-allowed'} transition-all rounded-lg flex flex-col items-center justify-center p-space-xs" id="btn-pass" ${!hasUserPassed && !isUserLeading ? '' : 'disabled'} type="button">
          <span class="material-symbols-outlined text-[18px] leading-none mb-0.5">close</span>
          <span class="font-headline-sm text-headline-sm leading-none uppercase">${hasUserPassed ? 'Passed' : 'Pass'}</span>
        </button>
      </div>

      <!-- Reserve rule warning note if blocked -->
      ${!valMin.valid && !isUserLeading && userTeamCount < teamCap ? `
        <div class="px-space-sm text-center">
          <span class="font-label-caps text-[11px] text-secondary tracking-wide uppercase">
            ${escapeHtml(valMin.error || 'Cannot bid: Reserve rule active')}
          </span>
        </div>
      ` : ''}

      <!-- Squad Roster & Purse Strip -->
      <div class="flex items-center justify-between bg-surface-container-high px-space-md py-space-sm rounded-xl">
        <div class="flex items-center space-x-space-sm">
          <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
            <span class="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          </div>
          <div class="flex flex-col">
            <span class="font-label-caps text-label-caps uppercase text-outline">Purse Left</span>
            <span class="font-tabular-stats text-tabular-stats text-primary font-bold tracking-tight">$${userPurse} Left</span>
          </div>
        </div>
        <div class="flex items-center space-x-space-sm">
          <div class="flex flex-col items-end">
            <span class="font-label-caps text-label-caps uppercase text-outline">Squad Roster</span>
            <span class="font-tabular-stats text-tabular-stats text-on-surface font-bold">${userTeamCount}/${teamCap} PKMN</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-tertiary-fixed-dim">
            <span class="material-symbols-outlined text-[18px]">group</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStatBar(name, val, max, colorClass) {
  const pct = Math.min(100, Math.max(10, Math.round((val / max) * 100)));
  return `
    <div class="flex items-center space-x-space-xs">
      <span class="w-7 font-label-caps text-label-caps text-outline">${name}</span>
      <div class="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div class="h-full ${colorClass} rounded-full" style="width: ${pct}%;"></div>
      </div>
      <span class="w-6 text-right font-tabular-stats text-tabular-stats text-on-surface">${val}</span>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
