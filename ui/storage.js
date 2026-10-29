/**
 * UI State Storage & Validation
 * Saves full match state after every action and restores on reload.
 * Strictly validates data integrity and safely clears corrupt saves.
 */

export const STORAGE_KEY = 'draftdex_saved_match';
export const GUEST_TOKEN_KEY = 'draftdex_guest_token';
export const SESSION_KEY = 'draftdex_session';

/**
 * Get existing guest token or generate and persist a new one.
 * @param {Storage} [storage=window.localStorage]
 * @returns {string}
 */
export function getOrCreateGuestToken(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return 'token_' + Math.random().toString(36).substring(2, 10);
  try {
    let token = storage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
      token = 'token_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      storage.setItem(GUEST_TOKEN_KEY, token);
    }
    return token;
  } catch (err) {
    return 'token_' + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Save active session info (room, isHost, playerId, guestToken).
 * @param {object} session
 * @param {Storage} [storage=window.localStorage]
 */
export function saveSession(session, storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage || !session) return;
  try {
    storage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session info:', err);
  }
}

/**
 * Load active session info.
 * @param {Storage} [storage=window.localStorage]
 * @returns {object|null}
 */
export function loadSession(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Clear active session info.
 * @param {Storage} [storage=window.localStorage]
 */
export function clearSession(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return;
  try {
    storage.removeItem(SESSION_KEY);
  } catch (_) {}
}

/**
 * Validate whether a saved state object is valid and non-corrupt.
 * @param {any} data
 * @returns {boolean}
 */
export function validateMatchSave(data) {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.currentRoute !== 'string') return false;
  const match = data.matchState;
  if (!match || typeof match !== 'object') return false;

  // Verify critical match fields
  if (typeof match.room !== 'string' || match.room.length === 0) return false;
  if (!Array.isArray(match.players) || match.players.length === 0) return false;
  if (!match.settings || typeof match.settings !== 'object') return false;
  if (!Array.isArray(match.sets)) return false;

  // Verify players have id and budget
  for (const p of match.players) {
    if (!p.id || typeof p.budget !== 'number' || !Array.isArray(p.team)) {
      return false;
    }
  }

  return true;
}

/**
 * Save match state and active route to localStorage.
 * @param {object} matchState
 * @param {string} currentRoute
 * @param {Storage} [storage=window.localStorage]
 */
export function saveMatch(matchState, currentRoute, storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage || !matchState) return;
  try {
    const payload = {
      savedAt: Date.now(),
      currentRoute,
      matchState
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save match state to storage:', err);
  }
}

/**
 * Load and validate saved match state.
 * If data is corrupt or invalid, clears it and returns an error notice without crashing.
 * @param {Storage} [storage=window.localStorage]
 * @returns {{ matchState: object|null, currentRoute: string|null, errorNotice?: string }}
 */
export function loadMatch(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return { matchState: null, currentRoute: null };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { matchState: null, currentRoute: null };

    const parsed = JSON.parse(raw);
    if (!validateMatchSave(parsed)) {
      storage.removeItem(STORAGE_KEY);
      return {
        matchState: null,
        currentRoute: null,
        errorNotice: 'Saved match data was invalid or corrupted and has been cleared.'
      };
    }

    return {
      matchState: parsed.matchState,
      currentRoute: parsed.currentRoute
    };
  } catch (err) {
    try { storage.removeItem(STORAGE_KEY); } catch (_) {}
    return {
      matchState: null,
      currentRoute: null,
      errorNotice: 'Saved match data was corrupted and has been cleared.'
    };
  }
}

/**
 * Clear the saved match from storage.
 * @param {Storage} [storage=window.localStorage]
 */
export function clearSavedMatch(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
