/**
 * DraftDex Battle Arena Screen
 * Bauhaus dark aesthetic, matching design/stitch_pok_mon_draft_auction_webapp/battle_arena/code.html
 *
 * Implements:
 * - Turn timer ring (SVG circle with countdown and urgent red state)
 * - 6-dot bench status indicators for both players
 * - Opponent and Player status hubs with HP gauges, Lv.50, and status badges (OK, BRN, PAR, etc.)
 * - Combat log ticker strip with toggleable history dialog
 * - Tactical 2x2 move grid (type pills, power, PP, disabled state for 0 PP)
 * - Collapsible bench switch drawer with HP bars
 * - Action lock confirmation badge and primary CTA button
 * - Pure UI renderer: accepts state, returns HTML
 */

import { getPokemonById } from '../../engine/pokemonData.js';
import { STATUS_CONDITIONS, MOVE_CATEGORIES } from '../../engine/moves.js';

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function getStatusBadge(status) {
  switch (status) {
    case STATUS_CONDITIONS.BURN:
      return '<span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-caps text-label-caps uppercase font-bold">BRN</span>';
    case STATUS_CONDITIONS.PARALYSIS:
      return '<span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase font-bold">PAR</span>';
    case STATUS_CONDITIONS.POISON:
      return '<span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-caps text-label-caps uppercase font-bold">PSN</span>';
    case STATUS_CONDITIONS.SLEEP:
      return '<span class="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-caps text-label-caps uppercase font-bold">SLP</span>';
    case STATUS_CONDITIONS.FREEZE:
      return '<span class="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-caps text-label-caps uppercase font-bold">FRZ</span>';
    default:
      return '<span class="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-caps text-label-caps uppercase font-bold">OK</span>';
  }
}

