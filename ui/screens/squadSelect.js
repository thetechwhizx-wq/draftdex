/**
 * Squad Select & Team Preview Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/squad_select_team_preview/code.html
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

  // SVG ring circumference
  const circumference = 125.6;
  const ratio = totalTimerSeconds > 0 ? (timerSeconds / totalTimerSeconds) : 0;
  const strokeOffset = (circumference * (1 - ratio)).toFixed(1);

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Go back" id="btn-squad-back" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button">
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
      <div class="flex flex-col w-full pb-6 px-gutter">
        
        <!-- Top Bar Utility: Timer & Fast Meta Status -->
        <div class="flex items-center justify-between py-space-sm">
          <div class="flex items-center gap-space-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></span>
            <span class="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Live Draft Phase</span>
          </div>
          <!-- Countdown Ring Indicator -->
          <div class="relative flex items-center justify-center w-12 h-12 bg-surface-container-high rounded-full shadow-md">
            <svg class="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle class="text-surface-variant" cx="24" cy="24" fill="none" r="20" stroke="currentColor" stroke-width="3"></circle>
              <circle id="squad-timer-ring" class="text-primary-container transition-all duration-300" cx="24" cy="24" fill="none" r="20" stroke="currentColor" stroke-dasharray="125.6" stroke-dashoffset="${strokeOffset}" stroke-linecap="round" stroke-width="3"></circle>
            </svg>
            <div id="squad-timer-val" class="absolute inset-0 flex items-center justify-center font-label-caps text-label-caps text-on-surface font-bold tracking-tight">
              ${timerSeconds}s
            </div>
          </div>
        </div>

        <!-- Warning Chips Row -->
        <div class="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-space-xs">
          ${warnings.map(w => {
            const isDanger = w.type === 'danger';
            const isWarning = w.type === 'warning';
            const bgClass = isDanger || isWarning ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant';
            return `
              <div class="flex items-center gap-1.5 px-3 py-1 ${bgClass} rounded-full shrink-0 shadow-sm">
                <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">${escapeHtml(w.icon)}</span>
                <span class="font-label-caps text-label-caps uppercase font-bold tracking-wider">${escapeHtml(w.text)}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Header Section: Title & Selection Counter -->
        <div class="flex items-end justify-between mt-space-md mb-space-sm">
          <div class="flex flex-col">
            <span class="font-label-caps text-label-caps text-primary uppercase tracking-widest font-semibold">Competitive Arena</span>
            <h2 class="font-headline-md text-headline-md uppercase text-on-surface tracking-wide leading-none">Choose Your Battle Team</h2>
          </div>
          <div class="bg-surface-container-high px-3 py-1 rounded-full shrink-0">
            <span id="picked-count-display" class="font-tabular-stats text-tabular-stats text-primary font-bold">${pickedCount} of ${targetCount}</span>
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase ml-1">Picked</span>
          </div>
        </div>

        <!-- Player's Squad Cards Grid (2 Columns) -->
        <div class="grid grid-cols-2 gap-space-sm mb-space-lg" id="squad-grid">
          ${fullTeam.map(p => {
            const isSelected = selectedIds.includes(p.id);
            const isLead = currentLead && currentLead.id === p.id;
            const containerClass = isSelected
              ? 'relative bg-surface-container-high rounded-xl p-space-sm flex flex-col justify-between shadow-lg overflow-hidden transition-all duration-200 ring-1 ring-primary-container cursor-pointer'
              : 'relative bg-surface-container-low rounded-xl p-space-sm flex flex-col justify-between shadow-sm opacity-60 hover:opacity-100 transition-all duration-200 cursor-pointer';

            return `
              <div class="squad-card ${containerClass}" data-id="${p.id}" data-selected="${isSelected}">
                ${isSelected ? '<div class="absolute inset-0 bg-primary-container/10 pointer-events-none"></div>' : ''}
                <div class="flex items-start justify-between z-10">
                  <div class="flex items-center gap-1">
                    <span class="font-label-caps text-label-caps text-on-surface-variant font-semibold tracking-wider">#${p.id}</span>
                    ${isLead ? '<span class="px-1.5 py-0.2 rounded bg-primary-container text-on-primary-container font-label-caps text-[10px] uppercase font-bold">Lead</span>' : ''}
                  </div>
                  <div class="w-6 h-6 rounded-full ${isSelected ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center shadow-md">
                    <span class="material-symbols-outlined text-[16px] font-bold">${isSelected ? 'check' : 'add'}</span>
                  </div>
                </div>

                <div class="relative w-full h-24 my-1 flex items-center justify-center">
                  <img class="w-full h-full object-contain ${isSelected ? 'drop-shadow-md' : 'grayscale-[30%]'} rounded-lg" src="${p.artworkUrl || p.spriteUrl}" alt="${escapeHtml(p.name)}"/>
                </div>

                <div class="z-10 flex flex-col gap-1 mt-1">
                  <span class="font-headline-sm text-headline-sm uppercase text-on-surface tracking-wide leading-tight">${escapeHtml(p.name)}</span>
                  <div class="flex flex-wrap gap-1">
                    ${(p.types || []).map(t => `
                      <span class="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-caps text-label-caps uppercase">${escapeHtml(t)}</span>
                    `).join('')}
                  </div>
                  <span class="font-body-sm text-body-sm text-primary font-semibold tracking-tight mt-0.5">${escapeHtml(p.role || 'All-rounder')}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Team Preview Section: Opponent's 6 Pokémon & Lead Selector -->
        <div class="bg-surface-container-low rounded-xl p-space-sm mb-space-lg flex flex-col gap-space-sm shadow-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[18px] text-error">visibility</span>
              <span class="font-label-caps text-label-caps uppercase tracking-wider text-on-surface font-bold">Opponent Roster Preview</span>
            </div>
            <!-- Choose Lead Selector Tool -->
            <button id="btn-choose-lead" class="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-variant hover:bg-surface-bright text-on-surface transition-colors cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[15px] text-primary">flag</span>
              <span class="font-label-caps text-label-caps uppercase tracking-wider font-semibold">Lead: ${escapeHtml(currentLead ? currentLead.name : 'Choose')}</span>
              <span class="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>

          <!-- Opponent Compact Icon Cards (6 Units) -->
          <div class="grid grid-cols-6 gap-2">
            ${opponentTeam.slice(0, 6).map(op => `
              <div class="bg-surface-container-high rounded-lg p-1.5 flex flex-col items-center gap-1 shadow-sm">
                <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden">
                  <img class="w-full h-full object-cover" src="${op.spriteUrl || op.artworkUrl}" alt="${escapeHtml(op.name)}"/>
                </div>
                <span class="font-label-caps text-label-caps text-on-surface-variant truncate w-full text-center">${escapeHtml(op.name.slice(0, 5))}</span>
              </div>
            `).join('')}
            ${opponentTeam.length === 0 ? '<span class="col-span-6 text-center text-outline text-xs py-2">No opponent Pokémon visible</span>' : ''}
          </div>
        </div>

        <!-- Primary CTA Action -->
        <div class="w-full">
          ${isLocked ? `
            <button disabled class="w-full h-[52px] rounded-xl bg-surface-container-high text-emerald-400 border border-emerald-500/40 flex items-center justify-center gap-2 shadow-sm font-headline-sm text-headline-sm uppercase tracking-wider font-bold" type="button">
              <span class="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Team Locked · Ready</span>
            </button>
          ` : isComplete ? `
            <button id="btn-lock-team" class="w-full h-[52px] rounded-xl bg-primary-container text-on-primary-container active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 font-headline-sm text-headline-sm uppercase tracking-wider font-bold transition-all hover:brightness-105" type="button">
              <span class="material-symbols-outlined text-[20px]">lock</span>
              <span>Lock Team & Ready</span>
            </button>
          ` : `
            <button disabled class="w-full h-[52px] rounded-xl bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm font-headline-sm text-headline-sm uppercase tracking-wider font-bold transition-all" type="button">
              <span class="material-symbols-outlined text-[20px]">lock_clock</span>
              <span>Lock Team (Select ${targetCount - pickedCount} More)</span>
            </button>
          `}
        </div>

      </div>
    </main>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
