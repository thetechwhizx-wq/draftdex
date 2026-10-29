/**
 * Battle Countdown Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/battle_countdown/code.html
 */

export function renderCountdownScreen({
  matchState,
  countdownNumber = 3,
  userPlayerId = null
}) {
  const players = matchState?.players || [];
  const p1 = players[0] || { name: 'Player 1', isReady: true };
  const p2 = players[1] || { name: 'Challenger', isReady: true };

  const displayNum = String(countdownNumber || '1');

  return `
    <header class="fixed top-0 w-full max-w-[390px] md:max-w-[768px] z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-14 px-gutter flex items-center justify-between">
        <div class="flex items-center gap-space-sm">
          <button aria-label="Go back" id="btn-countdown-back" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button">
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
      <div class="flex flex-col w-full relative overflow-hidden select-none bg-[#0B111E] py-8 px-gutter items-center justify-between min-h-[calc(100vh-3.5rem)]">
        
        <!-- Ambient Background Glow -->
        <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div class="w-[320px] h-[320px] rounded-full bg-primary-container/20 blur-3xl animate-ping opacity-40"></div>
          <div class="w-[220px] h-[220px] rounded-full bg-secondary-container/30 blur-2xl animate-pulse opacity-60"></div>
        </div>

        <!-- Top Trainer Banner -->
        <div class="relative z-10 w-full flex flex-col items-center gap-space-sm pt-space-md">
          <span class="font-label-caps text-label-caps uppercase tracking-widest text-primary-fixed/80">
            Battle starts
          </span>
          <div class="flex items-center gap-space-sm bg-surface-container-lowest/80 px-space-md py-space-xs rounded-full shadow-md">
            <span class="font-headline-md text-headline-md tracking-wider text-on-surface uppercase font-bold">
              ${escapeHtml(p1.name)}
            </span>
            <span class="inline-flex items-center gap-1 bg-[#123620] text-[#75f991] font-label-caps text-label-caps uppercase px-space-sm py-0.5 rounded-full shadow-sm">
              Ready ✓
            </span>
          </div>
        </div>

        <!-- Huge Center Countdown Number -->
        <div class="relative z-10 my-auto flex flex-col items-center justify-center">
          <div id="countdown-display" class="font-headline-lg text-[88px] leading-[88px] tracking-tight uppercase text-primary-container font-extrabold drop-shadow-[0_0_24px_rgba(255,85,64,0.7)] text-center transition-all duration-300 transform scale-100">
            ${displayNum}
          </div>
          <div class="flex items-center justify-center gap-space-md mt-space-sm opacity-60 font-headline-sm text-headline-sm text-primary-fixed tracking-widest uppercase">
            <span class="${displayNum === '3' ? 'text-primary-container font-bold scale-110' : ''}">3</span>
            <span class="text-primary-container">·</span>
            <span class="${displayNum === '2' ? 'text-primary-container font-bold scale-110' : ''}">2</span>
            <span class="text-primary-container">·</span>
            <span class="${displayNum === '1' ? 'text-primary-container font-bold scale-110' : ''}">1</span>
          </div>
        </div>

        <!-- Bottom Trainer Banner -->
        <div class="relative z-10 w-full flex flex-col items-center gap-space-sm pb-space-lg">
          <div class="flex items-center gap-space-sm bg-surface-container-lowest/80 px-space-md py-space-xs rounded-full shadow-md">
            <span class="font-headline-md text-headline-md tracking-wider text-on-surface uppercase font-bold">
              ${escapeHtml(p2.name)}
            </span>
            <span class="inline-flex items-center gap-1 bg-[#123620] text-[#75f991] font-label-caps text-label-caps uppercase px-space-sm py-0.5 rounded-full shadow-sm">
              Ready ✓
            </span>
          </div>
        </div>

      </div>
    </main>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
