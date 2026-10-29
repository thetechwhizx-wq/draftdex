/**
 * DraftDex P2P Multiplayer Networking Layer
 * Built for PeerJS with room codes, guest tokens, host referee authority,
 * state broadcasts, and seamless refresh/reconnection recovery.
 *
 * Zero UI, zero DOM imports. Compatible with both Browser (PeerJS) and Node.js (Mock Transport).
 */

export const MSG_TYPES = Object.freeze({
  JOIN_ROOM: 'JOIN_ROOM',
  JOIN_ACCEPTED: 'JOIN_ACCEPTED',
  JOIN_REJECTED: 'JOIN_REJECTED',
  STATE_UPDATE: 'STATE_UPDATE',
  TIMER_TICK: 'TIMER_TICK',
  CLIENT_BID: 'CLIENT_BID',
  CLIENT_PASS: 'CLIENT_PASS',
  CLIENT_LOCK_SQUAD: 'CLIENT_LOCK_SQUAD',
  COUNTDOWN_TICK: 'COUNTDOWN_TICK',
  BATTLE_COMMIT: 'BATTLE_COMMIT',
  BATTLE_REVEAL: 'BATTLE_REVEAL',
  BATTLE_FORCED_SWITCH: 'BATTLE_FORCED_SWITCH',
  BATTLE_STATE_UPDATE: 'BATTLE_STATE_UPDATE',
  REMATCH_REQUEST: 'REMATCH_REQUEST',
  REMATCH_ACCEPTED: 'REMATCH_ACCEPTED',
  ACTION_ERROR: 'ACTION_ERROR',
  HEARTBEAT: 'HEARTBEAT',
  HEARTBEAT_ACK: 'HEARTBEAT_ACK',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED: 'PLAYER_RECONNECTED'
});

export const CONNECTION_STATUS = Object.freeze({
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
});

/**
 * Format PeerJS peer ID for a given 6-character room code.
 * @param {string} roomCode
 * @returns {string}
 */
export function getPeerRoomId(roomCode) {
  const cleanCode = String(roomCode || '').trim().toUpperCase();
  return `draftdex-room-${cleanCode}`;
}

// ============================================================================
// IN-MEMORY MOCK PEER TRANSPORT (FOR TESTS & HEADLESS RUNNERS)
// ============================================================================

class MockPeerBus {
  constructor() {
    this.peers = new Map(); // id -> MockPeer
  }

  register(peer) {
    this.peers.set(peer.id, peer);
  }

  unregister(peer) {
    if (this.peers.get(peer.id) === peer) {
      this.peers.delete(peer.id);
    }
  }

  get(id) {
    return this.peers.get(id);
  }

  clear() {
    this.peers.clear();
  }
}

export const mockPeerBus = new MockPeerBus();

export class MockDataConnection {
  constructor(localPeer, remotePeerId, label = '') {
    this.localPeer = localPeer;
    this.peer = remotePeerId;
    this.label = label;
    this.open = false;
    this.handlers = {
      open: [],
      data: [],
      close: [],
      error: []
    };
    this.remoteConn = null;
  }

  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
    return this;
  }

  send(data) {
    if (!this.open || !this.remoteConn) {
      return;
    }
    // Simulate async network tick
    setTimeout(() => {
      if (this.remoteConn && this.remoteConn.open) {
        this.remoteConn.handlers.data.forEach(fn => fn(JSON.parse(JSON.stringify(data))));
      }
    }, 1);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.handlers.close.forEach(fn => fn());
    if (this.remoteConn && this.remoteConn.open) {
      this.remoteConn.open = false;
      this.remoteConn.handlers.close.forEach(fn => fn());
    }
  }
}

