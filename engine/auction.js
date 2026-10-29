/**
 * DraftDex Auction Engine
 * Pure game logic - zero UI / DOM / networking imports.
 * Enforces IPL-style set auctions, dynamic bid ladder, referee validation,
 * budget reserve rules, pass mechanics, accelerated rounds, and replayable seeds.
 */

import { createRNG, seededShuffle } from './random.js';
import { POKEMON_DATABASE, getPokemonById, TIERS } from './pokemonData.js';
import { ROLES } from './roles.js';

export const LOT_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  SOLD: 'sold',
  UNSOLD: 'unsold'
});

export const MATCH_STATUS = Object.freeze({
  SETUP: 'setup',
  IN_PROGRESS: 'in_progress',
  SET_BREAK: 'set_break',
  ACCELERATED_ROUND: 'accelerated_round',
  COMPLETED: 'completed'
});

export const BID_ERROR_CODES = Object.freeze({
  MATCH_NOT_ACTIVE: 'MATCH_NOT_ACTIVE',
  LOT_NOT_ACTIVE: 'LOT_NOT_ACTIVE',
  ALREADY_SOLD: 'ALREADY_SOLD',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  FULL_SQUAD: 'FULL_SQUAD',
  ALREADY_LEADING: 'ALREADY_LEADING',
  LOW_BID: 'LOW_BID',
  OVER_BUDGET: 'OVER_BUDGET',
  RESERVE_VIOLATION: 'RESERVE_VIOLATION'
});

/**
 * Dynamic bid ladder increment based on current price.
 * @param {number} currentPrice
 * @param {number} [baseIncrement] optional override
 * @returns {number}
 */
export function getMinIncrement(currentPrice, baseIncrement = null) {
  if (baseIncrement !== null && baseIncrement !== undefined && baseIncrement > 0) {
    return baseIncrement;
  }
  if (currentPrice < 20) return 1;
  if (currentPrice < 50) return 2;
  if (currentPrice < 100) return 5;
  return 10;
}

/**
 * Partition Pokémon pool into standard auction sets.
 * 1. Marquee Set
 * 2. Attackers (Physical Sweepers)
 * 3. Special Attackers (Special Sweepers)
 * 4. Speedsters
 * 5. Tanks & Walls
 * 6. Support & All-rounders
 * 7. Wildcards (any remaining)
 *
 * @param {Array<number|object>} rawPool
 * @param {() => number} rng
 * @returns {Array<{ id: string, name: string, lots: Array<object> }>}
 */
export function organizeSets(rawPool, rng) {
  const pokemonList = rawPool.map(item => {
    if (typeof item === 'number') return getPokemonById(item);
    return item;
  }).filter(Boolean);

  const usedIds = new Set();
  const sets = [];

  function extract(predicate, name, id) {
    const matched = [];
    for (const p of pokemonList) {
      if (!usedIds.has(p.id) && predicate(p)) {
        usedIds.add(p.id);
        matched.push(p);
      }
    }
    if (matched.length > 0) {
      const shuffled = seededShuffle(matched, rng);
      sets.push({
        id,
        name,
        lots: shuffled.map(p => ({
          pokemonId: p.id,
          pokemon: p,
          status: LOT_STATUS.PENDING
        }))
      });
    }
  }

  // 1. Marquee Set
  extract(p => p.tier === TIERS.MARQUEE || p.isLegendary || p.bst >= 600, 'Marquee Set', 'marquee');

  // 2. Physical Attackers
  extract(p => p.role === ROLES.PHYSICAL_SWEEPER, 'Physical Attackers', 'physical_attackers');

  // 3. Special Attackers
  extract(p => p.role === ROLES.SPECIAL_SWEEPER, 'Special Attackers', 'special_attackers');

  // 4. Speedsters
  extract(p => p.role === ROLES.SPEEDSTER, 'Speedsters', 'speedsters');

  // 5. Tanks & Walls
  extract(p => p.role === ROLES.TANK_WALL, 'Tanks & Walls', 'tanks_walls');

  // 6. Support & All-rounders
  extract(p => p.role === ROLES.SUPPORT || p.role === ROLES.ALL_ROUNDER, 'Support & All-rounders', 'support_allrounders');

  // 7. Wildcards (all remaining)
  extract(() => true, 'Wildcard Set', 'wildcard');

  return sets;
}

