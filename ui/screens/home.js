/**
 * Home / Resume Screen
 * Visual source: design/stitch_pok_mon_draft_auction_webapp/home_resume/code.html
 */

export function renderHomeScreen({ savedMatch, errorNotice, onNewMatch, onResumeMatch, onJoinRoom }) {
  const hasSaved = !!savedMatch;
  const roomCode = savedMatch?.room || '';
  const currentSet = (savedMatch?.currentSetIndex || 0) + 1;
  const currentLot = (savedMatch?.currentLotIndex || 0) + 1;

  return `
    <div class="flex flex-col w-full py-space-xl">
      ${errorNotice ? `
        <div class="mb-space-md p-space-sm rounded-xl bg-error-container/30 border border-error/40 flex items-center gap-space-sm text-error">
          <span class="material-symbols-outlined text-[20px]">warning</span>
          <span class="font-body-sm text-[13px]">${escapeHtml(errorNotice)}</span>
        </div>
      ` : ''}

      <div class="flex flex-col items-center justify-center pt-space-md pb-space-xl">
        <div class="relative flex items-center justify-center w-24 h-24 rounded-full bg-surface-container-high/80 p-2 shadow-xl">
          <div class="absolute inset-0 rounded-full bg-primary-container/10 blur-xl"></div>
          <img alt="Apex Draft Arena Logo" class="relative z-10 w-20 h-20 object-contain drop-shadow-md" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"/>
        </div>
        <div class="mt-space-md flex flex-col items-center">
          <span class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-wider uppercase">Apex Draft</span>
          <span class="font-label-caps text-label-caps text-outline tracking-widest uppercase">Live Auction Room</span>
        </div>
      </div>

      <div class="flex flex-col gap-space-lg w-full mt-space-sm">
        <button id="btn-new-match" class="w-full h-14 bg-primary-container active:scale-[0.98] transition-transform rounded-xl flex items-center justify-center px-space-md shadow-lg shadow-primary-container/20 group" type="button">
          <div class="flex items-center gap-space-sm">
            <span class="material-symbols-outlined text-on-primary-container text-[26px]">add_circle</span>
            <span class="font-headline-md text-headline-md text-on-primary font-bold uppercase tracking-wider">New Match</span>
          </div>
        </button>

        ${hasSaved ? `
          <div class="w-full bg-surface-container rounded-xl p-space-md flex flex-col gap-space-xs shadow-md">
            <div class="flex items-center justify-between">
              <span class="font-label-caps text-label-caps text-outline uppercase tracking-wider">Saved Session</span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-tertiary font-tabular-stats text-tabular-stats">
                <span class="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span>
                Active
              </span>
            </div>
            <button id="btn-resume-match" class="w-full mt-space-xs min-h-[52px] bg-surface-container-high active:bg-surface-container-highest transition-colors rounded-lg flex items-center justify-between px-space-md group" type="button">
              <div class="flex flex-col text-left">
                <span class="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wide group-hover:text-primary-container transition-colors">Resume Match</span>
                <span class="font-tabular-stats text-tabular-stats text-outline">Room #${escapeHtml(roomCode)} · Set ${currentSet}</span>
              </div>
              <span class="material-symbols-outlined text-primary-container text-[24px]">play_arrow</span>
            </button>
          </div>
        ` : ''}

        ${hasSaved ? `
          <button id="btn-clear-data" class="w-full h-10 bg-surface-container-low active:bg-error-container/30 transition-colors rounded-lg flex items-center justify-center gap-space-sm group" type="button">
            <span class="material-symbols-outlined text-outline group-active:text-error text-[18px]">delete_sweep</span>
            <span class="font-label-caps text-label-caps text-outline group-active:text-error uppercase tracking-wider">Clear Saved Data</span>
          </button>
        ` : ''}

        <div class="w-full bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm shadow-md">
          <label class="font-label-caps text-label-caps text-outline uppercase tracking-wider" for="room-code-input">Join Room</label>
          <div class="relative flex items-center w-full bg-surface-container-lowest rounded-lg h-14 px-space-sm">
            <input autocapitalize="characters" autocomplete="off" class="w-full h-full bg-transparent text-center font-numeral-lg text-numeral-lg text-primary tracking-[0.45em] placeholder:text-outline-variant uppercase focus:outline-none pl-4" id="room-code-input" maxlength="6" placeholder="______" spellcheck="false" type="text"/>
            <button aria-label="Enter room" class="flex items-center justify-center w-11 h-11 rounded-lg bg-surface-container-high text-outline hover:text-primary-container hover:bg-surface-container-highest active:scale-95 transition-all shrink-0" id="btn-join-room" type="button">
              <span class="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
