/**
 * Bot Personalities & Decision Engine
 * Pure game logic - zero UI / DOM / networking imports.
 * Supported Personalities: Aggressive, Strategist, Chaos, Sniper.
 */

import { ROLES } from './roles.js';
import { TIERS } from './pokemonData.js';
import { calculateFairValue } from './scoutReport.js';
import { getNextMinimumBid, validateBid, submitBid, submitPass } from './auction.js';

export const BOT_PERSONALITIES = Object.freeze({
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive',
    aggression: 0.95,
    budgetDiscipline: 1.35, // willing to pay up to 135% of valuation
    roleNeedWeight: 0.30,
    marqueeBias: 1.45,
    firstSetBonus: 1.40, // spends heavily in Set 1
    randomness: 0.04
  },
  strategist: {
    id: 'strategist',
    name: 'Strategist',
    aggression: 0.70,
    budgetDiscipline: 1.02, // strict value discipline
    roleNeedWeight: 0.95, // strongly prioritizes missing roles
    marqueeBias: 1.02,
    firstSetBonus: 1.00,
    randomness: 0.03
  },
  chaos: {
    id: 'chaos',
    name: 'Chaos',
    aggression: 0.75,
    budgetDiscipline: 1.15,
    roleNeedWeight: 0.40,
    marqueeBias: 1.10,
    firstSetBonus: 1.05,
    randomness: 0.25
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    aggression: 0.65,
    budgetDiscipline: 0.95, // only bids below fair value
    roleNeedWeight: 0.75,
    marqueeBias: 0.95,
    firstSetBonus: 0.90,
    randomness: 0.04
  }
});

/**
 * Calculate a bot's subjective valuation in credits for the current lot.
 *
 * @param {object} matchState
 * @param {object} botPlayer
 * @param {object} personality
 * @param {() => number} [rng=Math.random]
 * @returns {number} Value in match credits
 */
export function evaluateBotValue(matchState, botPlayer, personality, rng = Math.random) {
  const lot = matchState.currentLot;
  if (!lot || !lot.pokemon) return 0;
  const p = lot.pokemon;

  // Base objective fair value
  const baseFair = calculateFairValue(p, matchState.settings?.budget || 100);
  let value = baseFair;

  // 1. Role need & team synergy
  const currentTeam = botPlayer.team || [];
  const rolesInTeam = new Set(currentTeam.map(item => item.pokemon?.role));
  const missingRole = !rolesInTeam.has(p.role);

  if (missingRole) {
    // Reward filling an empty role archetype
    value += (baseFair * 0.25 * personality.roleNeedWeight);
  } else {
    // Diminishing returns on duplicate roles
    const duplicateCount = currentTeam.filter(item => item.pokemon?.role === p.role).length;
    value -= (duplicateCount * 2 * personality.roleNeedWeight);
  }

  // 2. Marquee and First-Set (Set 1) modifiers
  const isSet1 = matchState.currentSetIndex === 0;
  if (isSet1) {
    value *= personality.firstSetBonus;
  }
  if (p.tier === TIERS.MARQUEE || p.isLegendary) {
    value *= personality.marqueeBias;
  }

  // 3. Random noise factor
  const noise = (rng() - 0.5) * 2 * personality.randomness;
  value *= (1 + noise);

  // Apply personality budget discipline to find willing ceiling
  return Math.max(1, Math.round(value * personality.budgetDiscipline));
}

/**
 * Determine a bot player's next auction action (bid or pass).
 *
 * @param {object} matchState
 * @param {string|object} botPlayer
 * @param {'aggressive'|'strategist'|'chaos'|'sniper'} [personalityId='strategist']
 * @param {() => number} [rng=Math.random]
 * @returns {{ type: 'bid', amount: number } | { type: 'pass' }}
 */
export function botDecideAction(matchState, botPlayer, personalityId = 'strategist', rng = Math.random) {
  const lot = matchState.currentLot;
  if (!lot) return { type: 'pass' };

  const player = typeof botPlayer === 'string'
    ? matchState.players.find(p => p.id === botPlayer)
    : botPlayer;

  if (!player) return { type: 'pass' };

  // Cannot bid if squad is full
  if (player.team.length >= matchState.settings.teamSize) {
    return { type: 'pass' };
  }

  // Cannot bid against self
  if (lot.leaderId === player.id) {
    return { type: 'pass' };
  }

  const personality = BOT_PERSONALITIES[personalityId] || BOT_PERSONALITIES.strategist;
  const valuationCeiling = evaluateBotValue(matchState, player, personality, rng);
  const minRequired = getNextMinimumBid(matchState);

  // If minimum required exceeds willingness to pay, pass
  if (minRequired > valuationCeiling) {
    return { type: 'pass' };
  }

  // Validate bid against referee rules (budget, reserve rule)
  const validation = validateBid(matchState, player.id, minRequired);
  if (!validation.valid) {
    return { type: 'pass' };
  }

  // Decide whether to bid minimum or place a competitive jump bid
  let bidAmount = minRequired;
  if (personality.aggression > 0.85 && valuationCeiling > minRequired + 3 && rng() < 0.35) {
    const jump = minRequired + 1 + Math.floor(rng() * 3);
    if (jump <= valuationCeiling && jump <= validation.maxBid) {
      bidAmount = jump;
    }
  }

  return { type: 'bid', amount: bidAmount };
}

/**
 * Run a full automated match between bots until completion.
 *
 * @param {object} matchState
 * @param {Record<string, string>} playerPersonalities Map of playerId -> personalityId
 * @param {() => number} [rng=Math.random]
 * @returns {object} Completed matchState
 */
export function simulateFullBotMatch(matchState, playerPersonalities, rng = Math.random) {
  let safetyLoop = 0;
  const maxActions = 2000;

  while (matchState.status !== 'completed' && matchState.currentLot && safetyLoop < maxActions) {
    safetyLoop++;
    const lot = matchState.currentLot;

    // Each active non-leading player gets a turn to act
    const eligibleBidders = matchState.players.filter(p =>
      p.team.length < matchState.settings.teamSize && p.id !== lot.leaderId
    );

    if (eligibleBidders.length === 0) {
      break;
    }

    let bidPlacedInRound = false;

    for (const p of eligibleBidders) {
      const personality = playerPersonalities[p.id] || 'strategist';
      const action = botDecideAction(matchState, p, personality, rng);

      if (action.type === 'bid') {
        submitBid(matchState, p.id, action.amount);
        bidPlacedInRound = true;
        break; // restart round with new leader
      } else {
        submitPass(matchState, p.id);
      }
    }
  }

  return matchState;
}