/**
 * Initialize a new Auction Match state.
 * @param {object} params
 * @param {string} [params.room='POKE01']
 * @param {number|string} [params.seed=Date.now()]
 * @param {object} [params.settings={}]
 * @param {Array<{id: string, name: string, isHost?: boolean, isBot?: boolean}>} params.players
 * @param {Array<number|object>} [params.pool]
 * @returns {object} Auction Match State
 */
export function createAuctionMatch({
  room = 'POKE01',
  seed = 'draftdex-seed-1',
  settings = {},
  players = [],
  pool = null
}) {
  const teamSize = Number(settings.teamSize) || 6;
  const budget = Number(settings.budget) || 100;
  const startBid = Number(settings.startBid) || 5;
  const minIncrement = settings.minIncrement !== undefined ? Number(settings.minIncrement) : null;
  const minReserveSlotPrice = settings.minReserveSlotPrice !== undefined ? Number(settings.minReserveSlotPrice) : 1;

  const rng = createRNG(seed);
  const activePool = pool || POKEMON_DATABASE;
  const sets = organizeSets(activePool, rng);

  const matchPlayers = players.map(p => ({
    id: p.id,
    name: p.name,
    budget,
    team: [], // Array of { pokemonId, price, lotId }
    isHost: !!p.isHost,
    isBot: !!p.isBot
  }));

  const match = {
    room,
    seed,
    status: MATCH_STATUS.IN_PROGRESS,
    settings: {
      teamSize,
      budget,
      startBid,
      minIncrement,
      minReserveSlotPrice
    },
    players: matchPlayers,
    sets,
    currentSetIndex: 0,
    currentLotIndex: -1,
    currentLot: null,
    acceleratedPool: [], // Pokémon IDs that went unsold
    salesHistory: [], // Array of { pokemonId, price, winnerId, setIndex, timestamp }
    events: [],
    passSet: new Set() // Set of playerIds who passed on current lot
  };

  // Advance to first lot
  startNextLot(match);
  return match;
}

/**
 * Get the current minimum required bid for the active lot.
 * @param {object} match
 * @returns {number}
 */
export function getNextMinimumBid(match) {
  const lot = match.currentLot;
  if (!lot) return match.settings.startBid;

  const isAccelerated = match.status === MATCH_STATUS.ACCELERATED_ROUND;
  const baseStart = isAccelerated
    ? Math.max(1, Math.floor(match.settings.startBid * 0.5))
    : match.settings.startBid;

  if (!lot.leaderId) {
    return baseStart;
  }

  const inc = getMinIncrement(lot.currentBid, match.settings.minIncrement);
  return lot.currentBid + inc;
}

/**
 * Validate a bid against all referee and budget rules.
 * @param {object} match
 * @param {string} playerId
 * @param {number} amount
 * @returns {{ valid: boolean, error?: string, code?: string, minBid?: number, maxBid?: number }}
 */
export function validateBid(match, playerId, amount) {
  if (match.status !== MATCH_STATUS.IN_PROGRESS && match.status !== MATCH_STATUS.ACCELERATED_ROUND) {
    return { valid: false, error: 'Match is not actively accepting bids', code: BID_ERROR_CODES.MATCH_NOT_ACTIVE };
  }

  const lot = match.currentLot;
  if (!lot) {
    return { valid: false, error: 'No active lot', code: BID_ERROR_CODES.LOT_NOT_ACTIVE };
  }

  if (lot.status === LOT_STATUS.SOLD) {
    return { valid: false, error: 'This lot has already been sold', code: BID_ERROR_CODES.ALREADY_SOLD };
  }

  if (lot.status !== LOT_STATUS.ACTIVE) {
    return { valid: false, error: 'Lot is not currently accepting bids', code: BID_ERROR_CODES.LOT_NOT_ACTIVE };
  }

  const player = match.players.find(p => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found in match', code: BID_ERROR_CODES.PLAYER_NOT_FOUND };
  }

  // 1. Full squad rule
  if (player.team.length >= match.settings.teamSize) {
    return { valid: false, error: 'Player squad is full', code: BID_ERROR_CODES.FULL_SQUAD };
  }

  // 2. Already leading rule
  if (lot.leaderId === playerId) {
    return { valid: false, error: 'Player is already holding the highest bid', code: BID_ERROR_CODES.ALREADY_LEADING };
  }

  const minBid = getNextMinimumBid(match);
  const numAmount = Number(amount);

  // 3. Minimum bid check
  if (!Number.isFinite(numAmount) || numAmount < minBid) {
    return {
      valid: false,
      error: `Bid of ${numAmount} is below minimum required bid of ${minBid}`,
      code: BID_ERROR_CODES.LOW_BID,
      minBid
    };
  }

  // 4. Over budget check
  if (numAmount > player.budget) {
    return {
      valid: false,
      error: `Bid of ${numAmount} exceeds available budget of ${player.budget}`,
      code: BID_ERROR_CODES.OVER_BUDGET
    };
  }

  // 5. Budget Reserve Rule
  // A player cannot bid so much that they cannot afford the minimum reserve for their remaining slots.
  // remainingSlots: slots left to fill (including this purchase)
  // futureSlots: slots left to fill AFTER this purchase
  const remainingSlots = match.settings.teamSize - player.team.length;
  const futureSlots = Math.max(0, remainingSlots - 1);
  const reserveNeeded = futureSlots * match.settings.minReserveSlotPrice;
  const maxAllowableBid = player.budget - reserveNeeded;

  if (numAmount > maxAllowableBid) {
    return {
      valid: false,
      error: `Bid of ${numAmount} violates reserve rule. Must keep at least ${reserveNeeded} for remaining ${futureSlots} empty slots. Maximum bid is ${maxAllowableBid}`,
      code: BID_ERROR_CODES.RESERVE_VIOLATION,
      maxBid: maxAllowableBid
    };
  }

  return { valid: true, minBid, maxBid: maxAllowableBid };
}