export class MockPeer {
  constructor(id) {
    this.id = id || 'mock-peer-' + Math.random().toString(36).substring(2, 9);
    this.handlers = {
      open: [],
      connection: [],
      close: [],
      error: [],
      disconnected: []
    };
    this.disconnected = false;
    this.destroyed = false;

    mockPeerBus.register(this);

    setTimeout(() => {
      if (!this.destroyed) {
        this.handlers.open.forEach(fn => fn(this.id));
      }
    }, 1);
  }

  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
    return this;
  }

  connect(targetPeerId) {
    const localConn = new MockDataConnection(this, targetPeerId);
    setTimeout(() => {
      const targetPeer = mockPeerBus.get(targetPeerId);
      if (!targetPeer || targetPeer.destroyed) {
        localConn.handlers.error.forEach(fn => fn(new Error(`Could not connect to peer ${targetPeerId}`)));
        return;
      }

      const remoteConn = new MockDataConnection(targetPeer, this.id);
      localConn.remoteConn = remoteConn;
      remoteConn.remoteConn = localConn;

      localConn.open = true;
      remoteConn.open = true;

      targetPeer.handlers.connection.forEach(fn => fn(remoteConn));
      remoteConn.handlers.open.forEach(fn => fn());
      localConn.handlers.open.forEach(fn => fn());
    }, 2);

    return localConn;
  }

  disconnect() {
    this.disconnected = true;
    this.handlers.disconnected.forEach(fn => fn());
  }

  reconnect() {
    this.disconnected = false;
    mockPeerBus.register(this);
    setTimeout(() => {
      this.handlers.open.forEach(fn => fn(this.id));
    }, 1);
  }

  destroy() {
    this.destroyed = true;
    mockPeerBus.unregister(this);
    this.handlers.close.forEach(fn => fn());
  }
}

/**
 * Default peer factory that selects window.Peer if in browser, or MockPeer if headless.
 */
export function defaultPeerFactory(peerId) {
  if (typeof window !== 'undefined' && window.Peer) {
    return new window.Peer(peerId);
  }
  return new MockPeer(peerId);
}

// ============================================================================
// P2P HOST SESSION
// ============================================================================

export class P2PHostSession {
  /**
   * @param {object} options
   * @param {string} options.roomCode - 6-char room code
   * @param {object} options.matchState - current match state
   * @param {Function} options.onClientAction - callback(action, guestToken, replyFn)
   * @param {Function} [options.onGuestConnected] - callback(guestInfo)
   * @param {Function} [options.onGuestDisconnected] - callback(guestInfo)
   * @param {Function} [options.peerFactory] - custom peer factory
   */
  constructor({
    roomCode,
    matchState,
    onClientAction,
    onGuestConnected,
    onGuestDisconnected,
    peerFactory = defaultPeerFactory
  }) {
    this.roomCode = String(roomCode || '').trim().toUpperCase();
    this.matchState = matchState;
    this.onClientAction = onClientAction;
    this.onGuestConnected = onGuestConnected;
    this.onGuestDisconnected = onGuestDisconnected;
    this.peerFactory = peerFactory;

    this.peerId = getPeerRoomId(this.roomCode);
    this.peer = null;
    this.status = CONNECTION_STATUS.DISCONNECTED;

    // Map: guestToken -> { conn, playerId, guestToken, playerName, connected: boolean }
    this.clients = new Map();

    this.initPeer();
  }

  initPeer() {
    this.status = CONNECTION_STATUS.CONNECTING;
    this.peer = this.peerFactory(this.peerId);

    this.peer.on('open', (id) => {
      this.status = CONNECTION_STATUS.CONNECTED;
      this.peerId = id;
    });

    this.peer.on('connection', (conn) => {
      this.handleIncomingConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.warn(`Host peer error on room ${this.roomCode}:`, err);
      this.status = CONNECTION_STATUS.ERROR;
    });

    this.peer.on('close', () => {
      this.status = CONNECTION_STATUS.DISCONNECTED;
    });
  }

