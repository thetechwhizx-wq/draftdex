/**
 * DraftDex Master UI Application Controller
 * Pure UI layer wiring screens to the Engine.
 * Manages hash routing, state persistence after every action,
 * live auction timers, bot interactions, and PeerJS P2P multiplayer.
 */

import { Router } from './router.js';
import {
  saveMatch,
  loadMatch,
  clearSavedMatch,
  getOrCreateGuestToken,
  saveSession,
  loadSession,
  clearSession
} from './storage.js';

import {
  createAuctionMatch,
  buildDraftPool,
  recommendSettings,
  submitBid,
  submitPass,
  resolveCurrentLot,
  startNextLot,
  botDecideAction,
  computeSquadWarnings,
  autoPickSquad,
  determineLeadPokemon,
  botAutoSelectBattleTeam,
  createBattle,
  executeTurn,
  resolveForcedSwitch,
  decideBattleAction,
  BATTLE_STATUS,
  ACTION_TYPES,
  generateSalt,
  computeCommitment,
  verifyCommitment
} from '../engine/index.js';

import {
  P2PHostSession,
  P2PGuestSession,
  CONNECTION_STATUS,
  MSG_TYPES,
  defaultPeerFactory
} from '../network/p2p.js';

import { renderHomeScreen } from './screens/home.js';
import { renderSetupScreen } from './screens/setup.js';
import { renderLobbyScreen } from './screens/lobby.js';
import { renderAuctionScreen } from './screens/auction.js';
import { renderBreakScreen } from './screens/break.js';
import { renderScoutScreen } from './screens/scout.js';
import { renderSquadSelectScreen } from './screens/squadSelect.js';
import { renderCountdownScreen } from './screens/countdown.js';
import { renderBattleScreen } from './screens/battle.js';
import { renderResultScreen } from './screens/result.js';
import { sounds } from './audio.js';

export class DraftDexApp {
  constructor({ rootElement = null, peerFactory = defaultPeerFactory } = {}) {
    this.root = rootElement || (typeof document !== 'undefined' ? document.getElementById('app-root') : null);
    this.router = new Router();
    this.peerFactory = peerFactory;
    this.matchState = null;
    this.errorNotice = null;

    // Multiplayer & Session State
    this.guestToken = getOrCreateGuestToken();
    this.isHost = true;
    this.p2pSession = null;
    this.connectionStatus = CONNECTION_STATUS.CONNECTED;

    // Setup screen state
    this.setupConfig = {
      preset: 'standard',
      selectedGens: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      famousMix: false,
      lockedFields: new Set(),
      isAdvancedOpen: false
    };

    // Live auction runtime
    this.timerInterval = null;
    this.timerSeconds = 18;
    this.totalTimerSeconds = 18;
    this.botActionTimeout = null;
    this.userPlayerId = 'human';

    // Squad selection & countdown runtime
    this.selectedSquadIds = new Set();
    this.selectedLeadId = null;
    this.squadTimerInterval = null;
    this.squadTimerSeconds = 30;
    this.countdownInterval = null;
    this.countdownNumber = 3;

    // Battle runtime state
    this.battleCurrentSelection = null;
    this.battleCommitState = 'pending'; // 'pending' | 'committed' | 'resolving'
    this.battleTimerSeconds = 25;
    this.battleTotalTimerSeconds = 25;
    this.battleTimerInterval = null;
    this.isBenchOpen = false;
    this.isLogOpen = false;
    this.pendingCommitments = { A: null, B: null };
    this.localCommit = null;

    this.router.setRouteHandler(route => this.onRouteChanged(route));
  }

  /**
   * Initialize application, restore saved match or navigate to home.
   */
  init() {
    const session = loadSession();
    const loaded = loadMatch();

    if (loaded.errorNotice) {
      this.errorNotice = loaded.errorNotice;
    }

    if (session && !session.isHost && session.room) {
      // Re-establish Guest session
      this.isHost = false;
      this.userPlayerId = session.playerId || null;
      if (loaded.matchState) {
        this.matchState = loaded.matchState;
      }
      this.initGuestSession(session.room);
      const targetRoute = loaded.currentRoute || (this.matchState ? this.getRouteForMatchState(this.matchState) : `#/lobby/${session.room}`);
      this.router.navigate(targetRoute);
    } else if (loaded.matchState) {
      // Re-establish Host session
      this.isHost = true;
      this.matchState = loaded.matchState;
      this.userPlayerId = 'human';
      this.initHostSession(this.matchState.room);
      const targetRoute = loaded.currentRoute || this.getRouteForMatchState(this.matchState);
      this.router.navigate(targetRoute);
    } else {
      // Default to home screen
      if (typeof window !== 'undefined' && (!window.location.hash || window.location.hash === '#/')) {
        this.router.navigate('#/home');
      } else {
        this.router.init();
      }
    }
  }

  /**
   * Initialize P2P Host Session
   */
  initHostSession(roomCode) {
    if (this.p2pSession) {
      this.p2pSession.close();
      this.p2pSession = null;
    }

    this.p2pSession = new P2PHostSession({
      roomCode,
      matchState: this.matchState,
      peerFactory: this.peerFactory,
      onClientAction: (action, reply) => this.handleClientAction(action, reply),
      onGuestConnected: (guest) => this.onGuestConnected(guest),
      onGuestDisconnected: (guest) => this.onGuestDisconnected(guest)
    });
  }

  /**
   * Initialize P2P Guest Session
   */
  initGuestSession(roomCode) {
    if (this.p2pSession) {
      this.p2pSession.close();
      this.p2pSession = null;
    }

    this.p2pSession = new P2PGuestSession({
      roomCode,
      guestToken: this.guestToken,
      playerName: 'Challenger',
      peerFactory: this.peerFactory,
      onStateUpdate: (state) => this.onGuestStateUpdate(state),
      onTimerTick: (rem, tot) => this.onGuestTimerTick(rem, tot),
      onCountdownTick: (num) => this.onGuestCountdownTick(num),
      onBattleStateUpdate: (battle, turnLog) => this.onGuestBattleUpdate(battle, turnLog),
      onRematchAccepted: (state) => this.onGuestRematchAccepted(state),
      onActionError: (err) => this.onGuestActionError(err),
      onStatusChange: (st) => this.onConnectionStatusChange(st)
    });
  }

