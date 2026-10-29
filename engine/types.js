/**
 * Pokémon 18-Type System & Interaction Chart
 * Pure game logic - zero UI / DOM / networking imports.
 */

export const POKEMON_TYPES = Object.freeze([
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'steel',
  'dark',
  'fairy'
]);

/**
 * TYPE_CHART[attackerType][defenderType] = damage multiplier
 * 2 = Super effective
 * 1 = Normal effectiveness
 * 0.5 = Not very effective
 * 0 = No effect (immune)
 */
export const TYPE_CHART = Object.freeze({
  normal: {
    normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 1, poison: 1,
    ground: 1, flying: 1, psychic: 1, bug: 1, rock: 0.5, ghost: 0, dragon: 1, steel: 0.5, dark: 1, fairy: 1
  },
  fire: {
    normal: 1, fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 2, fighting: 1, poison: 1,
    ground: 1, flying: 1, psychic: 1, bug: 2, rock: 0.5, ghost: 1, dragon: 0.5, steel: 2, dark: 1, fairy: 1
  },
  water: {
    normal: 1, fire: 2, water: 0.5, grass: 0.5, electric: 1, ice: 1, fighting: 1, poison: 1,
    ground: 2, flying: 1, psychic: 1, bug: 1, rock: 2, ghost: 1, dragon: 0.5, steel: 1, dark: 1, fairy: 1
  },
  grass: {
    normal: 1, fire: 0.5, water: 2, grass: 0.5, electric: 1, ice: 1, fighting: 1, poison: 0.5,
    ground: 2, flying: 0.5, psychic: 1, bug: 0.5, rock: 2, ghost: 1, dragon: 0.5, steel: 0.5, dark: 1, fairy: 1
  },
  electric: {
    normal: 1, fire: 1, water: 2, grass: 0.5, electric: 0.5, ice: 1, fighting: 1, poison: 1,
    ground: 0, flying: 2, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 0.5, steel: 1, dark: 1, fairy: 1
  },
  ice: {
    normal: 1, fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 0.5, fighting: 1, poison: 1,
    ground: 2, flying: 2, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 2, steel: 0.5, dark: 1, fairy: 1
  },
  fighting: {
    normal: 2, fire: 1, water: 1, grass: 1, electric: 1, ice: 2, fighting: 1, poison: 0.5,
    ground: 1, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dragon: 1, steel: 2, dark: 2, fairy: 0.5
  },
  poison: {
    normal: 1, fire: 1, water: 1, grass: 2, electric: 1, ice: 1, fighting: 1, poison: 0.5,
    ground: 0.5, flying: 1, psychic: 1, bug: 1, rock: 0.5, ghost: 0.5, dragon: 1, steel: 0, dark: 1, fairy: 2
  },
  ground: {
    normal: 1, fire: 2, water: 1, grass: 0.5, electric: 2, ice: 1, fighting: 1, poison: 2,
    ground: 1, flying: 0, psychic: 1, bug: 0.5, rock: 2, ghost: 1, dragon: 1, steel: 2, dark: 1, fairy: 1
  },
  flying: {
    normal: 1, fire: 1, water: 1, grass: 2, electric: 0.5, ice: 1, fighting: 2, poison: 1,
    ground: 1, flying: 1, psychic: 1, bug: 2, rock: 0.5, ghost: 1, dragon: 1, steel: 0.5, dark: 1, fairy: 1
  },
  psychic: {
    normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 2, poison: 2,
    ground: 1, flying: 1, psychic: 0.5, bug: 1, rock: 1, ghost: 1, dragon: 1, steel: 0.5, dark: 0, fairy: 1
  },
  bug: {
    normal: 1, fire: 0.5, water: 1, grass: 2, electric: 1, ice: 1, fighting: 0.5, poison: 0.5,
    ground: 1, flying: 0.5, psychic: 2, bug: 1, rock: 1, ghost: 0.5, dragon: 1, steel: 0.5, dark: 2, fairy: 0.5
  },
  rock: {
    normal: 1, fire: 2, water: 1, grass: 1, electric: 1, ice: 2, fighting: 0.5, poison: 1,
    ground: 0.5, flying: 2, psychic: 1, bug: 2, rock: 1, ghost: 1, dragon: 1, steel: 0.5, dark: 1, fairy: 1
  },
  ghost: {
    normal: 0, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 1, poison: 1,
    ground: 1, flying: 1, psychic: 2, bug: 1, rock: 1, ghost: 2, dragon: 1, steel: 1, dark: 0.5, fairy: 1
  },
  dragon: {
    normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 1, poison: 1,
    ground: 1, flying: 1, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 2, steel: 0.5, dark: 1, fairy: 0
  },
  steel: {
    normal: 1, fire: 0.5, water: 0.5, grass: 1, electric: 0.5, ice: 2, fighting: 1, poison: 1,
    ground: 1, flying: 1, psychic: 1, bug: 1, rock: 2, ghost: 1, dragon: 1, steel: 0.5, dark: 1, fairy: 2
  },
  dark: {
    normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 0.5, poison: 1,
    ground: 1, flying: 1, psychic: 2, bug: 1, rock: 1, ghost: 2, dragon: 1, steel: 1, dark: 0.5, fairy: 0.5
  },
  fairy: {
    normal: 1, fire: 0.5, water: 1, grass: 1, electric: 1, ice: 1, fighting: 2, poison: 0.5,
    ground: 1, flying: 1, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 2, steel: 0.5, dark: 2, fairy: 1
  }
});

/**
 * Calculate type effectiveness multiplier of an attack against single or dual defender types.
 * @param {string} attackType
 * @param {string|string[]} defenderTypes
 * @returns {number} 0, 0.25, 0.5, 1, 2, or 4
 */
export function getTypeEffectiveness(attackType, defenderTypes) {
  const atk = String(attackType).toLowerCase();
  const defTypes = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
  
  if (!TYPE_CHART[atk]) {
    throw new Error(`Unknown attack type: ${attackType}`);
  }

  let multiplier = 1;
  for (const def of defTypes) {
    const d = String(def).toLowerCase();
    if (TYPE_CHART[atk][d] === undefined) {
      throw new Error(`Unknown defender type: ${def}`);
    }
    multiplier *= TYPE_CHART[atk][d];
  }
  return multiplier;
}

/**
 * Get standard battle message/classification for a damage multiplier.
 * @param {number} multiplier
 * @returns {'super-effective'|'not-very-effective'|'no-effect'|'normal'}
 */
export function getEffectivenessMessage(multiplier) {
  if (multiplier === 0) return 'no-effect';
  if (multiplier > 1) return 'super-effective';
  if (multiplier < 1) return 'not-very-effective';
  return 'normal';
}
