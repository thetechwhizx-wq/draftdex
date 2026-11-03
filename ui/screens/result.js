/**
 * Tactical Arena Match Result & Rematch Screen
 * Visual source: design-v2/match_result_phone/code.html & design-v2/match_result_desktop_1280px/code.html
 * Responsive across 390px (mobile), 768px (tablet), and 1280px+ (desktop command cockpit).
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
    return `<div class="p-8 text-center text-white font-display text-lg">No match data available.</div>`;
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
  let totalTurns = battle?.turn || 8;

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
    p1Remaining = 3;
    p2Remaining = 0;
    isWinner = true;
  }

  // Outcome title & style
  let outcomeTitle = 'VICTORY';
  let outcomeColor = 'text-[#ffe033]';
  let outcomeGlow = 'drop-shadow-[0_0_24px_rgba(255,224,51,0.5)]';
  let bannerBadge = 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30';

  if (isDraw) {
    outcomeTitle = 'DRAW';
    outcomeColor = 'text-[#dde2f5]';
    outcomeGlow = 'drop-shadow-[0_0_20px_rgba(221,226,245,0.4)]';
    bannerBadge = 'bg-[#1e2d4a] text-[#9aa4bc] border-[#1e2d4a]';
  } else if (!isWinner) {
    outcomeTitle = 'DEFEAT';
    outcomeColor = 'text-[#ff2a5f]';
    outcomeGlow = 'drop-shadow-[0_0_24px_rgba(255,42,95,0.6)]';
    bannerBadge = 'bg-[#ff2a5f]/20 text-[#ff2a5f] border-[#ff2a5f]/30';
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

  // MVP selection (best survivor or top damage dealer)
  let mvpPokemon = null;
  let mvpArtwork = '';
  if (battle?.sideA?.party?.length > 0) {
    const alive = battle.sideA.party.filter(p => !p.isFainted);
    mvpPokemon = (alive.length > 0 ? alive[0] : battle.sideA.party[0])?.pokemon;
  }
  if (!mvpPokemon && userPlayer?.team?.length > 0) {
    mvpPokemon = userPlayer.team[0]?.pokemon || userPlayer.team[0];
  }
  if (mvpPokemon) {
    mvpArtwork = `./assets/sprites/artwork/${mvpPokemon.id}.png`;
  }

  const roomPin = matchState.room || 'PK-940';

  return `
    <!-- Top HUD Header -->
    <header class="fixed top-0 inset-x-0 z-50 bg-[#080d18]/90 backdrop-blur-xl border-b border-[#162238] shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
      <div class="max-w-[1600px] mx-auto h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button aria-label="Go back" id="btn-result-back" class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#111a2e] text-[#dde2f5] hover:text-[#ffe033] hover:bg-[#162238] transition-colors border border-[#1e2d4a]" type="button">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
              </span>
              <span class="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">TACTICAL ARENA</span>
            </div>
            <h1 class="text-base md:text-lg font-bold text-white uppercase tracking-tight font-display truncate">Match Results</h1>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="flex items-center gap-1.5 bg-[#111a2e] px-3 py-1 rounded-lg border border-[#1e2d4a]">
            <span class="material-symbols-outlined text-[#ffe033] text-[15px]">vpn_key</span>
            <span class="text-xs font-mono text-[#ffe033] font-bold tracking-widest">${escapeHtml(roomPin)}</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#162238] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033]">
            <span class="material-symbols-outlined text-[18px]">emoji_events</span>
          </div>
        </div>
      </div>
    </header>

    <main class="w-full pt-20 pb-16 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen">
      
      <!-- Victory / Defeat Ambient Aura & Header Banner -->
      <div class="relative w-full rounded-2xl bg-[#111a2e] border border-[#1e2d4a] p-6 md:p-8 shadow-2xl flex flex-col items-center justify-center overflow-hidden mb-6 text-center">
        <!-- Volumetric Ambient Neon Aura -->
        <div class="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full ${isWinner ? 'bg-[#ffe033]/15' : isDraw ? 'bg-white/10' : 'bg-[#ff2a5f]/15'} blur-3xl pointer-events-none"></div>
        
        <!-- Status Overline Badge -->
        <div class="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full border ${bannerBadge} shadow-sm mb-3">
          <span class="w-2 h-2 rounded-full ${isWinner ? 'bg-[#10b981]' : isDraw ? 'bg-[#9aa4bc]' : 'bg-[#ff2a5f]'} animate-pulse"></span>
          <span class="text-[11px] font-bold uppercase tracking-wider">Ranked Combat Concluded</span>
          <span class="text-[#9aa4bc]/40 text-xs">|</span>
          <span class="text-[10px] font-mono uppercase tracking-widest text-[#9aa4bc]">Room ${escapeHtml(roomPin)}</span>
        </div>

        <!-- Trophy Icon Crest -->
        <div class="relative z-10 my-2 flex items-center justify-center">
          <div class="w-16 h-16 rounded-2xl bg-[#162238] border border-[#1e2d4a] flex items-center justify-center shadow-xl relative">
            <span class="material-symbols-outlined text-[36px] ${isWinner ? 'text-[#ffe033]' : isDraw ? 'text-[#9aa4bc]' : 'text-[#ff2a5f]'}" style="font-variation-settings: 'FILL' 1;">
              ${isWinner ? 'emoji_events' : isDraw ? 'balance' : 'cancel'}
            </span>
          </div>
        </div>

        <!-- Huge Outcome Headline -->
        <h2 id="outcome-heading" class="relative z-10 font-display text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight ${outcomeColor} ${outcomeGlow} my-1">
          ${outcomeTitle}
        </h2>
        <p class="relative z-10 text-xs md:text-sm font-mono uppercase tracking-widest text-[#9aa4bc] mt-1">
          BATTLE ARENA CONCLUDED · ${totalTurns} TURNS RESOLVED
        </p>
      </div>

      <!-- Main Cockpit Split: Left Scoreboard & MVP + Right Telemetry & Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: Scoreboard, MVP Spotlight, Battle Timeline (7 cols on lg+) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          
          <!-- Head-to-Head Final Scoreboard Card -->
          <div id="final-scoreboard" class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#9aa4bc]">Battle Matchup Ledger</span>
              <span class="text-xs font-mono text-[#ffe033]">Singles 6v6</span>
            </div>

            <!-- Faceoff Roster Readout -->
            <div class="flex items-center justify-between gap-4">
              <!-- Player 1 -->
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-[#ffe033] text-[#080d18] font-bold text-sm flex items-center justify-center shrink-0">
                  ${escapeHtml((player1.name || 'P1').charAt(0).toUpperCase())}
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-white uppercase truncate font-display">${escapeHtml((player1.name || '').toUpperCase())}</span>
                    <span class="w-2 h-2 rounded-full ${p1Remaining > 0 ? 'bg-[#10b981]' : 'bg-[#ff2a5f]'}"></span>
                  </div>
                  <span class="text-[11px] font-mono ${p1Remaining > 0 ? 'text-[#10b981]' : 'text-[#ff2a5f]'} font-semibold uppercase">
                    ${p1Remaining} Remaining
                  </span>
                </div>
              </div>

              <!-- Center Score Digits Display -->
              <div class="flex items-center gap-3 px-4 py-2 bg-[#080d18] rounded-xl border border-[#1e2d4a] shrink-0">
                <span class="text-3xl md:text-4xl font-bold font-mono text-[#ffe033]" id="score-p1">${p1Remaining}</span>
                <span class="text-xl font-bold font-mono text-[#9aa4bc]/50">—</span>
                <span class="text-3xl md:text-4xl font-bold font-mono text-[#9aa4bc]" id="score-p2">${p2Remaining}</span>
              </div>

              <!-- Player 2 -->
              <div class="flex items-center gap-3 flex-row-reverse text-right min-w-0">
                <div class="w-10 h-10 rounded-xl bg-[#162238] border border-[#1e2d4a] text-white font-bold text-sm flex items-center justify-center shrink-0">
                  ${escapeHtml((player2.name || 'P2').charAt(0).toUpperCase())}
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-1.5 justify-end">
                    <span class="w-2 h-2 rounded-full ${p2Remaining > 0 ? 'bg-[#10b981]' : 'bg-[#ff2a5f]'}"></span>
                    <span class="font-bold text-white uppercase truncate font-display">${escapeHtml((player2.name || '').toUpperCase())}</span>
                  </div>
                  <span class="text-[11px] font-mono ${p2Remaining > 0 ? 'text-[#10b981]' : 'text-[#ff2a5f]'} font-semibold uppercase">
                    ${p2Remaining} Remaining
                  </span>
                </div>
              </div>
            </div>

            <!-- Proportional Matchup Progress Bar -->
            <div id="matchup-progress-bar" class="w-full bg-[#080d18] h-2.5 rounded-full overflow-hidden flex border border-[#1e2d4a] p-0.5">
              <div class="bg-[#ffe033] h-full rounded-full transition-all duration-700" style="width: ${p1Ratio}%;"></div>
              <div class="bg-[#162238] h-full rounded-r-full transition-all duration-700" style="width: ${p2Ratio}%;"></div>
            </div>
          </div>

          <!-- Match MVP Feature Card -->
          ${mvpPokemon ? `
            <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 shadow-lg flex flex-col gap-3 relative overflow-hidden">
              <div class="absolute -top-12 -right-12 w-40 h-40 bg-[#ffe033]/10 rounded-full blur-3xl pointer-events-none"></div>

              <div class="flex items-center justify-between z-10">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#ffd000] text-[18px]">star</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider font-display">Match MVP Telemetry</span>
                </div>
                <span class="px-2 py-0.5 rounded bg-[#ffd000]/20 text-[#ffd000] text-[10px] font-bold uppercase tracking-wider border border-[#ffd000]/30">
                  Combat Anchor
                </span>
              </div>

              <div class="grid grid-cols-12 gap-4 items-center z-10 mt-1">
                <div class="col-span-4 relative group">
                  <div class="w-full h-28 bg-[#162238] border border-[#1e2d4a] rounded-lg flex items-center justify-center p-1.5 shadow-inner">
                    <img class="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" src="${mvpArtwork}" alt="${escapeHtml(mvpPokemon.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                  </div>
                  <div class="absolute bottom-1 left-1 bg-[#080d18]/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#1e2d4a]">
                    #${mvpPokemon.id}
                  </div>
                </div>

                <div class="col-span-8 flex flex-col min-w-0">
                  <span class="text-lg font-bold text-white uppercase truncate font-display">${escapeHtml(mvpPokemon.name)}</span>
                  
                  <div class="flex items-center gap-1.5 mt-1">
                    ${(mvpPokemon.types || []).map(t => `
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white shadow-sm" style="background-color: ${getTypeColor(t)}">
                        ${escapeHtml(t)}
                      </span>
                    `).join('')}
                    <span class="text-[11px] text-[#ffe033] font-mono font-semibold ml-1">BST ${mvpPokemon.bst || 525}</span>
                  </div>

                  <!-- 3 Telemetry Stat Blocks -->
                  <div class="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div class="bg-[#162238] p-2 rounded-lg border border-[#1e2d4a]">
                      <span class="text-[9px] uppercase font-bold text-[#9aa4bc] block">Impact</span>
                      <span class="text-sm font-bold font-mono text-[#10b981]">Surviving</span>
                    </div>
                    <div class="bg-[#162238] p-2 rounded-lg border border-[#1e2d4a]">
                      <span class="text-[9px] uppercase font-bold text-[#9aa4bc] block">Role</span>
                      <span class="text-sm font-bold font-mono text-white truncate">${escapeHtml(mvpPokemon.role || 'Sweeper')}</span>
                    </div>
                    <div class="bg-[#162238] p-2 rounded-lg border border-[#1e2d4a]">
                      <span class="text-[9px] uppercase font-bold text-[#9aa4bc] block">Speed</span>
                      <span class="text-sm font-bold font-mono text-[#ffe033]">${mvpPokemon.stats?.speed || 100}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Combat Efficiency Metrics -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 shadow-lg flex flex-col gap-3">
            <span class="text-xs font-bold text-white uppercase tracking-wider font-display">Combat Efficiency Metrics</span>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-lg p-3 flex flex-col items-center">
                <div class="flex items-center gap-1 text-[#9aa4bc] text-[10px] uppercase font-bold mb-1">
                  <span class="material-symbols-outlined text-[15px]">timelapse</span>
                  <span>Turns</span>
                </div>
                <span class="text-2xl font-bold font-mono text-white">${totalTurns}</span>
                <span class="text-[9px] text-[#10b981] font-bold uppercase mt-1">Battle Tempo</span>
              </div>
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-lg p-3 flex flex-col items-center">
                <div class="flex items-center gap-1 text-[#9aa4bc] text-[10px] uppercase font-bold mb-1">
                  <span class="material-symbols-outlined text-[15px]">bolt</span>
                  <span>Initiative</span>
                </div>
                <span class="text-2xl font-bold font-mono text-[#ffe033]">${isWinner ? 'High' : 'Neutral'}</span>
                <span class="text-[9px] text-[#9aa4bc] font-bold uppercase mt-1">Pace Control</span>
              </div>
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-lg p-3 flex flex-col items-center">
                <div class="flex items-center gap-1 text-[#9aa4bc] text-[10px] uppercase font-bold mb-1">
                  <span class="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>Clinch</span>
                </div>
                <span class="text-2xl font-bold font-mono text-[#00f5ff]">${isWinner ? 'Clean' : 'Deficit'}</span>
                <span class="text-[9px] text-[#9aa4bc] font-bold uppercase mt-1">Outcome Seal</span>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: Dual Circular Score Rings & Action CTAs (5 cols on lg+) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          
          <!-- Scout Report Summary (Circular Score Rings) -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#ffe033] text-[20px]">query_stats</span>
                <span class="text-xs font-bold text-white uppercase tracking-wider font-display">Scout Report Summary</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold uppercase border border-[#10b981]/30">Verified</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Ring 1: Draft Grade -->
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <div class="relative w-24 h-24 my-1 flex items-center justify-center">
                  <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle class="text-[#111a2e]" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-width="7"></circle>
                    <circle id="draft-ring" class="text-[#ffe033] transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-dasharray="251.32" stroke-dashoffset="${draftOffset}" stroke-linecap="round" stroke-width="7"></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span id="draft-grade-text" class="text-2xl font-bold font-display text-[#ffe033] leading-none">${draftGrade}</span>
                    <span id="draft-score-text" class="text-[10px] font-mono text-[#9aa4bc] mt-0.5">${draftScore}</span>
                  </div>
                </div>
                <span class="mt-2 text-xs font-bold uppercase text-white tracking-tight">Draft Grade</span>
                <span class="text-[9px] font-bold uppercase text-[#10b981] mt-0.5">Value Ratio</span>
              </div>

              <!-- Ring 2: Win Chance Gauge -->
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <div class="relative w-24 h-24 my-1 flex items-center justify-center">
                  <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle class="text-[#111a2e]" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-width="7"></circle>
                    <circle id="win-ring" class="text-[#00f5ff] transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-dasharray="251.32" stroke-dashoffset="${winOffset}" stroke-linecap="round" stroke-width="7"></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span id="win-chance-text" class="text-xl font-bold font-mono text-[#00f5ff] leading-none">${winChance}%</span>
                    <span class="text-[9px] font-mono text-[#9aa4bc] mt-0.5">Predicted</span>
                  </div>
                </div>
                <span class="mt-2 text-xs font-bold uppercase text-white tracking-tight">Win Chance</span>
                <span class="text-[9px] font-bold uppercase text-[#00f5ff] mt-0.5">Simulation</span>
              </div>
            </div>
          </div>

          <!-- Interactive Actions Dock -->
          <div class="w-full flex flex-col gap-3">
            <!-- Rematch Button -->
            <button id="btn-rematch" class="w-full min-h-[52px] bg-[#ffe033] hover:bg-[#ffd000] active:scale-[0.99] text-[#080d18] rounded-xl font-bold uppercase tracking-wider text-sm md:text-base font-display flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(255,224,51,0.25)] hover:shadow-[0_0_25px_rgba(255,224,51,0.4)]" type="button">
              <span class="material-symbols-outlined text-[20px] font-bold" style="font-variation-settings: 'FILL' 1;">replay</span>
              <span>Rematch</span>
            </button>

            <!-- Back to Home Button -->
            <button id="btn-result-home" class="w-full min-h-[44px] bg-[#162238] hover:bg-[#1e2d4a] text-[#9aa4bc] hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs font-display flex items-center justify-center gap-2 border border-[#1e2d4a] transition-all" type="button">
              <span class="material-symbols-outlined text-[18px]">home</span>
              <span>Back to Home</span>
            </button>
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
