/**
 * Scout Report Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/scout_report/code.html
 */

import { generateScoutReport } from '../../engine/scoutReport.js';

export function renderScoutScreen({ matchState, userPlayerId = 'human' }) {
  const report = generateScoutReport(matchState);
  const userReport = report.players.find(p => p.playerId === userPlayerId) || report.players[0];
  const opponentReport = report.players.find(p => p.playerId !== userPlayerId) || report.players[1];

  const roleCov = userReport.roleCoverage?.score ?? 80;
  const typeCov = userReport.typeSynergy?.coverageScore ?? 80;
  const draftGrade = userReport.draftGrade || 'B';
  const overallScore = userReport.overallScore || 75;

  const winChanceObj = report.winChances?.[userReport.playerId] || { percentage: 50 };
  const winPercent = winChanceObj.percentage;

  // Speed outspeeds ratio
  const speedRatio = report.speedComparison
    ? Math.round((report.speedComparison.teamAOutspeeds / Math.max(1, report.speedComparison.teamAOutspeeds + report.speedComparison.teamBOutspeeds)) * 100)
    : 75;

  const bestSteal = userReport.highlights?.bestSteal;
  const overpay = userReport.highlights?.biggestOverpay;
  const mvp = userReport.highlights?.mvpPick;
  const weakness = userReport.highlights?.weaknessAlerts?.[0] || 'Balanced defenses';

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)] pt-safe">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Back" id="btn-scout-back" class="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary-container transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <img alt="Apex Draft Arena Logo" class="h-8 w-auto object-contain" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"/>
          <h1 class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">Scout Report</h1>
        </div>
        <div class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-col w-full pb-margin pt-14 space-y-space-md">
      <!-- Winner Banner -->
      <div class="bg-surface-container rounded-xl p-space-md flex items-center justify-between shadow-md border border-primary-container/30">
        <div class="flex items-center gap-space-sm">
          <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
            <span class="material-symbols-outlined text-[24px]">emoji_events</span>
          </div>
          <div class="flex flex-col">
            <span class="font-label-caps text-label-caps uppercase text-outline">Draft Champion</span>
            <span class="font-headline-sm text-headline-sm uppercase text-primary-container font-bold">${escapeHtml(report.draftWinner)}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="font-numeral-lg text-numeral-lg text-on-surface">${overallScore}</span>
          <span class="font-label-caps text-[10px] text-outline block">Score</span>
        </div>
      </div>

      <!-- 2x2 Score Rings Grid -->
      <div class="grid grid-cols-2 gap-space-md">
        <!-- Draft Grade -->
        <div class="bg-surface-container rounded-xl p-space-md flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden">
          <div class="relative w-20 h-20 flex items-center justify-center mb-space-xs">
            <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path class="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
              <path class="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${overallScore}, 100" stroke-linecap="round" stroke-width="3.5"></path>
            </svg>
            <div class="absolute flex flex-col items-center justify-center">
              <span class="font-headline-md text-headline-md text-primary-container leading-none">${draftGrade}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant font-semibold">${overallScore}</span>
            </div>
          </div>
          <span class="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Draft Grade</span>
        </div>

        <!-- Role Coverage -->
        <div class="bg-surface-container rounded-xl p-space-md flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden">
          <div class="relative w-20 h-20 flex items-center justify-center mb-space-xs">
            <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path class="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
              <path class="text-tertiary-fixed-dim" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${roleCov}, 100" stroke-linecap="round" stroke-width="3.5"></path>
            </svg>
            <div class="absolute flex items-center justify-center">
              <span class="font-numeral-lg text-numeral-lg text-on-surface tabular-nums">${roleCov}%</span>
            </div>
          </div>
          <span class="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Role Coverage</span>
        </div>

        <!-- Type Coverage -->
        <div class="bg-surface-container rounded-xl p-space-md flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden">
          <div class="relative w-20 h-20 flex items-center justify-center mb-space-xs">
            <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path class="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
              <path class="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${typeCov}, 100" stroke-linecap="round" stroke-width="3.5"></path>
            </svg>
            <div class="absolute flex items-center justify-center">
              <span class="font-numeral-lg text-numeral-lg text-on-surface tabular-nums">${typeCov}%</span>
            </div>
          </div>
          <span class="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Type Coverage</span>
        </div>

        <!-- Speed Profile -->
        <div class="bg-surface-container rounded-xl p-space-md flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden">
          <div class="relative w-20 h-20 flex items-center justify-center mb-space-xs">
            <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path class="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
              <path class="text-tertiary-fixed-dim" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${speedRatio}, 100" stroke-linecap="round" stroke-width="3.5"></path>
            </svg>
            <div class="absolute flex items-center justify-center">
              <span class="font-numeral-lg text-numeral-lg text-on-surface tabular-nums">${speedRatio}%</span>
            </div>
          </div>
          <span class="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Speed Profile</span>
        </div>
      </div>

      <!-- Win Chance Bar -->
      <div class="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-xs shadow-md">
        <div class="flex items-center justify-between">
          <span class="font-label-caps text-label-caps uppercase text-on-surface-variant">Estimate</span>
          <span class="font-headline-sm text-headline-sm text-primary-container drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]">${winPercent}% Win Chance</span>
        </div>
        <div class="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden relative">
          <div class="h-full bg-primary-container rounded-full shadow-[0_0_12px_rgba(255,215,0,0.6)]" style="width: ${winPercent}%;"></div>
        </div>
      </div>

      <!-- Highlights 4-Icon Cards Row -->
      <div class="grid grid-cols-2 gap-space-sm">
        <!-- Best Steal -->
        <div class="bg-surface-container rounded-xl p-space-sm flex items-center gap-space-sm shadow-sm">
          <div class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
            <span class="material-symbols-outlined text-[20px]">savings</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-label-caps text-label-caps uppercase text-on-surface-variant truncate">Best Steal</span>
            <span class="font-tabular-stats text-tabular-stats text-on-surface truncate">
              ${bestSteal ? `${escapeHtml(bestSteal.name)} · <span class="text-primary-container">$${bestSteal.price}</span>` : 'None'}
            </span>
          </div>
        </div>

        <!-- Biggest Overpay -->
        <div class="bg-surface-container rounded-xl p-space-sm flex items-center gap-space-sm shadow-sm">
          <div class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
            <span class="material-symbols-outlined text-[20px]">trending_up</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-label-caps text-label-caps uppercase text-on-surface-variant truncate">Overpay</span>
            <span class="font-tabular-stats text-tabular-stats text-on-surface truncate">
              ${overpay ? `${escapeHtml(overpay.name)} · <span class="text-secondary">$${overpay.price}</span>` : 'None'}
            </span>
          </div>
        </div>

        <!-- Weakness Alert -->
        <div class="bg-surface-container rounded-xl p-space-sm flex items-center gap-space-sm shadow-sm">
          <div class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-error shrink-0">
            <span class="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-label-caps text-label-caps uppercase text-on-surface-variant truncate">Weakness</span>
            <span class="font-tabular-stats text-tabular-stats text-error truncate">${escapeHtml(weakness)}</span>
          </div>
        </div>

        <!-- MVP -->
        <div class="bg-surface-container rounded-xl p-space-sm flex items-center gap-space-sm shadow-sm">
          <div class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
            <span class="material-symbols-outlined text-[20px]">military_tech</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-label-caps text-label-caps uppercase text-on-surface-variant truncate">MVP Pick</span>
            <span class="font-tabular-stats text-tabular-stats text-on-surface truncate">
              ${mvp ? `${escapeHtml(mvp.name)}` : 'None'}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="w-full mt-4 flex flex-col gap-2">
        <button id="btn-scout-proceed" class="w-full min-h-[52px] bg-primary-container text-on-primary-container rounded-xl font-headline-md text-headline-md uppercase tracking-wider flex items-center justify-center gap-space-sm active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 hover:brightness-105" type="button">
          <span class="material-symbols-outlined text-[24px]">sports_martial_arts</span>
          <span>Proceed to Squad Select</span>
        </button>
        <button id="btn-scout-new" class="w-full min-h-[44px] bg-surface-container-high text-outline hover:text-on-surface rounded-xl font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-space-sm transition-all" type="button">
          <span class="material-symbols-outlined text-[20px]">replay</span>
          <span>New Match</span>
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