  handleIncomingConnection(conn) {
    let clientToken = null;

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case MSG_TYPES.JOIN_ROOM: {
          clientToken = data.guestToken;
          const playerName = data.playerName || 'Challenger';
          this.handleJoinRequest(conn, clientToken, playerName);
          break;
        }

        case MSG_TYPES.CLIENT_BID: {
          if (this.onClientAction) {
            this.onClientAction({
              type: MSG_TYPES.CLIENT_BID,
              guestToken: data.guestToken,
              amount: data.amount
            }, (reply) => conn.send(reply));
          }
          break;
        }

        case MSG_TYPES.CLIENT_PASS: {
          if (this.onClientAction) {
            this.onClientAction({
              type: MSG_TYPES.CLIENT_PASS,
              guestToken: data.guestToken
            }, (reply) => conn.send(reply));
          }
          break;
        }

        case MSG_TYPES.CLIENT_LOCK_SQUAD: {
          if (this.onClientAction) {
            this.onClientAction({
              type: MSG_TYPES.CLIENT_LOCK_SQUAD,
              guestToken: data.guestToken,
              selectedIds: data.selectedIds,
              leadId: data.leadId
            }, (reply) => conn.send(reply));
          }
          break;
        }

        case MSG_TYPES.BATTLE_COMMIT: {
          if (this.onClientAction) {
            this.onClientAction({
              type: MSG_TYPES.BATTLE_COMMIT,
              guestToken: data.guestToken,
              commitHash: data.commitHash
            }, (reply) => conn.send(reply));
          }
          break;
        }

        case MSG_TYPES.BATTLE_REVEAL: {
          if (this.onClientAction) {
            this.onClientAction({
              type: MSG_TYPES.BATTLE_REVEAL,
              guestToken: data.guestToken,
              action: data.action,
              salt: data.salt
            }, (reply) => conn.send(reply));
          }
          break;
        }

        case MSG_TYPES.BATTLE_FORCED_SWITCH: {
          if (this.onClientAction) {
            this.onClientAction({
              type: MSG_TYPES.BATTLE_FORCED_SWITCH,
              guestToken: data.guestToken,
              switchIndex: data.switchIndex
            }, (reply) => conn.send(reply));
          }
          break;
        }

        case MSG_TYPES.REMATCH_REQUEST: {
          if (this.onClientAction) {
            this.onClientAction({
              type: MSG_TYPES.REMATCH_REQUEST,
              guestToken: data.guestToken
            }, (reply) => conn.send(reply));
          }
          break;
        }

        case MSG_TYPES.HEARTBEAT: {
          conn.send({ type: MSG_TYPES.HEARTBEAT_ACK, timestamp: Date.now() });
          break;
        }
      }
    });

    conn.on('close', () => {
      if (clientToken && this.clients.has(clientToken)) {
        const client = this.clients.get(clientToken);
        client.connected = false;
        if (this.onGuestDisconnected) {
          this.onGuestDisconnected(client);
        }
      }
    });
  }

  handleJoinRequest(conn, guestToken, playerName) {
    if (!this.matchState) {
      conn.send({ type: MSG_TYPES.JOIN_REJECTED, reason: 'MATCH_NOT_INITIALIZED' });
      return;
    }

    // Check if player with this token already exists (Reconnect)
    let existingPlayer = this.matchState.players.find(p => p.guestToken === guestToken);

    if (existingPlayer) {
      // Reconnection: update client mapping and connection
      existingPlayer.connected = true;
      this.clients.set(guestToken, {
        conn,
        playerId: existingPlayer.id,
        guestToken,
        playerName: existingPlayer.name,
        connected: true
      });

      conn.send({
        type: MSG_TYPES.JOIN_ACCEPTED,
        isReconnect: true,
        playerId: existingPlayer.id,
        guestToken,
        matchState: this.matchState
      });

      if (this.onGuestConnected) {
        this.onGuestConnected(this.clients.get(guestToken));
      }
      this.broadcastStateUpdate();
      return;
    }

    // Check if there is an empty seat or bot seat we can assign to this new guest
    const botSlot = this.matchState.players.find(p => p.isBot);
    let assignedPlayerId = null;

    if (botSlot) {
      // Replace bot with human guest
      botSlot.isBot = false;
      botSlot.name = playerName;
      botSlot.guestToken = guestToken;
      botSlot.connected = true;
      assignedPlayerId = botSlot.id;
    } else {
      // Check if lobby permits adding a new player
      if (this.matchState.status === 'setup' || this.matchState.status === 'lobby') {
        const newId = 'player_' + guestToken.substring(0, 6);
        const newPlayer = {
          id: newId,
          name: playerName,
          budget: this.matchState.settings.budget,
          team: [],
          isHost: false,
          isBot: false,
          guestToken,
          connected: true
        };
        this.matchState.players.push(newPlayer);
        assignedPlayerId = newId;
      } else {
        // Late join / mid-auction new spectator or late entrant
        const newId = 'player_' + guestToken.substring(0, 6);
        const newPlayer = {
          id: newId,
          name: playerName,
          budget: this.matchState.settings.budget,
          team: [],
          isHost: false,
          isBot: false,
          guestToken,
          connected: true
        };
        this.matchState.players.push(newPlayer);
        assignedPlayerId = newId;
      }
    }

    this.clients.set(guestToken, {
      conn,
      playerId: assignedPlayerId,
      guestToken,
      playerName,
      connected: true
    });

    conn.send({
      type: MSG_TYPES.JOIN_ACCEPTED,
      isReconnect: false,
      playerId: assignedPlayerId,
      guestToken,
      matchState: this.matchState
    });

    if (this.onGuestConnected) {
      this.onGuestConnected(this.clients.get(guestToken));
    }

    this.broadcastStateUpdate();
  }

  updateMatchState(newState) {
    this.matchState = newState;
    this.broadcastStateUpdate();
  }

  broadcastStateUpdate() {
    this.broadcast({
      type: MSG_TYPES.STATE_UPDATE,
      matchState: this.matchState
    });
  }

  broadcastTimerTick(remaining, total) {
    this.broadcast({
      type: MSG_TYPES.TIMER_TICK,
      remaining,
      total
    });
  }

  broadcastCountdownTick(countdownNumber) {
    this.broadcast({
      type: MSG_TYPES.COUNTDOWN_TICK,
      countdownNumber
    });
  }

  broadcastBattleState(battle, turnLog = []) {
    this.broadcast({
      type: MSG_TYPES.BATTLE_STATE_UPDATE,
      battle,
      turnLog
    });
  }

  broadcastRematch(matchState) {
    this.broadcast({
      type: MSG_TYPES.REMATCH_ACCEPTED,
      matchState
    });
  }

  broadcast(message) {
    const payload = JSON.parse(JSON.stringify(message));
    for (const client of this.clients.values()) {
      if (client.conn && client.conn.open) {
        try {
          client.conn.send(payload);
        } catch (err) {
          console.warn('Failed to send to client:', err);
        }
      }
    }
  }

  sendToGuest(guestToken, message) {
    const client = this.clients.get(guestToken);
    if (client && client.conn && client.conn.open) {
      client.conn.send(message);
    }
  }

  close() {
    this.status = CONNECTION_STATUS.DISCONNECTED;
    for (const client of this.clients.values()) {
      if (client.conn) {
        try { client.conn.close(); } catch (_) {}
      }
    }
    this.clients.clear();
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
  }
}

