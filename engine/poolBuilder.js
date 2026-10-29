/**
 * Draft Pool Builder and Role Coverage Validator
 * Pure game logic - zero UI / DOM / networking imports.
 */

import { POKEMON_DATABASE, filterPokemon } from './pokemonData.js';
import { ROLES } from './roles.js';
import { createRNG, seededShuffle } from './random.js';

export const CORE_ROLES = Object.freeze([
  ROLES.PHYSICAL_SWEEPER,
  ROLES.SPECIAL_SWEEPER,
  ROLES.SPEEDSTER,
  ROLES.TANK_WALL,
  ROLES.SUPPORT,
  ROLES.ALL_ROUNDER
]);

/**
 * Minimum required Pokémon count per role for a balanced draft.
 * Ensures every player has opportunities to draft each core role.
 *
 * @param {number} numPlayers
 * @param {number} teamSize
 * @returns {Record<string, number>} Minimum quota per role
 */
export function getRoleQuotas(numPlayers = 2, teamSize = 6) {
  const baseQuota = Math.max(2, Math.ceil(numPlayers * 1.5));
  return {
    [ROLES.PHYSICAL_SWEEPER]: baseQuota,
    [ROLES.SPECIAL_SWEEPER]: baseQuota,
    [ROLES.SPEEDSTER]: baseQuota,
    [ROLES.TANK_WALL]: baseQuota,
    'Support/All-rounder': Math.max(2, Math.ceil(numPlayers * 1.5))
  };
}

/**
 * Check if a Pokémon satisfies a given role or archetype.
 * @param {object} p
 * @param {string} roleKey
 * @returns {boolean}
 */
export function pokemonMatchesRole(p, roleKey) {
  if (!p) return false;
  if (roleKey === 'Support/All-rounder') {
    return p.role === ROLES.SUPPORT || p.secondaryRole === ROLES.SUPPORT ||
           p.role === ROLES.ALL_ROUNDER || p.secondaryRole === ROLES.ALL_ROUNDER;
  }
  return p.role === roleKey || p.secondaryRole === roleKey;
}

/**
 * Validate whether a given pool meets the role coverage requirement.
 * "before the match starts, the pool must contain enough of every role for each player to fill a balanced team."
 *
 * @param {Array<object>} pool
 * @param {number} [numPlayers=2]
 * @param {number} [teamSize=6]
 * @returns {{ valid: boolean, counts: Record<string, number>, quotas: Record<string, number>, deficits: Record<string, number> }}
 */
export function validateRoleCoverage(pool, numPlayers = 2, teamSize = 6) {
  const quotas = getRoleQuotas(numPlayers, teamSize);
  const counts = {
    [ROLES.PHYSICAL_SWEEPER]: 0,
    [ROLES.SPECIAL_SWEEPER]: 0,
    [ROLES.SPEEDSTER]: 0,
    [ROLES.TANK_WALL]: 0,
    'Support/All-rounder': 0
  };

  for (const p of pool) {
    if (p.role === ROLES.PHYSICAL_SWEEPER || p.secondaryRole === ROLES.PHYSICAL_SWEEPER) {
      counts[ROLES.PHYSICAL_SWEEPER]++;
    }
    if (p.role === ROLES.SPECIAL_SWEEPER || p.secondaryRole === ROLES.SPECIAL_SWEEPER) {
      counts[ROLES.SPECIAL_SWEEPER]++;
    }
    if (p.role === ROLES.SPEEDSTER || p.secondaryRole === ROLES.SPEEDSTER) {
      counts[ROLES.SPEEDSTER]++;
    }
    if (p.role === ROLES.TANK_WALL || p.secondaryRole === ROLES.TANK_WALL) {
      counts[ROLES.TANK_WALL]++;
    }
    if (
      p.role === ROLES.SUPPORT || p.secondaryRole === ROLES.SUPPORT ||
      p.role === ROLES.ALL_ROUNDER || p.secondaryRole === ROLES.ALL_ROUNDER
    ) {
      counts['Support/All-rounder']++;
    }
  }

  const deficits = {};
  let valid = true;

  for (const [role, quota] of Object.entries(quotas)) {
    const count = counts[role] || 0;
    if (count < quota) {
      valid = false;
      deficits[role] = quota - count;
    }
  }

  return {
    valid,
    counts,
    quotas,
    deficits
  };
}

