/**
 * Curated Move Table & Move-Build Engine
 * Pure game logic - zero UI / DOM / networking imports.
 */

import { POKEMON_TYPES, getTypeEffectiveness } from './types.js';
import { ROLES } from './roles.js';

export const MOVE_CATEGORIES = Object.freeze({
  PHYSICAL: 'physical',
  SPECIAL: 'special',
  STATUS: 'status'
});

export const STATUS_CONDITIONS = Object.freeze({
  BURN: 'burn',
  PARALYSIS: 'paralysis',
  POISON: 'poison',
  SLEEP: 'sleep',
  FREEZE: 'freeze'
});

/**
 * Curated move dictionary covering physical, special, and utility across types.
 */
export const MOVES = Object.freeze({
  // --- NORMAL ---
  'Body Slam': { name: 'Body Slam', type: 'normal', category: 'physical', power: 85, accuracy: 100, priority: 0, pp: 15, statusChance: 0.3, status: STATUS_CONDITIONS.PARALYSIS },
  'Return': { name: 'Return', type: 'normal', category: 'physical', power: 102, accuracy: 100, priority: 0, pp: 20 },
  'Extreme Speed': { name: 'Extreme Speed', type: 'normal', category: 'physical', power: 80, accuracy: 100, priority: 2, pp: 5 },
  'Hyper Voice': { name: 'Hyper Voice', type: 'normal', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 10 },
  'Recover': { name: 'Recover', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 10, healPercent: 0.5 },
  'Swords Dance': { name: 'Swords Dance', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20, statChanges: { attack: 2 } },

  // --- FIRE ---
  'Flare Blitz': { name: 'Flare Blitz', type: 'fire', category: 'physical', power: 120, accuracy: 100, priority: 0, pp: 15, recoil: 0.33, statusChance: 0.1, status: STATUS_CONDITIONS.BURN },
  'Fire Punch': { name: 'Fire Punch', type: 'fire', category: 'physical', power: 75, accuracy: 100, priority: 0, pp: 15, statusChance: 0.1, status: STATUS_CONDITIONS.BURN },
  'Flamethrower': { name: 'Flamethrower', type: 'fire', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 15, statusChance: 0.1, status: STATUS_CONDITIONS.BURN },
  'Fire Blast': { name: 'Fire Blast', type: 'fire', category: 'special', power: 110, accuracy: 85, priority: 0, pp: 5, statusChance: 0.1, status: STATUS_CONDITIONS.BURN },
  'Will-O-Wisp': { name: 'Will-O-Wisp', type: 'fire', category: 'status', power: 0, accuracy: 85, priority: 0, pp: 15, status: STATUS_CONDITIONS.BURN },

  // --- WATER ---
  'Waterfall': { name: 'Waterfall', type: 'water', category: 'physical', power: 80, accuracy: 100, priority: 0, pp: 15 },
  'Aqua Jet': { name: 'Aqua Jet', type: 'water', category: 'physical', power: 40, accuracy: 100, priority: 1, pp: 20 },
  'Surf': { name: 'Surf', type: 'water', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 15 },
  'Hydro Pump': { name: 'Hydro Pump', type: 'water', category: 'special', power: 110, accuracy: 80, priority: 0, pp: 5 },
  'Scald': { name: 'Scald', type: 'water', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 15, statusChance: 0.3, status: STATUS_CONDITIONS.BURN },

  // --- GRASS ---
  'Leaf Blade': { name: 'Leaf Blade', type: 'grass', category: 'physical', power: 90, accuracy: 100, priority: 0, pp: 15, critRatio: 1 },
  'Wood Hammer': { name: 'Wood Hammer', type: 'grass', category: 'physical', power: 120, accuracy: 100, priority: 0, pp: 15, recoil: 0.33 },
  'Energy Ball': { name: 'Energy Ball', type: 'grass', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 10 },
  'Giga Drain': { name: 'Giga Drain', type: 'grass', category: 'special', power: 75, accuracy: 100, priority: 0, pp: 10, drainPercent: 0.5 },
  'Spore': { name: 'Spore', type: 'grass', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 15, status: STATUS_CONDITIONS.SLEEP },
  'Sleep Powder': { name: 'Sleep Powder', type: 'grass', category: 'status', power: 0, accuracy: 75, priority: 0, pp: 15, status: STATUS_CONDITIONS.SLEEP },

  // --- ELECTRIC ---
  'Wild Charge': { name: 'Wild Charge', type: 'electric', category: 'physical', power: 90, accuracy: 100, priority: 0, pp: 15, recoil: 0.25 },
  'Thunder Punch': { name: 'Thunder Punch', type: 'electric', category: 'physical', power: 75, accuracy: 100, priority: 0, pp: 15, statusChance: 0.1, status: STATUS_CONDITIONS.PARALYSIS },
  'Thunderbolt': { name: 'Thunderbolt', type: 'electric', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 15, statusChance: 0.1, status: STATUS_CONDITIONS.PARALYSIS },
  'Volt Switch': { name: 'Volt Switch', type: 'electric', category: 'special', power: 70, accuracy: 100, priority: 0, pp: 20 },
  'Thunder Wave': { name: 'Thunder Wave', type: 'electric', category: 'status', power: 0, accuracy: 90, priority: 0, pp: 20, status: STATUS_CONDITIONS.PARALYSIS },

  // --- ICE ---
  'Icicle Crash': { name: 'Icicle Crash', type: 'ice', category: 'physical', power: 85, accuracy: 90, priority: 0, pp: 10, flinchChance: 0.3 },
  'Ice Shard': { name: 'Ice Shard', type: 'ice', category: 'physical', power: 40, accuracy: 100, priority: 1, pp: 30 },
  'Ice Beam': { name: 'Ice Beam', type: 'ice', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 10, statusChance: 0.1, status: STATUS_CONDITIONS.FREEZE },
  'Blizzard': { name: 'Blizzard', type: 'ice', category: 'special', power: 110, accuracy: 70, priority: 0, pp: 5, statusChance: 0.1, status: STATUS_CONDITIONS.FREEZE },
  'Haze': { name: 'Haze', type: 'ice', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 30, resetsStats: true },

  // --- FIGHTING ---
  'Close Combat': { name: 'Close Combat', type: 'fighting', category: 'physical', power: 120, accuracy: 100, priority: 0, pp: 5, selfStatChanges: { defense: -1, spDefense: -1 } },
  'Drain Punch': { name: 'Drain Punch', type: 'fighting', category: 'physical', power: 75, accuracy: 100, priority: 0, pp: 10, drainPercent: 0.5 },
  'Mach Punch': { name: 'Mach Punch', type: 'fighting', category: 'physical', power: 40, accuracy: 100, priority: 1, pp: 30 },
  'Aura Sphere': { name: 'Aura Sphere', type: 'fighting', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 20 },
  'Focus Blast': { name: 'Focus Blast', type: 'fighting', category: 'special', power: 120, accuracy: 70, priority: 0, pp: 5 },
  'Bulk Up': { name: 'Bulk Up', type: 'fighting', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20, statChanges: { attack: 1, defense: 1 } },

  // --- POISON ---
  'Gunk Shot': { name: 'Gunk Shot', type: 'poison', category: 'physical', power: 120, accuracy: 80, priority: 0, pp: 5, statusChance: 0.3, status: STATUS_CONDITIONS.POISON },
  'Poison Jab': { name: 'Poison Jab', type: 'poison', category: 'physical', power: 80, accuracy: 100, priority: 0, pp: 20, statusChance: 0.3, status: STATUS_CONDITIONS.POISON },
  'Sludge Bomb': { name: 'Sludge Bomb', type: 'poison', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 10, statusChance: 0.3, status: STATUS_CONDITIONS.POISON },
  'Sludge Wave': { name: 'Sludge Wave', type: 'poison', category: 'special', power: 95, accuracy: 100, priority: 0, pp: 10, statusChance: 0.1, status: STATUS_CONDITIONS.POISON },
  'Toxic': { name: 'Toxic', type: 'poison', category: 'status', power: 0, accuracy: 90, priority: 0, pp: 10, status: STATUS_CONDITIONS.POISON },

  // --- GROUND ---
  'Earthquake': { name: 'Earthquake', type: 'ground', category: 'physical', power: 100, accuracy: 100, priority: 0, pp: 10 },
  'High Horsepower': { name: 'High Horsepower', type: 'ground', category: 'physical', power: 95, accuracy: 95, priority: 0, pp: 10 },
  'Earth Power': { name: 'Earth Power', type: 'ground', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 10 },
  'Mud Shot': { name: 'Mud Shot', type: 'ground', category: 'special', power: 55, accuracy: 95, priority: 0, pp: 15, targetStatChanges: { speed: -1 } },
  'Stealth Rock': { name: 'Stealth Rock', type: 'rock', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20, hazard: 'stealth_rock' },

  // --- FLYING ---
  'Brave Bird': { name: 'Brave Bird', type: 'flying', category: 'physical', power: 120, accuracy: 100, priority: 0, pp: 15, recoil: 0.33 },
  'Acrobatics': { name: 'Acrobatics', type: 'flying', category: 'physical', power: 110, accuracy: 100, priority: 0, pp: 15 },
  'Air Slash': { name: 'Air Slash', type: 'flying', category: 'special', power: 75, accuracy: 95, priority: 0, pp: 15, flinchChance: 0.3 },
  'Hurricane': { name: 'Hurricane', type: 'flying', category: 'special', power: 110, accuracy: 70, priority: 0, pp: 10 },
  'Roost': { name: 'Roost', type: 'flying', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 10, healPercent: 0.5 },

  // --- PSYCHIC ---
  'Zen Headbutt': { name: 'Zen Headbutt', type: 'psychic', category: 'physical', power: 80, accuracy: 90, priority: 0, pp: 15, flinchChance: 0.2 },
  'Psychic Fangs': { name: 'Psychic Fangs', type: 'psychic', category: 'physical', power: 85, accuracy: 100, priority: 0, pp: 10 },
  'Psychic': { name: 'Psychic', type: 'psychic', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 10, targetStatChanges: { spDefense: -1 } },
  'Psyshock': { name: 'Psyshock', type: 'psychic', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 10, targetsDefense: true },
  'Calm Mind': { name: 'Calm Mind', type: 'psychic', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20, statChanges: { spAttack: 1, spDefense: 1 } },

  // --- BUG ---
  'Megahorn': { name: 'Megahorn', type: 'bug', category: 'physical', power: 120, accuracy: 85, priority: 0, pp: 10 },
  'U-turn': { name: 'U-turn', type: 'bug', category: 'physical', power: 70, accuracy: 100, priority: 0, pp: 20, pivot: true },
  'Bug Buzz': { name: 'Bug Buzz', type: 'bug', category: 'special', power: 90, accuracy: 100, priority: 0, pp: 10 },
  'Quiver Dance': { name: 'Quiver Dance', type: 'bug', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20, statChanges: { spAttack: 1, spDefense: 1, speed: 1 } },

  // --- ROCK ---
  'Stone Edge': { name: 'Stone Edge', type: 'rock', category: 'physical', power: 100, accuracy: 80, priority: 0, pp: 5, critRatio: 1 },
  'Rock Slide': { name: 'Rock Slide', type: 'rock', category: 'physical', power: 75, accuracy: 90, priority: 0, pp: 10, flinchChance: 0.3 },
  'Power Gem': { name: 'Power Gem', type: 'rock', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 20 },
  'Meteor Beam': { name: 'Meteor Beam', type: 'rock', category: 'special', power: 120, accuracy: 90, priority: 0, pp: 10 },

  // --- GHOST ---
  'Shadow Claw': { name: 'Shadow Claw', type: 'ghost', category: 'physical', power: 70, accuracy: 100, priority: 0, pp: 15, critRatio: 1 },
  'Poltergeist': { name: 'Poltergeist', type: 'ghost', category: 'physical', power: 110, accuracy: 90, priority: 0, pp: 5 },
  'Shadow Ball': { name: 'Shadow Ball', type: 'ghost', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 15, targetStatChanges: { spDefense: -1 } },
  'Shadow Sneak': { name: 'Shadow Sneak', type: 'ghost', category: 'physical', power: 40, accuracy: 100, priority: 1, pp: 30 },

  // --- DRAGON ---
  'Outrage': { name: 'Outrage', type: 'dragon', category: 'physical', power: 120, accuracy: 100, priority: 0, pp: 10 },
  'Dragon Claw': { name: 'Dragon Claw', type: 'dragon', category: 'physical', power: 80, accuracy: 100, priority: 0, pp: 15 },
  'Draco Meteor': { name: 'Draco Meteor', type: 'dragon', category: 'special', power: 130, accuracy: 90, priority: 0, pp: 5, selfStatChanges: { spAttack: -2 } },
  'Dragon Pulse': { name: 'Dragon Pulse', type: 'dragon', category: 'special', power: 85, accuracy: 100, priority: 0, pp: 10 },
  'Dragon Dance': { name: 'Dragon Dance', type: 'dragon', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20, statChanges: { attack: 1, speed: 1 } },

  // --- STEEL ---
  'Iron Head': { name: 'Iron Head', type: 'steel', category: 'physical', power: 80, accuracy: 100, priority: 0, pp: 15, flinchChance: 0.3 },
  'Bullet Punch': { name: 'Bullet Punch', type: 'steel', category: 'physical', power: 40, accuracy: 100, priority: 1, pp: 30 },
  'Flash Cannon': { name: 'Flash Cannon', type: 'steel', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 10 },
  'Iron Defense': { name: 'Iron Defense', type: 'steel', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 15, statChanges: { defense: 2 } },

  // --- DARK ---
  'Crunch': { name: 'Crunch', type: 'dark', category: 'physical', power: 80, accuracy: 100, priority: 0, pp: 15, targetStatChanges: { defense: -1 } },
  'Knock Off': { name: 'Knock Off', type: 'dark', category: 'physical', power: 65, accuracy: 100, priority: 0, pp: 20 },
  'Sucker Punch': { name: 'Sucker Punch', type: 'dark', category: 'physical', power: 70, accuracy: 100, priority: 1, pp: 5 },
  'Dark Pulse': { name: 'Dark Pulse', type: 'dark', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 15, flinchChance: 0.2 },
  'Nasty Plot': { name: 'Nasty Plot', type: 'dark', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20, statChanges: { spAttack: 2 } },
  'Taunt': { name: 'Taunt', type: 'dark', category: 'status', power: 0, accuracy: 100, priority: 0, pp: 20 },

  // --- FAIRY ---
  'Play Rough': { name: 'Play Rough', type: 'fairy', category: 'physical', power: 90, accuracy: 90, priority: 0, pp: 10, targetStatChanges: { attack: -1 } },
  'Spirit Break': { name: 'Spirit Break', type: 'fairy', category: 'physical', power: 75, accuracy: 100, priority: 0, pp: 15, targetStatChanges: { spAttack: -1 } },
  'Moonblast': { name: 'Moonblast', type: 'fairy', category: 'special', power: 95, accuracy: 100, priority: 0, pp: 15, targetStatChanges: { spAttack: -1 } },
  'Dazzling Gleam': { name: 'Dazzling Gleam', type: 'fairy', category: 'special', power: 80, accuracy: 100, priority: 0, pp: 10 }
});