// ============================================================================
// P2P GUEST SESSION
// ============================================================================

export class P2PGuestSession {
  /**
   * @param {object} options
   * @param {string} options.roomCode - 6-char room code
   * @param {string} options.guestToken - persistent guest identifier
   * @param {string} [options.playerName='Challenger']
   * @param {Function} [options.onStateUpdate] - callback(matchState)
   * @param {Function} [options.onTimerTick] - callback(remaining, total)
   * @param {Function} [options.onActionError] - callback(errorReason)
   * @param {Function} [options.onStatusChange] - callback(status)
   * @param {Function} [options.peerFactory] - custom peer factory
   */
  constructor({
    roomCode,
    guestToken,
    playerName = 'Challenger',
    onStateUpdate,
    onTimerTick,
    onCountdownTick,
    onBattleStateUpdate,
    onRematchAccepted,
    onActionError,
    onStatusChange,
    peerFactory = defaultPeerFactory
  }) {
    this.roomCode = String(roomCode || '').trim().toUpperCase();
    this.guestToken = guestToken;
    this.playerName = playerName;
    this.onStateUpdate = onStateUpdate;
    this.onTimerTick = onTimerTick;
    this.onCountdownTick = onCountdownTick;
    this.onBattleStateUpdate = onBattleStateUpdate;
    this.onRematchAccepted = onRematchAccepted;
    this.onActionError = onActionError;
    this.onStatusChange = onStatusChange;
    this.peerFactory = peerFactory;

    this.peer = null;
    this.conn = null;
    this.status = CONNECTION_STATUS.DISCONNECTED;
    this.playerId = null;
    this.isReconnecting = false;
    this.reconnectTimer = null;
    this.destroyed = false;

    this.connect();
  }

  setStatus(newStatus) {
    this.status = newStatus;
    if (this.onStatusChange) {
      this.onStatusChange(newStatus);
    }
  }

  connect() {
    if (this.destroyed) return;
    this.setStatus(this.isReconnecting ? CONNECTION_STATUS.RECONNECTING : CONNECTION_STATUS.CONNECTING);

    this.peer = this.peerFactory();

    this.peer.on('open', () => {
      const hostPeerId = getPeerRoomId(this.roomCode);
      this.conn = this.peer.connect(hostPeerId);
      this.bindConnectionEvents(this.conn);
    });

    this.peer.on('error', (err) => {
      console.warn(`Guest peer error on room ${this.roomCode}:`, err);
      this.scheduleReconnect();
    });

    this.peer.on('close', () => {
      this.scheduleReconnect();
    });
  }