/**
 * Build and balance a draft pool according to match setup criteria and role coverage.
 *
 * @param {object} params
 * @param {number[]|number} [params.generations] Gen 1–9 or subset
 * @param {boolean} [params.famousMix=false]
 * @param {boolean} [params.fullyEvolvedOnly=true]
 * @param {boolean} [params.includeLegendaries=true]
 * @param {boolean} [params.includeMythicals=false]
 * @param {number} [params.targetPoolSize]
 * @param {number} [params.numPlayers=2]
 * @param {number} [params.teamSize=6]
 * @param {string|number} [params.seed='pool-seed-1']
 * @returns {{ pool: Array<object>, roleCoverage: object, seed: string|number }}
 */
export function buildDraftPool({
  generations = null,
  famousMix = false,
  fullyEvolvedOnly = true,
  includeLegendaries = true,
  includeMythicals = false,
  targetPoolSize = null,
  numPlayers = 2,
  teamSize = 6,
  seed = 'pool-seed-1'
} = {}) {
  const rng = createRNG(seed);

  // 1. Filter candidates matching the user's generation and category filters
  const eligibleCandidates = filterPokemon({
    generations: famousMix ? null : generations,
    famousMixOnly: famousMix,
    fullyEvolvedOnly,
    includeLegendaries,
    includeMythicals
  });

  const targetSize = targetPoolSize || Math.max(numPlayers * teamSize * 2, 24);
  const shuffledEligible = seededShuffle(eligibleCandidates, rng);

  // Select initial sample
  let selected = shuffledEligible.slice(0, Math.min(targetSize, shuffledEligible.length));
  let selectedIds = new Set(selected.map(p => p.id));

  // 2. Loop to balance deficits
  let coverage = validateRoleCoverage(selected, numPlayers, teamSize);

  if (!coverage.valid) {
    let availableBackups = eligibleCandidates.filter(p => !selectedIds.has(p.id));

    // Fallback if the restricted generation filter doesn't have enough backups
    if (availableBackups.length === 0) {
      availableBackups = POKEMON_DATABASE.filter(p => !selectedIds.has(p.id) && (fullyEvolvedOnly ? p.isFullyEvolved : true));
    }

    for (const [role, deficitCount] of Object.entries(coverage.deficits)) {
      let needed = deficitCount;

      for (const backup of availableBackups) {
        if (needed <= 0) break;
        if (selectedIds.has(backup.id)) continue;

        if (pokemonMatchesRole(backup, role)) {
          // Find a surplus item to replace:
          // 1. MUST NOT match the deficit role being fixed
          // 2. Removing it must not create a new deficit in its primary or secondary role
          const replaceIdx = selected.findIndex(p => {
            if (pokemonMatchesRole(p, role)) return false;

            const pRoleKey = (p.role === ROLES.SUPPORT || p.role === ROLES.ALL_ROUNDER) ? 'Support/All-rounder' : p.role;
            const currentCount = coverage.counts[pRoleKey] || 0;
            const quota = coverage.quotas[pRoleKey] || 0;
            if (currentCount <= quota) return false;

            if (p.secondaryRole) {
              const secKey = (p.secondaryRole === ROLES.SUPPORT || p.secondaryRole === ROLES.ALL_ROUNDER) ? 'Support/All-rounder' : p.secondaryRole;
              if ((coverage.counts[secKey] || 0) <= (coverage.quotas[secKey] || 0)) {
                return false;
              }
            }
            return true;
          });

          if (replaceIdx !== -1) {
            const removed = selected[replaceIdx];
            selectedIds.delete(removed.id);
            selectedIds.add(backup.id);
            selected[replaceIdx] = backup;
            coverage = validateRoleCoverage(selected, numPlayers, teamSize);
            needed = coverage.deficits[role] || 0;
          } else if (selected.length < targetSize) {
            selected.push(backup);
            selectedIds.add(backup.id);
            coverage = validateRoleCoverage(selected, numPlayers, teamSize);
            needed = coverage.deficits[role] || 0;
          }
        }
      }
    }

    coverage = validateRoleCoverage(selected, numPlayers, teamSize);
  }

  return {
    pool: selected,
    roleCoverage: coverage,
    seed
  };
}
