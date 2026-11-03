/**
 * Tactical Arena Squad Select & Team Preview Screen
 * Visual source: design-v2/squad_select_phone/code.html & design-v2/squad_select_desktop_1280px/code.html
 * Responsive across 390px (mobile), 768px (tablet), and 1280px+ (desktop command cockpit).
 */

import { getPokemonById } from '../../engine/pokemonData.js';
import { computeSquadWarnings } from '../../engine/squadSelect.js';

export function renderSquadSelectScreen({
  matchState,
  userPlayerId,
  selectedIds = [],
  leadId = null,
  timerSeconds = 30,
  totalTimerSeconds = 30,
  isLocked = false
}) {
  const players = matchState?.players || [];
  const self = players.find(p => p.id === userPlayerId) || players[0] || { team: [] };
  const opponent = players.find(p => p.id !== self.id) || { name: 'Rival', team: [] };

  const fullTeam = (self.team || []).map(t => {
    const id = t.pokemonId !== undefined ? t.pokemonId : t.id;
    return getPokemonById(id);
  }).filter(Boolean);

  const selectedPokemon = selectedIds.map(id => getPokemonById(id)).filter(Boolean);
  const warnings = computeSquadWarnings(selectedPokemon);

  const targetCount = Math.min(6, fullTeam.length);
  const pickedCount = selectedIds.length;
  const isComplete = pickedCount === targetCount;

  // Lead Pokémon
  const currentLead = getPokemonById(leadId) || selectedPokemon[0] || fullTeam[0];

  // Opponent preview team
  const opponentTeam = (opponent.team || []).map(t => {
    const id = t.pokemonId !== undefined ? t.pokemonId : t.id;
    return getPokemonById(id);
  }).filter(Boolean);

  // SVG ring circumference for 48px circle (r=20 -> 2*PI*20 = 125.6)
  const circumference = 125.6;
  const ratio = totalTimerSeconds > 0 ? (timerSeconds / totalTimerSeconds) : 0;
  const strokeOffset = (circumference * (1 - ratio)).toFixed(1);

  const roomPin = matchState?.room || 'PK-940';
  const progressPercent = targetCount > 0 ? Math.min(100, Math.round((pickedCount / targetCount) * 100)) : 0;

  return `
    <!-- Top HUD Header -->
    <header class="fixed top-0 inset-x-0 z-50 bg-[#080d18]/90 backdrop-blur-xl border-b border-[#162238] shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
      <div class="max-w-[1600px] mx-auto h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button aria-label="Go back" id="btn-squad-back" class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#111a2e] text-[#dde2f5] hover:text-[#ffe033] hover:bg-[#162238] transition-colors border border-[#1e2d4a]" type="button">
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
            <h1 class="text-base md:text-lg font-bold text-white uppercase tracking-tight font-display truncate">Squad Select</h1>
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
    <main class="w-full pt-20 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen">
      
      <!-- Top Matchup Telemetry Bar -->
      <div class="w-full bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-[#162238] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033] shrink-0 shadow-inner">
            <span class="material-symbols-outlined text-[22px]">swords</span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="text-base md:text-lg font-bold uppercase tracking-tight text-white font-display">PREVIEW STAGE</span>
              <span class="px-2 py-0.5 rounded bg-[#1e2d4a] text-[10px] font-bold text-[#00f5ff] uppercase tracking-wider">
                6V6 SINGLES
              </span>
            </div>
            <span class="text-xs text-[#9aa4bc] mt-0.5">
              Select your battle 6 and designate your lead opener before lock deadline.
            </span>
          </div>
        </div>

        <!-- 30s Deliberation Countdown Micro-Widget -->
        <div class="flex items-center gap-3 bg-[#080d18] px-3 py-1.5 rounded-xl border border-[#1e2d4a]">
          <div class="relative flex items-center justify-center w-10 h-10">
            <svg class="w-10 h-10 -rotate-90" viewBox="0 0 48 48">
              <circle class="text-[#162238]" cx="24" cy="24" fill="none" r="20" stroke="currentColor" stroke-width="3.5"></circle>
              <circle id="squad-timer-ring" class="text-[#ffe033] transition-all duration-300" cx="24" cy="24" fill="none" r="20" stroke="currentColor" stroke-dasharray="125.6" stroke-dashoffset="${strokeOffset}" stroke-linecap="round" stroke-width="3.5"></circle>
            </svg>
            <div id="squad-timer-val" class="absolute inset-0 flex items-center justify-center font-mono text-xs text-white font-bold">
              ${timerSeconds}s
            </div>
          </div>
          <div class="flex flex-col">
            <span class="text-[9px] uppercase font-bold text-[#9aa4bc] tracking-wider">Lock Clock</span>
            <span class="text-xs font-bold uppercase ${timerSeconds <= 10 ? 'text-[#ff2a5f] animate-pulse' : 'text-[#ffe033]'}">
              ${timerSeconds <= 10 ? 'URGENT' : 'DELIBERATING'}
            </span>
          </div>
        </div>
      </div>

      <!-- Tactical Threat Radar Warning Chips -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-5">
        ${warnings.map(w => {
          const isDanger = w.type === 'danger';
          const isWarning = w.type === 'warning';
          const badgeStyle = isDanger 
            ? 'bg-[#ff2a5f]/20 text-[#ff2a5f] border-[#ff2a5f]/30' 
            : isWarning 
              ? 'bg-[#ffd000]/20 text-[#ffd000] border-[#ffd000]/30' 
              : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30';
          return `
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 border ${badgeStyle} shadow-sm">
              <span class="material-symbols-outlined text-[14px]">${escapeHtml(w.icon)}</span>
              <span>${escapeHtml(w.text)}</span>
            </div>
          `;
        }).join('')}
        ${warnings.length === 0 ? `
          <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30">
            <span class="material-symbols-outlined text-[14px]">verified</span>
            <span>BALANCED COMBAT PROFILE</span>
          </div>
        ` : ''}
      </div>

      <!-- Main Multi-Column Cockpit Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT PANEL: Squad Status, Designated Lead Opener (3 cols on xl) -->
        <div class="xl:col-span-3 flex flex-col gap-5">
          
          <!-- Squad Deployment Status Card -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 shadow-lg flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-[10px] font-bold uppercase tracking-widest text-[#9aa4bc]">Roster Deployment</span>
                <div class="flex items-baseline gap-1.5 mt-0.5">
                  <span id="picked-count-display" class="text-3xl font-bold font-mono text-[#ffe033] leading-none">${pickedCount} of ${targetCount}</span>
                  <span class="text-sm font-mono text-[#9aa4bc]">Picked</span>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isComplete ? 'text-[#10b981] bg-[#10b981]/15 border-[#10b981]/30' : 'text-[#ffe033] bg-[#ffe033]/15 border-[#ffe033]/30'}">
                ${isComplete ? 'READY' : 'SELECTING'}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-[#080d18] h-2 rounded-full overflow-hidden flex border border-[#1e2d4a] p-0.5 shadow-inner">
              <div class="bg-[#ffe033] h-full rounded-full transition-all duration-300" style="width: ${progressPercent}%;"></div>
            </div>
          </div>

          <!-- Designated Lead Opener Card -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 shadow-lg flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#ffd000] text-[18px]">flag</span>
                <span class="text-xs font-bold text-white uppercase tracking-wider font-display">Designated Lead</span>
              </div>
              <span class="text-[9px] font-bold uppercase text-[#00f5ff] px-1.5 py-0.5 bg-[#00f5ff]/15 rounded border border-[#00f5ff]/30">Phase 1 Opener</span>
            </div>

            ${currentLead ? `
              <div class="bg-[#162238] border border-[#1e2d4a] p-3 rounded-xl flex items-center gap-3 relative overflow-hidden">
                <div class="w-14 h-14 rounded-lg bg-[#111a2e] border border-[#1e2d4a] flex items-center justify-center p-1 shrink-0">
                  <img class="max-h-full max-w-full object-contain filter drop-shadow" src="${currentLead.artworkUrl || currentLead.spriteUrl || (currentLead.id ? `./assets/sprites/artwork/${currentLead.id}.png` : '')}" alt="${escapeHtml(currentLead.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm font-bold text-white uppercase truncate font-display">${escapeHtml(currentLead.name)}</span>
                    <span class="text-[10px] text-[#9aa4bc] font-mono">#${currentLead.id}</span>
                  </div>
                  <div class="flex items-center gap-1 mt-1">
                    ${(currentLead.types || []).map(t => `
                      <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase text-white shadow-sm" style="background-color: ${getTypeColor(t)}">
                        ${escapeHtml(t)}
                      </span>
                    `).join('')}
                  </div>
                  <span class="text-[10px] text-[#ffe033] font-semibold mt-1 truncate">${escapeHtml(currentLead.role || 'All-rounder')}</span>
                </div>
              </div>
            ` : `
              <p class="text-xs text-[#9aa4bc]">No lead designated yet.</p>
            `}

            <!-- Choose / Cycle Lead CTA -->
            <button id="btn-choose-lead" class="w-full h-10 rounded-lg bg-[#162238] hover:bg-[#1e2d4a] text-white border border-[#1e2d4a] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2" type="button">
              <span class="material-symbols-outlined text-[16px] text-[#ffe033]">swap_horiz</span>
              <span>Change Opener: ${escapeHtml(currentLead ? currentLead.name : 'Choose')}</span>
            </button>
          </div>

        </div>

        <!-- CENTER DECK: Combatants Selection Grid (6 cols on xl) -->
        <div class="xl:col-span-6 flex flex-col gap-4">
          
          <div class="flex items-center justify-between bg-[#111a2e] border border-[#1e2d4a] px-4 py-2.5 rounded-xl">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#ffe033] text-[20px]">group_work</span>
              <span class="text-xs md:text-sm font-bold text-white uppercase tracking-wider font-display">Active Combatants Roster</span>
            </div>
            <span class="text-xs font-mono text-[#ffe033] font-bold">${fullTeam.length} Drafted Total</span>
          </div>

          <!-- Squad Cards Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="squad-grid">
            ${fullTeam.map(p => {
              const isSelected = selectedIds.includes(p.id);
              const isLead = currentLead && currentLead.id === p.id;
              const cardBorder = isSelected 
                ? 'border-[#ffe033] bg-[#162238] shadow-[0_0_15px_rgba(255,224,51,0.2)]' 
                : 'border-[#1e2d4a] bg-[#111a2e] opacity-60 hover:opacity-100 hover:border-[#9aa4bc]/40';

              return `
                <div class="squad-card relative rounded-xl p-3 border ${cardBorder} flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]" data-id="${p.id}" data-selected="${isSelected}">
                  
                  <!-- Top Row: #ID + Lead Badge + Indicator Check -->
                  <div class="flex items-start justify-between z-10">
                    <div class="flex items-center gap-1 flex-wrap">
                      <span class="text-[10px] font-mono text-[#9aa4bc]">#${p.id}</span>
                      ${isLead ? '<span class="px-1.5 py-0.2 rounded bg-[#ffe033] text-[#080d18] text-[9px] uppercase font-bold">LEAD</span>' : ''}
                    </div>
                    <div class="w-6 h-6 rounded-full ${isSelected ? 'bg-[#ffe033] text-[#080d18]' : 'bg-[#1e2d4a] text-[#9aa4bc]'} flex items-center justify-center shadow-md">
                      <span class="material-symbols-outlined text-[16px] font-bold">${isSelected ? 'check' : 'add'}</span>
                    </div>
                  </div>

                  <!-- Pokémon Artwork -->
                  <div class="relative w-full h-24 my-1.5 flex items-center justify-center p-1">
                    <img class="max-h-full max-w-full object-contain filter drop-shadow ${isSelected ? '' : 'grayscale-[30%]'}" src="${p.artworkUrl || p.spriteUrl || (p.id ? `./assets/sprites/artwork/${p.id}.png` : '')}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                  </div>

                  <!-- Name, Types, Role -->
                  <div class="z-10 flex flex-col gap-1">
                    <span class="text-xs md:text-sm font-bold uppercase text-white tracking-tight truncate font-display">${escapeHtml(p.name)}</span>
                    <div class="flex flex-wrap gap-1">
                      ${(p.types || []).map(t => `
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase text-white shadow-sm" style="background-color: ${getTypeColor(t)}">
                          ${escapeHtml(t)}
                        </span>
                      `).join('')}
                    </div>
                    <span class="text-[10px] text-[#ffe033] font-semibold truncate mt-0.5">${escapeHtml(p.role || 'All-rounder')}</span>
                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>

        <!-- RIGHT PANEL: Opponent Recon Preview + Lock Team Action (3 cols on xl) -->
        <div class="xl:col-span-3 flex flex-col gap-5">
          
          <!-- Opponent Live Recon Preview Card -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 shadow-lg flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#ff2a5f] text-[18px]">visibility</span>
                <span class="text-xs font-bold text-white uppercase tracking-wider font-display">Opponent Recon</span>
              </div>
              <span class="text-[10px] font-mono text-[#9aa4bc] uppercase">${escapeHtml(opponent.name || 'Rival')}</span>
            </div>

            <!-- Opponent Mini Pokemon Grid (6 Units) -->
            <div class="grid grid-cols-3 gap-2">
              ${opponentTeam.slice(0, 6).map(op => `
                <div class="bg-[#162238] border border-[#1e2d4a] rounded-lg p-1.5 flex flex-col items-center gap-1 shadow-sm">
                  <div class="w-8 h-8 rounded-full bg-[#111a2e] border border-[#1e2d4a] flex items-center justify-center overflow-hidden">
                    <img class="w-full h-full object-contain p-0.5" src="${op.spriteUrl || op.artworkUrl || (op.id ? `./assets/sprites/artwork/${op.id}.png` : '')}" alt="${escapeHtml(op.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                  </div>
                  <span class="text-[9px] font-bold uppercase text-white truncate w-full text-center">${escapeHtml(op.name.slice(0, 7))}</span>
                </div>
              `).join('')}
              ${opponentTeam.length === 0 ? '<span class="col-span-3 text-center text-[#9aa4bc] text-xs py-2">No opponent Pokémon visible</span>' : ''}
            </div>
          </div>

          <!-- Primary Lock Team CTA -->
          <div class="w-full flex flex-col gap-2">
            ${isLocked ? `
              <button disabled class="w-full min-h-[52px] rounded-xl bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 flex items-center justify-center gap-2 shadow-sm font-bold text-sm uppercase tracking-wider font-display" type="button">
                <span class="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Team Locked · Ready</span>
              </button>
            ` : isComplete ? `
              <button id="btn-lock-team" class="w-full min-h-[52px] bg-[#ffe033] hover:bg-[#ffd000] active:scale-[0.99] text-[#080d18] rounded-xl font-bold uppercase tracking-wider text-sm md:text-base font-display flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,224,51,0.25)] hover:shadow-[0_0_25px_rgba(255,224,51,0.4)]" type="button">
                <span class="material-symbols-outlined text-[20px] font-bold">lock</span>
                <span>Lock Team & Ready</span>
              </button>
            ` : `
              <button disabled class="w-full min-h-[52px] rounded-xl bg-[#162238] text-[#9aa4bc] opacity-50 cursor-not-allowed border border-[#1e2d4a] flex items-center justify-center gap-2 shadow-sm font-bold text-xs uppercase tracking-wider font-display" type="button">
                <span class="material-symbols-outlined text-[18px]">lock_clock</span>
                <span>Lock Team (Select ${targetCount - pickedCount} More)</span>
              </button>
            `}
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