  /**
   * Handle incoming action from guest (Host Authoritative Referee)
   */
  handleClientAction(action, reply) {
    if (!this.matchState) return;

    const player = this.matchState.players.find(p => p.guestToken === action.guestToken);
    if (!player) {
      if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: 'PLAYER_NOT_FOUND' });
      return;
    }

    if (action.type === MSG_TYPES.CLIENT_BID) {
      const res = submitBid(this.matchState, player.id, action.amount);
      if (res.success) {
        this.timerSeconds = this.matchState.settings.bidTimer || 10;
        this.totalTimerSeconds = this.timerSeconds;
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.renderAuction();
        this.scheduleBotAction(2000);
        if (reply) reply({ success: true });
      } else {
        if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: res.error });
      }
    } else if (action.type === MSG_TYPES.CLIENT_LOCK_SQUAD) {
      player.battleSquad = action.selectedIds;
      player.leadPokemonId = action.leadId;
      player.isReady = true;

      if (this.matchState.players.every(p => p.isReady)) {
        this.matchState.status = 'countdown';
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.router.navigate(`#/countdown/${this.matchState.room}`);
      } else {
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
      }
      if (reply) reply({ success: true });
    } else if (action.type === MSG_TYPES.CLIENT_PASS) {
      const res = submitPass(this.matchState, player.id);
      if (res.success) {
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        if (res.resolved) {
          this.handleLotResolved();
        } else {
          this.renderAuction();
          this.scheduleBotAction(1500);
        }
        if (reply) reply({ success: true });
      } else {
        if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: res.error });
      }
    } else if (action.type === MSG_TYPES.BATTLE_COMMIT) {
      if (!this.matchState?.battle) {
        if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: 'NO_BATTLE_ACTIVE' });
        return;
      }
      this.pendingCommitments.B = { commitHash: action.commitHash };
      if (reply) reply({ success: true, hostCommitted: !!this.pendingCommitments.A });
    } else if (action.type === MSG_TYPES.BATTLE_REVEAL) {
      if (!this.matchState?.battle) {
        if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: 'NO_BATTLE_ACTIVE' });
        return;
      }
      const expectedCommit = this.pendingCommitments.B?.commitHash;
      if (!expectedCommit) {
        if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: 'NO_COMMITMENT_FOUND' });
        return;
      }

      const isValid = verifyCommitment(expectedCommit, action.action, action.salt);
      if (!isValid) {
        if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: 'REVEAL_MISMATCH' });
        return;
      }

      this.pendingCommitments.B.action = action.action;
      this.pendingCommitments.B.salt = action.salt;

      if (this.pendingCommitments.A?.action) {
        this.resolveHostBattleTurn();
      }
      if (reply) reply({ success: true });
    } else if (action.type === MSG_TYPES.BATTLE_FORCED_SWITCH) {
      if (!this.matchState?.battle) return;
      const success = resolveForcedSwitch(this.matchState.battle, 'B', action.switchIndex);
      if (success) {
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.broadcastBattleState(this.matchState.battle);
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.renderBattle();
        if (reply) reply({ success: true });
      } else {
        if (reply) reply({ type: MSG_TYPES.ACTION_ERROR, reason: 'INVALID_SWITCH_TARGET' });
      }
    } else if (action.type === MSG_TYPES.REMATCH_REQUEST) {
      this.executeRematch();
      if (reply) reply({ success: true });
    }
  }

  onGuestConnected(guest) {
    this.persistState();
    const current = this.router.getCurrentRoute();
    if (current?.screen === 'lobby') {
      this.renderLobby();
    }
  }

  onGuestDisconnected(guest) {
    const current = this.router.getCurrentRoute();
    if (current?.screen === 'lobby') {
      this.renderLobby();
    }
  }

  /**
   * Guest receives updated authoritative matchState from Host
   */
  onGuestStateUpdate(newState) {
    this.matchState = newState;

    // Identify guest's player id from guestToken
    const self = this.matchState.players.find(p => p.guestToken === this.guestToken);
    if (self) {
      this.userPlayerId = self.id;
      saveSession({
        room: this.matchState.room,
        isHost: false,
        playerId: self.id,
        guestToken: this.guestToken
      });
    }

    this.persistState();

    const current = this.router.getCurrentRoute();
    const room = this.matchState.room;

    // Screen synchronization
    if ((this.matchState.status === 'result' || this.matchState.battle?.status === 'completed') && current?.screen !== 'result') {
      this.router.navigate(`#/result/${room}`);
    } else if (this.matchState.status === 'battle' && current?.screen !== 'battle') {
      this.router.navigate(`#/battle/${room}`);
    } else if ((this.matchState.status === 'battle_ready' || this.matchState.status === 'countdown') && current?.screen !== 'countdown') {
      this.router.navigate(`#/countdown/${room}`);
    } else if (this.matchState.status === 'squad_select' && current?.screen !== 'squad') {
      this.router.navigate(`#/squad/${room}`);
    } else if (this.matchState.status === 'completed' && current?.screen !== 'scout') {
      this.router.navigate(`#/scout/${room}`);
    } else if (this.matchState.status === 'set_break' && current?.screen !== 'break') {
      this.router.navigate(`#/break/${room}`);
    } else if ((this.matchState.status === 'in_progress' || this.matchState.status === 'accelerated_round') && current?.screen !== 'auction') {
      this.router.navigate(`#/auction/${room}`);
    } else {
      if (current?.screen === 'auction') {
        this.renderAuction();
      } else if (current?.screen === 'lobby') {
        this.renderLobby();
      } else if (current?.screen === 'break') {
        this.renderBreak();
      } else if (current?.screen === 'scout') {
        this.renderScout();
      } else if (current?.screen === 'squad') {
        this.renderSquad();
      } else if (current?.screen === 'countdown') {
        this.renderCountdown();
      } else if (current?.screen === 'battle') {
        this.renderBattle();
      } else if (current?.screen === 'result') {
        this.renderResult();
      }
    }
  }

  onGuestCountdownTick(num) {
    this.countdownNumber = num;
    const display = this.root?.querySelector('#countdown-display');
    if (display) {
      display.textContent = String(Math.max(1, num));
    }
  }

  onGuestTimerTick(remaining, total) {
    this.timerSeconds = remaining;
    this.totalTimerSeconds = total;
    this.updateTimerDisplay();
  }

  onGuestActionError(err) {
    console.warn('Action error from host referee:', err);
  }

  onConnectionStatusChange(status) {
    this.connectionStatus = status;
    this.renderConnectionBanner();
  }

  renderConnectionBanner() {
    if (!this.root) return;
    let banner = this.root.querySelector('#network-status-banner');

    if (this.connectionStatus === CONNECTION_STATUS.RECONNECTING) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'network-status-banner';
        banner.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-headline flex items-center gap-1.5 shadow-md border border-secondary/40 animate-pulse';
        banner.innerHTML = '<span class="material-symbols-outlined text-[16px]">sync</span><span>Reconnecting to match...</span>';
        this.root.appendChild(banner);
      }
    } else {
      if (banner) {
        banner.remove();
      }
    }
  }

  /**
   * Determine matching URL hash from match state.
   */
  getRouteForMatchState(match) {
    if (!match) return '#/home';
    const room = match.room || 'POKE01';
    if (match.status === 'result' || match.battle?.status === 'completed') return `#/result/${room}`;
    if (match.status === 'battle' || match.battle) return `#/battle/${room}`;
    if (match.status === 'battle_ready' || match.status === 'countdown') return `#/countdown/${room}`;
    if (match.status === 'squad_select') return `#/squad/${room}`;
    if (match.status === 'completed') return `#/scout/${room}`;
    if (match.status === 'set_break') return `#/break/${room}`;
    if (match.status === 'in_progress' || match.status === 'accelerated_round') return `#/auction/${room}`;
    return `#/lobby/${room}`;
  }

  /**
   * Route change handler.
   */
  onRouteChanged(route) {
    this.clearAuctionTimer();

    switch (route.screen) {
      case 'home':
        this.renderHome();
        break;
      case 'setup':
        this.renderSetup();
        break;
      case 'lobby':
        this.renderLobby(route.params.room);
        break;
      case 'auction':
        this.renderAuction(route.params.room);
        break;
      case 'break':
        this.renderBreak(route.params.room);
        break;
      case 'scout':
        this.renderScout(route.params.room);
        break;
      case 'squad':
        this.renderSquad(route.params.room);
        break;
      case 'countdown':
        this.renderCountdown(route.params.room);
        break;
      case 'battle':
        this.renderBattle(route.params.room);
        break;
      case 'result':
        this.renderResult(route.params.room);
        break;
      default:
        this.renderHome();
        break;
    }
  }

  /**
   * Persist full match state and current URL hash to storage.
   */
  persistState() {
    if (!this.matchState) return;
    const currentRoute = this.router.getCurrentRoute();
    const rawHash = currentRoute ? currentRoute.raw : this.getRouteForMatchState(this.matchState);
    saveMatch(this.matchState, rawHash);
  }

  // ==========================================
  // SCREEN: HOME / RESUME
  // ==========================================
  renderHome() {
    if (!this.root) return;

    this.root.innerHTML = renderHomeScreen({
      savedMatch: this.matchState,
      errorNotice: this.errorNotice,
      onNewMatch: () => this.router.navigate('#/setup'),
      onResumeMatch: () => {
        const dest = this.getRouteForMatchState(this.matchState);
        this.router.navigate(dest);
      }
    });

    const btnNew = this.root.querySelector('#btn-new-match');
    if (btnNew) btnNew.addEventListener('click', () => this.router.navigate('#/setup'));

    const btnResume = this.root.querySelector('#btn-resume-match');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        const dest = this.getRouteForMatchState(this.matchState);
        this.router.navigate(dest);
      });
    }

    const btnClear = this.root.querySelector('#btn-clear-data');
    if (btnClear) btnClear.addEventListener('click', () => this.handleClearData());

    const inputRoom = this.root.querySelector('#room-code-input');
    const btnJoin = this.root.querySelector('#btn-join-room');
    if (inputRoom && btnJoin) {
      inputRoom.addEventListener('input', e => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (e.target.value.length === 6) {
          btnJoin.classList.remove('text-outline', 'bg-surface-container-high');
          btnJoin.classList.add('text-on-primary-container', 'bg-primary-container');
        } else {
          btnJoin.classList.remove('text-on-primary-container', 'bg-primary-container');
          btnJoin.classList.add('text-outline', 'bg-surface-container-high');
        }
      });

      btnJoin.addEventListener('click', () => {
        const code = inputRoom.value.trim();
        if (code.length === 6) {
          this.handleJoinRoom(code);
        }
      });
    }
  }

  /**
   * Wipe every saved DraftDex value (match, session, guest token) and return to a clean Home.
   */
  handleClearData() {
    if (typeof window !== 'undefined' && !window.confirm('Delete the saved match and session on this device? This cannot be undone.')) return;

    this.clearAuctionTimer();
    if (this.botActionTimeout) { clearTimeout(this.botActionTimeout); this.botActionTimeout = null; }
    if (this.p2pSession) { try { this.p2pSession.close(); } catch (_) {} this.p2pSession = null; }

    try {
      const ls = window.localStorage;
      Object.keys(ls).filter(k => k.startsWith('draftdex')).forEach(k => ls.removeItem(k));
    } catch (_) {}

    this.matchState = null;
    this.isHost = true;
    this.userPlayerId = 'human';
    this.errorNotice = null;
    this.guestToken = getOrCreateGuestToken();
    this.router.navigate('#/home');
    this.renderHome();
  }

  handleJoinRoom(code) {
    this.isHost = false;
    saveSession({
      room: code,
      isHost: false,
      guestToken: this.guestToken
    });

    this.initGuestSession(code);
    if (this.matchState && this.matchState.room === code) {
      this.router.navigate(this.getRouteForMatchState(this.matchState));
    } else {
      this.router.navigate(`#/lobby/${code}`);
    }
  }

  // ==========================================
  // SCREEN: MATCH SETUP
  // ==========================================
  renderSetup() {
    if (!this.root) return;
    const recommended = recommendSettings({
      preset: this.setupConfig.preset,
      lockedFields: this.setupConfig.lockedFields,
      currentValues: this.currentSetupValues || {}
    });

    this.root.innerHTML = renderSetupScreen({
      settings: recommended,
      activePreset: this.setupConfig.preset,
      selectedGens: this.setupConfig.selectedGens,
      famousMix: this.setupConfig.famousMix,
      lockedFields: this.setupConfig.lockedFields,
      isAdvancedOpen: this.setupConfig.isAdvancedOpen
    });

    // Back button
    const btnBack = this.root.querySelector('#btn-setup-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    // Preset cards
    this.root.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const preset = card.dataset.preset;
        this.setupConfig.preset = preset;
        this.renderSetup();
      });
    });

    // Toggle advanced
    const btnAdv = this.root.querySelector('#btn-toggle-advanced');
    if (btnAdv) {
      btnAdv.addEventListener('click', () => {
        this.setupConfig.isAdvancedOpen = !this.setupConfig.isAdvancedOpen;
        this.renderSetup();
      });
    }

    // Gen chips
    this.root.querySelectorAll('.chip-gen').forEach(chip => {
      chip.addEventListener('click', () => {
        const gen = Number(chip.dataset.gen);
        this.setupConfig.famousMix = false;
        if (this.setupConfig.selectedGens.includes(gen)) {
          if (this.setupConfig.selectedGens.length > 1) {
            this.setupConfig.selectedGens = this.setupConfig.selectedGens.filter(g => g !== gen);
          }
        } else {
          this.setupConfig.selectedGens.push(gen);
        }
        this.renderSetup();
      });
    });

    // Famous mix chip
    const chipFamous = this.root.querySelector('#chip-famous');
    if (chipFamous) {
      chipFamous.addEventListener('click', () => {
        this.setupConfig.famousMix = !this.setupConfig.famousMix;
        this.renderSetup();
      });
    }

    // Locks
    this.root.querySelectorAll('.btn-lock').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        if (this.setupConfig.lockedFields.has(field)) {
          this.setupConfig.lockedFields.delete(field);
        } else {
          this.setupConfig.lockedFields.add(field);
        }
        this.renderSetup();
      });
    });

    // Inputs
    const inputTeam = this.root.querySelector('#input-team-size');
    const inputBudget = this.root.querySelector('#input-budget');
    const inputStart = this.root.querySelector('#input-start-bid');
    const inputTimer = this.root.querySelector('#input-bid-timer');

    this.currentSetupValues = {
      teamSize: inputTeam?.value,
      budget: inputBudget?.value,
      startBid: inputStart?.value,
      bidTimer: inputTimer?.value?.replace('s', '')
    };

    // Create match button
    const btnCreate = this.root.querySelector('#btn-create-match');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => this.handleCreateMatch(recommended));
    }
  }

  handleCreateMatch(recommended) {
    // 6 random characters (no 0/O/1/I to avoid mix-ups): ~887 million combinations,
    // so two hosts on the public PeerJS network almost never collide.
    const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) roomCode += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
    const seed = 'match-seed-' + Date.now();

    const { pool } = buildDraftPool({
      generations: this.setupConfig.famousMix ? null : this.setupConfig.selectedGens,
      famousMix: this.setupConfig.famousMix,
      teamSize: recommended.teamSize,
      seed
    });

    this.isHost = true;
    this.userPlayerId = 'human';

    saveSession({
      room: roomCode,
      isHost: true,
      playerId: 'human',
      guestToken: this.guestToken
    });

    this.matchState = createAuctionMatch({
      room: roomCode,
      seed,
      settings: {
        budget: recommended.budget,
        teamSize: recommended.teamSize,
        startBid: recommended.startBid,
        openTimer: recommended.openTimer,
        bidTimer: recommended.bidTimer
      },
      players: [
        { id: 'human', name: 'You (Host)', isHost: true, guestToken: this.guestToken, connected: true },
        { id: 'bot', name: 'DexBot', isHost: false, isBot: true, connected: true }
      ],
      pool
    });

    this.initHostSession(roomCode);
    this.persistState();
    this.router.navigate(`#/lobby/${roomCode}`);
  }

  // ==========================================
  // SCREEN: LOBBY
  // ==========================================
  renderLobby(roomParam) {
    if (!this.root || !this.matchState) {
      if (roomParam && !this.isHost) {
        // Guest waiting for match state from host
        this.root.innerHTML = `
          <div class="flex flex-col items-center justify-center min-h-screen py-10">
            <span class="material-symbols-outlined text-[48px] text-tertiary animate-spin mb-4">sync</span>
            <span class="font-headline-sm uppercase text-on-surface">Connecting to Room ${roomParam}...</span>
          </div>
        `;
        return;
      }
      this.router.navigate('#/setup');
      return;
    }

    this.root.innerHTML = renderLobbyScreen({
      matchState: this.matchState,
      copied: false,
      isHost: this.isHost
    });

    const btnBack = this.root.querySelector('#btn-lobby-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    const btnCopy = this.root.querySelector('#copyBtn');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(this.matchState.room);
          const icon = this.root.querySelector('#copyIcon');
          if (icon) icon.textContent = 'check';
          setTimeout(() => { if (icon) icon.textContent = 'content_copy'; }, 1500);
        }
      });
    }

    const btnStart = this.root.querySelector('#btn-start-auction');
    if (btnStart && this.isHost) {
      btnStart.addEventListener('click', () => {
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.router.navigate(`#/auction/${this.matchState.room}`);
      });
    }
  }

  // ==========================================
  // SCREEN: AUCTION ROOM
  // ==========================================
  renderAuction(roomParam) {
    if (!this.root || !this.matchState) {
      this.router.navigate('#/home');
      return;
    }

    // Check if match already finished or on set break
    if (this.matchState.status === 'completed') {
      this.router.navigate(`#/scout/${this.matchState.room}`);
      return;
    }
    if (this.matchState.status === 'set_break') {
      this.router.navigate(`#/break/${this.matchState.room}`);
      return;
    }

    this.root.innerHTML = renderAuctionScreen({
      matchState: this.matchState,
      currentTimerSeconds: this.timerSeconds,
      totalTimerSeconds: this.totalTimerSeconds,
      userPlayerId: this.userPlayerId
    });

    // Back button
    const btnBack = this.root.querySelector('#btn-auction-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    // User quick bid 1
    const btnBid1 = this.root.querySelector('#btn-bid-1');
    if (btnBid1 && !btnBid1.disabled) {
      btnBid1.addEventListener('click', () => {
        const amount = Number(btnBid1.dataset.amount);
        this.handleUserBid(amount);
      });
    }

    // User jump bid 2
    const btnBid2 = this.root.querySelector('#btn-bid-2');
    if (btnBid2 && !btnBid2.disabled) {
      btnBid2.addEventListener('click', () => {
        const amount = Number(btnBid2.dataset.amount);
        this.handleUserBid(amount);
      });
    }

    // User pass
    const btnPass = this.root.querySelector('#btn-pass');
    if (btnPass && !btnPass.disabled) {
      btnPass.addEventListener('click', () => {
        this.handleUserPass();
      });
    }

    // Start clock if host & not already running
    if (!this.timerInterval && this.isHost) {
      this.startAuctionClock();
    }
  }

  handleUserBid(amount) {
    if (this.isHost) {
      const res = submitBid(this.matchState, this.userPlayerId, amount);
      if (res.success) {
        sounds.playBid();
        this.timerSeconds = this.matchState.settings.bidTimer || 10;
        this.totalTimerSeconds = this.timerSeconds;
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.renderAuction();
        this.scheduleBotAction(2000);
      }
    } else {
      if (this.p2pSession) {
        this.p2pSession.submitBid(amount);
        sounds.playBid();
      }
    }
  }

  handleUserPass() {
    if (this.isHost) {
      const res = submitPass(this.matchState, this.userPlayerId);
      if (res.success) {
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        if (res.resolved) {
          this.handleLotResolved();
        } else {
          this.renderAuction();
          this.scheduleBotAction(1500);
        }
      }
    } else {
      if (this.p2pSession) {
        this.p2pSession.submitPass();
      }
    }
  }

  startAuctionClock() {
    if (!this.isHost) return;
    this.clearAuctionTimer();
    this.timerSeconds = this.matchState.settings.openTimer || 18;
    this.totalTimerSeconds = this.timerSeconds;

    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this.updateTimerDisplay();

      if (this.p2pSession) {
        this.p2pSession.broadcastTimerTick(this.timerSeconds, this.totalTimerSeconds);
      }

      if (this.timerSeconds <= 0) {
        this.handleClockExpiry();
      }
    }, 1000);

    // Schedule bot opening reaction
    this.scheduleBotAction(2500);
  }

  updateTimerDisplay() {
    const timerVal = this.root?.querySelector('#timer-val');
    const timerRing = this.root?.querySelector('#timer-ring');
    if (!timerVal || !timerRing) return;

    const clamped = Math.max(0, this.timerSeconds);
    timerVal.textContent = `${String(clamped).padStart(2, '0')}s`;

    const circumference = 188.5;
    const ratio = this.totalTimerSeconds > 0 ? (clamped / this.totalTimerSeconds) : 0;
    timerRing.style.strokeDashoffset = (circumference * (1 - ratio)).toFixed(1);

    if (clamped <= 5) {
      timerVal.classList.add('text-[#EF4444]');
      timerRing.setAttribute('stroke', '#EF4444');
      timerRing.classList.add('drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]');
    }
  }

  scheduleBotAction(delayMs = 2500) {
    if (!this.isHost) return;
    if (typeof setTimeout === 'undefined') return;
    clearTimeout(this.botActionTimeout);
    this.botActionTimeout = setTimeout(() => {
      if (!this.matchState || !this.matchState.currentLot) return;
      const bot = this.matchState.players.find(p => p.isBot);
      if (!bot) return;

      const action = botDecideAction(this.matchState, bot, 'strategist');
      if (action.type === 'bid') {
        const res = submitBid(this.matchState, bot.id, action.amount);
        if (res.success) {
          this.timerSeconds = this.matchState.settings.bidTimer || 10;
          this.totalTimerSeconds = this.timerSeconds;
          this.persistState();
          if (this.p2pSession) {
            this.p2pSession.updateMatchState(this.matchState);
          }
          this.renderAuction();
        }
      } else {
        const res = submitPass(this.matchState, bot.id);
        if (res.success) {
          this.persistState();
          if (this.p2pSession) {
            this.p2pSession.updateMatchState(this.matchState);
          }
          if (res.resolved) {
            this.handleLotResolved();
          } else {
            this.renderAuction();
          }
        }
      }
    }, delayMs);
  }

  handleClockExpiry() {
    this.clearAuctionTimer();
    const lot = this.matchState.currentLot;
    if (!lot) return;

    const outcome = lot.leaderId ? 'sold' : 'unsold';
    resolveCurrentLot(this.matchState, outcome);
    this.handleLotResolved();
  }

  handleLotResolved() {
    sounds.playSold();
    this.clearAuctionTimer();
    this.persistState();

    // Check if entire match is finished
    if (this.matchState.status === 'completed' || this.matchState.players.every(p => p.team.length >= this.matchState.settings.teamSize)) {
      this.matchState.status = 'completed';
      this.persistState();
      if (this.p2pSession) {
        this.p2pSession.updateMatchState(this.matchState);
      }
      this.router.navigate(`#/scout/${this.matchState.room}`);
      return;
    }

    // Check if lot index reset to 0 (meaning a set break occurred!)
    if (this.matchState.currentLotIndex === 0 && this.matchState.currentSetIndex > 0) {
      this.matchState.status = 'set_break';
      this.persistState();
      if (this.p2pSession) {
        this.p2pSession.updateMatchState(this.matchState);
      }
      this.router.navigate(`#/break/${this.matchState.room}`);
      return;
    }

    if (this.p2pSession) {
      this.p2pSession.updateMatchState(this.matchState);
    }
    // Otherwise render next active lot
    this.renderAuction();
  }

  clearAuctionTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.botActionTimeout) {
      clearTimeout(this.botActionTimeout);
      this.botActionTimeout = null;
    }
    this.clearSquadTimer();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // ==========================================
  // SCREEN: SET BREAK
  // ==========================================
  renderBreak(roomParam) {
    if (!this.root || !this.matchState) {
      this.router.navigate('#/home');
      return;
    }

    const completedIdx = Math.max(0, this.matchState.currentSetIndex - 1);
    this.root.innerHTML = renderBreakScreen({
      matchState: this.matchState,
      completedSetIndex: completedIdx
    });

    const btnBack = this.root.querySelector('#btn-break-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    const btnContinue = this.root.querySelector('#btn-continue-next-set');
    if (btnContinue) {
      if (this.isHost) {
        btnContinue.addEventListener('click', () => {
          this.matchState.status = 'in_progress';
          this.persistState();
          if (this.p2pSession) {
            this.p2pSession.updateMatchState(this.matchState);
          }
          this.router.navigate(`#/auction/${this.matchState.room}`);
        });
      } else {
        btnContinue.disabled = true;
        btnContinue.classList.add('opacity-50', 'cursor-not-allowed');
        btnContinue.innerHTML = '<span>Waiting for Host...</span>';
      }
    }
  }

  // ==========================================
  // SCREEN: SCOUT REPORT
  // ==========================================
  renderScout(roomParam) {
    if (!this.root || !this.matchState) {
      this.router.navigate('#/home');
      return;
    }

    this.root.innerHTML = renderScoutScreen({
      matchState: this.matchState,
      userPlayerId: this.userPlayerId
    });

    const btnBack = this.root.querySelector('#btn-scout-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    const btnProceed = this.root.querySelector('#btn-scout-proceed');
    if (btnProceed) {
      btnProceed.addEventListener('click', () => {
        this.matchState.status = 'squad_select';
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.router.navigate(`#/squad/${this.matchState.room}`);
      });
    }

    const btnNew = this.root.querySelector('#btn-scout-new');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        clearSavedMatch();
        clearSession();
        if (this.p2pSession) {
          this.p2pSession.close();
          this.p2pSession = null;
        }
        this.matchState = null;
        this.router.navigate('#/setup');
      });
    }
  }

  // ==========================================
  // SCREEN: SQUAD SELECT & TEAM PREVIEW
  // ==========================================
  renderSquad(roomParam) {
    if (!this.root || !this.matchState) {
      this.router.navigate('#/home');
      return;
    }

    const self = this.matchState.players.find(p => p.id === this.userPlayerId) || this.matchState.players[0];
    const fullTeam = self.team || [];
    const draftedIds = fullTeam.map(t => (t.pokemonId !== undefined ? t.pokemonId : t.id));

    // Default selection: if team size <= 6, all 6 selected; if team size > 6, pre-select up to 6
    if (!this.selectedSquadIds || this.selectedSquadIds.size === 0) {
      this.selectedSquadIds = new Set(draftedIds.slice(0, 6));
    }

    if (!this.selectedLeadId || !this.selectedSquadIds.has(this.selectedLeadId)) {
      this.selectedLeadId = determineLeadPokemon(Array.from(this.selectedSquadIds));
    }

    this.root.innerHTML = renderSquadSelectScreen({
      matchState: this.matchState,
      userPlayerId: this.userPlayerId,
      selectedIds: Array.from(this.selectedSquadIds),
      leadId: this.selectedLeadId,
      timerSeconds: this.squadTimerSeconds,
      totalTimerSeconds: 30,
      isLocked: !!self.isReady
    });

    const btnBack = this.root.querySelector('#btn-squad-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    // Card selection toggles
    this.root.querySelectorAll('.squad-card').forEach(card => {
      card.addEventListener('click', () => {
        if (self.isReady) return; // already locked
        const id = Number(card.dataset.id);
        if (this.selectedSquadIds.has(id)) {
          if (this.selectedSquadIds.size > 1) {
            this.selectedSquadIds.delete(id);
            if (this.selectedLeadId === id) {
              this.selectedLeadId = determineLeadPokemon(Array.from(this.selectedSquadIds));
            }
          }
        } else {
          if (this.selectedSquadIds.size < 6) {
            this.selectedSquadIds.add(id);
            if (!this.selectedLeadId) {
              this.selectedLeadId = id;
            }
          }
        }
        this.renderSquad();
      });
    });

    // Choose lead button (cycles through selected Pokémon)
    const btnChooseLead = this.root.querySelector('#btn-choose-lead');
    if (btnChooseLead) {
      btnChooseLead.addEventListener('click', () => {
        if (self.isReady) return;
        const currentArr = Array.from(this.selectedSquadIds);
        if (currentArr.length === 0) return;
        const currentIdx = currentArr.indexOf(this.selectedLeadId);
        const nextIdx = (currentIdx + 1) % currentArr.length;
        this.selectedLeadId = currentArr[nextIdx];
        this.renderSquad();
      });
    }

    // Lock button
    const btnLock = this.root.querySelector('#btn-lock-team');
    if (btnLock) {
      btnLock.addEventListener('click', () => {
        this.handleLockSquad();
      });
    }

    // Start 30s deliberation timer if host and not already running
    if (!this.squadTimerInterval && !self.isReady && this.isHost) {
      this.startSquadDeliberationClock();
    }
  }

  startSquadDeliberationClock() {
    this.clearSquadTimer();
    this.squadTimerSeconds = 30;

    this.squadTimerInterval = setInterval(() => {
      this.squadTimerSeconds--;
      
      const timerVal = this.root?.querySelector('#squad-timer-val');
      const timerRing = this.root?.querySelector('#squad-timer-ring');
      if (timerVal) timerVal.textContent = `${this.squadTimerSeconds}s`;
      if (timerRing) {
        const circumference = 125.6;
        const ratio = Math.max(0, this.squadTimerSeconds) / 30;
        timerRing.style.strokeDashoffset = (circumference * (1 - ratio)).toFixed(1);
      }

      if (this.squadTimerSeconds <= 0) {
        this.clearSquadTimer();
        this.handleSquadTimeout();
      }
    }, 1000);
  }

  clearSquadTimer() {
    if (this.squadTimerInterval) {
      clearInterval(this.squadTimerInterval);
      this.squadTimerInterval = null;
    }
  }

  handleSquadTimeout() {
    const self = this.matchState.players.find(p => p.id === this.userPlayerId) || this.matchState.players[0];
    if (self.isReady) return;

    // Auto-pick remaining Pokémon up to 6
    const filled = autoPickSquad(self.team, Array.from(this.selectedSquadIds), 6);
    this.selectedSquadIds = new Set(filled);
    if (!this.selectedLeadId || !this.selectedSquadIds.has(this.selectedLeadId)) {
      this.selectedLeadId = determineLeadPokemon(filled);
    }
    this.handleLockSquad();
  }

  handleLockSquad() {
    this.clearSquadTimer();
    const self = this.matchState.players.find(p => p.id === this.userPlayerId) || this.matchState.players[0];
    const pickedArray = Array.from(this.selectedSquadIds);
    const lead = this.selectedLeadId || pickedArray[0];

    self.battleSquad = pickedArray;
    self.leadPokemonId = lead;
    self.isReady = true;

    if (this.isHost) {
      // If opponent is Bot, bot locks automatically
      const bot = this.matchState.players.find(p => p.isBot);
      if (bot) {
        const botPicks = botAutoSelectBattleTeam(bot, 6);
        bot.battleSquad = botPicks.selectedIds;
        bot.leadPokemonId = botPicks.leadId;
        bot.isReady = true;
      }

      this.persistState();

      if (this.matchState.players.every(p => p.isReady)) {
        this.matchState.status = 'countdown';
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.router.navigate(`#/countdown/${this.matchState.room}`);
      } else {
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.renderSquad();
      }
    } else {
      // Guest sends CLIENT_LOCK_SQUAD
      if (this.p2pSession) {
        this.p2pSession.submitSquadLock(pickedArray, lead);
      }
      this.persistState();
      this.renderSquad();
    }
  }

  // ==========================================
  // SCREEN: BATTLE COUNTDOWN
  // ==========================================
  renderCountdown(roomParam) {
    if (!this.root || !this.matchState) {
      this.router.navigate('#/home');
      return;
    }

    this.root.innerHTML = renderCountdownScreen({
      matchState: this.matchState,
      countdownNumber: this.countdownNumber,
      userPlayerId: this.userPlayerId
    });

    const btnBack = this.root.querySelector('#btn-countdown-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    // Host drives countdown
    if (this.isHost && !this.countdownInterval) {
      this.startCountdownClock();
    }
  }

  startCountdownClock() {
    this.countdownNumber = 3;
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      this.countdownNumber--;
      const display = this.root?.querySelector('#countdown-display');
      if (display) {
        display.textContent = String(Math.max(1, this.countdownNumber));
      }

      if (this.p2pSession) {
        this.p2pSession.broadcastCountdownTick(this.countdownNumber);
      }

      if (this.countdownNumber <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.matchState.status = 'battle';
        this.matchState.battleReady = true;

        if (this.isHost && !this.matchState.battle) {
          this.initBattle();
        }

        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.updateMatchState(this.matchState);
          if (this.matchState.battle) {
            this.p2pSession.broadcastBattleState(this.matchState.battle);
          }
        }
        this.router.navigate(`#/battle/${this.matchState.room}`);
      }
    }, 1000);
  }

  // ==========================================
  // SCREEN: BATTLE ARENA
  // ==========================================

  initBattle() {
    if (!this.matchState || this.matchState.battle) return;

    const playerA = this.matchState.players[0] || { name: 'Trainer 1', squad: [] };
    const playerB = this.matchState.players[1] || { name: 'Trainer 2', squad: [] };

    const teamA = (playerA.battleSquad && playerA.battleSquad.length > 0)
      ? playerA.battleSquad
      : (playerA.squad || []).map(p => p.pokemonId !== undefined ? p.pokemonId : (p.id !== undefined ? p.id : p)).slice(0, 6);

    const teamB = (playerB.battleSquad && playerB.battleSquad.length > 0)
      ? playerB.battleSquad
      : (playerB.squad || []).map(p => p.pokemonId !== undefined ? p.pokemonId : (p.id !== undefined ? p.id : p)).slice(0, 6);

    const leadA = playerA.leadPokemonId !== undefined && playerA.leadPokemonId !== null
      ? playerA.leadPokemonId
      : (teamA[0] ? (teamA[0].pokemonId || teamA[0].id || teamA[0]) : null);

    const leadB = playerB.leadPokemonId !== undefined && playerB.leadPokemonId !== null
      ? playerB.leadPokemonId
      : (teamB[0] ? (teamB[0].pokemonId || teamB[0].id || teamB[0]) : null);

    this.matchState.battle = createBattle({
      teamA,
      teamB,
      seed: `${this.matchState.room}-battle-${Date.now()}`,
      leadA,
      leadB,
      nameA: playerA.name || 'Trainer 1',
      nameB: playerB.name || 'Trainer 2'
    });

    this.matchState.status = 'battle';
    this.persistState();
  }

  renderBattle(roomParam) {
    if (!this.root || !this.matchState) {
      this.router.navigate('#/home');
      return;
    }

    if (this.isHost && !this.matchState.battle) {
      this.initBattle();
    }

    if (!this.matchState.battle) {
      this.root.innerHTML = `<div class="p-8 text-center text-on-surface font-headline-sm">Initializing battle arena...</div>`;
      return;
    }

    const userSide = (this.userPlayerId === this.matchState.players[0].id) ? 'A' : 'B';

    this.root.innerHTML = renderBattleScreen({
      battle: this.matchState.battle,
      userSide,
      timerSeconds: this.battleTimerSeconds,
      totalTimerSeconds: this.battleTotalTimerSeconds,
      currentSelection: this.battleCurrentSelection,
      commitState: this.battleCommitState,
      isBenchOpen: this.isBenchOpen,
      isLogOpen: this.isLogOpen,
      errorNotice: this.errorNotice
    });

    if (!this.battleTimerInterval && this.matchState.battle.status !== BATTLE_STATUS.COMPLETED) {
      this.startBattleTurnTimer();
    }

    this.attachBattleEventListeners(userSide);
  }

  attachBattleEventListeners(userSide) {
    const btnBack = this.root.querySelector('#btn-battle-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    // Move Selection Buttons
    this.root.querySelectorAll('.move-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const moveName = btn.dataset.move;
        this.battleCurrentSelection = { type: ACTION_TYPES.MOVE, moveName };
        this.renderBattle();
      });
    });

    // Bench Toggle Drawer
    const btnBenchToggle = this.root.querySelector('#btn-bench-toggle');
    if (btnBenchToggle) {
      btnBenchToggle.addEventListener('click', () => {
        this.isBenchOpen = !this.isBenchOpen;
        const preview = this.root.querySelector('#bench-preview');
        const icon = this.root.querySelector('#switch-icon');
        if (preview) {
          if (this.isBenchOpen) {
            preview.classList.remove('hidden');
            if (icon) icon.textContent = 'expand_less';
          } else {
            preview.classList.add('hidden');
            if (icon) icon.textContent = 'expand_more';
          }
        }
      });
    }

    // Bench Pokémon Selection
    this.root.querySelectorAll('.bench-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const switchIndex = parseInt(btn.dataset.index, 10);
        this.battleCurrentSelection = { type: ACTION_TYPES.SWITCH, switchIndex };
        this.renderBattle();
      });
    });

    // Lock Action Button
    const btnLock = this.root.querySelector('#btn-lock-action');
    if (btnLock) {
      btnLock.addEventListener('click', () => {
        this.submitCurrentBattleAction(userSide);
      });
    }

    // Full Combat Log Modal Toggle
    const btnToggleLog = this.root.querySelector('#btn-toggle-log');
    if (btnToggleLog) {
      btnToggleLog.addEventListener('click', () => {
        this.isLogOpen = true;
        this.renderBattle();
      });
    }

    const btnCloseLog = this.root.querySelector('#btn-close-log');
    if (btnCloseLog) {
      btnCloseLog.addEventListener('click', () => {
        this.isLogOpen = false;
        this.renderBattle();
      });
    }

    // Match Completed Result Navigation
    const btnViewResult = this.root.querySelector('#btn-view-result');
    if (btnViewResult) {
      btnViewResult.addEventListener('click', () => {
        this.router.navigate(`#/result/${this.matchState.room}`);
      });
    }
  }

  submitCurrentBattleAction(userSide) {
    if (!this.matchState?.battle || !this.battleCurrentSelection) return;

    const action = this.battleCurrentSelection;
    const battle = this.matchState.battle;
    const isForcedSwitch = battle.status === BATTLE_STATUS.NEEDS_SWITCH && battle.needsSwitch[userSide];

    if (isForcedSwitch) {
      if (action.type !== ACTION_TYPES.SWITCH) return;

      if (this.isHost) {
        resolveForcedSwitch(battle, userSide, action.switchIndex);

        // If Bot also needed forced switch, resolve Bot switch
        const oppSide = userSide === 'A' ? 'B' : 'A';
        const oppPlayer = this.matchState.players[1];
        if (oppPlayer && oppPlayer.isBot && battle.needsSwitch[oppSide]) {
          const botSwitch = decideBattleAction(battle, oppSide);
          if (botSwitch?.type === ACTION_TYPES.SWITCH) {
            resolveForcedSwitch(battle, oppSide, botSwitch.switchIndex);
          }
        }

        this.battleCurrentSelection = null;
        this.persistState();
        if (this.p2pSession) {
          this.p2pSession.broadcastBattleState(battle);
          this.p2pSession.updateMatchState(this.matchState);
        }
        this.renderBattle();
      } else {
        // Guest submits forced switch
        if (this.p2pSession) {
          this.p2pSession.submitBattleForcedSwitch(action.switchIndex);
        }
        this.battleCurrentSelection = null;
      }
      return;
    }

    // Normal Turn Action: Commit-then-reveal protocol
    const salt = generateSalt();
    const commitHash = computeCommitment(action, salt);

    if (this.isHost) {
      this.pendingCommitments[userSide] = { commitHash, action, salt };
      this.battleCommitState = 'committed';

      const oppSide = userSide === 'A' ? 'B' : 'A';
      const oppPlayer = this.matchState.players[1];

      if (oppPlayer && oppPlayer.isBot) {
        // Bot auto-commits its move
        const botAction = decideBattleAction(battle, oppSide);
        const botSalt = generateSalt();
        const botCommitHash = computeCommitment(botAction, botSalt);
        this.pendingCommitments[oppSide] = { commitHash: botCommitHash, action: botAction, salt: botSalt };

        // Both committed: resolve turn immediately!
        this.resolveHostBattleTurn();
      } else {
        // If guest already committed & revealed, resolve
        if (this.pendingCommitments[oppSide]?.action) {
          this.resolveHostBattleTurn();
        } else {
          this.renderBattle();
        }
      }
    } else {
      // Guest commits hash first, then reveals
      this.localCommit = { action, salt, commitHash };
      this.battleCommitState = 'committed';
      if (this.p2pSession) {
        this.p2pSession.submitBattleCommit(commitHash);
        this.p2pSession.submitBattleReveal(action, salt);
      }
      this.renderBattle();
    }
  }

  resolveHostBattleTurn() {
    if (!this.matchState?.battle || !this.pendingCommitments.A?.action || !this.pendingCommitments.B?.action) {
      return;
    }

    const actionA = this.pendingCommitments.A.action;
    const actionB = this.pendingCommitments.B.action;

    // Pure engine execution
    executeTurn(this.matchState.battle, { A: actionA, B: actionB });

    sounds.playHit();
    if (this.matchState.battle.status === BATTLE_STATUS.NEEDS_SWITCH) {
      sounds.playFaint();
    }
    if (this.matchState.battle.status === BATTLE_STATUS.COMPLETED) {
      sounds.playVictory();
    }

    this.pendingCommitments = { A: null, B: null };
    this.battleCommitState = 'pending';
    this.battleCurrentSelection = null;

    this.persistState();

    if (this.p2pSession) {
      this.p2pSession.broadcastBattleState(this.matchState.battle);
      this.p2pSession.updateMatchState(this.matchState);
    }

    this.startBattleTurnTimer();

    // If opponent is Bot and needs forced switch, Bot switches automatically
    if (this.matchState.battle.status === BATTLE_STATUS.NEEDS_SWITCH) {
      const oppPlayer = this.matchState.players[1];
      if (oppPlayer && oppPlayer.isBot && this.matchState.battle.needsSwitch.B) {
        const botSwitch = decideBattleAction(this.matchState.battle, 'B');
        if (botSwitch?.type === ACTION_TYPES.SWITCH) {
          resolveForcedSwitch(this.matchState.battle, 'B', botSwitch.switchIndex);
          this.persistState();
          if (this.p2pSession) {
            this.p2pSession.broadcastBattleState(this.matchState.battle);
            this.p2pSession.updateMatchState(this.matchState);
          }
        }
      }
    }

    this.renderBattle();
  }

  startBattleTurnTimer() {
    this.battleTimerSeconds = 25;
    this.battleTotalTimerSeconds = 25;
    if (this.battleTimerInterval) clearInterval(this.battleTimerInterval);

    this.battleTimerInterval = setInterval(() => {
      this.battleTimerSeconds--;

      const timerDisplay = this.root?.querySelector('#turn-timer');
      const timerRing = this.root?.querySelector('#timer-ring');
      if (timerDisplay) {
        timerDisplay.textContent = `${this.battleTimerSeconds}s`;
        if (this.battleTimerSeconds <= 5) {
          timerDisplay.classList.add('text-error');
          if (timerRing) {
            timerRing.classList.remove('text-primary-container');
            timerRing.classList.add('text-error');
          }
        }
      }
      if (timerRing) {
        const totalLength = 125.6;
        const ratio = this.battleTotalTimerSeconds > 0 ? (this.battleTimerSeconds / this.battleTotalTimerSeconds) : 0;
        const offset = (totalLength * (1 - ratio)).toFixed(1);
        timerRing.style.strokeDashoffset = offset;
      }

      if (this.battleTimerSeconds <= 0) {
        clearInterval(this.battleTimerInterval);
        this.battleTimerInterval = null;
        this.handleBattleTurnTimeout();
      }
    }, 1000);
  }

  handleBattleTurnTimeout() {
    if (!this.matchState?.battle || this.matchState.battle.status === BATTLE_STATUS.COMPLETED) return;
    const userSide = (this.userPlayerId === this.matchState.players[0].id) ? 'A' : 'B';
    const sideObj = userSide === 'A' ? this.matchState.battle.sideA : this.matchState.battle.sideB;
    const active = sideObj.party[sideObj.activeIndex];

    if (this.battleCommitState === 'committed') return;

    if (active.isFainted || this.matchState.battle.needsSwitch[userSide]) {
      const benchIndex = sideObj.party.findIndex((p, idx) => idx !== sideObj.activeIndex && !p.isFainted);
      if (benchIndex !== -1) {
        this.battleCurrentSelection = { type: ACTION_TYPES.SWITCH, switchIndex: benchIndex };
        this.submitCurrentBattleAction(userSide);
      }
    } else {
      const validMove = active.moves.find(m => m.currentPp > 0) || active.moves[0];
      if (validMove) {
        this.battleCurrentSelection = { type: ACTION_TYPES.MOVE, moveName: validMove.name };
        this.submitCurrentBattleAction(userSide);
      }
    }
  }

  onGuestBattleUpdate(battle, turnLog) {
    if (!this.matchState) return;
    this.matchState.battle = battle;
    this.battleCommitState = 'pending';
    this.battleCurrentSelection = null;
    this.localCommit = null;
    this.persistState();

    const current = this.router.getCurrentRoute();
    if (current?.screen === 'battle') {
      this.renderBattle();
    }
  }

  // ==========================================
  // SCREEN: MATCH RESULT & REMATCH
  // ==========================================

  renderResult(roomParam) {
    if (!this.root || !this.matchState) {
      this.router.navigate('#/home');
      return;
    }

    this.root.innerHTML = renderResultScreen({
      matchState: this.matchState,
      userPlayerId: this.userPlayerId
    });

    // Animate circular SVG gauges
    const draftRing = this.root.querySelector('#draft-ring');
    const winRing = this.root.querySelector('#win-ring');
    if (draftRing && winRing) {
      const draftOffset = draftRing.getAttribute('stroke-dashoffset');
      const winOffset = winRing.getAttribute('stroke-dashoffset');
      draftRing.style.strokeDashoffset = '251.32';
      winRing.style.strokeDashoffset = '251.32';
      requestAnimationFrame(() => {
        draftRing.style.strokeDashoffset = draftOffset;
        winRing.style.strokeDashoffset = winOffset;
      });
    }

    const btnBack = this.root.querySelector('#btn-result-back');
    if (btnBack) btnBack.addEventListener('click', () => this.router.navigate('#/home'));

    const btnHome = this.root.querySelector('#btn-result-home');
    if (btnHome) btnHome.addEventListener('click', () => this.router.navigate('#/home'));

    const btnRematch = this.root.querySelector('#btn-rematch');
    if (btnRematch) {
      btnRematch.addEventListener('click', () => {
        this.executeRematch();
      });
    }
  }

  executeRematch() {
    if (!this.matchState) return;

    if (this.isHost) {
      // Reset player teams, budgets, and readiness
      this.matchState.players.forEach(p => {
        p.budget = this.matchState.settings.budget || 100;
        p.team = [];
        p.battleSquad = [];
        p.leadPokemonId = null;
        p.isReady = false;
      });

      this.matchState.battle = null;
      this.matchState.status = 'setup';

      // Build a fresh draft pool
      const newPool = buildDraftPool({
        poolPreset: this.setupConfig.preset,
        selectedGenerations: this.setupConfig.selectedGens,
        famousMix: this.setupConfig.famousMix,
        minPoolSize: this.matchState.settings.poolSize || 30
      });
      this.matchState.draftPool = newPool;

      this.persistState();

      if (this.p2pSession) {
        this.p2pSession.broadcastRematch(this.matchState);
        this.p2pSession.updateMatchState(this.matchState);
      }

      this.router.navigate(`#/lobby/${this.matchState.room}`);
    } else {
      if (this.p2pSession) {
        this.p2pSession.submitRematchRequest();
      }
    }
  }

  onGuestRematchAccepted(newState) {
    if (newState) {
      this.matchState = newState;
    }
    this.persistState();
    this.router.navigate(`#/lobby/${this.matchState.room}`);
  }
}