export function renderBattleScreen({
  battle,
  userSide = 'A',
  timerSeconds = 25,
  totalTimerSeconds = 25,
  currentSelection = null, // { type: 'move', moveName: string } | { type: 'switch', switchIndex: number } | null
  commitState = 'pending', // 'pending' | 'committed' | 'resolving'
  isBenchOpen = false,
  isLogOpen = false,
  errorNotice = null
}) {
  if (!battle) {
    return `<div class="p-8 text-center text-on-surface font-headline-sm">Battle initializing...</div>`;
  }

  const oppSide = userSide === 'A' ? 'B' : 'A';
  const playerSideObj = userSide === 'A' ? battle.sideA : battle.sideB;
  const oppSideObj = userSide === 'A' ? battle.sideB : battle.sideA;

  const playerActive = playerSideObj.party[playerSideObj.activeIndex] || playerSideObj.party[0];
  const oppActive = oppSideObj.party[oppSideObj.activeIndex] || oppSideObj.party[0];

  const playerInfo = getPokemonById(playerActive.id) || {};
  const oppInfo = getPokemonById(oppActive.id) || {};

  const playerArtwork = playerInfo.artworkUrl || playerInfo.spriteUrl || '';
  const oppArtwork = oppInfo.artworkUrl || oppInfo.spriteUrl || '';

  // HP Percentages
  const playerHpPct = Math.max(0, Math.min(100, Math.round((playerActive.currentHp / playerActive.maxHp) * 100)));
  const oppHpPct = Math.max(0, Math.min(100, Math.round((oppActive.currentHp / oppActive.maxHp) * 100)));

  // Turn timer ring
  const totalLength = 125.6;
  const ratio = totalTimerSeconds > 0 ? (timerSeconds / totalTimerSeconds) : 0;
  const strokeOffset = (totalLength * (1 - ratio)).toFixed(1);
  const isUrgent = timerSeconds <= 5;

  // Latest battle log message
  const latestLog = (battle.log && battle.log.length > 0)
    ? battle.log[battle.log.length - 1].text
    : 'Battle in progress...';

  // Ready bench count
  const availableBench = playerSideObj.party.filter((p, idx) => idx !== playerSideObj.activeIndex && !p.isFainted);
  const readyBenchCount = availableBench.length;

  // Determine forced switch requirement
  const isPlayerForcedSwitch = playerActive.isFainted || (battle.needsSwitch && battle.needsSwitch[userSide]);
  const isOpponentForcedSwitch = oppActive.isFainted || (battle.needsSwitch && battle.needsSwitch[oppSide]);
  const isBattleCompleted = battle.status === 'completed';

  // Lock badge text
  let lockBadgeText = 'Select an action';
  let canLock = false;

  if (isBattleCompleted) {
    lockBadgeText = `Battle Finished: ${battle.winner === userSide ? 'Victory!' : (battle.winner === 'draw' ? 'Draw' : 'Defeat')}`;
  } else if (commitState === 'committed') {
    lockBadgeText = 'Action locked. Waiting for opponent...';
  } else if (commitState === 'resolving') {
    lockBadgeText = 'Resolving turn...';
  } else if (isPlayerForcedSwitch) {
    if (currentSelection?.type === 'switch') {
      const targetPkmn = playerSideObj.party[currentSelection.switchIndex];
      lockBadgeText = `Switch to: ${targetPkmn ? targetPkmn.name : 'Selected'}`;
      canLock = true;
    } else {
      lockBadgeText = 'Pokémon fainted! Choose replacement:';
    }
  } else if (currentSelection?.type === 'move') {
    lockBadgeText = `Lock move: ${currentSelection.moveName}`;
    canLock = true;
  } else if (currentSelection?.type === 'switch') {
    const targetPkmn = playerSideObj.party[currentSelection.switchIndex];
    lockBadgeText = `Switch to: ${targetPkmn ? targetPkmn.name : 'Selected'}`;
    canLock = true;
  }

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Go back" id="btn-battle-back" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button">
            <span class="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 class="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface truncate">Apex Battle</h1>
        </div>
        <div class="flex items-center gap-space-sm">
          <span class="font-label-caps text-label-caps text-on-surface-variant font-bold">TURN ${battle.turn}</span>
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen">
      <div class="flex flex-col w-full px-gutter pb-space-lg select-none">

        ${errorNotice ? `
          <div class="my-2 p-2.5 rounded-lg bg-error-container text-on-error-container font-body-sm flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">error</span>
            <span>${escapeHtml(errorNotice)}</span>
          </div>
        ` : ''}

        <!-- Top Arena Control: Timer & Opponent Bench -->
        <div class="flex items-center justify-between py-space-xs">
          <!-- Opponent Bench (6 Dots) -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low shadow-sm" id="opp-bench-dots">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mr-1">FOE</span>
            ${oppSideObj.party.map((p, idx) => {
              const isAlive = !p.isFainted;
              const isCurrent = idx === oppSideObj.activeIndex;
              if (isAlive) {
                return `<span class="w-2.5 h-2.5 rounded-full bg-primary ${isCurrent ? 'ring-2 ring-primary/50' : ''} shadow-[0_0_8px_rgba(255,180,168,0.8)]" title="${escapeHtml(p.name)}"></span>`;
              }
              return `<span class="w-2.5 h-2.5 rounded-full bg-surface-variant" title="${escapeHtml(p.name)} (fainted)"></span>`;
            }).join('')}
          </div>

          <!-- Turn Timer Ring -->
          <div class="relative flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-high shadow-md">
            <svg class="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle class="text-surface-variant" cx="24" cy="24" fill="none" r="20" stroke="currentColor" stroke-width="3.5"></circle>
              <circle class="${isUrgent ? 'text-error' : 'text-primary-container'} transition-all duration-1000 ease-linear" cx="24" cy="24" fill="none" id="timer-ring" r="20" stroke="currentColor" stroke-dasharray="125.6" stroke-dashoffset="${strokeOffset}" stroke-linecap="round" stroke-width="3.5"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="font-headline-sm text-headline-sm ${isUrgent ? 'text-error' : 'text-on-surface'} tracking-tight leading-none" id="turn-timer">${timerSeconds}s</span>
            </div>
          </div>
        </div>

        <!-- Stage: Opponent (Top-Right) -->
        <div class="relative flex flex-col items-end mt-2">
          <!-- Opponent Status Hub -->
          <div class="w-64 p-3 rounded-xl bg-surface-container-high shadow-md">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-headline-sm text-headline-sm uppercase text-on-surface tracking-wide truncate mr-2">
                ${escapeHtml((oppActive.name || '').toUpperCase())} <span class="text-primary font-tabular-stats text-tabular-stats">Lv.50</span>
              </span>
              <span id="opp-status-badge">${getStatusBadge(oppActive.status)}</span>
            </div>
            <!-- HP Gauge -->
            <div class="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
              <div class="h-full bg-primary-container rounded-full transition-all duration-500" style="width: ${oppHpPct}%;"></div>
            </div>
            <div class="flex justify-between items-center mt-1">
              <span class="font-label-caps text-label-caps text-on-surface-variant">HP GAUGE</span>
              <span class="font-tabular-stats text-tabular-stats text-on-surface font-semibold tracking-tight" id="opp-hp-text">
                ${oppActive.currentHp}/${oppActive.maxHp} HP · ${oppHpPct}%
              </span>
            </div>
          </div>

          <!-- Opponent Asset Visual -->
          <div class="relative w-44 h-36 mt-1 flex items-center justify-center">
            <div class="absolute inset-x-4 bottom-1 h-5 rounded-full bg-surface-container-lowest/60 blur-sm"></div>
            <img class="w-36 h-36 object-contain z-10 drop-shadow-[0_12px_20px_rgba(0,0,0,0.8)] ${oppActive.isFainted ? 'opacity-30 grayscale' : ''}" src="${oppArtwork}" alt="${escapeHtml(oppActive.name)}"/>
          </div>
        </div>

        <!-- Stage: Player (Bottom-Left) -->
        <div class="relative flex flex-col items-start -mt-6">
          <!-- Player Asset Visual -->
          <div class="relative w-44 h-36 flex items-center justify-center z-10">
            <div class="absolute inset-x-3 bottom-1 h-5 rounded-full bg-surface-container-lowest/60 blur-sm"></div>
            <img class="w-36 h-36 object-contain z-10 drop-shadow-[0_14px_24px_rgba(0,0,0,0.9)] ${playerActive.isFainted ? 'opacity-30 grayscale' : ''}" src="${playerArtwork}" alt="${escapeHtml(playerActive.name)}"/>
          </div>

          <!-- Player Status Hub -->
          <div class="w-64 p-3 rounded-xl bg-surface-container-high shadow-md -mt-3 z-20">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-headline-sm text-headline-sm uppercase text-on-surface tracking-wide truncate mr-2">
                ${escapeHtml((playerActive.name || '').toUpperCase())} <span class="text-tertiary font-tabular-stats text-tabular-stats">Lv.50</span>
              </span>
              <span id="player-status-badge">${getStatusBadge(playerActive.status)}</span>
            </div>
            <!-- HP Gauge -->
            <div class="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
              <div class="h-full bg-tertiary-container rounded-full transition-all duration-500" style="width: ${playerHpPct}%;"></div>
            </div>
            <div class="flex justify-between items-center mt-1">
              <!-- Player Bench (6 Dots) -->
              <div class="flex items-center gap-1" id="player-bench-dots">
                ${playerSideObj.party.map((p, idx) => {
                  const isAlive = !p.isFainted;
                  const isCurrent = idx === playerSideObj.activeIndex;
                  if (isAlive) {
                    return `<span class="w-2 h-2 rounded-full bg-tertiary ${isCurrent ? 'ring-2 ring-tertiary/50' : ''}" title="${escapeHtml(p.name)}"></span>`;
                  }
                  return `<span class="w-2 h-2 rounded-full bg-surface-variant" title="${escapeHtml(p.name)} (fainted)"></span>`;
                }).join('')}
              </div>
              <span class="font-tabular-stats text-tabular-stats text-on-surface font-semibold tracking-tight" id="player-hp-text">
                ${playerActive.currentHp}/${playerActive.maxHp} HP · ${playerHpPct}%
              </span>
            </div>
          </div>
        </div>

        <!-- Center Action Ticker: Battle Log Strip -->
        <div class="w-full mt-3">
          <button class="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm text-left" id="btn-toggle-log" type="button">
            <div class="flex items-center gap-2 truncate">
              <span class="material-symbols-outlined text-[18px] text-primary-container">bolt</span>
              <span class="font-body-sm text-body-sm text-on-surface truncate" id="latest-log-text">${escapeHtml(latestLog)}</span>
            </div>
            <div class="flex items-center gap-1 ml-1 text-on-surface-variant">
              <span class="material-symbols-outlined text-[16px]">history</span>
              <span class="font-label-caps text-[10px]">LOG</span>
            </div>
          </button>
        </div>

        <!-- Selected Action Lock Confirmation Indicator & CTA -->
        <div class="flex flex-col items-center justify-center my-2.5 gap-2">
          <div class="flex items-center gap-1.5 px-3 py-1 rounded-full ${commitState === 'committed' ? 'bg-primary-container text-on-primary-container animate-pulse' : 'bg-surface-container-high text-on-surface'} shadow-md" id="move-lock-badge">
            <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">
              ${commitState === 'committed' ? 'lock' : (isPlayerForcedSwitch ? 'swap_horiz' : 'touch_app')}
            </span>
            <span class="font-label-caps text-label-caps uppercase tracking-wider font-bold" id="move-lock-text">
              ${escapeHtml(lockBadgeText)}
            </span>
          </div>

          ${isBattleCompleted ? `
            <button class="w-full h-12 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform" id="btn-view-result" type="button">
              <span>View Match Results</span>
              <span class="material-symbols-outlined text-[20px]">emoji_events</span>
            </button>
          ` : `
            <button class="w-full h-11 rounded-xl font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
              canLock && commitState === 'pending'
                ? 'bg-primary-container text-on-primary-container hover:brightness-110 active:scale-[0.99] cursor-pointer'
                : 'bg-surface-container-lowest text-on-surface-variant opacity-50 cursor-not-allowed'
            }" id="btn-lock-action" type="button" ${(!canLock || commitState !== 'pending') ? 'disabled' : ''}>
              <span class="material-symbols-outlined text-[18px]">lock</span>
              <span>${commitState === 'committed' ? 'Action Locked' : (isPlayerForcedSwitch ? 'Confirm Switch' : 'Lock Action')}</span>
            </button>
          `}
        </div>

        <!-- Tactical Moves: 2x2 Grid -->
        <div class="grid grid-cols-2 gap-2 mb-2.5" id="moves-grid">
          ${playerActive.moves.map((move, idx) => {
            const hasPp = move.currentPp > 0;
            const isMoveDisabled = !hasPp || isPlayerForcedSwitch || commitState !== 'pending' || isBattleCompleted;
            const isSelected = currentSelection?.type === 'move' && currentSelection.moveName === move.name;

            const bgClass = isSelected
              ? 'bg-surface-container-high ring-2 ring-primary-container'
              : (hasPp ? 'bg-surface-container hover:bg-surface-container-high' : 'bg-surface-container-lowest opacity-40 cursor-not-allowed');

            return `
              <button class="move-card flex flex-col justify-between p-3 h-20 rounded-xl text-left active:scale-[0.98] transition-all shadow-sm ${bgClass}"
                data-move="${escapeHtml(move.name)}"
                data-index="${idx}"
                ${isMoveDisabled ? 'disabled' : ''}
                type="button">
                <div class="flex items-center justify-between w-full">
                  <span class="font-headline-sm text-headline-sm uppercase ${hasPp ? 'text-on-surface' : 'text-on-surface-variant line-through'} leading-tight truncate mr-1">
                    ${escapeHtml(move.name)}
                  </span>
                  <span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase">
                    ${escapeHtml(move.type)}
                  </span>
                </div>
                <div class="flex items-center justify-between w-full">
                  <span class="font-tabular-stats text-tabular-stats ${move.power ? 'text-primary font-bold' : 'text-on-surface-variant'}">
                    ${move.power ? `PWR ${move.power}` : 'PWR —'}
                  </span>
                  <span class="font-tabular-stats text-tabular-stats ${hasPp ? 'text-on-surface-variant' : 'text-error font-bold'}">
                    PP ${move.currentPp}/${move.pp}
                  </span>
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Bench Switch Deck Drawer Trigger -->
        <div class="flex flex-col w-full">
          <button class="flex items-center justify-between w-full h-12 px-4 rounded-xl ${isPlayerForcedSwitch ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface'} active:scale-[0.99] transition-all shadow-sm" id="btn-bench-toggle" type="button" ${commitState !== 'pending' || isBattleCompleted ? 'disabled' : ''}>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px] ${isPlayerForcedSwitch ? 'text-on-secondary-container' : 'text-primary'}">swap_horiz</span>
              <span class="font-headline-sm text-headline-sm uppercase tracking-wider">
                ${isPlayerForcedSwitch ? 'Select Replacement Pokémon' : 'Switch Pokémon'}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="font-label-caps text-label-caps ${isPlayerForcedSwitch ? 'text-on-secondary-container' : 'text-on-surface-variant'}">${readyBenchCount} READY</span>
              <span class="material-symbols-outlined text-[20px] transition-transform duration-200" id="switch-icon">
                ${isBenchOpen || isPlayerForcedSwitch ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </button>

          <!-- Bench Preview Deck (Collapsible) -->
          <div class="grid grid-cols-3 gap-2 mt-2 transition-all duration-300 overflow-hidden ${(!isBenchOpen && !isPlayerForcedSwitch) ? 'hidden' : ''}" id="bench-preview">
            ${playerSideObj.party.map((p, idx) => {
              if (idx === playerSideObj.activeIndex) return '';

              const pInfo = getPokemonById(p.id) || {};
              const pArt = pInfo.artworkUrl || pInfo.spriteUrl || '';
              const isSelected = currentSelection?.type === 'switch' && currentSelection.switchIndex === idx;
              const isFainted = p.isFainted;
              const hpPct = Math.max(0, Math.min(100, Math.round((p.currentHp / p.maxHp) * 100)));

              const cardBg = isSelected
                ? 'bg-surface-container-high ring-2 ring-primary-container'
                : (isFainted ? 'bg-surface-container-lowest opacity-40 cursor-not-allowed' : 'bg-surface-container-low hover:bg-surface-container');

              return `
                <button class="bench-card flex flex-col items-center p-2 rounded-xl text-center active:scale-[0.97] transition-all ${cardBg}"
                  data-index="${idx}"
                  data-name="${escapeHtml(p.name)}"
                  ${(isFainted || commitState !== 'pending' || isBattleCompleted) ? 'disabled' : ''}
                  type="button">
                  <img class="w-10 h-10 object-contain drop-shadow ${isFainted ? 'grayscale' : ''}" src="${pArt}" alt="${escapeHtml(p.name)}"/>
                  <span class="font-headline-sm text-headline-sm uppercase text-on-surface text-[14px] mt-1 leading-tight truncate w-full">
                    ${escapeHtml(p.name)}
                  </span>
                  <div class="w-full h-1 rounded-full bg-surface-variant mt-1.5 overflow-hidden">
                    <div class="h-full bg-tertiary-container rounded-full" style="width: ${hpPct}%;"></div>
                  </div>
                  <span class="font-label-caps text-[10px] text-on-surface-variant mt-0.5">
                    ${p.currentHp}/${p.maxHp}
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Combat Log Full Overlay Modal -->
      ${isLogOpen ? `
        <div class="fixed inset-0 z-50 bg-surface/90 backdrop-blur-md flex flex-col p-4 animate-fadeIn" id="combat-log-modal">
          <div class="flex items-center justify-between pb-3 border-b border-surface-variant">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px] text-primary">history</span>
              <h2 class="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface">Combat Log History</h2>
            </div>
            <button class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:text-primary" id="btn-close-log" type="button">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto py-3 space-y-2">
            ${(battle.log || []).slice().reverse().map(entry => `
              <div class="p-2.5 rounded-lg bg-surface-container text-on-surface font-body-sm flex items-start gap-2">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold shrink-0">
                  T${entry.turn || 0}
                </span>
                <span class="flex-1">${escapeHtml(entry.text)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

    </main>
  `;
}
