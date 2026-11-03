/**
 * Tactical Arena Battle Countdown Screen
 * Responsive across 390px (mobile), 768px (tablet), and 1280px+ (desktop).
 */

export function renderCountdownScreen({
  matchState,
  countdownNumber = 3,
  userPlayerId = null
}) {
  const players = matchState?.players || [];
  const p1 = players[0] || { name: 'Player 1', isReady: true };
  const p2 = players[1] || { name: 'Challenger', isReady: true };
  const roomPin = matchState?.room || 'PK-940';

  const displayNum = String(countdownNumber || '1');

  return `
    <!-- Top HUD Header -->
    <header class="fixed top-0 inset-x-0 z-50 bg-[#080d18]/90 backdrop-blur-xl border-b border-[#162238] shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
      <div class="max-w-[1600px] mx-auto h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button aria-label="Go back" id="btn-countdown-back" class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#111a2e] text-[#dde2f5] hover:text-[#ffe033] hover:bg-[#162238] transition-colors border border-[#1e2d4a]" type="button">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
              </span>
              <span class="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">ARENA DEPLOYMENT</span>
            </div>
            <h1 class="text-base md:text-lg font-bold text-white uppercase tracking-tight font-display truncate">Apex Battle</h1>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="flex items-center gap-1.5 bg-[#111a2e] px-3 py-1 rounded-lg border border-[#1e2d4a]">
            <span class="material-symbols-outlined text-[#ffe033] text-[15px]">vpn_key</span>
            <span class="text-xs font-mono text-[#ffe033] font-bold tracking-widest">${escapeHtml(roomPin)}</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#162238] border border-[#1e2d4a] flex items-center justify-center text-[#ffe033]">
            <span class="material-symbols-outlined text-[18px]">sports_martial_arts</span>
          </div>
        </div>
      </div>
    </header>

    <main class="flex flex-col relative w-full pt-16 bg-[#080d18] min-h-screen">
      <div class="flex-1 w-full max-w-[1280px] mx-auto relative overflow-hidden select-none py-8 px-4 md:px-8 flex flex-col items-center justify-between min-h-[calc(100vh-4rem)]">
        
        <!-- Ambient Volumetric Glow Auras -->
        <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div class="w-[420px] h-[420px] rounded-full bg-[#ffe033]/10 blur-3xl animate-pulse"></div>
          <div class="w-[280px] h-[280px] rounded-full bg-[#00f5ff]/15 blur-2xl animate-ping opacity-60"></div>
        </div>

        <!-- Top Trainer Card -->
        <div class="relative z-10 w-full max-w-[500px] flex flex-col items-center gap-2 pt-4">
          <span class="text-[11px] font-bold uppercase tracking-widest text-[#9aa4bc]">
            Battle Protocol Initiated
          </span>
          <div class="w-full flex items-center justify-between bg-[#111a2e] border border-[#1e2d4a] px-5 py-3 rounded-xl shadow-xl">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-lg bg-[#ffe033] text-[#080d18] font-bold text-sm flex items-center justify-center shrink-0">
                ${escapeHtml(p1.name.charAt(0).toUpperCase())}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm md:text-base font-bold text-white uppercase truncate font-display">
                  ${escapeHtml(p1.name)}
                </span>
                <span class="text-[10px] text-[#9aa4bc] uppercase tracking-wider">Trainer 1</span>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-xs font-bold uppercase px-3 py-1 rounded-full shadow-sm">
              <span class="material-symbols-outlined text-[14px]">check</span>
              Ready ✓
            </span>
          </div>
        </div>

        <!-- Huge Center Countdown Display -->
        <div class="relative z-10 my-auto flex flex-col items-center justify-center">
          <div class="relative flex items-center justify-center">
            <!-- Pulsing Outer Ring -->
            <div class="w-56 h-56 md:w-64 md:h-64 rounded-full border border-[#ffe033]/30 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(255,224,51,0.2)]">
              <div class="w-44 h-44 md:w-52 md:h-52 rounded-full border border-[#00f5ff]/30 flex items-center justify-center">
                <div id="countdown-display" class="font-display text-[96px] md:text-[120px] leading-none font-bold text-[#ffe033] drop-shadow-[0_0_30px_rgba(255,224,51,0.8)] text-center transition-all duration-300 transform scale-100">
                  ${displayNum}
                </div>
              </div>
            </div>
          </div>

          <!-- Step Progression Tracker -->
          <div class="flex items-center justify-center gap-4 mt-6 text-sm font-mono tracking-widest uppercase">
            <span class="px-2 py-0.5 rounded ${displayNum === '3' ? 'bg-[#ffe033] text-[#080d18] font-bold scale-110 shadow-[0_0_12px_rgba(255,224,51,0.6)]' : 'text-[#9aa4bc]'}">3</span>
            <span class="text-[#1e2d4a]">·</span>
            <span class="px-2 py-0.5 rounded ${displayNum === '2' ? 'bg-[#ffe033] text-[#080d18] font-bold scale-110 shadow-[0_0_12px_rgba(255,224,51,0.6)]' : 'text-[#9aa4bc]'}">2</span>
            <span class="text-[#1e2d4a]">·</span>
            <span class="px-2 py-0.5 rounded ${displayNum === '1' ? 'bg-[#ffe033] text-[#080d18] font-bold scale-110 shadow-[0_0_12px_rgba(255,224,51,0.6)]' : 'text-[#9aa4bc]'}">1</span>
          </div>
        </div>

        <!-- Bottom Trainer Card -->
        <div class="relative z-10 w-full max-w-[500px] flex flex-col items-center gap-2 pb-6">
          <div class="w-full flex items-center justify-between bg-[#111a2e] border border-[#1e2d4a] px-5 py-3 rounded-xl shadow-xl">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-lg bg-[#162238] border border-[#1e2d4a] text-white font-bold text-sm flex items-center justify-center shrink-0">
                ${escapeHtml(p2.name.charAt(0).toUpperCase())}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm md:text-base font-bold text-white uppercase truncate font-display">
                  ${escapeHtml(p2.name)}
                </span>
                <span class="text-[10px] text-[#9aa4bc] uppercase tracking-wider">Trainer 2</span>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-xs font-bold uppercase px-3 py-1 rounded-full shadow-sm">
              <span class="material-symbols-outlined text-[14px]">check</span>
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
