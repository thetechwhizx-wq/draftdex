/**
 * DraftDex Match Result & Rematch Screen
 * Bauhaus dark aesthetic, matching design/stitch_pok_mon_draft_auction_webapp/match_result_rematch/code.html
 *
 * Implements:
 * - Victory / Defeat visual aura with glowing gradients and military_tech icons
 * - Head-to-head Final Score Board with survivor counters and proportional match progress bar
 * - Scout Report Summary with dual circular SVG progress rings (Draft Grade & Win Chance)
 * - Rematch action button and Back to Home navigation
 */

import { generateScoutReport } from '../../engine/scoutReport.js';

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

export function renderResultScreen({
  matchState,
  userPlayerId = 'human'
}) {
  if (!matchState) {
    return `<div class="p-8 text-center text-on-surface font-headline-sm">No match data available.</div>`;
  }

  const players = matchState.players || [];
  const player1 = players[0] || { id: 'p1', name: 'Player 1' };
  const player2 = players[1] || { id: 'p2', name: 'Player 2' };

  const isUserPlayer1 = userPlayerId === player1.id;
  const userPlayer = isUserPlayer1 ? player1 : player2;
  const oppPlayer = isUserPlayer1 ? player2 : player1;

  // Battle survivors calculation
  const battle = matchState.battle;
  let p1Remaining = 0;
  let p2Remaining = 0;
  let isWinner = false;
  let isDraw = false;

  if (battle) {
    p1Remaining = battle.sideA.party.filter(p => !p.isFainted).length;
    p2Remaining = battle.sideB.party.filter(p => !p.isFainted).length;

    const winnerSide = battle.winner;
    if (winnerSide === 'draw') {
      isDraw = true;
    } else if (winnerSide === 'A') {
      isWinner = isUserPlayer1;
    } else if (winnerSide === 'B') {
      isWinner = !isUserPlayer1;
    }
  } else {
    // Fallback if accessed directly
    p1Remaining = 3;
    p2Remaining = 0;
    isWinner = true;
  }

  // Outcome title
  let outcomeTitle = 'VICTORY';
  let outcomeColor = 'text-primary';
  let outcomeGlow = 'drop-shadow-[0_0_24px_rgba(255,85,64,0.65)]';

  if (isDraw) {
    outcomeTitle = 'DRAW';
    outcomeColor = 'text-on-surface';
    outcomeGlow = 'drop-shadow-[0_0_20px_rgba(200,198,197,0.4)]';
  } else if (!isWinner) {
    outcomeTitle = 'DEFEAT';
    outcomeColor = 'text-error';
    outcomeGlow = 'drop-shadow-[0_0_24px_rgba(255,180,171,0.65)]';
  }

  // Final score progress bar
  const totalRemaining = p1Remaining + p2Remaining;
  const p1Ratio = totalRemaining > 0 ? (p1Remaining / totalRemaining) * 100 : 50;
  const p2Ratio = 100 - p1Ratio;

  // Scout report for user
  let scout = null;
  try {
    const opp = isUserPlayer1 ? player2 : player1;
    scout = generateScoutReport(userPlayer, opp, matchState.settings);
  } catch (_) {}

  const draftScore = scout?.overallScore || 92;
  const draftGrade = scout?.grade || 'A';
  const winChance = scout?.winChance || (isWinner ? 74 : 42);

  // SVG circular gauge circumference
  const circumference = 251.32; // 2 * PI * 40
  const draftOffset = (circumference * (1 - (draftScore / 100))).toFixed(1);
  const winOffset = (circumference * (1 - (winChance / 100))).toFixed(1);

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Go back" id="btn-result-back" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button">
            <span class="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 class="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface truncate">Apex Battle</h1>
        </div>
        <div class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen">
      <div class="flex flex-col w-full px-gutter pb-space-lg select-none">

        <!-- Victory Banner Visual Aura -->
        <div class="relative w-full flex flex-col items-center justify-center pt-space-lg pb-space-md overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-64 h-24 bg-primary-container/20 rounded-full blur-2xl"></div>
            <div class="w-40 h-16 bg-tertiary-container/15 rounded-full blur-xl"></div>
          </div>
          <div class="relative flex items-center gap-space-xs mb-space-xs">
            <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings: 'FILL' 1;">military_tech</span>
            <span class="font-label-caps text-label-caps text-primary tracking-widest uppercase">Match Concluded</span>
            <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings: 'FILL' 1;">military_tech</span>
          </div>

          <!-- Large Title: Outcome -->
          <h2 class="relative font-display-auction-mobile text-display-auction-mobile ${outcomeColor} tracking-widest ${outcomeGlow} uppercase text-center" id="outcome-heading">
            ${outcomeTitle}
          </h2>
        </div>

        <!-- Final Score Board -->
        <div class="w-full bg-surface-container-high rounded-xl p-space-md mb-space-lg shadow-xl relative overflow-hidden" id="final-scoreboard">
          <div class="flex items-center justify-between gap-space-sm mb-space-sm">
            <!-- Player 1 Status -->
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${p1Remaining > 0 ? 'bg-primary animate-pulse' : 'bg-surface-variant'}"></span>
                <span class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">${escapeHtml((player1.name || '').toUpperCase())}</span>
              </div>
              <span class="font-label-caps text-label-caps text-primary uppercase">${p1Remaining} Remaining</span>
            </div>

            <!-- Scoreboard Center Display -->
            <div class="flex items-center gap-space-sm px-space-md py-1 bg-surface-container-lowest rounded-lg">
              <span class="font-numeral-xl text-numeral-xl text-primary font-extrabold tabular-nums" id="score-p1">${p1Remaining}</span>
              <span class="font-headline-sm text-headline-sm text-outline-variant font-light">-</span>
              <span class="font-numeral-xl text-numeral-xl text-outline font-extrabold tabular-nums" id="score-p2">${p2Remaining}</span>
            </div>

            <!-- Player 2 Status -->
            <div class="flex flex-col items-end min-w-0">
              <div class="flex items-center gap-1.5 justify-end">
                <span class="font-headline-sm text-headline-sm uppercase text-on-surface-variant truncate">${escapeHtml((player2.name || '').toUpperCase())}</span>
                <span class="w-2 h-2 rounded-full ${p2Remaining > 0 ? 'bg-primary' : 'bg-surface-variant'}"></span>
              </div>
              <span class="font-label-caps text-label-caps text-outline uppercase">${p2Remaining} Remaining</span>
            </div>
          </div>

          <!-- Matchup Progress Bar -->
          <div class="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden flex" id="matchup-progress-bar">
            <div class="bg-primary h-full transition-all duration-700" style="width: ${p1Ratio}%;"></div>
            <div class="bg-surface-variant h-full transition-all duration-700" style="width: ${p2Ratio}%;"></div>
          </div>
        </div>

        <!-- Scout Report Summary (Circular Score Rings) -->
        <div class="w-full bg-surface-container rounded-xl p-space-md mb-space-xl shadow-lg">
          <div class="flex items-center justify-between mb-space-md">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-primary text-[18px]">query_stats</span>
              <span class="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">Scout Report Summary</span>
            </div>
            <span class="font-label-caps text-label-caps uppercase text-tertiary">Verified</span>
          </div>

          <div class="grid grid-cols-2 gap-space-md">
            <!-- Ring 1: Draft Grade -->
            <div class="flex flex-col items-center justify-center p-space-sm bg-surface-container-low rounded-lg">
              <div class="relative w-28 h-28 flex items-center justify-center">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle class="text-surface-container-highest" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-width="7"></circle>
                  <circle class="text-primary transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" id="draft-ring" r="40" stroke="currentColor" stroke-dasharray="251.32" stroke-dashoffset="${draftOffset}" stroke-linecap="round" stroke-width="7"></circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary leading-none" id="draft-grade-text">${draftGrade}</span>
                  <span class="font-tabular-stats text-tabular-stats text-on-surface-variant" id="draft-score-text">${draftScore}</span>
                </div>
              </div>
              <span class="mt-space-sm font-label-caps text-label-caps uppercase text-on-surface-variant">Draft Grade</span>
            </div>

            <!-- Ring 2: Win Chance Gauge -->
            <div class="flex flex-col items-center justify-center p-space-sm bg-surface-container-low rounded-lg">
              <div class="relative w-28 h-28 flex items-center justify-center">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle class="text-surface-container-highest" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-width="7"></circle>
                  <circle class="text-tertiary-container transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" id="win-ring" r="40" stroke="currentColor" stroke-dasharray="251.32" stroke-dashoffset="${winOffset}" stroke-linecap="round" stroke-width="7"></circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="font-headline-lg-mobile text-headline-lg-mobile font-bold text-tertiary-container leading-none" id="win-chance-text">${winChance}%</span>
                  <span class="font-tabular-stats text-tabular-stats text-on-surface-variant">Predicted</span>
                </div>
              </div>
              <span class="mt-space-sm font-label-caps text-label-caps uppercase text-on-surface-variant">Win Chance</span>
            </div>
          </div>
        </div>

        <!-- Interactive Bottom Buttons -->
        <div class="w-full flex flex-col gap-space-sm">
          <!-- Rematch Button -->
          <button class="w-full h-[52px] bg-primary text-on-primary rounded-xl font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-space-xs shadow-lg active:scale-[0.98] transition-all hover:brightness-110" id="btn-rematch" type="button">
            <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">replay</span>
            <span>Rematch</span>
          </button>

          <!-- Back to Home Button -->
          <button class="w-full h-[48px] bg-surface-container-high text-on-surface rounded-xl font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-space-xs active:scale-[0.98] transition-all hover:bg-surface-bright" id="btn-result-home" type="button">
            <span class="material-symbols-outlined text-[20px]">home</span>
            <span>Back to Home</span>
          </button>
        </div>

      </div>
    </main>
  `;
}
