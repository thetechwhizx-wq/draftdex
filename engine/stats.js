/**
 * Level 50 Stat Calculation with Fixed Role Builds
 * Pure game logic - zero UI / DOM / networking imports.
 */

import { ROLES } from './roles.js';

export const FIXED_ROLE_BUILDS = Object.freeze({
  [ROLES.PHYSICAL_SWEEPER]: {
    evs: { hp: 4, attack: 252, defense: 0, spAttack: 0, spDefense: 0, speed: 252 },
    natureModifiers: { attack: 1.1, spAttack: 0.9 }
  },
  [ROLES.SPECIAL_SWEEPER]: {
    evs: { hp: 4, attack: 0, defense: 0, spAttack: 252, spDefense: 0, speed: 252 },
    natureModifiers: { spAttack: 1.1, attack: 0.9 }
  },
  [ROLES.SPEEDSTER]: {
    evs: { hp: 4, attack: 128, defense: 0, spAttack: 128, speed: 252 },
    natureModifiers: { speed: 1.1, defense: 0.9 }
  },
  [ROLES.TANK_WALL]: {
    evs: { hp: 252, attack: 0, defense: 128, spAttack: 0, spDefense: 128, speed: 0 },
    natureModifiers: { defense: 1.1, speed: 0.9 }
  },
  [ROLES.SUPPORT]: {
    evs: { hp: 252, attack: 0, defense: 128, spAttack: 0, spDefense: 128, speed: 0 },
    natureModifiers: { spDefense: 1.1, attack: 0.9 }
  },
  [ROLES.ALL_ROUNDER]: {
    evs: { hp: 84, attack: 84, defense: 84, spAttack: 84, spDefense: 84, speed: 84 },
    natureModifiers: {}
  }
});

/**
 * Calculate Level 50 battle stats from base stats and role.
 * Standard competitive formula assuming 31 IVs.
 *
 * @param {{ hp: number, attack: number, defense: number, spAttack: number, spDefense: number, speed: number }} baseStats
 * @param {string} role
 * @param {number} [level=50]
 * @returns {{ hp: number, attack: number, defense: number, spAttack: number, spDefense: number, speed: number }}
 */
export function calculateLevel50Stats(baseStats, role, level = 50) {
  const build = FIXED_ROLE_BUILDS[role] || FIXED_ROLE_BUILDS[ROLES.ALL_ROUNDER];
  const iv = 31;

  // HP Formula: floor(((2 * base + IV + floor(EV/4)) * level) / 100) + level + 10
  const hpEv = build.evs.hp || 0;
  const calculatedHp = Math.floor(((2 * baseStats.hp + iv + Math.floor(hpEv / 4)) * level) / 100) + level + 10;

  // Other stats formula: floor((floor(((2 * base + IV + floor(EV/4)) * level) / 100) + 5) * nature)
  function calcStat(base, statName) {
    const ev = build.evs[statName] || 0;
    const baseCalc = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
    const nature = build.natureModifiers[statName] || 1.0;
    return Math.floor(baseCalc * nature);
  }

  return {
    hp: calculatedHp,
    attack: calcStat(baseStats.attack, 'attack'),
    defense: calcStat(baseStats.defense, 'defense'),
    spAttack: calcStat(baseStats.spAttack, 'spAttack'),
    spDefense: calcStat(baseStats.spDefense, 'spDefense'),
    speed: calcStat(baseStats.speed, 'speed')
  };
}
