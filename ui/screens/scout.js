/**
 * Tactical Arena Scout Report Screen
 * Visual source: design-v2/scout_report_phone/code.html & design-v2/scout_report_desktop_1280px/code.html
 * Responsive across 390px (mobile), 768px (tablet), and 1280px+ (desktop command cockpit).
 */

import { generateScoutReport } from '../../engine/scoutReport.js';

export function renderScoutScreen({ matchState, userPlayerId = 'human' }) {
  const report = generateScoutReport(matchState);
  const userReport = report.players.find(p => p.playerId === userPlayerId) || report.players[0] || {};
  const opponentReport = report.players.find(p => p.playerId !== userPlayerId) || report.players[1] || {};

  const roleCov = userReport.roleCoverage?.score ?? 80;
  const roleCoveredCount = userReport.roleCoverage?.coveredRoles?.length ?? 5;
  const typeCov = userReport.typeSynergy?.coverageScore ?? 80;
  const typeCount = userReport.typeSynergy?.uniqueTypes?.length ?? 12;
  const draftGrade = userReport.draftGrade || 'B';
  const overallScore = userReport.overallScore || 75;

  const winChanceObj = report.winChances?.[userReport.playerId] || { percentage: 50 };
  const winPercent = winChanceObj.percentage;
  const metaAdvantage = winPercent >= 50 ? `+${(winPercent - 50).toFixed(1)}% META ADVANTAGE` : `${(winPercent - 50).toFixed(1)}% UNDERDOG`;

  // Speed outspeeds ratio
  let speedRatio = 75;
  let speedDetails = 'Speed advantage';
  if (report.speedComparison) {
    const totalMatchups = Math.max(1, report.speedComparison.teamAOutspeeds + report.speedComparison.teamBOutspeeds);
    const userOutspeeds = userReport.playerId === matchState.players?.[0]?.id 
      ? report.speedComparison.teamAOutspeeds 
      : report.speedComparison.teamBOutspeeds;
    speedRatio = Math.round((userOutspeeds / totalMatchups) * 100);
    speedDetails = `${userOutspeeds}/${totalMatchups} Favored`;
  }

  const bestSteal = userReport.highlights?.bestSteal;
  const overpay = userReport.highlights?.biggestOverpay;
  const mvp = userReport.highlights?.mvpPick;
  const weaknessAlerts = userReport.highlights?.weaknessAlerts || [];
  const primaryWeakness = weaknessAlerts[0] || 'Balanced defensive spread';

  const roomPin = matchState.room || 'PK-940';
  const teamSize = matchState.settings?.teamSize || 6;
  const baseBudget = matchState.settings?.budget || 200;
  const userSpent = userReport.totalSpent || (userReport.team || []).reduce((sum, item) => sum + (item.price || 0), 0);
  const userBanked = Math.max(0, baseBudget - userSpent);
  const userSquadCount = (userReport.team || []).length;

  return `
    <!-- Top HUD Header -->
    <header class="fixed top-0 inset-x-0 z-50 bg-[#080d18]/90 backdrop-blur-xl border-b border-[#162238] shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
      <div class="max-w-[1600px] mx-auto h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button aria-label="Back to home" id="btn-scout-back" class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#111a2e] text-[#dde2f5] hover:text-[#ffe033] hover:bg-[#162238] transition-colors border border-[#1e2d4a]">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
              </span>
              <span class="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">TACTICAL AUDIT</span>
            </div>
            <h1 class="text-base md:text-lg font-bold text-white uppercase tracking-tight font-display truncate">Scout Report</h1>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="flex items-center gap-1.5 bg-[#111a2e] px-3 py-1 rounded-lg border border-[#1e2d4a]">
            <span class="material-symbols-outlined text-[#ffe033] text-[15px]">vpn_key</span>
            <span class="text-xs font-mono text-[#ffe033] font-bold tracking-widest">${escapeHtml(roomPin)}</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#162238] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033]">
            <span class="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Container -->
    <main class="w-full pt-20 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto">
      
      <!-- Top Diagnostic Metadata Ribbon -->
      <div class="w-full bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl mb-6">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-[#162238] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033] shadow-inner shrink-0">
            <span class="material-symbols-outlined text-[28px]">analytics</span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-lg md:text-xl font-bold uppercase tracking-tight text-white font-display">
                POST-DRAFT SCOUT REPORT
              </span>
              <span class="px-2 py-0.5 rounded bg-[#10b981]/20 text-[10px] font-bold text-[#10b981] uppercase tracking-wider border border-[#10b981]/30">
                AUDIT VERIFIED
              </span>
            </div>
            <span class="text-xs text-[#9aa4bc] mt-0.5">
              Comprehensive statistical triage calculated against franchise rosters in Room ${escapeHtml(roomPin)}.
            </span>
          </div>
        </div>

        <!-- Winner Telemetry Badge -->
        <div class="flex items-center gap-3 bg-[#080d18] px-4 py-2 rounded-xl border border-[#1e2d4a]">
          <div class="w-8 h-8 rounded-lg bg-[#ffe033]/20 flex items-center justify-center text-[#ffe033]">
            <span class="material-symbols-outlined text-[20px]">emoji_events</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[9px] uppercase font-bold text-[#9aa4bc] tracking-wider">Draft Champion</span>
            <span class="text-sm font-bold uppercase text-[#ffe033] font-display">${escapeHtml(report.draftWinner)}</span>
          </div>
        </div>
      </div>

      <!-- Main Dual Cockpit Layout: Left Analytics + Right Diagnostic Dossier -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: Win Projection, 4 Telemetry Score Rings, Purse Summary (5 cols on lg+) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          
          <!-- Win Chance Tactical Telemetry Bar -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 flex flex-col gap-3 shadow-lg relative overflow-hidden">
            <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-[#ffe033]/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div class="flex items-center justify-between z-10">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold uppercase tracking-widest text-[#9aa4bc]">PROJECTION</span>
                <span class="text-xs text-[#9aa4bc]">· Head-to-Head Estimate</span>
              </div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl md:text-3xl font-bold font-mono text-[#ffe033]">${winPercent}%</span>
                <span class="text-[10px] uppercase font-bold text-[#9aa4bc] tracking-wider">WIN CHANCE</span>
              </div>
            </div>

            <!-- Segmented Progress Bar -->
            <div class="w-full bg-[#080d18] h-3.5 rounded-lg overflow-hidden flex p-0.5 border border-[#1e2d4a] shadow-inner z-10">
              <div class="bg-[#ffe033] h-full rounded-md transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(255,224,51,0.6)]" style="width: ${winPercent}%;"></div>
              <div class="bg-[#162238] h-full rounded-r-md flex-1"></div>
            </div>

            <div class="flex items-center justify-between text-[11px] font-mono text-[#9aa4bc] z-10">
              <span>BASELINE 50.0%</span>
              <span class="${winPercent >= 50 ? 'text-[#10b981]' : 'text-[#ff2a5f]'} flex items-center gap-1 font-semibold">
                <span class="material-symbols-outlined text-[14px]">${winPercent >= 50 ? 'trending_up' : 'trending_down'}</span>
                ${metaAdvantage}
              </span>
            </div>
          </div>

          <!-- 4 Telemetry Score Rings Grid (2x2) -->
          <div class="grid grid-cols-2 gap-3">
            
            <!-- Ring 1: Draft Grade -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-md relative overflow-hidden group hover:border-[#ffe033]/50 transition-colors">
              <div class="w-full flex items-center justify-between text-[9px] font-bold text-[#9aa4bc] uppercase tracking-wider mb-1">
                <span>OVERALL</span>
                <span class="text-[#ffe033]">GRADE</span>
              </div>
              <div class="relative w-24 h-24 my-1 flex items-center justify-center">
                <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path class="text-[#162238]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
                  <path class="text-[#ffe033]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${overallScore}, 100" stroke-linecap="round" stroke-width="3.5"></path>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-2xl font-bold font-display text-[#ffe033] leading-none">${draftGrade}</span>
                  <span class="text-[10px] font-mono text-[#9aa4bc] mt-0.5">${overallScore}/100</span>
                </div>
              </div>
              <span class="text-xs font-bold uppercase text-white tracking-tight mt-1">Draft Grade</span>
              <span class="text-[9px] font-bold text-[#10b981] uppercase mt-0.5">${overallScore >= 80 ? 'Elite Tier' : 'Competitive'}</span>
            </div>

            <!-- Ring 2: Role Coverage -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-md relative overflow-hidden group hover:border-[#00f5ff]/50 transition-colors">
              <div class="w-full flex items-center justify-between text-[9px] font-bold text-[#9aa4bc] uppercase tracking-wider mb-1">
                <span>ARCHETYPES</span>
                <span class="text-[#00f5ff]">${roleCoveredCount}/6 ROLES</span>
              </div>
              <div class="relative w-24 h-24 my-1 flex items-center justify-center">
                <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path class="text-[#162238]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
                  <path class="text-[#00f5ff]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${roleCov}, 100" stroke-linecap="round" stroke-width="3.5"></path>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-xl font-bold font-mono text-[#00f5ff] leading-none">${roleCov}%</span>
                  <span class="text-[9px] font-bold uppercase text-[#9aa4bc] mt-0.5">${roleCov >= 80 ? 'Solid' : 'Imbalanced'}</span>
                </div>
              </div>
              <span class="text-xs font-bold uppercase text-white tracking-tight mt-1">Role Coverage</span>
              <span class="text-[9px] font-bold text-[#9aa4bc] uppercase mt-0.5">Tactical Depth</span>
            </div>

            <!-- Ring 3: Type Coverage -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-md relative overflow-hidden group hover:border-[#10b981]/50 transition-colors">
              <div class="w-full flex items-center justify-between text-[9px] font-bold text-[#9aa4bc] uppercase tracking-wider mb-1">
                <span>OFFENSIVE</span>
                <span class="text-[#10b981]">${typeCount} TYPES</span>
              </div>
              <div class="relative w-24 h-24 my-1 flex items-center justify-center">
                <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path class="text-[#162238]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
                  <path class="text-[#10b981]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${typeCov}, 100" stroke-linecap="round" stroke-width="3.5"></path>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-xl font-bold font-mono text-[#10b981] leading-none">${typeCov}%</span>
                  <span class="text-[9px] font-bold uppercase text-[#9aa4bc] mt-0.5">Synergy</span>
                </div>
              </div>
              <span class="text-xs font-bold uppercase text-white tracking-tight mt-1">Type Coverage</span>
              <span class="text-[9px] font-bold text-[#10b981] uppercase mt-0.5">STAB Supremacy</span>
            </div>

            <!-- Ring 4: Speed Profile -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-md relative overflow-hidden group hover:border-[#ffd000]/50 transition-colors">
              <div class="w-full flex items-center justify-between text-[9px] font-bold text-[#9aa4bc] uppercase tracking-wider mb-1">
                <span>MATCHUPS</span>
                <span class="text-[#ffd000]">${escapeHtml(speedDetails)}</span>
              </div>
              <div class="relative w-24 h-24 my-1 flex items-center justify-center">
                <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path class="text-[#162238]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
                  <path class="text-[#ffd000]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${speedRatio}, 100" stroke-linecap="round" stroke-width="3.5"></path>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-xl font-bold font-mono text-[#ffd000] leading-none">${speedRatio}%</span>
                  <span class="text-[9px] font-bold uppercase text-[#9aa4bc] mt-0.5">Tempo</span>
                </div>
              </div>
              <span class="text-xs font-bold uppercase text-white tracking-tight mt-1">Speed Profile</span>
              <span class="text-[9px] font-bold text-[#ffd000] uppercase mt-0.5">Pace Matchup</span>
            </div>

          </div>

          <!-- Roster Cap Usage Summary Card -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex items-center justify-between shadow-md">
            <div class="flex flex-col">
              <span class="text-[10px] uppercase font-bold text-[#9aa4bc] tracking-wider">Purse Cap Consumed</span>
              <span class="text-base font-bold font-mono text-white mt-0.5">
                $${userSpent} <span class="text-xs font-normal text-[#9aa4bc]">/ $${baseBudget} ($${userBanked} Banked)</span>
              </span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-[10px] uppercase font-bold text-[#9aa4bc] tracking-wider">Slots Acquired</span>
              <span class="text-base font-bold font-mono text-[#00f5ff] mt-0.5">
                ${userSquadCount} <span class="text-xs font-normal text-[#9aa4bc]">/ ${teamSize} Roster</span>
              </span>
            </div>
          </div>

          <!-- Primary Actions Dock -->
          <div class="w-full flex flex-col gap-2.5">
            <button id="btn-scout-proceed" class="w-full min-h-[52px] bg-[#ffe033] hover:bg-[#ffd000] active:scale-[0.99] text-[#080d18] rounded-xl font-bold uppercase tracking-wider text-sm md:text-base font-display flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(255,224,51,0.25)] hover:shadow-[0_0_25px_rgba(255,224,51,0.4)]" type="button">
              <span>PROCEED TO SQUAD SELECT</span>
              <span class="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
            </button>
            <button id="btn-scout-new" class="w-full min-h-[44px] bg-[#162238] hover:bg-[#1e2d4a] text-[#9aa4bc] hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs font-display flex items-center justify-center gap-2 border border-[#1e2d4a] transition-all" type="button">
              <span class="material-symbols-outlined text-[18px]">replay</span>
              <span>NEW MATCH</span>
            </button>
          </div>

        </div>

        <!-- RIGHT COLUMN: 4 Highlight Dossier Cards + Opponent Roster Comparison (7 cols on lg+) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          
          <!-- Tactical Highlights Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#ffe033] text-[20px]">military_tech</span>
              <h3 class="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">
                Tactical Highlights & Roster Audit
              </h3>
            </div>
            <span class="text-xs font-mono text-[#ffe033]">4 AUDIT FLAGS</span>
          </div>

          <!-- 4 Highlight Cards in 2x2 Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Card 1: Best Steal -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col gap-3 shadow-md relative overflow-hidden hover:border-[#10b981]/50 transition-colors">
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold uppercase tracking-wider border border-[#10b981]/30">
                  BEST STEAL
                </span>
                <span class="text-base font-bold font-mono text-[#10b981]">
                  ${bestSteal ? `$${bestSteal.price}` : '-'}
                </span>
              </div>

              ${bestSteal ? `
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-lg bg-[#162238] border border-[#1e2d4a] shrink-0 flex items-center justify-center p-1 overflow-hidden">
                    <img class="max-h-full max-w-full object-contain filter drop-shadow" src="./assets/sprites/artwork/${bestSteal.pokemon?.id || bestSteal.pokemonId || 1}.png" alt="${escapeHtml(bestSteal.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold text-white uppercase truncate font-display">${escapeHtml(bestSteal.name)}</span>
                    <span class="text-[11px] text-[#9aa4bc] truncate mt-0.5">
                      Fair Val $${bestSteal.fairValue || '-'} · +$${bestSteal.valueDiff || 0} surplus
                    </span>
                    <div class="flex items-center gap-1 mt-1">
                      ${(bestSteal.pokemon?.types || []).map(t => `
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase text-white shadow-sm" style="background-color: ${getTypeColor(t)}">
                          ${escapeHtml(t)}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                </div>
              ` : `
                <p class="text-xs text-[#9aa4bc]">No significant draft steal identified.</p>
              `}
            </div>

            <!-- Card 2: Biggest Overpay -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col gap-3 shadow-md relative overflow-hidden hover:border-[#ff8000]/50 transition-colors">
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-[#ff8000]/20 text-[#ff8000] text-[10px] font-bold uppercase tracking-wider border border-[#ff8000]/30">
                  OVERPAY
                </span>
                <span class="text-base font-bold font-mono text-[#ff8000]">
                  ${overpay ? `$${overpay.price}` : '-'}
                </span>
              </div>

              ${overpay ? `
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-lg bg-[#162238] border border-[#1e2d4a] shrink-0 flex items-center justify-center p-1 overflow-hidden">
                    <img class="max-h-full max-w-full object-contain filter drop-shadow" src="./assets/sprites/artwork/${overpay.pokemon?.id || overpay.pokemonId || 1}.png" alt="${escapeHtml(overpay.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold text-white uppercase truncate font-display">${escapeHtml(overpay.name)}</span>
                    <span class="text-[11px] text-[#9aa4bc] truncate mt-0.5">
                      Fair Val $${overpay.fairValue || '-'} · $${Math.abs(overpay.valueDiff || 0)} premium
                    </span>
                    <div class="flex items-center gap-1 mt-1">
                      ${(overpay.pokemon?.types || []).map(t => `
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase text-white shadow-sm" style="background-color: ${getTypeColor(t)}">
                          ${escapeHtml(t)}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                </div>
              ` : `
                <p class="text-xs text-[#9aa4bc]">Draft discipline preserved; no major overpays.</p>
              `}
            </div>

            <!-- Card 3: Weakness Alert -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col gap-2.5 shadow-md relative overflow-hidden hover:border-[#ff2a5f]/50 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-[#ff2a5f]">warning</span>
                  <span class="px-2 py-0.5 rounded bg-[#ff2a5f]/20 text-[#ff2a5f] text-[10px] font-bold uppercase tracking-wider border border-[#ff2a5f]/30">
                    DEFICIT WARNING
                  </span>
                </div>
                <span class="text-[10px] font-bold text-[#ff2a5f] uppercase">VULNERABILITY</span>
              </div>

              <div class="flex flex-col gap-1 mt-1">
                <span class="text-sm font-bold text-white uppercase font-display">${escapeHtml(primaryWeakness)}</span>
                <p class="text-[11px] text-[#9aa4bc] leading-relaxed">
                  Defensive exposure identified in draft pool. Adjust squad lead and switch rotations during team preview.
                </p>
              </div>
            </div>

            <!-- Card 4: MVP Pick -->
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col gap-3 shadow-md relative overflow-hidden hover:border-[#ffe033]/50 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-[#ffe033]">star</span>
                  <span class="px-2 py-0.5 rounded bg-[#ffe033]/20 text-[#ffe033] text-[10px] font-bold uppercase tracking-wider border border-[#ffe033]/30">
                    MVP PICK
                  </span>
                </div>
                <span class="text-base font-bold font-mono text-[#ffe033]">
                  ${mvp ? `BST ${mvp.bst || mvp.pokemon?.bst || 600}` : '-'}
                </span>
              </div>

              ${mvp ? `
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-lg bg-[#162238] border border-[#1e2d4a] shrink-0 flex items-center justify-center p-1 overflow-hidden">
                    <img class="max-h-full max-w-full object-contain filter drop-shadow" src="./assets/sprites/artwork/${mvp.pokemon?.id || mvp.pokemonId || 1}.png" alt="${escapeHtml(mvp.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold text-white uppercase truncate font-display">${escapeHtml(mvp.name)}</span>
                    <span class="text-[11px] text-[#9aa4bc] truncate mt-0.5">
                      Acquired $${mvp.price} · Primary Combat Anchor
                    </span>
                    <div class="flex items-center gap-1 mt-1">
                      ${(mvp.pokemon?.types || []).map(t => `
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase text-white shadow-sm" style="background-color: ${getTypeColor(t)}">
                          ${escapeHtml(t)}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                </div>
              ` : `
                <p class="text-xs text-[#9aa4bc]">Balanced roster anchor.</p>
              `}
            </div>

          </div>

          <!-- Opponent Dossier Comparison Card -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 shadow-lg flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#00f5ff] text-[20px]">compare_arrows</span>
                <h3 class="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">
                  Head-to-Head Franchise Dossier
                </h3>
              </div>
              <span class="text-xs text-[#9aa4bc]">Pre-Match Intelligence</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Player A (User) -->
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-xl p-3.5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-[#ffe033] text-[#080d18] font-bold text-xs flex items-center justify-center">
                      ${escapeHtml(userReport.name?.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <span class="text-xs font-bold text-white uppercase truncate">${escapeHtml(userReport.name || 'You')}</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-[#ffe033]">Grade: ${draftGrade}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-[#9aa4bc]">
                  <span>Overall Score</span>
                  <span class="font-mono font-bold text-white">${overallScore}/100</span>
                </div>
                <div class="flex items-center justify-between text-xs text-[#9aa4bc]">
                  <span>Roster Count</span>
                  <span class="font-mono text-white">${(userReport.team || []).length} Pokémon</span>
                </div>
              </div>

              <!-- Player B (Opponent) -->
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-xl p-3.5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-[#111a2e] text-white border border-[#1e2d4a] font-bold text-xs flex items-center justify-center">
                      ${escapeHtml(opponentReport.name?.charAt(0).toUpperCase() || 'O')}
                    </div>
                    <span class="text-xs font-bold text-white uppercase truncate">${escapeHtml(opponentReport.name || 'Opponent')}</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-[#00f5ff]">Grade: ${opponentReport.draftGrade || 'B'}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-[#9aa4bc]">
                  <span>Overall Score</span>
                  <span class="font-mono font-bold text-white">${opponentReport.overallScore || 70}/100</span>
                </div>
                <div class="flex items-center justify-between text-xs text-[#9aa4bc]">
                  <span>Roster Count</span>
                  <span class="font-mono text-white">${(opponentReport.team || []).length} Pokémon</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </main>
  `;
}

function getTypeColor(type) {
  const map = {
    normal: '#9FA19F', fire: '#E62829', water: '#2980EF', electric: '#FAC000',
    grass: '#3FA129', ice: '#3DCEF3', fighting: '#FF8000', poison: '#8F41CB',
    ground: '#915121', flying: '#81B9EF', psychic: '#EF4179', bug: '#91A119',
    rock: '#AFA981', ghost: '#704170', dragon: '#5060E1', steel: '#60A1B8',
    dark: '#50413F', fairy: '#EF70EF'
  };
  return map[type?.toLowerCase()] || '#6b7280';
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
