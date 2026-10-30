/**
 * Global Error Handler & Toast Notification
 * Catches window.onerror and unhandledrejection, showing a visible on-screen
 * toast with a summary and a "Copy error details" button so errors never fail silently.
 */

let errorToastEl = null;
let lastErrorDetails = '';

export function initGlobalErrorHandler() {
  if (typeof window === 'undefined') return;

  window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = typeof message === 'string' ? message : (error?.message || 'Unknown error');
    const stack = error?.stack || `${source}:${lineno}:${colno}`;
    showErrorToast({
      title: 'JavaScript Error',
      message: errorMsg,
      details: `${errorMsg}\n\nLocation: ${source}:${lineno}:${colno}\n\nStack:\n${stack}\nRoute: ${window.location.hash}\nUserAgent: ${navigator.userAgent}`
    });
    return false; // Let default browser console logging proceed as well
  };

  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    const errorMsg = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection');
    const stack = reason instanceof Error ? reason.stack : 'No stack available';
    showErrorToast({
      title: 'Unhandled Promise Rejection',
      message: errorMsg,
      details: `${errorMsg}\n\nStack:\n${stack}\nRoute: ${window.location.hash}\nUserAgent: ${navigator.userAgent}`
    });
  });
}

/**
 * Show visible error toast on screen
 * @param {{ title: string, message: string, details: string }} param0
 */
export function showErrorToast({ title = 'Error', message = 'Something went wrong', details = '' }) {
  if (typeof document === 'undefined') return;

  lastErrorDetails = details || message;

  if (!errorToastEl) {
    errorToastEl = document.createElement('div');
    errorToastEl.id = 'global-error-toast';
    errorToastEl.setAttribute('role', 'alert');
    errorToastEl.className = 'fixed z-[99999] bottom-4 left-4 right-4 max-w-[500px] mx-auto p-4 rounded-xl bg-[#2a0808] border-2 border-[#ffb4ab] text-[#ffdad6] shadow-2xl flex flex-col gap-2 font-sans text-sm animate-bounce-once';
    document.body.appendChild(errorToastEl);
  }

  errorToastEl.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-[#ffb4ab] text-[24px]" style="font-variation-settings: 'FILL' 1;">error</span>
        <strong class="font-bold text-white text-[15px]">${escapeHtml(title)}</strong>
      </div>
      <button id="btn-close-error-toast" type="button" aria-label="Close error toast" class="text-[#ffdad6]/70 hover:text-white p-1 -mr-1 -mt-1 rounded hover:bg-white/10 transition-colors">
        <span class="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
    <div class="text-[13px] text-[#ffdad6] leading-snug break-words font-mono bg-black/40 p-2 rounded border border-[#ffb4ab]/20 max-h-24 overflow-y-auto">
      ${escapeHtml(message)}
    </div>
    <div class="flex items-center justify-end gap-2 mt-1">
      <button id="btn-copy-error" type="button" class="px-3 py-1.5 rounded-lg bg-[#93000a] hover:bg-[#ffb4ab] hover:text-[#690005] active:scale-95 text-white font-semibold text-xs transition-all flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">content_copy</span>
        <span id="copy-btn-label">Copy error details</span>
      </button>
    </div>
  `;

  errorToastEl.style.display = 'flex';

  const btnClose = errorToastEl.querySelector('#btn-close-error-toast');
  if (btnClose) {
    btnClose.onclick = () => {
      if (errorToastEl) errorToastEl.style.display = 'none';
    };
  }

  const btnCopy = errorToastEl.querySelector('#btn-copy-error');
  const copyLabel = errorToastEl.querySelector('#copy-btn-label');
  if (btnCopy) {
    btnCopy.onclick = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(lastErrorDetails);
        } else {
          const ta = document.createElement('textarea');
          ta.value = lastErrorDetails;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        if (copyLabel) copyLabel.textContent = 'Copied to clipboard!';
        setTimeout(() => {
          if (copyLabel) copyLabel.textContent = 'Copy error details';
        }, 2000);
      } catch (err) {
        if (copyLabel) copyLabel.textContent = 'Copy failed';
      }
    };
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  initGlobalErrorHandler();
  window.showErrorToast = showErrorToast;
}