const ALL_MOVES_ARRAY = Object.values(MOVES);

/**
 * Auto-build 4 moves for any Pokémon:
 * - 2 same-type attacks (STAB)
 * - 1 coverage attack (different type)
 * - 1 utility move (status / boost / recovery)
 *
 * @param {{ types: string[], baseStats: { attack: number, spAttack: number, speed: number }, role?: string }} pokemon
 * @returns {Array<typeof MOVES[keyof typeof MOVES]>} 4 curated moves
 */
export function buildMoveSet(pokemon) {
  const { types, baseStats, role } = pokemon;
  const isPhysical = baseStats.attack >= baseStats.spAttack;
  const preferredCat = isPhysical ? MOVE_CATEGORIES.PHYSICAL : MOVE_CATEGORIES.SPECIAL;

  const chosenMoves = [];
  const chosenNames = new Set();

  function addMove(move) {
    if (move && !chosenNames.has(move.name)) {
      chosenMoves.push(move);
      chosenNames.add(move.name);
      return true;
    }
    return false;
  }

  // 1. Two STAB moves
  if (types.length >= 2) {
    // One for type 1, one for type 2
    for (const type of types.slice(0, 2)) {
      const best = ALL_MOVES_ARRAY
        .filter(m => m.type === type && m.category !== MOVE_CATEGORIES.STATUS)
        .sort((a, b) => {
          // Prefer preferred category
          const aPref = a.category === preferredCat ? 1 : 0;
          const bPref = b.category === preferredCat ? 1 : 0;
          if (aPref !== bPref) return bPref - aPref;
          return b.power - a.power;
        })[0];
      if (best) addMove(best);
    }
  } else {
    // Single type: 2 attacks of that type
    const stabList = ALL_MOVES_ARRAY
      .filter(m => m.type === types[0] && m.category !== MOVE_CATEGORIES.STATUS)
      .sort((a, b) => {
        const aPref = a.category === preferredCat ? 1 : 0;
        const bPref = b.category === preferredCat ? 1 : 0;
        if (aPref !== bPref) return bPref - aPref;
        return b.power - a.power;
      });
    for (const m of stabList) {
      if (chosenMoves.length >= 2) break;
      addMove(m);
    }
  }

  // Fallback if less than 2 STAB moves found
  if (chosenMoves.length < 2) {
    const fillerStab = ALL_MOVES_ARRAY.find(m => types.includes(m.type) && !chosenNames.has(m.name));
    if (fillerStab) addMove(fillerStab);
  }

  // 2. One Coverage attack (non-STAB)
  const coverageCandidates = ALL_MOVES_ARRAY
    .filter(m => !types.includes(m.type) && m.category !== MOVE_CATEGORIES.STATUS)
    .sort((a, b) => {
      const aPref = a.category === preferredCat ? 1 : 0;
      const bPref = b.category === preferredCat ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
      return b.power - a.power;
    });

  if (coverageCandidates.length > 0) {
    addMove(coverageCandidates[0]);
  }

  // 3. One Utility / Status move
  let utilityMove = null;
  if (role === ROLES.PHYSICAL_SWEEPER) {
    utilityMove = MOVES['Swords Dance'] || MOVES['Dragon Dance'] || MOVES['Bulk Up'];
  } else if (role === ROLES.SPECIAL_SWEEPER) {
    utilityMove = MOVES['Nasty Plot'] || MOVES['Calm Mind'];
  } else if (role === ROLES.TANK_WALL) {
    utilityMove = MOVES['Recover'] || MOVES['Will-O-Wisp'] || MOVES['Toxic'] || MOVES['Roost'];
  } else if (role === ROLES.SUPPORT || role === ROLES.SPEEDSTER) {
    utilityMove = MOVES['Thunder Wave'] || MOVES['Taunt'] || MOVES['Will-O-Wisp'] || MOVES['Spore'];
  } else {
    // All-rounder or general
    utilityMove = isPhysical ? MOVES['Swords Dance'] : MOVES['Calm Mind'];
  }

  if (utilityMove && !addMove(utilityMove)) {
    // If utility was somehow duplicate, get another status move
    const alt = ALL_MOVES_ARRAY.find(m => m.category === MOVE_CATEGORIES.STATUS && !chosenNames.has(m.name));
    if (alt) addMove(alt);
  }

  // Fill up to 4 if still missing
  for (const m of ALL_MOVES_ARRAY) {
    if (chosenMoves.length >= 4) break;
    addMove(m);
  }

  return chosenMoves.slice(0, 4);
}