  bindConnectionEvents(conn) {
    conn.on('open', () => {
      this.setStatus(CONNECTION_STATUS.CONNECTED);
      this.isReconnecting = false;
      // Send handshake join message
      conn.send({
        type: MSG_TYPES.JOIN_ROOM,
        roomCode: this.roomCode,
        guestToken: this.guestToken,
        playerName: this.playerName
      });
    });

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case MSG_TYPES.JOIN_ACCEPTED: {
          this.playerId = data.playerId;
          if (this.onStateUpdate && data.matchState) {
            this.onStateUpdate(data.matchState);
          }
          break;
        }

        case MSG_TYPES.STATE_UPDATE: {
          if (this.onStateUpdate && data.matchState) {
            this.onStateUpdate(data.matchState);
          }
          break;
        }

        case MSG_TYPES.TIMER_TICK: {
          if (this.onTimerTick) {
            this.onTimerTick(data.remaining, data.total);
          }
          break;
        }

        case MSG_TYPES.COUNTDOWN_TICK: {
          if (this.onCountdownTick) {
            this.onCountdownTick(data.countdownNumber);
          }
          break;
        }

        case MSG_TYPES.BATTLE_STATE_UPDATE: {
          if (this.onBattleStateUpdate) {
            this.onBattleStateUpdate(data.battle, data.turnLog);
          }
          break;
        }

        case MSG_TYPES.REMATCH_ACCEPTED: {
          if (this.onRematchAccepted) {
            this.onRematchAccepted(data.matchState);
          }
          break;
        }

        case MSG_TYPES.ACTION_ERROR: {
          if (this.onActionError) {
            this.onActionError(data.reason);
          }
          break;
        }

        case MSG_TYPES.JOIN_REJECTED: {
          this.setStatus(CONNECTION_STATUS.ERROR);
          if (this.onActionError) {
            this.onActionError(data.reason || 'JOIN_REJECTED');
          }
          break;
        }
      }
    });

    conn.on('close', () => {
      this.scheduleReconnect();
    });

    conn.on('error', (err) => {
      console.warn('Guest connection error:', err);
      this.scheduleReconnect();
    });
  }

  scheduleReconnect() {
    if (this.destroyed) return;
    if (this.status !== CONNECTION_STATUS.RECONNECTING) {
      this.setStatus(CONNECTION_STATUS.RECONNECTING);
    }
    this.isReconnecting = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed && this.status === CONNECTION_STATUS.RECONNECTING) {
        if (this.peer) {
          try { this.peer.destroy(); } catch (_) {}
        }
        this.connect();
      }
    }, 1500);
  }

  submitBid(amount) {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send({
      type: MSG_TYPES.CLIENT_BID,
      guestToken: this.guestToken,
      amount
    });
    return true;
  }

  submitPass() {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send({
      type: MSG_TYPES.CLIENT_PASS,
      guestToken: this.guestToken
    });
    return true;
  }

  submitSquadLock(selectedIds, leadId) {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send({
      type: MSG_TYPES.CLIENT_LOCK_SQUAD,
      guestToken: this.guestToken,
      selectedIds,
      leadId
    });
    return true;
  }

  submitBattleCommit(commitHash) {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send({
      type: MSG_TYPES.BATTLE_COMMIT,
      guestToken: this.guestToken,
      commitHash
    });
    return true;
  }

  submitBattleReveal(action, salt) {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send({
      type: MSG_TYPES.BATTLE_REVEAL,
      guestToken: this.guestToken,
      action,
      salt
    });
    return true;
  }

  submitBattleForcedSwitch(switchIndex) {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send({
      type: MSG_TYPES.BATTLE_FORCED_SWITCH,
      guestToken: this.guestToken,
      switchIndex
    });
    return true;
  }

  submitRematchRequest() {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send({
      type: MSG_TYPES.REMATCH_REQUEST,
      guestToken: this.guestToken
    });
    return true;
  }

  close() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.conn) {
      try { this.conn.close(); } catch (_) {}
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
    }
    this.setStatus(CONNECTION_STATUS.DISCONNECTED);
  }
}
