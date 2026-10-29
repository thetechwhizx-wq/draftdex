/**
 * Pokémon Role Classification System
 * Pure game logic - zero UI / DOM / networking imports.
 * Roles: Physical Sweeper, Special Sweeper, Speedster, Tank/Wall, Support, All-rounder.
 */

export const ROLES = Object.freeze({
  PHYSICAL_SWEEPER: 'Physical Sweeper',
  SPECIAL_SWEEPER: 'Special Sweeper',
  SPEEDSTER: 'Speedster',
  TANK_WALL: 'Tank/Wall',
  SUPPORT: 'Support',
  ALL_ROUNDER: 'All-rounder'
});

/**
 * Configurable thresholds for role evaluation
 */
export const ROLE_CONFIG = Object.freeze({
  physicalSweeper: {
    minAtk: 95,
    highAtk: 120,
    minSpeed: 60,
    atkDominanceMargin: 15
  },
  specialSweeper: {
    minSpAtk: 95,
    highSpAtk: 120,
    minSpeed: 60,
    spAtkDominanceMargin: 15
  },
  speedster: {
    minSpeed: 105,
    extremeSpeed: 130
  },
  tankWall: {
    minBulkSum: 260, // hp + def + spDef
    highDef: 110,
    highSpDef: 110,
    maxSpeedForPureTank: 90
  },
  support: {
    minBulk: 220,
    minSpeed: 55
  },
  allRounder: {
    minBST: 470,
    maxStatSpreadDiff: 40 // max stat - min stat spread
  }
});

/**
 * Calculate role affinity scores for a given set of base stats.
 * @param {{hp: number, attack: number, defense: number, spAttack: number, spDefense: number, speed: number}} stats
 * @returns {Record<string, number>} Scores for each role
 */
export function calculateRoleScores(stats) {
  const { hp, attack, defense, spAttack, spDefense, speed } = stats;
  const bst = hp + attack + defense + spAttack + spDefense + speed;
  const bulk = hp + defense + spDefense;
  const maxStat = Math.max(hp, attack, defense, spAttack, spDefense, speed);
  const minStat = Math.min(hp, attack, defense, spAttack, spDefense, speed);

  const scores = {};

  // 1. Physical Sweeper score
  let physScore = (attack * 1.8) + (speed * 0.9) - (spAttack * 0.15);
  if (attack >= ROLE_CONFIG.physicalSweeper.highAtk) {
    physScore += 60;
  } else if (attack >= ROLE_CONFIG.physicalSweeper.minAtk) {
    physScore += 30;
  }
  if (attack >= spAttack + ROLE_CONFIG.physicalSweeper.atkDominanceMargin) {
    physScore += 40;
  }
  if (speed >= ROLE_CONFIG.physicalSweeper.minSpeed) {
    physScore += 20;
  }
  scores[ROLES.PHYSICAL_SWEEPER] = Math.max(0, physScore);

  // 2. Special Sweeper score
  let specScore = (spAttack * 1.8) + (speed * 0.9) - (attack * 0.15);
  if (spAttack >= ROLE_CONFIG.specialSweeper.highSpAtk) {
    specScore += 60;
  } else if (spAttack >= ROLE_CONFIG.specialSweeper.minSpAtk) {
    specScore += 30;
  }
  if (spAttack >= attack + ROLE_CONFIG.specialSweeper.spAtkDominanceMargin) {
    specScore += 40;
  }
  if (speed >= ROLE_CONFIG.specialSweeper.minSpeed) {
    specScore += 20;
  }
  scores[ROLES.SPECIAL_SWEEPER] = Math.max(0, specScore);

  // 3. Speedster score
  let speedScore = (speed * 2.2) + (Math.max(attack, spAttack) * 0.5);
  if (speed >= ROLE_CONFIG.speedster.extremeSpeed) {
    speedScore += 65;
  } else if (speed >= ROLE_CONFIG.speedster.minSpeed) {
    speedScore += 30;
  }
  // If speed is significantly greater than raw offenses, it's primarily a speedster
  if (speed > Math.max(attack, spAttack)) {
    speedScore += 35;
  }
  scores[ROLES.SPEEDSTER] = Math.max(0, speedScore);

  // 4. Tank/Wall score
  let tankScore = (bulk * 1.1) + Math.max(defense, spDefense) * 0.6 - (speed * 0.5);
  if (bulk >= ROLE_CONFIG.tankWall.minBulkSum) tankScore += 40;
  if (defense >= ROLE_CONFIG.tankWall.highDef || spDefense >= ROLE_CONFIG.tankWall.highSpDef) tankScore += 35;
  if (speed <= ROLE_CONFIG.tankWall.maxSpeedForPureTank) tankScore += 20;
  scores[ROLES.TANK_WALL] = Math.max(0, tankScore);

  // 5. Support score
  let supportScore = (bulk * 0.75) + (speed * 0.5) + 30;
  if (Math.abs(defense - spDefense) <= 30 && bulk >= ROLE_CONFIG.support.minBulk) {
    supportScore += 25;
  }
  if (speed >= ROLE_CONFIG.support.minSpeed && speed <= 110) {
    supportScore += 15;
  }
  if (attack > 125 || spAttack > 125) {
    supportScore -= 40;
  }
  scores[ROLES.SUPPORT] = Math.max(0, supportScore);

  // 6. All-rounder score
  const statValues = [hp, attack, defense, spAttack, spDefense, speed];
  const mean = bst / 6;
  const variance = statValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 6;
  const stdDev = Math.sqrt(variance);

  let allRounderScore = (bst * 0.42) + (100 - stdDev * 2.5);
  if (bst >= ROLE_CONFIG.allRounder.minBST && stdDev <= ROLE_CONFIG.allRounder.maxStatSpreadDiff) {
    allRounderScore += 45;
  }
  // Penalize all-rounder if there is a hyper-dominant stat (> 130)
  if (maxStat >= 130) {
    allRounderScore -= 45;
  }
  scores[ROLES.ALL_ROUNDER] = Math.max(0, allRounderScore);

  return scores;
}

/**
 * Assign primary and optional secondary role based on base stats.
 * @param {{hp: number, attack: number, defense: number, spAttack: number, spDefense: number, speed: number}} stats
 * @returns {{ primaryRole: string, secondaryRole: string | null, scores: Record<string, number> }}
 */
export function assignRoles(stats) {
  const scores = calculateRoleScores(stats);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const [topRole, topScore] = sorted[0];
  const [secondRole, secondScore] = sorted[1];

  let secondaryRole = null;
  // Secondary role awarded if it has a high relative score (>= 80% of top score) and absolute value
  if (secondScore >= topScore * 0.80 && secondScore >= 220) {
    secondaryRole = secondRole;
  }

  return {
    primaryRole: topRole,
    secondaryRole,
    scores
  };
}
