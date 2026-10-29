/**
 * Lobby Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/lobby/code.html
 */

export function renderLobbyScreen({ matchState, copied = false, isHost = true }) {
  const room = matchState.room || 'POKE01';
  const players = matchState.players || [];
  const totalSlots = players.length;

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)] pt-safe">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Back" id="btn-lobby-back" class="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary-container transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <img alt="Apex Draft Arena Logo" class="h-8 w-auto object-contain" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"/>
          <h1 class="font-headline-sm text-headline-sm uppercase text-on-surface truncate">Lobby</h1>
        </div>
        <div class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-col w-full pb-6 space-y-4 pt-14">
      <!-- Room Code Card -->
      <div class="relative bg-surface-container rounded-xl p-4 shadow-lg flex items-center justify-between overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-primary-container/5 blur-2xl pointer-events-none"></div>
        <div class="flex flex-col">
          <span class="font-label-caps text-label-caps uppercase text-outline tracking-wider">Draft Room Code</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="font-headline-lg-mobile text-headline-lg-mobile tracking-widest text-primary-container font-bold" id="roomCode">${escapeHtml(room)}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Spectator Count Pill -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high rounded-full shadow-sm">
            <span class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim" style="font-variation-settings: 'FILL' 1;">visibility</span>
            <span class="font-tabular-stats text-tabular-stats font-bold text-on-surface">1</span>
          </div>
          <!-- Copy Code Button -->
          <button aria-label="Copy Room Code" class="w-12 h-12 rounded-xl bg-surface-container-highest active:bg-primary-container/20 flex items-center justify-center text-primary-container transition-transform active:scale-95 shadow-md" id="copyBtn">
            <span class="material-symbols-outlined text-[22px]" id="copyIcon">${copied ? 'check' : 'content_copy'}</span>
          </button>
        </div>
      </div>

      <!-- Slots Header -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <span class="font-headline-sm text-headline-sm uppercase text-on-surface tracking-wide">Participants</span>
          <span class="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-tabular-stats text-body-sm font-semibold">${players.length} / ${totalSlots}</span>
        </div>
        <span class="font-label-caps text-label-caps uppercase text-outline">Ready Status</span>
      </div>

      <!-- Player Grid -->
      <div class="grid grid-cols-2 gap-3">
        ${players.map((p, index) => {
          const isHost = index === 0 || p.isHost;
          const avatarUrl = isHost
            ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/red.png'
            : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/blue.png';

          return `
            <div class="relative bg-surface-container rounded-xl p-3 flex items-center gap-3 shadow-md">
              <div class="relative flex-shrink-0">
                <img class="w-12 h-12 rounded-lg object-contain bg-surface-container-high p-1" src="${avatarUrl}" alt="${escapeHtml(p.name)}"/>
                <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-surface-container flex items-center justify-center"></span>
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-1">
                  <span class="font-headline-sm text-headline-sm text-on-surface truncate">${escapeHtml(p.name)}</span>
                </div>
                <span class="font-label-caps text-label-caps uppercase ${isHost ? 'text-primary-container font-semibold' : 'text-tertiary-fixed-dim'}">${isHost ? 'Host' : (p.isBot ? 'DexBot' : 'Ready')}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Match Settings Strip -->
      <div class="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2">
        <span class="font-label-caps text-label-caps uppercase text-outline tracking-wider">Match Overview</span>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-surface-container p-2 rounded-lg">
            <span class="font-label-caps text-[10px] text-outline uppercase block">Budget</span>
            <span class="font-numeral-lg text-numeral-lg text-primary-container">$${matchState.settings.budget}</span>
          </div>
          <div class="bg-surface-container p-2 rounded-lg">
            <span class="font-label-caps text-[10px] text-outline uppercase block">Squad</span>
            <span class="font-numeral-lg text-numeral-lg text-primary">${matchState.settings.teamSize} PKMN</span>
          </div>
          <div class="bg-surface-container p-2 rounded-lg">
            <span class="font-label-caps text-[10px] text-outline uppercase block">Start Bid</span>
            <span class="font-numeral-lg text-numeral-lg text-tertiary-fixed-dim">$${matchState.settings.startBid}</span>
          </div>
        </div>
      </div>

      <!-- Primary Action: Start Auction -->
      <div class="w-full mt-4">
        ${isHost ? `
          <button id="btn-start-auction" class="w-full min-h-[52px] bg-primary-container text-on-primary-container rounded-xl font-headline-md text-headline-md uppercase tracking-wider flex items-center justify-center gap-space-sm active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 hover:brightness-105" type="button">
            <span class="material-symbols-outlined text-[24px]">sports_esports</span>
            <span>Start Auction</span>
          </button>
        ` : `
          <button disabled class="w-full min-h-[52px] bg-surface-container-high text-outline rounded-xl font-headline-md text-headline-md uppercase tracking-wider flex items-center justify-center gap-space-sm cursor-not-allowed opacity-80" type="button">
            <span class="material-symbols-outlined text-[24px] animate-spin">sync</span>
            <span>Waiting for Host...</span>
          </button>
        `}
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
