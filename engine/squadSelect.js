/**
 * DraftDex Squad Select & Team Preview Logic
 * Pure game logic - zero UI / DOM / networking imports.
 */

import { getPokemonById } from './pokemonData.js';
import { getTypeEffectiveness, POKEMON_TYPES } from './types.js';
import { ROLES } from './roles.js';

/**
 * Compute short warning chips for a battle squad (e.g. "No Speedster", "Ice 3x Vuln", "Electric Resist OK").
 * @param {Array<object|number>} teamOrIds
 * @returns {Array<{ text: string, type: 'danger'|'warning'|'positive', icon: string }>}
 */
export function computeSquadWarnings(teamOrIds) {
  const pokemonList = (teamOrIds || []).map(item => {
    if (typeof item === 'number') return getPokemonById(item);
    if (item && item.pokemonId !== undefined) return getPokemonById(item.pokemonId);
    if (item && item.id !== undefined) return getPokemonById(item.id);
    return item;
  }).filter(Boolean);

  if (pokemonList.length === 0) return [];

  const warnings = [];

  // 1. Core Role Checks
  const rolesPresent = new Set();
  for (const p of pokemonList) {
    if (p.role) rolesPresent.add(p.role);
    if (p.secondaryRole) rolesPresent.add(p.secondaryRole);
  }

  if (!rolesPresent.has(ROLES.SPEEDSTER)) {
    warnings.push({ text: 'No Speedster', type: 'danger', icon: 'warning' });
  }
  if (!rolesPresent.has(ROLES.TANK_WALL)) {
    warnings.push({ text: 'No Tank/Wall', type: 'warning', icon: 'shield_with_heart' });
  }
  if (!rolesPresent.has(ROLES.PHYSICAL_SWEEPER) && !rolesPresent.has(ROLES.SPECIAL_SWEEPER)) {
    warnings.push({ text: 'No Sweeper', type: 'danger', icon: 'warning' });
  }

  // 2. Type Weaknesses and Resistances
  const vulnCounts = {};
  const resistCounts = {};

  for (const atkType of POKEMON_TYPES) {
    vulnCounts[atkType] = 0;
    resistCounts[atkType] = 0;
    for (const p of pokemonList) {
      if (!p.types) continue;
      const mult = getTypeEffectiveness(atkType, p.types);
      if (mult > 1) {
        vulnCounts[atkType]++;
      } else if (mult < 1 && mult > 0) {
        resistCounts[atkType]++;
      }
    }
  }

  // Find worst vulnerabilities (>= 3 weak to same type)
  const sortedVulns = Object.entries(vulnCounts)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  for (const [type, count] of sortedVulns.slice(0, 2)) {
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    warnings.push({
      text: `${formattedType} ${count}x Vuln`,
      type: 'danger',
      icon: 'shield_with_heart'
    });
  }

  // Find top resistances (>= 3 resist)
  const sortedResists = Object.entries(resistCounts)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  if (sortedResists.length > 0) {
    const [topType] = sortedResists[0];
    const formattedType = topType.charAt(0).toUpperCase() + topType.slice(1);
    warnings.push({
      text: `${formattedType} Resist OK`,
      type: 'positive',
      icon: 'electric_bolt'
    });
  }

  return warnings;
}

/**
 * Automatically complete or pick the battle squad of targetSize (default 6).
 * Deterministically balances BST and roles.
 * @param {Array<object>} fullDraftedTeam
 * @param {Array<number>} currentlySelectedIds
 * @param {number} [targetSize=6]
 * @returns {Array<number>}
 */
export function autoPickSquad(fullDraftedTeam, currentlySelectedIds = [], targetSize = 6) {
  const draftedIds = (fullDraftedTeam || []).map(t => (t.pokemonId !== undefined ? t.pokemonId : t.id));
  const selected = new Set((currentlySelectedIds || []).filter(id => draftedIds.includes(id)));

  if (selected.size >= targetSize) {
    return Array.from(selected).slice(0, targetSize);
  }

  // Remaining candidates sorted by BST descending
  const remaining = draftedIds
    .filter(id => !selected.has(id))
    .map(id => getPokemonById(id))
    .filter(Boolean)
    .sort((a, b) => (b.bst || 0) - (a.bst || 0));

  for (const p of remaining) {
    if (selected.size >= targetSize) break;
    selected.add(p.id);
  }

  // If still fewer than targetSize (e.g. drafted team had fewer), return what we have
  return Array.from(selected);
}

/**
 * Select or validate lead Pokémon.
 * @param {Array<number>} selectedIds
 * @param {number} [preferredLeadId]
 * @returns {number|null}
 */
export function determineLeadPokemon(selectedIds, preferredLeadId = null) {
  if (!selectedIds || selectedIds.length === 0) return null;
  if (preferredLeadId && selectedIds.includes(preferredLeadId)) {
    return preferredLeadId;
  }
  // Default to highest speed Pokémon among selected
  const list = selectedIds.map(id => getPokemonById(id)).filter(Boolean);
  if (list.length === 0) return selectedIds[0];
  list.sort((a, b) => {
    const speA = (a.baseStats && a.baseStats.speed) || (a.stats && a.stats.speed) || (a.stats && a.stats.spe) || 0;
    const speB = (b.baseStats && b.baseStats.speed) || (b.stats && b.stats.speed) || (b.stats && b.stats.spe) || 0;
    return speB - speA;
  });
  return list[0].id;
}

/**
 * Bot automatically selects its battle squad and lead.
 * @param {object} botPlayer
 * @param {number} [targetSize=6]
 * @returns {{ selectedIds: Array<number>, leadId: number }}
 */
export function botAutoSelectBattleTeam(botPlayer, targetSize = 6) {
  const drafted = botPlayer.team || [];
  const selectedIds = autoPickSquad(drafted, [], targetSize);
  const leadId = determineLeadPokemon(selectedIds);
  return { selectedIds, leadId };
}
