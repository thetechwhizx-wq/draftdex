/**
 * Setup Recommender Engine
 * Pure game logic - zero UI / DOM / networking imports.
 * Formula: Pool size and team size set the budget; budget sets starting bid;
 * base prices plus preset set the timers. Manually edited fields are locked.
 */

export const PRESETS = Object.freeze({
  quick: {
    id: 'quick',
    name: 'Quick',
    desc: 'Small pool, short timers, ~10 minutes',
    defaultTeamSize: 4,
    poolMultiplier: 2.5,
    baseTimers: { openTimer: 10, bidTimer: 5 }
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    desc: 'Default balanced draft experience',
    defaultTeamSize: 6,
    poolMultiplier: 3.5,
    baseTimers: { openTimer: 18, bidTimer: 10 }
  },
  marathon: {
    id: 'marathon',
    name: 'Marathon',
    desc: 'Large pool, team of 10, longer deliberation',
    defaultTeamSize: 10,
    poolMultiplier: 4.5,
    baseTimers: { openTimer: 25, bidTimer: 15 }
  }
});

/**
 * Calculate recommended match settings based on preset, pool size, and team size.
 *
 * @param {object} params
 * @param {'quick'|'standard'|'marathon'} [params.preset='standard']
 * @param {number} [params.teamSize]
 * @param {number} [params.poolSize]
 * @param {number} [params.numPlayers=2]
 * @param {Record<string, any>} [params.currentValues={}]
 * @param {string[]|Set<string>} [params.lockedFields=[]]
 * @returns {object} Full recommended settings with locked fields preserved
 */
export function recommendSettings({
  preset = 'standard',
  teamSize = null,
  poolSize = null,
  numPlayers = 2,
  currentValues = {},
  lockedFields = []
} = {}) {
  const locked = new Set(Array.isArray(lockedFields) ? lockedFields : Array.from(lockedFields));
  const presetConfig = PRESETS[preset] || PRESETS.standard;

  // 1. Team Size
  let finalTeamSize;
  if (locked.has('teamSize') && currentValues.teamSize !== undefined) {
    finalTeamSize = Math.max(1, Number(currentValues.teamSize));
  } else if (teamSize !== null && teamSize !== undefined) {
    finalTeamSize = Math.max(1, Number(teamSize));
  } else {
    finalTeamSize = presetConfig.defaultTeamSize;
  }

  // 2. Pool Size Target
  let finalPoolSize;
  if (locked.has('poolSize') && currentValues.poolSize !== undefined) {
    finalPoolSize = Math.max(finalTeamSize * numPlayers, Number(currentValues.poolSize));
  } else if (poolSize !== null && poolSize !== undefined) {
    finalPoolSize = Math.max(finalTeamSize * numPlayers, Number(poolSize));
  } else {
    finalPoolSize = Math.round(finalTeamSize * numPlayers * presetConfig.poolMultiplier);
  }

  // 3. Budget Recommendation Formula
  // Baseline ~16.5 credits per slot + small pool scale bonus
  let finalBudget;
  if (locked.has('budget') && currentValues.budget !== undefined) {
    finalBudget = Number(currentValues.budget);
  } else {
    const rawBudget = (finalTeamSize * 16) + (finalPoolSize * 0.1);
    // Round to nearest 5
    finalBudget = Math.max(20, Math.round(rawBudget / 5) * 5);
  }

  // 4. Starting Bid Recommendation Formula
  // Budget sets base prices: target roughly 5% of budget or budget / (teamSize * 3.3)
  let finalStartBid;
  if (locked.has('startBid') && currentValues.startBid !== undefined) {
    finalStartBid = Number(currentValues.startBid);
  } else {
    const calculatedBase = finalBudget / (finalTeamSize * 3.33);
    finalStartBid = Math.max(1, Math.round(calculatedBase));
  }

  // 5. Timers Recommendation Formula
  // Preset base timers + small deliberation modifier if high-stakes / high base bid
  let finalOpenTimer;
  let finalBidTimer;

  if (locked.has('openTimer') && currentValues.openTimer !== undefined) {
    finalOpenTimer = Number(currentValues.openTimer);
  } else {
    const timerBonus = finalStartBid >= 10 ? 3 : 0;
    finalOpenTimer = presetConfig.baseTimers.openTimer + timerBonus;
  }

  if (locked.has('bidTimer') && currentValues.bidTimer !== undefined) {
    finalBidTimer = Number(currentValues.bidTimer);
  } else {
    const timerBonus = finalStartBid >= 10 ? 2 : 0;
    finalBidTimer = presetConfig.baseTimers.bidTimer + timerBonus;
  }

  return {
    preset: presetConfig.id,
    teamSize: finalTeamSize,
    poolSize: finalPoolSize,
    budget: finalBudget,
    startBid: finalStartBid,
    openTimer: finalOpenTimer,
    bidTimer: finalBidTimer,
    lockedFields: Array.from(locked)
  };
}
