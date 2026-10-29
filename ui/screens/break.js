/**
 * Set Break Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/set_break/code.html
 */

export function renderBreakScreen({ matchState, completedSetIndex = 0 }) {
  const completedSet = matchState.sets[completedSetIndex] || { name: `Set ${completedSetIndex + 1}`, lots: [] };
  const nextSet = matchState.sets[completedSetIndex + 1] || (matchState.acceleratedPool.length > 0 ? { name: 'Accelerated Round' } : null);

  // Analyze sales in the completed set
  const salesInSet = (matchState.salesHistory || []).filter(s => s.setIndex === completedSetIndex);
  const soldCount = salesInSet.length;
  const unsoldCount = (completedSet.lots?.length || 0) - soldCount;

  // Top buy of this set
  let topBuy = null;
  if (salesInSet.length > 0) {
    topBuy = [...salesInSet].sort((a, b) => b.price - a.price)[0];
  }

  const topBuyPokemon = topBuy ? matchState.sets.flatMap(s => s.lots).find(l => l.pokemonId === topBuy.pokemonId)?.pokemon : null;
  const topArtwork = topBuy ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${topBuy.pokemonId}.png` : '';

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)] pt-safe">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Back" id="btn-break-back" class="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary-container transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <img alt="Apex Draft Arena Logo" class="h-8 w-auto object-contain" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"/>
          <h1 class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">Set Break</h1>
        </div>
        <div class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-col w-full pb-6 space-y-4 pt-14">
      <!-- Status Chip & Header Bar -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary-fixed font-label-caps text-label-caps tracking-wider uppercase">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-container mr-1.5 animate-pulse"></span>
            ${escapeHtml(completedSet.name)} Complete
          </span>
          <span class="font-tabular-stats text-tabular-stats text-on-surface-variant/70">Break 0${completedSetIndex + 1}/0${matchState.sets.length}</span>
        </div>
        <div class="flex items-center space-x-1 text-on-surface-variant/80">
          <span class="material-symbols-outlined text-[16px] text-primary-fixed">timer</span>
          <span class="font-tabular-stats text-tabular-stats font-bold text-primary-fixed" id="countdown">READY</span>
        </div>
      </div>

      <!-- Set Summary Card -->
      <div class="relative overflow-hidden rounded-xl bg-surface-container p-4 shadow-md">
        <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary-container/10 blur-2xl pointer-events-none"></div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <!-- Sold Cardlet -->
          <div class="rounded-lg bg-surface-container-low p-3 flex flex-col justify-between">
            <div class="flex items-center space-x-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim" style="font-variation-settings: 'FILL' 1;">gavel</span>
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Lots Sold</span>
            </div>
            <div class="mt-2 flex items-baseline space-x-1.5">
              <span class="font-numeral-xl text-numeral-xl text-tertiary-fixed font-bold leading-none">${soldCount}</span>
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Sold</span>
            </div>
          </div>

          <!-- Unsold Cardlet -->
          <div class="rounded-lg bg-surface-container-low p-3 flex flex-col justify-between">
            <div class="flex items-center space-x-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-[18px] text-secondary" style="font-variation-settings: 'FILL' 1;">remove_shopping_cart</span>
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Passed</span>
            </div>
            <div class="mt-2 flex items-baseline space-x-1.5">
              <span class="font-numeral-xl text-numeral-xl text-secondary font-bold leading-none">${Math.max(0, unsoldCount)}</span>
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Unsold</span>
            </div>
          </div>
        </div>

        ${topBuy && topBuyPokemon ? `
          <!-- Top Buy Banner -->
          <div class="rounded-lg bg-surface-container-high p-3 flex items-center justify-between">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-10 h-10 rounded-lg bg-surface-container-lowest flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                <img class="w-full h-full object-contain p-0.5" src="${topArtwork}" alt="${escapeHtml(topBuyPokemon.name)}"/>
                <div class="absolute inset-0 bg-primary-container/10 mix-blend-overlay"></div>
              </div>
              <div class="min-w-0 flex flex-col">
                <div class="flex items-center space-x-1.5">
                  <span class="font-label-caps text-label-caps text-primary-fixed uppercase tracking-wider">Top Buy</span>
                  <span class="text-[10px] text-on-surface-variant/60">•</span>
                  <span class="font-body-sm text-body-sm text-on-surface-variant truncate">${topBuyPokemon.types.join(' / ')}</span>
                </div>
                <span class="font-headline-sm text-headline-sm uppercase text-on-surface tracking-wide truncate">${escapeHtml(topBuyPokemon.name)}</span>
              </div>
            </div>
            <div class="text-right flex flex-col flex-shrink-0 pl-2">
              <span class="font-numeral-lg text-numeral-lg text-primary-container font-extrabold leading-none">$${topBuy.price}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">by <span class="font-headline-sm text-[13px] uppercase text-primary-fixed">${escapeHtml(topBuy.winnerName)}</span></span>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Player Board Section Header -->
      <div class="flex items-center justify-between px-1 pt-1">
        <div class="flex items-center space-x-2">
          <span class="material-symbols-outlined text-[18px] text-primary-fixed">groups</span>
          <span class="font-label-caps text-label-caps uppercase text-on-surface font-semibold tracking-wider">Draft Matrix</span>
        </div>
        <span class="font-body-sm text-body-sm text-on-surface-variant">${matchState.players.length} Active Managers</span>
      </div>

      <!-- Players Table / Matrix -->
      <div class="flex flex-col space-y-2">
        <div class="grid grid-cols-12 gap-2 px-3 py-1 font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant/80">
          <div class="col-span-6">Manager</div>
          <div class="col-span-3 text-right">Spend</div>
          <div class="col-span-3 text-right">Squad</div>
        </div>

        ${matchState.players.map(p => {
          const spend = p.team.reduce((sum, item) => sum + item.price, 0);
          const initial = p.name.charAt(0).toUpperCase();

          return `
            <div class="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg bg-surface-container-low transition-all">
              <div class="col-span-6 flex items-center space-x-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container font-headline-sm text-[14px] flex-shrink-0 font-bold">
                  ${initial}
                </div>
                <div class="min-w-0 flex flex-col">
                  <span class="font-headline-sm text-[15px] uppercase text-on-surface tracking-wide truncate">${escapeHtml(p.name)}</span>
                  <span class="font-body-sm text-[10px] text-on-surface-variant/70 leading-none">Cap remaining: $${p.budget}</span>
                </div>
              </div>
              <div class="col-span-3 text-right font-numeral-lg text-[15px] text-primary-container font-bold">
                $${spend}
              </div>
              <div class="col-span-3 text-right font-tabular-stats text-[13px] text-on-surface">
                ${p.team.length}/${matchState.settings.teamSize}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Primary Action: Continue -->
      <div class="w-full mt-4">
        <button id="btn-continue-next-set" class="w-full min-h-[52px] bg-primary-container text-on-primary-container rounded-xl font-headline-md text-headline-md uppercase tracking-wider flex items-center justify-center gap-space-sm active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 hover:brightness-105" type="button">
          <span class="material-symbols-outlined text-[24px]">arrow_forward</span>
          <span>${nextSet ? `Continue to ${escapeHtml(nextSet.name)}` : 'View Final Scout Report'}</span>
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