/**
 * Submit a bid on the active lot.
 * @param {object} match
 * @param {string} playerId
 * @param {number} amount
 * @param {number} [timestamp=Date.now()]
 * @returns {{ success: boolean, error?: string, code?: string, lot?: object }}
 */
export function submitBid(match, playerId, amount, timestamp = Date.now()) {
  const validation = validateBid(match, playerId, amount);
  if (!validation.valid) {
    return { success: false, error: validation.error, code: validation.code };
  }

  const lot = match.currentLot;
  const player = match.players.find(p => p.id === playerId);
  const prevLeader = lot.leaderId;
  const prevBid = lot.currentBid;

  lot.currentBid = Number(amount);
  lot.leaderId = playerId;
  lot.lastBidAt = timestamp;
  lot.bidCount = (lot.bidCount || 0) + 1;

  // Clear passes: every valid bid re-opens bidding for all active players
  match.passSet.clear();

  match.events.push({
    type: 'bid',
    playerId,
    playerName: player.name,
    amount: lot.currentBid,
    lotId: lot.pokemonId,
    timestamp
  });

  return { success: true, lot };
}

/**
 * Register a pass for a player on the current lot.
 * If all other eligible bidders have passed, resolves lot immediately (all-pass sale or unsold).
 *
 * @param {object} match
 * @param {string} playerId
 * @param {number} [timestamp=Date.now()]
 * @returns {{ success: boolean, resolved: boolean, resolution?: 'sold'|'unsold'|null, error?: string }}
 */
export function submitPass(match, playerId, timestamp = Date.now()) {
  const lot = match.currentLot;
  if (!lot || lot.status !== LOT_STATUS.ACTIVE) {
    return { success: false, resolved: false, error: 'No active lot to pass on' };
  }

  const player = match.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, resolved: false, error: 'Player not found' };
  }

  // Current leader does not pass against themselves
  if (lot.leaderId === playerId) {
    return { success: false, resolved: false, error: 'Current leader cannot pass' };
  }

  match.passSet.add(playerId);
  match.events.push({
    type: 'pass',
    playerId,
    playerName: player.name,
    lotId: lot.pokemonId,
    timestamp
  });

  // Check if all other active bidders have passed
  // Active bidders: players whose squads are NOT yet full
  const activeBidders = match.players.filter(p => p.team.length < match.settings.teamSize);

  let allPassed = false;
  if (lot.leaderId) {
    // There is a current leader. Check if all OTHER active bidders passed.
    const nonLeaders = activeBidders.filter(p => p.id !== lot.leaderId);
    allPassed = nonLeaders.every(p => match.passSet.has(p.id));
  } else {
    // Nobody has bid yet. Check if ALL active bidders passed.
    allPassed = activeBidders.every(p => match.passSet.has(p.id));
  }

  if (allPassed) {
    const outcome = resolveCurrentLot(match, lot.leaderId ? 'sold' : 'unsold', timestamp);
    return { success: true, resolved: true, resolution: outcome.resolution };
  }

  return { success: true, resolved: false };
}

