/**
 * Tactical Arena Set Break Screen
 * Visual source: design-v2/set_break_phone/code.html & design-v2/set_break_desktop_1280px/code.html
 * Responsive across 390px (mobile), 768px (tablet), and 1280px+ (desktop command cockpit).
 */

export function renderBreakScreen({ matchState, completedSetIndex = 0 }) {
  const sets = matchState.sets || [];
  const completedSet = sets[completedSetIndex] || { name: `Set ${completedSetIndex + 1}`, lots: [] };
  const nextSet = sets[completedSetIndex + 1] || (matchState.acceleratedPool?.length > 0 ? { name: 'Accelerated Round', lots: matchState.acceleratedPool } : null);

  // Sales in this completed set
  const salesInSet = (matchState.salesHistory || []).filter(s => s.setIndex === completedSetIndex);
  const totalLots = completedSet.lots?.length || 0;
  const soldCount = salesInSet.length;
  const unsoldCount = Math.max(0, totalLots - soldCount);
  const clearanceRate = totalLots > 0 ? Math.round((soldCount / totalLots) * 100) : 0;
  const totalSpentInSet = salesInSet.reduce((sum, s) => sum + s.price, 0);
  const avgSpentPerLot = soldCount > 0 ? (totalSpentInSet / soldCount).toFixed(1) : '0';

  // Find top buy of this set
  let topBuy = null;
  if (salesInSet.length > 0) {
    topBuy = [...salesInSet].sort((a, b) => b.price - a.price)[0];
  }

  let topBuyPokemon = null;
  if (topBuy) {
    topBuyPokemon = sets.flatMap(s => s.lots || []).find(l => l.pokemonId === topBuy.pokemonId)?.pokemon;
    if (!topBuyPokemon) {
      for (const p of matchState.players || []) {
        const found = p.team?.find(t => t.pokemon?.id === topBuy.pokemonId || t.pokemonId === topBuy.pokemonId);
        if (found) {
          topBuyPokemon = found.pokemon;
          break;
        }
      }
    }
  }

  const topArtwork = topBuy ? `./assets/sprites/artwork/${topBuy.pokemonId}.png` : '';
  const topStats = topBuyPokemon?.stats || { hp: 80, attack: 100, defense: 80, spAttack: 80, spDefense: 80, speed: 80 };
  const topBST = Object.values(topStats).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const topBuyer = topBuy?.winnerName || 'Anonymous';

  const roomPin = matchState.room || 'PK-940';
  const teamSize = matchState.settings?.teamSize || 6;
  const baseBudget = matchState.settings?.budget || 200;

  // Total lots drafted across entire match so far
  const totalDraftedAll = (matchState.players || []).reduce((sum, p) => sum + (p.team?.length || 0), 0);
  const totalCapacityAll = (matchState.players?.length || 2) * teamSize;

  return `
    <!-- Top HUD Header -->
    <header class="fixed top-0 inset-x-0 z-50 bg-[#080d18]/90 backdrop-blur-xl border-b border-[#162238] shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
      <div class="max-w-[1600px] mx-auto h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button aria-label="Back to home" id="btn-break-back" class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#111a2e] text-[#dde2f5] hover:text-[#ffe033] hover:bg-[#162238] transition-colors border border-[#1e2d4a]">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
              </span>
              <span class="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">TACTICAL INTERMISSION</span>
            </div>
            <h1 class="text-base md:text-lg font-bold text-white uppercase tracking-tight font-display truncate">Set Break</h1>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="hidden sm:flex items-center gap-1.5 bg-[#111a2e] px-3 py-1 rounded-lg border border-[#1e2d4a]">
            <span class="material-symbols-outlined text-[#ffe033] text-[15px]">vpn_key</span>
            <span class="text-xs font-mono text-[#ffe033] font-bold tracking-widest">${escapeHtml(roomPin)}</span>
          </div>
          <div class="flex items-center gap-2 bg-[#111a2e] px-3 py-1 rounded-lg border border-[#1e2d4a]">
            <span class="material-symbols-outlined text-[#ffd000] text-[16px]">timer</span>
            <span id="countdown" class="text-sm font-mono font-bold text-[#ffe033]">READY</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Container -->
    <main class="w-full pt-20 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto">
      
      <!-- Top Intermission Banner Ribbon -->
      <div class="w-full bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl mb-6">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-[#162238] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033] shadow-inner shrink-0">
            <span class="material-symbols-outlined text-[28px]">timelapse</span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-lg md:text-xl font-bold uppercase tracking-tight text-white font-display">
                ${escapeHtml(completedSet.name)} COMPLETE
              </span>
              <span class="px-2 py-0.5 rounded bg-[#1e2d4a] text-[10px] font-bold text-[#00f5ff] uppercase tracking-wider">
                INTERVAL 0${completedSetIndex + 1}/0${sets.length}
              </span>
            </div>
            <span class="text-xs text-[#9aa4bc] mt-0.5">
              Franchise managers reviewing scouting ledgers, cap reserves, and roster depth.
            </span>
          </div>
        </div>

        <!-- Quick Telemetry Badges -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="bg-[#080d18] px-3 py-1.5 rounded-lg border border-[#162238] flex items-center gap-2">
            <span class="text-[11px] text-[#9aa4bc] uppercase tracking-wider font-semibold">Match Roster:</span>
            <span class="text-xs font-mono font-bold text-white">${totalDraftedAll} / ${totalCapacityAll} PKMN</span>
          </div>
          <div class="bg-[#080d18] px-3 py-1.5 rounded-lg border border-[#162238] flex items-center gap-2">
            <span class="text-[11px] text-[#9aa4bc] uppercase tracking-wider font-semibold">Clearance:</span>
            <span class="text-xs font-mono font-bold text-[#10b981]">${clearanceRate}% Flow</span>
          </div>
        </div>
      </div>

      <!-- Main Cockpit Split: Left Command Column + Right Draft Matrix Ledger -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: Set Telemetry, Top Buy Spotlight, Next Set CTA (5 cols on lg+) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          
          <!-- 3-Pillar Set Telemetry Cards -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 shadow-lg flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-3.5 bg-[#ffe033] rounded-full"></span>
                <span class="text-xs font-bold uppercase text-white tracking-wider font-display">${escapeHtml(completedSet.name)} Production</span>
              </div>
              <span class="text-[11px] font-mono text-[#9aa4bc] uppercase">${totalLots} Lots Cleared</span>
            </div>

            <div class="grid grid-cols-3 gap-2.5">
              <!-- Lots Sold -->
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-lg p-3 flex flex-col justify-between shadow-sm">
                <div class="flex items-center justify-between text-[#9aa4bc]">
                  <span class="text-[10px] uppercase font-bold tracking-wider">Sold</span>
                  <span class="material-symbols-outlined text-[15px] text-[#10b981]">gavel</span>
                </div>
                <div class="mt-2">
                  <div class="text-xl md:text-2xl font-bold font-mono text-[#10b981] leading-none">${soldCount}</div>
                  <div class="text-[10px] text-[#9aa4bc] mt-1">${clearanceRate}% Cleared</div>
                </div>
              </div>

              <!-- Lots Passed -->
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-lg p-3 flex flex-col justify-between shadow-sm">
                <div class="flex items-center justify-between text-[#9aa4bc]">
                  <span class="text-[10px] uppercase font-bold tracking-wider">Passed</span>
                  <span class="material-symbols-outlined text-[15px] text-[#ff2a5f]">remove_shopping_cart</span>
                </div>
                <div class="mt-2">
                  <div class="text-xl md:text-2xl font-bold font-mono text-[#ff2a5f] leading-none">${unsoldCount}</div>
                  <div class="text-[10px] text-[#9aa4bc] mt-1">${unsoldCount > 0 ? 'To Accel' : 'None'}</div>
                </div>
              </div>

              <!-- Total Spent -->
              <div class="bg-[#162238] border border-[#1e2d4a] rounded-lg p-3 flex flex-col justify-between shadow-sm">
                <div class="flex items-center justify-between text-[#9aa4bc]">
                  <span class="text-[10px] uppercase font-bold tracking-wider">Purse</span>
                  <span class="material-symbols-outlined text-[15px] text-[#ffe033]">payments</span>
                </div>
                <div class="mt-2">
                  <div class="text-xl md:text-2xl font-bold font-mono text-[#ffe033] leading-none">$${totalSpentInSet}</div>
                  <div class="text-[10px] text-[#9aa4bc] mt-1">Avg $${avgSpentPerLot}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Buy of Set Spotlight -->
          ${topBuy && topBuyPokemon ? `
            <div class="bg-[#162238] border border-[#1e2d4a] rounded-xl p-4 md:p-5 flex flex-col gap-3 relative overflow-hidden shadow-xl">
              <div class="absolute -top-12 -right-12 w-40 h-40 bg-[#ffe033]/10 blur-3xl pointer-events-none rounded-full"></div>
              
              <div class="flex items-center justify-between z-10">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-[#ffe033] text-[#080d18] text-[10px] font-bold uppercase tracking-wider font-display">
                    TOP SET VALUATION
                  </span>
                  <span class="text-[11px] font-mono text-[#9aa4bc]">HAMMER $${topBuy.price}</span>
                </div>
                <div class="flex items-center gap-1 bg-[#111a2e] px-2 py-0.5 rounded text-[#ffd000] text-[10px] font-bold uppercase border border-[#1e2d4a]">
                  <span class="material-symbols-outlined text-[13px]">military_tech</span>
                  <span>MARQUEE</span>
                </div>
              </div>

              <div class="grid grid-cols-12 gap-3 items-center z-10 mt-1">
                <div class="col-span-4 relative group">
                  <div class="w-full h-24 bg-[#111a2e] border border-[#1e2d4a] rounded-lg flex items-center justify-center overflow-hidden shadow-inner p-1">
                    <img class="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]" src="${topArtwork}" alt="${escapeHtml(topBuyPokemon.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                  </div>
                  <div class="absolute bottom-1 left-1 bg-[#080d18]/90 text-white text-[9px] font-mono px-1 py-0.5 rounded border border-[#1e2d4a]">
                    BST ${topBST}
                  </div>
                </div>

                <div class="col-span-8 flex flex-col min-w-0">
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-base md:text-lg font-bold uppercase text-white font-display tracking-tight truncate">${escapeHtml(topBuyPokemon.name)}</span>
                    <span class="text-xl font-bold font-mono text-[#ffe033]">$${topBuy.price}</span>
                  </div>
                  
                  <!-- Types -->
                  <div class="flex items-center gap-1.5 mt-1">
                    ${(topBuyPokemon.types || []).map(t => `
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white shadow-sm" style="background-color: ${getTypeColor(t)}">
                        ${escapeHtml(t)}
                      </span>
                    `).join('')}
                    <span class="text-[11px] text-[#9aa4bc] font-mono">#${topBuyPokemon.id || topBuy.pokemonId}</span>
                  </div>

                  <!-- Winning Franchise Buyer Tag -->
                  <div class="mt-2.5 bg-[#111a2e] p-2 rounded-lg border border-[#1e2d4a] flex items-center justify-between">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-6 h-6 rounded-full bg-[#ffe033] text-[#080d18] font-bold text-xs flex items-center justify-center shrink-0">
                        ${escapeHtml(topBuyer.charAt(0).toUpperCase())}
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="text-xs font-bold text-white uppercase truncate">${escapeHtml(topBuyer)}</span>
                        <span class="text-[9px] text-[#9aa4bc] uppercase tracking-wider">Winning Bidder</span>
                      </div>
                    </div>
                    <span class="text-[10px] font-bold text-[#10b981] uppercase px-1.5 py-0.5 bg-[#10b981]/15 rounded border border-[#10b981]/30">
                      Acquired
                    </span>
                  </div>
                </div>
              </div>

              <!-- Segmented Stat Meter -->
              <div class="bg-[#111a2e] rounded-lg p-2.5 border border-[#1e2d4a] flex flex-col gap-1.5 z-10 mt-1">
                <div class="flex items-center justify-between text-[10px] font-mono text-[#9aa4bc]">
                  <span class="uppercase tracking-wider font-semibold">Combat Stat Matrix</span>
                  <span class="text-white">HP ${topStats.hp} / ATK ${topStats.attack} / DEF ${topStats.defense} / SPE ${topStats.speed}</span>
                </div>
                <div class="grid grid-cols-6 gap-1 h-1.5">
                  <div class="bg-[#10b981] rounded-full h-full" title="HP: ${topStats.hp}"></div>
                  <div class="bg-[#ffe033] rounded-full h-full" title="ATK: ${topStats.attack}"></div>
                  <div class="bg-[#915121] rounded-full h-full" title="DEF: ${topStats.defense}"></div>
                  <div class="bg-[#00f5ff] rounded-full h-full" title="SPA: ${topStats.spAttack}"></div>
                  <div class="bg-[#2980ef] rounded-full h-full" title="SPD: ${topStats.spDefense}"></div>
                  <div class="bg-[#ff2a5f] rounded-full h-full" title="SPE: ${topStats.speed}"></div>
                </div>
              </div>
            </div>
          ` : `
            <div class="bg-[#162238] border border-[#1e2d4a] rounded-xl p-5 text-center text-[#9aa4bc]">
              <span class="material-symbols-outlined text-[32px] text-[#9aa4bc]/40 mb-2">inventory_2</span>
              <p class="text-xs uppercase tracking-wider">No sales recorded in this intermission set.</p>
            </div>
          `}

          <!-- Primary CTA Button (Next Set / Scout Report) -->
          <div class="w-full flex flex-col gap-2">
            <div class="flex items-center justify-between px-1 text-xs text-[#9aa4bc]">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[14px] text-[#00f5ff]">lock_open</span>
                <span class="uppercase font-semibold tracking-wider">
                  ${nextSet ? `Upcoming: ${escapeHtml(nextSet.name)} (${nextSet.lots?.length || 'Full'} Lots)` : 'All Sets Cleared'}
                </span>
              </div>
              <span class="text-[10px] font-bold text-[#10b981] uppercase">Ready</span>
            </div>

            <button id="btn-continue-next-set" class="w-full min-h-[52px] bg-[#ffe033] hover:bg-[#ffd000] active:scale-[0.99] text-[#080d18] rounded-xl font-bold uppercase tracking-wider text-sm md:text-base font-display flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(255,224,51,0.25)] hover:shadow-[0_0_25px_rgba(255,224,51,0.4)]" type="button">
              <span>${nextSet ? `Continue to ${escapeHtml(nextSet.name)}` : 'View Final Scout Report'}</span>
              <span class="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
            </button>
          </div>

        </div>

        <!-- RIGHT COLUMN: Franchise Budget Ledger & Squad Roster Matrix (7 cols on lg+) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          
          <!-- Franchise Budget Ledger Table -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 shadow-lg flex flex-col gap-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#ffe033] text-[20px]">table_chart</span>
                <h3 class="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Franchise Budget Ledger</h3>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-[#9aa4bc] uppercase tracking-wider font-semibold">Base Purse Cap:</span>
                <span class="text-xs font-mono font-bold text-[#ffe033]">$${baseBudget}.00</span>
              </div>
            </div>

            <!-- Ledger Table Container -->
            <div class="overflow-x-auto -mx-1">
              <table class="w-full text-left min-w-[500px]">
                <thead>
                  <tr class="bg-[#080d18] text-[#9aa4bc] text-[10px] font-bold uppercase tracking-wider border-b border-[#1e2d4a]">
                    <th class="py-2.5 px-3 rounded-l-lg">Trainer / Franchise</th>
                    <th class="py-2.5 px-2 text-right">Spent</th>
                    <th class="py-2.5 px-2 text-right">Cap Left</th>
                    <th class="py-2.5 px-2 text-right">Avg / Lot</th>
                    <th class="py-2.5 px-2 text-center">Squad</th>
                    <th class="py-2.5 px-3 text-right rounded-r-lg">Cap Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#162238] text-xs">
                  ${(matchState.players || []).map((p, idx) => {
                    const spend = (p.team || []).reduce((sum, item) => sum + (item.price || 0), 0);
                    const budgetLeft = p.budget;
                    const initialPurse = p.initialBudget || baseBudget;
                    const spendPercent = initialPurse > 0 ? Math.min(100, Math.round((spend / initialPurse) * 100)) : 0;
                    const squadCount = (p.team || []).length;
                    const emptySlots = Math.max(0, teamSize - squadCount);
                    const avg = squadCount > 0 ? (spend / squadCount).toFixed(1) : '-';
                    
                    let statusLabel = 'Stable';
                    let statusColor = 'text-[#10b981] bg-[#10b981]/15 border-[#10b981]/30';
                    if (squadCount >= teamSize) {
                      statusLabel = 'Complete';
                      statusColor = 'text-[#00f5ff] bg-[#00f5ff]/15 border-[#00f5ff]/30';
                    } else if (spendPercent > 65) {
                      statusLabel = 'Aggressive';
                      statusColor = 'text-[#ffe033] bg-[#ffe033]/15 border-[#ffe033]/30';
                    } else if (budgetLeft < emptySlots * (matchState.settings?.startBid || 1)) {
                      statusLabel = 'Reserve Alert';
                      statusColor = 'text-[#ff2a5f] bg-[#ff2a5f]/15 border-[#ff2a5f]/30';
                    }

                    return `
                      <tr class="hover:bg-[#162238]/60 transition-colors">
                        <td class="py-3 px-3">
                          <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg bg-[#162238] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033] font-bold text-xs shrink-0">
                              ${escapeHtml(p.name.charAt(0).toUpperCase())}
                            </div>
                            <div class="flex flex-col min-w-0">
                              <div class="flex items-center gap-1.5">
                                <span class="font-bold text-white uppercase truncate">${escapeHtml(p.name)}</span>
                                ${p.isHost ? '<span class="text-[9px] bg-[#ffd000]/20 text-[#ffd000] px-1 py-0.2 rounded font-bold">HOST</span>' : ''}
                                ${p.isBot ? '<span class="text-[9px] bg-[#00f5ff]/20 text-[#00f5ff] px-1 py-0.2 rounded font-bold">BOT</span>' : ''}
                              </div>
                              <span class="text-[10px] text-[#9aa4bc]">Rank #${idx + 1} Spender</span>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-2 text-right font-mono font-bold text-white">$${spend}</td>
                        <td class="py-3 px-2 text-right font-mono font-bold text-[#10b981]">$${budgetLeft}</td>
                        <td class="py-3 px-2 text-right font-mono text-[#9aa4bc]">$${avg}</td>
                        <td class="py-3 px-2 text-center">
                          <span class="px-2 py-0.5 rounded bg-[#162238] font-mono text-[11px] text-white border border-[#1e2d4a]">
                            ${squadCount}/${teamSize}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor}">
                            ${statusLabel}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Budget Reserve Rule Explainer Note -->
            <div class="bg-[#080d18] border border-[#162238] rounded-lg p-3 flex items-start gap-2.5">
              <span class="material-symbols-outlined text-[16px] text-[#ffe033] shrink-0 mt-0.5">verified_user</span>
              <div class="text-[11px] text-[#9aa4bc] leading-relaxed">
                <span class="text-white font-semibold">Budget Reserve Rule Active:</span> Each franchise must maintain at least 
                <span class="text-[#ffe033] font-mono font-bold">$${matchState.settings?.startBid || 1}</span> for each unfilled squad slot. 
                Maximum bid allowed = <span class="text-white font-mono font-bold">Purse - ((Empty Slots - 1) * Base Price)</span>.
              </div>
            </div>
          </div>

          <!-- Live Squad Roster Cards Deck -->
          <div class="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 md:p-5 shadow-lg flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#00f5ff] text-[20px]">grid_view</span>
                <h3 class="text-sm md:text-base font-bold text-white uppercase tracking-wider font-display">Acquired Squad Rosters</h3>
              </div>
              <span class="text-xs text-[#9aa4bc]">Team Preview Snapshot</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${(matchState.players || []).map(p => {
                const team = p.team || [];
                return `
                  <div class="bg-[#162238] border border-[#1e2d4a] rounded-xl p-3.5 flex flex-col gap-3 shadow-sm">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 min-w-0">
                        <div class="w-6 h-6 rounded bg-[#111a2e] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033] font-bold text-xs shrink-0">
                          ${escapeHtml(p.name.charAt(0).toUpperCase())}
                        </div>
                        <span class="text-xs font-bold text-white uppercase truncate">${escapeHtml(p.name)}</span>
                      </div>
                      <span class="text-[11px] font-mono text-[#ffe033] font-bold">${team.length}/${teamSize} PKMN</span>
                    </div>

                    <!-- Mini Pokemon Slot Tiles -->
                    <div class="grid grid-cols-6 gap-1.5">
                      ${Array.from({ length: teamSize }).map((_, slotIdx) => {
                        const lot = team[slotIdx];
                        if (lot && lot.pokemon) {
                          const pkmn = lot.pokemon;
                          const art = `./assets/sprites/artwork/${pkmn.id || lot.pokemonId}.png`;
                          return `
                            <div class="aspect-square bg-[#111a2e] border border-[#1e2d4a] rounded-lg p-1 flex items-center justify-center relative group" title="${escapeHtml(pkmn.name)} ($${lot.price})">
                              <img class="max-h-full max-w-full object-contain filter drop-shadow" src="${art}" alt="${escapeHtml(pkmn.name)}" onerror="this.onerror=null; this.src='./assets/icons/poke-ball.png';"/>
                              <div class="absolute inset-0 bg-[#080d18]/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-0.5 rounded transition-opacity">
                                <span class="text-[8px] font-mono font-bold text-[#ffe033]">$${lot.price}</span>
                              </div>
                            </div>
                          `;
                        } else {
                          return `
                            <div class="aspect-square bg-[#080d18] border border-dashed border-[#1e2d4a] rounded-lg flex items-center justify-center text-[#9aa4bc]/40">
                              <span class="text-[9px] font-mono">#${slotIdx + 1}</span>
                            </div>
                          `;
                        }
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
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
