/**
 * Pokémon Dataset (Gen 1–9) with Stats, Types, Role, and Tier
 * Pure game logic - zero UI / DOM / networking imports.
 */

import { assignRoles } from './roles.js';

export const TIERS = Object.freeze({
  MARQUEE: 'Marquee',
  TIER_1: 'Tier 1',
  TIER_2: 'Tier 2',
  TIER_3: 'Tier 3'
});

/**
 * Determine auction/competitive tier from stats and status
 */
function determineTier(bst, isLegendary, isMythical, isFullyEvolved) {
  if (isLegendary || isMythical || bst >= 600) {
    return TIERS.MARQUEE;
  }
  if (bst >= 520) {
    return TIERS.TIER_1;
  }
  if (bst >= 470) {
    return TIERS.TIER_2;
  }
  return TIERS.TIER_3;
}

/**
 * Raw definition list of curated Pokémon across Generations 1 through 9.
 */
const RAW_POKEMON_LIST = [
  // --- GEN 1 ---
  { id: 3, name: 'Venusaur', types: ['grass', 'poison'], baseStats: { hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 6, name: 'Charizard', types: ['fire', 'flying'], baseStats: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 9, name: 'Blastoise', types: ['water'], baseStats: { hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 25, name: 'Pikachu', types: ['electric'], baseStats: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 }, gen: 1, isFullyEvolved: false, isLegendary: false, isMythical: false, famousMix: true },
  { id: 65, name: 'Alakazam', types: ['psychic'], baseStats: { hp: 55, attack: 50, defense: 45, spAttack: 135, spDefense: 95, speed: 120 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 68, name: 'Machamp', types: ['fighting'], baseStats: { hp: 90, attack: 130, defense: 80, spAttack: 65, spDefense: 85, speed: 55 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 94, name: 'Gengar', types: ['ghost', 'poison'], baseStats: { hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 130, name: 'Gyarados', types: ['water', 'flying'], baseStats: { hp: 95, attack: 125, defense: 79, spAttack: 60, spDefense: 100, speed: 81 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 135, name: 'Jolteon', types: ['electric'], baseStats: { hp: 65, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 130 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 143, name: 'Snorlax', types: ['normal'], baseStats: { hp: 160, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 145, name: 'Zapdos', types: ['electric', 'flying'], baseStats: { hp: 90, attack: 90, defense: 85, spAttack: 125, spDefense: 90, speed: 100 }, gen: 1, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 149, name: 'Dragonite', types: ['dragon', 'flying'], baseStats: { hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 150, name: 'Mewtwo', types: ['psychic'], baseStats: { hp: 106, attack: 110, defense: 90, spAttack: 154, spDefense: 90, speed: 130 }, gen: 1, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 151, name: 'Mew', types: ['psychic'], baseStats: { hp: 100, attack: 100, defense: 100, spAttack: 100, spDefense: 100, speed: 100 }, gen: 1, isFullyEvolved: true, isLegendary: false, isMythical: true, famousMix: true },

  // --- GEN 2 ---
  { id: 154, name: 'Meganium', types: ['grass'], baseStats: { hp: 80, attack: 82, defense: 100, spAttack: 83, spDefense: 100, speed: 80 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 157, name: 'Typhlosion', types: ['fire'], baseStats: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 160, name: 'Feraligatr', types: ['water'], baseStats: { hp: 85, attack: 105, defense: 100, spAttack: 79, spDefense: 83, speed: 78 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 196, name: 'Espeon', types: ['psychic'], baseStats: { hp: 65, attack: 65, defense: 60, spAttack: 130, spDefense: 95, speed: 110 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 197, name: 'Umbreon', types: ['dark'], baseStats: { hp: 95, attack: 65, defense: 110, spAttack: 60, spDefense: 130, speed: 65 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 212, name: 'Scizor', types: ['bug', 'steel'], baseStats: { hp: 70, attack: 130, defense: 100, spAttack: 55, spDefense: 80, speed: 65 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 227, name: 'Skarmory', types: ['steel', 'flying'], baseStats: { hp: 65, attack: 80, defense: 140, spAttack: 40, spDefense: 70, speed: 70 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 230, name: 'Kingdra', types: ['water', 'dragon'], baseStats: { hp: 75, attack: 95, defense: 95, spAttack: 95, spDefense: 95, speed: 85 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 242, name: 'Blissey', types: ['normal'], baseStats: { hp: 255, attack: 10, defense: 10, spAttack: 75, spDefense: 135, speed: 55 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 243, name: 'Raikou', types: ['electric'], baseStats: { hp: 90, attack: 85, defense: 75, spAttack: 115, spDefense: 100, speed: 115 }, gen: 2, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 248, name: 'Tyranitar', types: ['rock', 'dark'], baseStats: { hp: 100, attack: 134, defense: 110, spAttack: 95, spDefense: 100, speed: 61 }, gen: 2, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 249, name: 'Lugia', types: ['psychic', 'flying'], baseStats: { hp: 106, attack: 90, defense: 130, spAttack: 90, spDefense: 154, speed: 110 }, gen: 2, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 250, name: 'Ho-Oh', types: ['fire', 'flying'], baseStats: { hp: 106, attack: 130, defense: 90, spAttack: 110, spDefense: 154, speed: 90 }, gen: 2, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },

  // --- GEN 3 ---
  { id: 254, name: 'Sceptile', types: ['grass'], baseStats: { hp: 70, attack: 85, defense: 65, spAttack: 105, spDefense: 85, speed: 120 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 257, name: 'Blaziken', types: ['fire', 'fighting'], baseStats: { hp: 80, attack: 120, defense: 70, spAttack: 110, spDefense: 70, speed: 80 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 260, name: 'Swampert', types: ['water', 'ground'], baseStats: { hp: 100, attack: 110, defense: 90, spAttack: 85, spDefense: 90, speed: 60 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 282, name: 'Gardevoir', types: ['psychic', 'fairy'], baseStats: { hp: 68, attack: 65, defense: 65, spAttack: 125, spDefense: 115, speed: 80 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 286, name: 'Breloom', types: ['grass', 'fighting'], baseStats: { hp: 60, attack: 130, defense: 80, spAttack: 60, spDefense: 60, speed: 70 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 330, name: 'Flygon', types: ['ground', 'dragon'], baseStats: { hp: 80, attack: 100, defense: 80, spAttack: 80, spDefense: 80, speed: 100 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 350, name: 'Milotic', types: ['water'], baseStats: { hp: 95, attack: 60, defense: 79, spAttack: 100, spDefense: 125, speed: 81 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 373, name: 'Salamence', types: ['dragon', 'flying'], baseStats: { hp: 95, attack: 135, defense: 80, spAttack: 110, spDefense: 80, speed: 100 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 376, name: 'Metagross', types: ['steel', 'psychic'], baseStats: { hp: 80, attack: 135, defense: 130, spAttack: 95, spDefense: 90, speed: 70 }, gen: 3, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 380, name: 'Latias', types: ['dragon', 'psychic'], baseStats: { hp: 80, attack: 80, defense: 90, spAttack: 110, spDefense: 130, speed: 110 }, gen: 3, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 381, name: 'Latios', types: ['dragon', 'psychic'], baseStats: { hp: 80, attack: 90, defense: 80, spAttack: 130, spDefense: 110, speed: 110 }, gen: 3, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 382, name: 'Kyogre', types: ['water'], baseStats: { hp: 100, attack: 100, defense: 90, spAttack: 150, spDefense: 140, speed: 90 }, gen: 3, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 383, name: 'Groudon', types: ['ground'], baseStats: { hp: 100, attack: 150, defense: 140, spAttack: 100, spDefense: 90, speed: 90 }, gen: 3, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 384, name: 'Rayquaza', types: ['dragon', 'flying'], baseStats: { hp: 105, attack: 150, defense: 90, spAttack: 150, spDefense: 90, speed: 95 }, gen: 3, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },

  // --- GEN 4 ---
  { id: 389, name: 'Torterra', types: ['grass', 'ground'], baseStats: { hp: 95, attack: 109, defense: 105, spAttack: 75, spDefense: 85, speed: 56 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 392, name: 'Infernape', types: ['fire', 'fighting'], baseStats: { hp: 76, attack: 104, defense: 71, spAttack: 104, spDefense: 71, speed: 108 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 395, name: 'Empoleon', types: ['water', 'steel'], baseStats: { hp: 84, attack: 86, defense: 88, spAttack: 111, spDefense: 101, speed: 60 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 445, name: 'Garchomp', types: ['dragon', 'ground'], baseStats: { hp: 108, attack: 130, defense: 95, spAttack: 80, spDefense: 85, speed: 102 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 448, name: 'Lucario', types: ['fighting', 'steel'], baseStats: { hp: 70, attack: 110, defense: 70, spAttack: 115, spDefense: 70, speed: 90 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 461, name: 'Weavile', types: ['dark', 'ice'], baseStats: { hp: 70, attack: 120, defense: 65, spAttack: 45, spDefense: 85, speed: 125 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 468, name: 'Togekiss', types: ['fairy', 'flying'], baseStats: { hp: 85, attack: 50, defense: 95, spAttack: 120, spDefense: 115, speed: 80 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 472, name: 'Gliscor', types: ['ground', 'flying'], baseStats: { hp: 75, attack: 95, defense: 125, spAttack: 45, spDefense: 75, speed: 95 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 479, name: 'Rotom-Wash', types: ['electric', 'water'], baseStats: { hp: 50, attack: 65, defense: 107, spAttack: 105, spDefense: 107, speed: 86 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 483, name: 'Dialga', types: ['steel', 'dragon'], baseStats: { hp: 100, attack: 120, defense: 120, spAttack: 150, spDefense: 100, speed: 90 }, gen: 4, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 484, name: 'Palkia', types: ['water', 'dragon'], baseStats: { hp: 90, attack: 120, defense: 100, spAttack: 150, spDefense: 120, speed: 100 }, gen: 4, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 487, name: 'Giratina', types: ['ghost', 'dragon'], baseStats: { hp: 150, attack: 100, defense: 120, spAttack: 100, spDefense: 120, speed: 90 }, gen: 4, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 491, name: 'Darkrai', types: ['dark'], baseStats: { hp: 70, attack: 90, defense: 90, spAttack: 135, spDefense: 90, speed: 125 }, gen: 4, isFullyEvolved: true, isLegendary: false, isMythical: true, famousMix: true },

  // --- GEN 5 ---
  { id: 497, name: 'Serperior', types: ['grass'], baseStats: { hp: 75, attack: 75, defense: 95, spAttack: 75, spDefense: 95, speed: 113 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 500, name: 'Emboar', types: ['fire', 'fighting'], baseStats: { hp: 110, attack: 123, defense: 65, spAttack: 100, spDefense: 65, speed: 65 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 503, name: 'Samurott', types: ['water'], baseStats: { hp: 95, attack: 100, defense: 85, spAttack: 108, spDefense: 70, speed: 70 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 530, name: 'Excadrill', types: ['ground', 'steel'], baseStats: { hp: 110, attack: 135, defense: 60, spAttack: 50, spDefense: 65, speed: 88 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 534, name: 'Conkeldurr', types: ['fighting'], baseStats: { hp: 105, attack: 140, defense: 95, spAttack: 55, spDefense: 65, speed: 45 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 571, name: 'Zoroark', types: ['dark'], baseStats: { hp: 60, attack: 105, defense: 60, spAttack: 120, spDefense: 60, speed: 105 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 598, name: 'Ferrothorn', types: ['grass', 'steel'], baseStats: { hp: 74, attack: 94, defense: 131, spAttack: 54, spDefense: 116, speed: 20 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 609, name: 'Chandelure', types: ['ghost', 'fire'], baseStats: { hp: 60, attack: 55, defense: 90, spAttack: 145, spDefense: 90, speed: 80 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 612, name: 'Haxorus', types: ['dragon'], baseStats: { hp: 76, attack: 147, defense: 90, spAttack: 60, spDefense: 70, speed: 97 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 635, name: 'Hydreigon', types: ['dark', 'dragon'], baseStats: { hp: 92, attack: 105, defense: 90, spAttack: 125, spDefense: 90, speed: 98 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 637, name: 'Volcarona', types: ['bug', 'fire'], baseStats: { hp: 85, attack: 60, defense: 65, spAttack: 135, spDefense: 105, speed: 100 }, gen: 5, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 645, name: 'Landorus-Therian', types: ['ground', 'flying'], baseStats: { hp: 89, attack: 145, defense: 90, spAttack: 105, spDefense: 80, speed: 91 }, gen: 5, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 643, name: 'Reshiram', types: ['dragon', 'fire'], baseStats: { hp: 100, attack: 120, defense: 100, spAttack: 150, spDefense: 120, speed: 90 }, gen: 5, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 644, name: 'Zekrom', types: ['dragon', 'electric'], baseStats: { hp: 100, attack: 150, defense: 120, spAttack: 120, spDefense: 100, speed: 90 }, gen: 5, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },

  // --- GEN 6 ---
  { id: 652, name: 'Chesnaught', types: ['grass', 'fighting'], baseStats: { hp: 88, attack: 107, defense: 122, spAttack: 74, spDefense: 75, speed: 64 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 655, name: 'Delphox', types: ['fire', 'psychic'], baseStats: { hp: 75, attack: 69, defense: 72, spAttack: 114, spDefense: 100, speed: 104 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 658, name: 'Greninja', types: ['water', 'dark'], baseStats: { hp: 72, attack: 95, defense: 67, spAttack: 103, spDefense: 71, speed: 122 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 663, name: 'Talonflame', types: ['fire', 'flying'], baseStats: { hp: 78, attack: 81, defense: 71, spAttack: 74, spDefense: 69, speed: 126 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 681, name: 'Aegislash', types: ['steel', 'ghost'], baseStats: { hp: 60, attack: 140, defense: 140, spAttack: 140, spDefense: 140, speed: 60 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 700, name: 'Sylveon', types: ['fairy'], baseStats: { hp: 95, attack: 65, defense: 65, spAttack: 110, spDefense: 130, speed: 60 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 701, name: 'Hawlucha', types: ['fighting', 'flying'], baseStats: { hp: 78, attack: 92, defense: 75, spAttack: 74, spDefense: 63, speed: 118 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 706, name: 'Goodra', types: ['dragon'], baseStats: { hp: 90, attack: 100, defense: 70, spAttack: 110, spDefense: 150, speed: 80 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 707, name: 'Klefki', types: ['steel', 'fairy'], baseStats: { hp: 57, attack: 80, defense: 91, spAttack: 80, spDefense: 87, speed: 75 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 715, name: 'Noivern', types: ['flying', 'dragon'], baseStats: { hp: 85, attack: 70, defense: 80, spAttack: 97, spDefense: 80, speed: 123 }, gen: 6, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 716, name: 'Xerneas', types: ['fairy'], baseStats: { hp: 126, attack: 131, defense: 95, spAttack: 131, spDefense: 98, speed: 99 }, gen: 6, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 717, name: 'Yveltal', types: ['dark', 'flying'], baseStats: { hp: 126, attack: 131, defense: 95, spAttack: 131, spDefense: 98, speed: 99 }, gen: 6, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },

  // --- GEN 7 ---
  { id: 724, name: 'Decidueye', types: ['grass', 'ghost'], baseStats: { hp: 78, attack: 107, defense: 75, spAttack: 100, spDefense: 100, speed: 70 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 727, name: 'Incineroar', types: ['fire', 'dark'], baseStats: { hp: 95, attack: 115, defense: 90, spAttack: 80, spDefense: 90, speed: 60 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 730, name: 'Primarina', types: ['water', 'fairy'], baseStats: { hp: 80, attack: 74, defense: 74, spAttack: 126, spDefense: 116, speed: 60 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 745, name: 'Lycanroc-Dusk', types: ['rock'], baseStats: { hp: 75, attack: 117, defense: 65, spAttack: 55, spDefense: 65, speed: 110 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 748, name: 'Toxapex', types: ['poison', 'water'], baseStats: { hp: 50, attack: 63, defense: 152, spAttack: 53, spDefense: 142, speed: 35 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 768, name: 'Golisopod', types: ['bug', 'water'], baseStats: { hp: 75, attack: 125, defense: 140, spAttack: 60, spDefense: 90, speed: 40 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 778, name: 'Mimikyu', types: ['ghost', 'fairy'], baseStats: { hp: 55, attack: 90, defense: 80, spAttack: 50, spDefense: 105, speed: 96 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 784, name: 'Kommo-o', types: ['dragon', 'fighting'], baseStats: { hp: 75, attack: 110, defense: 125, spAttack: 100, spDefense: 105, speed: 85 }, gen: 7, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 785, name: 'Tapu Koko', types: ['electric', 'fairy'], baseStats: { hp: 70, attack: 115, defense: 85, spAttack: 95, spDefense: 75, speed: 130 }, gen: 7, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 786, name: 'Tapu Lele', types: ['psychic', 'fairy'], baseStats: { hp: 70, attack: 85, defense: 75, spAttack: 130, spDefense: 115, speed: 95 }, gen: 7, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 791, name: 'Solgaleo', types: ['psychic', 'steel'], baseStats: { hp: 137, attack: 137, defense: 107, spAttack: 113, spDefense: 89, speed: 97 }, gen: 7, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 792, name: 'Lunala', types: ['psychic', 'ghost'], baseStats: { hp: 137, attack: 113, defense: 89, spAttack: 137, spDefense: 107, speed: 97 }, gen: 7, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },

  // --- GEN 8 ---
  { id: 812, name: 'Rillaboom', types: ['grass'], baseStats: { hp: 100, attack: 125, defense: 90, spAttack: 60, spDefense: 70, speed: 85 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 815, name: 'Cinderace', types: ['fire'], baseStats: { hp: 80, attack: 116, defense: 75, spAttack: 65, spDefense: 75, speed: 119 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 818, name: 'Inteleon', types: ['water'], baseStats: { hp: 70, attack: 85, defense: 65, spAttack: 125, spDefense: 65, speed: 120 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 823, name: 'Corviknight', types: ['flying', 'steel'], baseStats: { hp: 98, attack: 87, defense: 105, spAttack: 53, spDefense: 85, speed: 67 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 834, name: 'Drednaw', types: ['water', 'rock'], baseStats: { hp: 90, attack: 115, defense: 90, spAttack: 48, spDefense: 68, speed: 74 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 849, name: 'Toxtricity', types: ['electric', 'poison'], baseStats: { hp: 75, attack: 98, defense: 70, spAttack: 114, spDefense: 70, speed: 75 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 858, name: 'Hatterene', types: ['psychic', 'fairy'], baseStats: { hp: 57, attack: 90, defense: 95, spAttack: 136, spDefense: 103, speed: 29 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 861, name: 'Grimmsnarl', types: ['dark', 'fairy'], baseStats: { hp: 95, attack: 120, defense: 65, spAttack: 95, spDefense: 75, speed: 60 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 887, name: 'Dragapult', types: ['dragon', 'ghost'], baseStats: { hp: 88, attack: 120, defense: 75, spAttack: 100, spDefense: 75, speed: 142 }, gen: 8, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 888, name: 'Zacian', types: ['fairy', 'steel'], baseStats: { hp: 92, attack: 130, defense: 115, spAttack: 80, spDefense: 115, speed: 138 }, gen: 8, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 889, name: 'Zamazenta', types: ['fighting', 'steel'], baseStats: { hp: 92, attack: 130, defense: 115, spAttack: 80, spDefense: 115, speed: 138 }, gen: 8, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 892, name: 'Urshifu', types: ['fighting', 'dark'], baseStats: { hp: 100, attack: 130, defense: 100, spAttack: 63, spDefense: 60, speed: 97 }, gen: 8, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 894, name: 'Regieleki', types: ['electric'], baseStats: { hp: 80, attack: 100, defense: 50, spAttack: 100, spDefense: 50, speed: 200 }, gen: 8, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },

  // --- GEN 9 ---
  { id: 908, name: 'Meowscarada', types: ['grass', 'dark'], baseStats: { hp: 76, attack: 110, defense: 70, spAttack: 81, spDefense: 70, speed: 123 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 911, name: 'Skeledirge', types: ['fire', 'ghost'], baseStats: { hp: 104, attack: 75, defense: 100, spAttack: 110, spDefense: 75, speed: 66 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 914, name: 'Quaquaval', types: ['water', 'fighting'], baseStats: { hp: 85, attack: 120, defense: 80, spAttack: 85, spDefense: 75, speed: 85 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 977, name: 'Dondozo', types: ['water'], baseStats: { hp: 150, attack: 100, defense: 115, spAttack: 65, spDefense: 65, speed: 35 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: false },
  { id: 979, name: 'Annihilape', types: ['fighting', 'ghost'], baseStats: { hp: 110, attack: 115, defense: 80, spAttack: 50, spDefense: 90, speed: 90 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 983, name: 'Kingambit', types: ['dark', 'steel'], baseStats: { hp: 100, attack: 135, defense: 120, spAttack: 60, spDefense: 85, speed: 50 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 984, name: 'Great Tusk', types: ['ground', 'fighting'], baseStats: { hp: 115, attack: 131, defense: 131, spAttack: 53, spDefense: 53, speed: 87 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 987, name: 'Flutter Mane', types: ['ghost', 'fairy'], baseStats: { hp: 55, attack: 55, defense: 55, spAttack: 135, spDefense: 135, speed: 135 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 988, name: 'Iron Moth', types: ['fire', 'poison'], baseStats: { hp: 80, attack: 70, defense: 60, spAttack: 140, spDefense: 110, speed: 110 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 992, name: 'Iron Valiant', types: ['fairy', 'fighting'], baseStats: { hp: 74, attack: 130, defense: 90, spAttack: 120, spDefense: 60, speed: 116 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 998, name: 'Baxcalibur', types: ['dragon', 'ice'], baseStats: { hp: 115, attack: 145, defense: 92, spAttack: 75, spDefense: 86, speed: 87 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 1000, name: 'Gholdengo', types: ['steel', 'ghost'], baseStats: { hp: 87, attack: 60, defense: 95, spAttack: 133, spDefense: 91, speed: 84 }, gen: 9, isFullyEvolved: true, isLegendary: false, isMythical: false, famousMix: true },
  { id: 1002, name: 'Chien-Pao', types: ['dark', 'ice'], baseStats: { hp: 80, attack: 120, defense: 80, spAttack: 90, spDefense: 65, speed: 135 }, gen: 9, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 1003, name: 'Ting-Lu', types: ['dark', 'ground'], baseStats: { hp: 155, attack: 110, defense: 125, spAttack: 55, spDefense: 80, speed: 45 }, gen: 9, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 1007, name: 'Koraidon', types: ['fighting', 'dragon'], baseStats: { hp: 100, attack: 135, defense: 115, spAttack: 85, spDefense: 100, speed: 135 }, gen: 9, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 1008, name: 'Miraidon', types: ['electric', 'dragon'], baseStats: { hp: 100, attack: 85, defense: 100, spAttack: 135, spDefense: 115, speed: 135 }, gen: 9, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true },
  { id: 1017, name: 'Ogerpon', types: ['grass'], baseStats: { hp: 80, attack: 120, defense: 84, spAttack: 60, spDefense: 96, speed: 110 }, gen: 9, isFullyEvolved: true, isLegendary: true, isMythical: false, famousMix: true }
];

/**
 * Processed Pokémon database with calculated BST, roles, and tiers.
 */
export const POKEMON_DATABASE = Object.freeze(
  RAW_POKEMON_LIST.map(p => {
    const bst = p.baseStats.hp + p.baseStats.attack + p.baseStats.defense +
                p.baseStats.spAttack + p.baseStats.spDefense + p.baseStats.speed;
    const roleInfo = assignRoles(p.baseStats);
    const tier = determineTier(bst, p.isLegendary, p.isMythical, p.isFullyEvolved);

    return Object.freeze({
      ...p,
      bst,
      role: roleInfo.primaryRole,
      secondaryRole: roleInfo.secondaryRole,
      roleScores: roleInfo.scores,
      tier
    });
  })
);

export const POKEMON_BY_ID = new Map(POKEMON_DATABASE.map(p => [p.id, p]));
export const POKEMON_BY_NAME = new Map(POKEMON_DATABASE.map(p => [p.name.toLowerCase(), p]));

/**
 * Get a Pokémon by National Dex ID.
 * @param {number} id
 * @returns {typeof POKEMON_DATABASE[0] | undefined}
 */
export function getPokemonById(id) {
  return POKEMON_BY_ID.get(Number(id));
}

/**
 * Get a Pokémon by name (case-insensitive).
 * @param {string} name
 * @returns {typeof POKEMON_DATABASE[0] | undefined}
 */
export function getPokemonByName(name) {
  return POKEMON_BY_NAME.get(String(name).toLowerCase());
}

/**
 * Filter Pokémon dataset based on match settings.
 * @param {object} options
 * @param {number[]|number} [options.generations]
 * @param {boolean} [options.famousMixOnly]
 * @param {boolean} [options.fullyEvolvedOnly]
 * @param {boolean} [options.includeLegendaries]
 * @param {boolean} [options.includeMythicals]
 * @param {string} [options.role]
 * @param {string} [options.tier]
 * @returns {typeof POKEMON_DATABASE}
 */
export function filterPokemon(options = {}) {
  let list = POKEMON_DATABASE;

  if (options.generations) {
    const gens = Array.isArray(options.generations) ? options.generations : [options.generations];
    list = list.filter(p => gens.includes(p.gen));
  }

  if (options.famousMixOnly) {
    list = list.filter(p => p.famousMix);
  }

  if (options.fullyEvolvedOnly) {
    list = list.filter(p => p.isFullyEvolved);
  }

  if (options.includeLegendaries === false) {
    list = list.filter(p => !p.isLegendary);
  }

  if (options.includeMythicals === false) {
    list = list.filter(p => !p.isMythical);
  }

  if (options.role) {
    list = list.filter(p => p.role === options.role || p.secondaryRole === options.role);
  }

  if (options.tier) {
    list = list.filter(p => p.tier === options.tier);
  }

  return list;
}

/**
 * Get a random sample of N Pokémon from the dataset.
 * @param {number} count
 * @param {object} [filterOptions]
 * @returns {typeof POKEMON_DATABASE}
 */
export function getRandomPokemon(count, filterOptions = {}) {
  const pool = filterPokemon(filterOptions);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