/**
 * Resolve the current lot (sold to leader, or unsold).
 * @param {object} match
 * @param {'sold'|'unsold'} outcome
 * @param {number} [timestamp=Date.now()]
 * @returns {{ resolution: 'sold'|'unsold', winner?: object, price?: number }}
 */
export function resolveCurrentLot(match, outcome, timestamp = Date.now()) {
  const lot = match.currentLot;
  if (!lot) return { resolution: outcome };

  if (outcome === 'sold' && lot.leaderId) {
    const winner = match.players.find(p => p.id === lot.leaderId);
    lot.status = LOT_STATUS.SOLD;
    winner.budget -= lot.currentBid;
    winner.team.push({
      pokemonId: lot.pokemonId,
      pokemon: lot.pokemon,
      price: lot.currentBid
    });

    match.salesHistory.push({
      pokemonId: lot.pokemonId,
      pokemonName: lot.pokemon.name,
      price: lot.currentBid,
      winnerId: winner.id,
      winnerName: winner.name,
      setIndex: match.currentSetIndex,
      timestamp
    });

    match.events.push({
      type: 'sold',
      lotId: lot.pokemonId,
      winnerId: winner.id,
      winnerName: winner.name,
      price: lot.currentBid,
      timestamp
    });

    // Check if match is finished (all players filled their squads)
    if (match.players.every(p => p.team.length >= match.settings.teamSize)) {
      match.status = MATCH_STATUS.COMPLETED;
      match.currentLot = null;
      return { resolution: 'sold', winner, price: lot.currentBid };
    }
  } else {
    lot.status = LOT_STATUS.UNSOLD;
    // Add to accelerated pool for the accelerated round
    match.acceleratedPool.push(lot.pokemonId);

    match.events.push({
      type: 'unsold',
      lotId: lot.pokemonId,
      timestamp
    });
  }

  // Advance to next lot
  startNextLot(match);
  return { resolution: outcome, winner: lot.leaderId, price: lot.currentBid };
}

/**
 * Advance to the next lot in the current set, or move to the next set.
 * If all sets are exhausted and accelerated pool exists, start Accelerated Round.
 * @param {object} match
 * @returns {object|null} Next lot, or null if match completed.
 */
export function startNextLot(match) {
  match.passSet.clear();

  // If all players are already full, complete match
  if (match.players.every(p => p.team.length >= match.settings.teamSize)) {
    match.status = MATCH_STATUS.COMPLETED;
    match.currentLot = null;
    return null;
  }

  // 1. Regular sets
  if (match.status === MATCH_STATUS.IN_PROGRESS) {
    while (match.currentSetIndex < match.sets.length) {
      const currentSet = match.sets[match.currentSetIndex];
      match.currentLotIndex++;

      if (match.currentLotIndex < currentSet.lots.length) {
        const lot = currentSet.lots[match.currentLotIndex];
        lot.status = LOT_STATUS.ACTIVE;
        lot.currentBid = 0;
        lot.leaderId = null;
        lot.bidCount = 0;
        lot.startedAt = Date.now();
        match.currentLot = lot;
        return lot;
      }

      // Current set exhausted: advance to next set
      match.currentSetIndex++;
      match.currentLotIndex = -1;
    }

    // All regular sets finished. If unsold items exist and players need Pokémon, start Accelerated Round.
    if (match.acceleratedPool.length > 0) {
      match.status = MATCH_STATUS.ACCELERATED_ROUND;
      match.acceleratedSet = {
        id: 'accelerated',
        name: 'Accelerated Round',
        lots: match.acceleratedPool.map(id => {
          const p = getPokemonById(id);
          return {
            pokemonId: id,
            pokemon: p,
            status: LOT_STATUS.PENDING
          };
        })
      };
      match.currentLotIndex = -1;
    } else {
      match.status = MATCH_STATUS.COMPLETED;
      match.currentLot = null;
      return null;
    }
  }

  // 2. Accelerated round
  if (match.status === MATCH_STATUS.ACCELERATED_ROUND) {
    match.currentLotIndex++;
    if (match.currentLotIndex < match.acceleratedSet.lots.length) {
      const lot = match.acceleratedSet.lots[match.currentLotIndex];
      lot.status = LOT_STATUS.ACTIVE;
      lot.currentBid = 0;
      lot.leaderId = null;
      lot.bidCount = 0;
      lot.startedAt = Date.now();
      match.currentLot = lot;
      return lot;
    }

    // Accelerated round exhausted
    match.status = MATCH_STATUS.COMPLETED;
    match.currentLot = null;
    return null;
  }

  return null;
}
