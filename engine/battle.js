/**
 * DraftDex Headless Pokémon Battle Engine (Singles, 6 vs 6)
 * Pure game logic - zero UI / DOM / networking imports.
 *
 * Implements competitive Pokémon battle mechanics inspired by Pokémon Champions:
 * - Simultaneous turn lock & resolution (commit-then-reveal)
 * - Priority & speed calculation with stat stages and paralysis penalty
 * - Standard damage formula with STAB (1.5x), type effectiveness, critical hits (1.5x), and random roll (85-100%)
 * - 18-type chart with standard effectiveness messages
 * - Status conditions: Burn, Poison, Paralysis, Sleep, Freeze
 * - Stat stages: Attack, Defense, SpAttack, SpDefense, Speed [-6 to +6]
 * - Switching before attacks, faint checks, forced switches, win condition
 * - Deterministic execution driven by Mulberry32 seeded PRNG
 */

import { POKEMON_DATABASE, getPokemonById } from './pokemonData.js';
import { getTypeEffectiveness, getEffectivenessMessage, POKEMON_TYPES } from './types.js';
import { calculateLevel50Stats } from './stats.js';
import { buildMoveSet, MOVES, MOVE_CATEGORIES, STATUS_CONDITIONS } from './moves.js';
import { createRNG } from './random.js';

export const BATTLE_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  NEEDS_SWITCH: 'needs_switch',
  COMPLETED: 'completed'
});

export const ACTION_TYPES = Object.freeze({
  MOVE: 'move',
  SWITCH: 'switch'
});

/**
 * Stat stage multiplier table from -6 to +6.
 * Negative stages: 2 / (2 - stage)
 * Positive stages: (2 + stage) / 2
 */
export function getStatStageMultiplier(stage) {
  const s = Math.max(-6, Math.min(6, stage || 0));
  if (s >= 0) {
    return (2 + s) / 2;
  }
  return 2 / (2 - s);
}

/**
 * Initialize a single Pokémon for battle.
 * @param {object|number} pokemonOrId
 * @returns {object} Battle Pokémon state
 */
export function initBattlePokemon(pokemonOrId) {
  const pData = typeof pokemonOrId === 'number' ? getPokemonById(pokemonOrId) : (pokemonOrId.pokemonId ? getPokemonById(pokemonOrId.pokemonId) : pokemonOrId);
  if (!pData) {
    throw new Error(`Invalid Pokémon data: ${JSON.stringify(pokemonOrId)}`);
  }

  const role = pData.role || 'All-rounder';
  const level50 = calculateLevel50Stats(pData.baseStats, role, 50);
  const moves = buildMoveSet(pData);

  return {
    id: pData.id,
    name: pData.name,
    types: [...pData.types],
    role,
    baseStats: { ...pData.baseStats },
    stats: { ...level50 }, // { hp, attack, defense, spAttack, spDefense, speed }
    maxHp: level50.hp,
    currentHp: level50.hp,
    moves: moves.map(m => ({ ...m, currentPp: m.pp })),
    status: null, // 'burn' | 'paralysis' | 'poison' | 'sleep' | 'freeze' | null
    sleepTurns: 0,
    statStages: {
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0
    },
    isFainted: false
  };
}

/**
 * Calculate effective in-battle stat accounting for stat stages and status conditions.
 * @param {object} pkmn
 * @param {'attack'|'defense'|'spAttack'|'spDefense'|'speed'} statName
 * @returns {number}
 */
export function getEffectiveStat(pkmn, statName) {
  let val = pkmn.stats[statName] || 10;
  const stage = pkmn.statStages[statName] || 0;
  val = Math.floor(val * getStatStageMultiplier(stage));

  // Paralysis cuts speed by 50%
  if (statName === 'speed' && pkmn.status === STATUS_CONDITIONS.PARALYSIS) {
    val = Math.floor(val * 0.5);
  }

  return Math.max(1, val);
}

/**
 * Initialize a new Battle State.
 * @param {object} options
 * @param {Array<object|number>} options.teamA - 6 Pokémon for side A
 * @param {Array<object|number>} options.teamB - 6 Pokémon for side B
 * @param {number|string} [options.seed=Date.now()] - PRNG seed
 * @param {number} [options.leadA] - optional lead index/id for side A
 * @param {number} [options.leadB] - optional lead index/id for side B
 * @param {string} [options.nameA='Trainer A']
 * @param {string} [options.nameB='Trainer B']
 * @returns {object} Battle state
 */
export function createBattle({
  teamA = [],
  teamB = [],
  seed = 'battle-seed-default',
  leadA = null,
  leadB = null,
  nameA = 'Trainer A',
  nameB = 'Trainer B'
}) {
  const partyA = teamA.map(initBattlePokemon);
  const partyB = teamB.map(initBattlePokemon);

  if (partyA.length === 0 || partyB.length === 0) {
    throw new Error('Both teams must have at least one Pokémon to battle');
  }

  // Determine starting active indexes
  let activeIndexA = 0;
  if (leadA !== null && leadA !== undefined) {
    const idx = partyA.findIndex(p => p.id === leadA);
    if (idx !== -1) activeIndexA = idx;
  }

  let activeIndexB = 0;
  if (leadB !== null && leadB !== undefined) {
    const idx = partyB.findIndex(p => p.id === leadB);
    if (idx !== -1) activeIndexB = idx;
  }

  const rng = createRNG(seed);

  return {
    seed,
    rng,
    turn: 1,
    status: BATTLE_STATUS.IN_PROGRESS,
    winner: null, // 'A' | 'B' | null
    nameA,
    nameB,
    sideA: {
      name: nameA,
      party: partyA,
      activeIndex: activeIndexA
    },
    sideB: {
      name: nameB,
      party: partyB,
      activeIndex: activeIndexB
    },
    needsSwitch: { A: false, B: false },
    log: [
      { turn: 0, text: `Battle started between ${nameA} and ${nameB}!` },
      { turn: 0, text: `${nameA} sent out ${partyA[activeIndexA].name}!` },
      { turn: 0, text: `${nameB} sent out ${partyB[activeIndexB].name}!` }
    ]
  };
}

/**
 * Get active Pokémon for a side.
 * @param {object} battle
 * @param {'A'|'B'} side
 * @returns {object}
 */
export function getActivePokemon(battle, side) {
  const sideObj = side === 'A' ? battle.sideA : battle.sideB;
  return sideObj.party[sideObj.activeIndex];
}

/**
 * Standard competitive damage calculation formula.
 * @param {object} attacker
 * @param {object} defender
 * @param {object} move
 * @param {() => number} rng
 * @returns {{ damage: number, isCrit: boolean, effectiveness: number, effMessage: string }}
 */
export function calculateDamage(attacker, defender, move, rng) {
  if (move.category === MOVE_CATEGORIES.STATUS || (move.power || 0) === 0) {
    return { damage: 0, isCrit: false, effectiveness: 1, effMessage: 'normal' };
  }

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  const effMessage = getEffectivenessMessage(effectiveness);

  if (effectiveness === 0) {
    return { damage: 0, isCrit: false, effectiveness: 0, effMessage: 'no-effect' };
  }

  // Attack & Defense stats
  const isPhysical = move.category === MOVE_CATEGORIES.PHYSICAL;
  const attackStat = isPhysical ? getEffectiveStat(attacker, 'attack') : getEffectiveStat(attacker, 'spAttack');
  const defenseStat = isPhysical ? getEffectiveStat(defender, 'defense') : getEffectiveStat(defender, 'spDefense');

  // Standard Level 50 formula: floor(((2 * 50 / 5 + 2) * Power * A / D) / 50) + 2
  // = floor((22 * Power * A / D) / 50) + 2
  const baseDamage = Math.floor((22 * move.power * (attackStat / defenseStat)) / 50) + 2;

  // Critical hit: 1/24 (approx 4.17%) standard, or higher with critRatio
  const critThreshold = move.critRatio ? 0.125 : (1 / 24);
  const isCrit = rng() < critThreshold;
  const critMultiplier = isCrit ? 1.5 : 1.0;

  // STAB: Same Type Attack Bonus (1.5x)
  const isStab = attacker.types.includes(move.type);
  const stabMultiplier = isStab ? 1.5 : 1.0;

  // Random variance: 85% to 100%
  const randomFactor = 0.85 + (rng() * 0.15);

  // Burn penalty: physical moves dealt by burned attacker deal 0.5x
  const burnPenalty = (isPhysical && attacker.status === STATUS_CONDITIONS.BURN) ? 0.5 : 1.0;

  let totalDamage = Math.floor(baseDamage * critMultiplier * stabMultiplier * effectiveness * randomFactor * burnPenalty);
  totalDamage = Math.max(1, totalDamage);

  return {
    damage: totalDamage,
    isCrit,
    effectiveness,
    effMessage
  };
}

/**
 * Execute a switch action.
 * @param {object} battle
 * @param {'A'|'B'} side
 * @param {number} targetIndex
 * @param {boolean} [isForced=false]
 */
export function executeSwitch(battle, side, targetIndex, isForced = false) {
  const sideObj = side === 'A' ? battle.sideA : battle.sideB;
  const oldActive = sideObj.party[sideObj.activeIndex];
  const newActive = sideObj.party[targetIndex];

  if (!newActive || newActive.isFainted) {
    return false;
  }

  // Reset old active stat stages on switch-out
  oldActive.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };

  sideObj.activeIndex = targetIndex;

  battle.log.push({
    turn: battle.turn,
    side,
    action: 'switch',
    text: `${sideObj.name} withdrew ${oldActive.name} and sent out ${newActive.name}!`
  });

  return true;
}

/**
 * Check if a Pokémon is able to execute a move (evaluates sleep, freeze, paralysis).
 * @param {object} pkmn
 * @param {object} battle
 * @param {'A'|'B'} side
 * @returns {boolean} true if Pokémon can act, false if turn is forfeited
 */
export function canPokemonAct(pkmn, battle, side) {
  if (pkmn.isFainted) return false;

  // 1. Sleep check
  if (pkmn.status === STATUS_CONDITIONS.SLEEP) {
    pkmn.sleepTurns--;
    if (pkmn.sleepTurns <= 0) {
      pkmn.status = null;
      battle.log.push({
        turn: battle.turn,
        side,
        text: `${pkmn.name} woke up!`
      });
      return true;
    } else {
      battle.log.push({
        turn: battle.turn,
        side,
        text: `${pkmn.name} is fast asleep!`
      });
      return false;
    }
  }

  // 2. Freeze check
  if (pkmn.status === STATUS_CONDITIONS.FREEZE) {
    if (battle.rng() < 0.20) {
      pkmn.status = null;
      battle.log.push({
        turn: battle.turn,
        side,
        text: `${pkmn.name} thawed out!`
      });
      return true;
    } else {
      battle.log.push({
        turn: battle.turn,
        side,
        text: `${pkmn.name} is frozen solid!`
      });
      return false;
    }
  }

  // 3. Paralysis check: 25% chance of being fully paralyzed
  if (pkmn.status === STATUS_CONDITIONS.PARALYSIS) {
    if (battle.rng() < 0.25) {
      battle.log.push({
        turn: battle.turn,
        side,
        text: `${pkmn.name} is fully paralyzed and cannot move!`
      });
      return false;
    }
  }

  return true;
}

/**
 * Execute a move action.
 * @param {object} battle
 * @param {'A'|'B'} attackerSide
 * @param {string} moveName
 */
export function executeMove(battle, attackerSide, moveName) {
  const defenderSide = attackerSide === 'A' ? 'B' : 'A';
  const attacker = getActivePokemon(battle, attackerSide);
  const defender = getActivePokemon(battle, defenderSide);

  if (attacker.isFainted || defender.isFainted) return;

  const move = attacker.moves.find(m => m.name === moveName) || attacker.moves[0];
  if (!move) return;

  // Decrement PP
  if (move.currentPp !== undefined && move.currentPp > 0) {
    move.currentPp--;
  }

  // Check if Pokémon can act (status check)
  if (!canPokemonAct(attacker, battle, attackerSide)) {
    return;
  }

  battle.log.push({
    turn: battle.turn,
    side: attackerSide,
    action: 'move',
    moveName: move.name,
    text: `${attacker.name} used ${move.name}!`
  });

  // Accuracy check
  if (move.accuracy && move.accuracy < 100) {
    const hitRoll = battle.rng() * 100;
    if (hitRoll > move.accuracy) {
      battle.log.push({
        turn: battle.turn,
        side: attackerSide,
        text: `${attacker.name}'s attack missed!`
      });
      return;
    }
  }

  // Category: Status
  if (move.category === MOVE_CATEGORIES.STATUS) {
    // Healing move (e.g. Recover)
    if (move.healPercent) {
      const healAmount = Math.floor(attacker.maxHp * move.healPercent);
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
      battle.log.push({
        turn: battle.turn,
        side: attackerSide,
        text: `${attacker.name} restored HP!`
      });
    }

    // Stat changes
    if (move.statChanges) {
      for (const [stat, delta] of Object.entries(move.statChanges)) {
        if (attacker.statStages[stat] !== undefined) {
          attacker.statStages[stat] = Math.max(-6, Math.min(6, attacker.statStages[stat] + delta));
          const changeWord = delta > 1 ? 'sharply rose' : 'rose';
          battle.log.push({
            turn: battle.turn,
            side: attackerSide,
            text: `${attacker.name}'s ${stat} ${changeWord}!`
          });
        }
      }
    }

    // Status infliction (e.g. Will-O-Wisp, Spore, Thunder Wave)
    if (move.status && !defender.status) {
      applyStatus(defender, move.status, battle, defenderSide);
    }
    return;
  }

  // Category: Physical or Special -> Calculate Damage
  const calc = calculateDamage(attacker, defender, move, battle.rng);

  if (calc.effectiveness === 0) {
    battle.log.push({
      turn: battle.turn,
      side: defenderSide,
      text: `It doesn't affect ${defender.name}...`
    });
    return;
  }

  defender.currentHp = Math.max(0, defender.currentHp - calc.damage);

  if (calc.isCrit) {
    battle.log.push({ turn: battle.turn, side: attackerSide, text: 'A critical hit!' });
  }

  if (calc.effMessage === 'super-effective') {
    battle.log.push({ turn: battle.turn, side: attackerSide, text: "It's super effective!" });
  } else if (calc.effMessage === 'not-very-effective') {
    battle.log.push({ turn: battle.turn, side: attackerSide, text: "It's not very effective..." });
  }

  // Drain effects (e.g. Giga Drain)
  if (move.drainPercent && calc.damage > 0) {
    const drainHeal = Math.floor(calc.damage * move.drainPercent);
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drainHeal);
    battle.log.push({
      turn: battle.turn,
      side: attackerSide,
      text: `${attacker.name} drained HP from ${defender.name}!`
    });
  }

  // Recoil effects (e.g. Flare Blitz, Wood Hammer)
  if (move.recoil && calc.damage > 0) {
    const recoilDamage = Math.max(1, Math.floor(calc.damage * move.recoil));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
    battle.log.push({
      turn: battle.turn,
      side: attackerSide,
      text: `${attacker.name} is hit with recoil damage!`
    });
    if (attacker.currentHp === 0) {
      handleFaint(attacker, battle, attackerSide);
    }
  }

  // Secondary status chance (e.g. 10% Burn from Flamethrower, 30% Paralysis from Body Slam)
  if (move.statusChance && move.status && !defender.status && defender.currentHp > 0) {
    if (battle.rng() < move.statusChance) {
      applyStatus(defender, move.status, battle, defenderSide);
    }
  }

  // Defender faint check
  if (defender.currentHp === 0) {
    handleFaint(defender, battle, defenderSide);
  }
}

/**
 * Apply status condition to a Pokémon.
 */
function applyStatus(pkmn, status, battle, side) {
  if (pkmn.status || pkmn.isFainted) return;

  // Type immunities to status
  if (status === STATUS_CONDITIONS.BURN && pkmn.types.includes('fire')) return;
  if (status === STATUS_CONDITIONS.PARALYSIS && pkmn.types.includes('electric')) return;
  if (status === STATUS_CONDITIONS.POISON && (pkmn.types.includes('poison') || pkmn.types.includes('steel'))) return;
  if (status === STATUS_CONDITIONS.FREEZE && pkmn.types.includes('ice')) return;

  pkmn.status = status;

  if (status === STATUS_CONDITIONS.SLEEP) {
    pkmn.sleepTurns = 1 + Math.floor(battle.rng() * 3); // 1 to 3 turns
  }

  const messages = {
    [STATUS_CONDITIONS.BURN]: `${pkmn.name} was burned!`,
    [STATUS_CONDITIONS.PARALYSIS]: `${pkmn.name} is paralyzed! It may be unable to move!`,
    [STATUS_CONDITIONS.POISON]: `${pkmn.name} was poisoned!`,
    [STATUS_CONDITIONS.SLEEP]: `${pkmn.name} fell asleep!`,
    [STATUS_CONDITIONS.FREEZE]: `${pkmn.name} was frozen solid!`
  };

  battle.log.push({
    turn: battle.turn,
    side,
    text: messages[status] || `${pkmn.name} received ${status}!`
  });
}

/**
 * Handle a Pokémon fainting.
 */
function handleFaint(pkmn, battle, side) {
  pkmn.isFainted = true;
  pkmn.currentHp = 0;
  battle.log.push({
    turn: battle.turn,
    side,
    action: 'faint',
    text: `${pkmn.name} fainted!`
  });
}

/**
 * Check if an entire team is defeated.
 * @param {Array<object>} party
 * @returns {boolean}
 */
export function isTeamDefeated(party) {
  return party.every(p => p.isFainted);
}

/**
 * Check and resolve end of turn conditions:
 * - End-of-turn status damage (Burn, Poison)
 * - Fainting and win conditions
 * @param {object} battle
 */
export function resolveEndOfTurn(battle) {
  const activeA = getActivePokemon(battle, 'A');
  const activeB = getActivePokemon(battle, 'B');

  // End of turn Burn damage: 1/16 max HP
  // End of turn Poison damage: 1/8 max HP
  for (const [pkmn, side] of [[activeA, 'A'], [activeB, 'B']]) {
    if (pkmn && !pkmn.isFainted) {
      if (pkmn.status === STATUS_CONDITIONS.BURN) {
        const dmg = Math.max(1, Math.floor(pkmn.maxHp / 16));
        pkmn.currentHp = Math.max(0, pkmn.currentHp - dmg);
        battle.log.push({ turn: battle.turn, side, text: `${pkmn.name} is hurt by its burn!` });
        if (pkmn.currentHp === 0) handleFaint(pkmn, battle, side);
      } else if (pkmn.status === STATUS_CONDITIONS.POISON) {
        const dmg = Math.max(1, Math.floor(pkmn.maxHp / 8));
        pkmn.currentHp = Math.max(0, pkmn.currentHp - dmg);
        battle.log.push({ turn: battle.turn, side, text: `${pkmn.name} is hurt by poison!` });
        if (pkmn.currentHp === 0) handleFaint(pkmn, battle, side);
      }
    }
  }

  // Check victory condition
  const defeatedA = isTeamDefeated(battle.sideA.party);
  const defeatedB = isTeamDefeated(battle.sideB.party);

  if (defeatedA && defeatedB) {
    battle.status = BATTLE_STATUS.COMPLETED;
    battle.winner = 'draw';
    battle.log.push({ turn: battle.turn, text: 'The battle ended in a draw!' });
    return;
  }

  if (defeatedA) {
    battle.status = BATTLE_STATUS.COMPLETED;
    battle.winner = 'B';
    battle.log.push({ turn: battle.turn, text: `${battle.sideB.name} wins the battle!` });
    return;
  }

  if (defeatedB) {
    battle.status = BATTLE_STATUS.COMPLETED;
    battle.winner = 'A';
    battle.log.push({ turn: battle.turn, text: `${battle.sideA.name} wins the battle!` });
    return;
  }

  // Check if forced switches are required
  battle.needsSwitch.A = getActivePokemon(battle, 'A').isFainted;
  battle.needsSwitch.B = getActivePokemon(battle, 'B').isFainted;

  if (battle.needsSwitch.A || battle.needsSwitch.B) {
    battle.status = BATTLE_STATUS.NEEDS_SWITCH;
  }
}

/**
 * Execute a complete turn given actions from both sides.
 * @param {object} battle
 * @param {object} actions
 * @param {{ type: 'move'|'switch', moveName?: string, switchIndex?: number }} actions.A
 * @param {{ type: 'move'|'switch', moveName?: string, switchIndex?: number }} actions.B
 * @returns {object} Updated battle state
 */
export function executeTurn(battle, actions) {
  if (battle.status === BATTLE_STATUS.COMPLETED) {
    return battle;
  }

  // Step 1: Execute switches first (switches always happen before moves)
  if (actions.A?.type === ACTION_TYPES.SWITCH) {
    executeSwitch(battle, 'A', actions.A.switchIndex);
  }
  if (actions.B?.type === ACTION_TYPES.SWITCH) {
    executeSwitch(battle, 'B', actions.B.switchIndex);
  }

  // Step 2: Determine order for move execution
  const activeA = getActivePokemon(battle, 'A');
  const activeB = getActivePokemon(battle, 'B');

  const actsMoveA = actions.A?.type === ACTION_TYPES.MOVE;
  const actsMoveB = actions.B?.type === ACTION_TYPES.MOVE;

  if (actsMoveA && actsMoveB) {
    const moveObjA = activeA.moves.find(m => m.name === actions.A.moveName) || activeA.moves[0];
    const moveObjB = activeB.moves.find(m => m.name === actions.B.moveName) || activeB.moves[0];

    const prioA = moveObjA?.priority || 0;
    const prioB = moveObjB?.priority || 0;

    let aGoesFirst = true;

    if (prioA !== prioB) {
      aGoesFirst = prioA > prioB;
    } else {
      const speA = getEffectiveStat(activeA, 'speed');
      const speB = getEffectiveStat(activeB, 'speed');
      if (speA !== speB) {
        aGoesFirst = speA > speB;
      } else {
        // Speed tie: broken deterministically by PRNG roll
        aGoesFirst = battle.rng() < 0.5;
      }
    }

    const firstSide = aGoesFirst ? 'A' : 'B';
    const secondSide = aGoesFirst ? 'B' : 'A';
    const firstMove = aGoesFirst ? actions.A.moveName : actions.B.moveName;
    const secondMove = aGoesFirst ? actions.B.moveName : actions.A.moveName;

    // First attacker strikes
    executeMove(battle, firstSide, firstMove);

    // Second attacker strikes only if still active and not fainted
    const secondActive = getActivePokemon(battle, secondSide);
    if (!secondActive.isFainted) {
      executeMove(battle, secondSide, secondMove);
    }
  } else if (actsMoveA) {
    executeMove(battle, 'A', actions.A.moveName);
  } else if (actsMoveB) {
    executeMove(battle, 'B', actions.B.moveName);
  }

  // Step 3: End of turn resolutions
  resolveEndOfTurn(battle);

  // If battle continues, advance turn number
  if (battle.status !== BATTLE_STATUS.COMPLETED && battle.status !== BATTLE_STATUS.NEEDS_SWITCH) {
    battle.turn++;
  }

  return battle;
}

/**
 * Handle a forced switch after a Pokémon faints.
 * @param {object} battle
 * @param {'A'|'B'} side
 * @param {number} targetIndex
 * @returns {boolean}
 */
export function resolveForcedSwitch(battle, side, targetIndex) {
  const success = executeSwitch(battle, side, targetIndex, true);
  if (!success) return false;

  battle.needsSwitch[side] = false;

  // If no more switches needed, return to in_progress
  if (!battle.needsSwitch.A && !battle.needsSwitch.B) {
    battle.status = BATTLE_STATUS.IN_PROGRESS;
    battle.turn++;
  }

  return true;
}

/**
 * AI Bot Action Decision.
 * Selects an optimal move or forced switch.
 * @param {object} battle
 * @param {'A'|'B'} side
 * @returns {{ type: 'move'|'switch', moveName?: string, switchIndex?: number }}
 */
export function decideBattleAction(battle, side) {
  const sideObj = side === 'A' ? battle.sideA : battle.sideB;
  const oppSide = side === 'A' ? 'B' : 'A';
  const active = getActivePokemon(battle, side);
  const oppActive = getActivePokemon(battle, oppSide);

  // 1. Forced switch decision
  if (battle.needsSwitch[side] || active.isFainted) {
    const available = sideObj.party
      .map((p, idx) => ({ p, idx }))
      .filter(({ p, idx }) => !p.isFainted && idx !== sideObj.activeIndex);

    if (available.length === 0) return { type: ACTION_TYPES.SWITCH, switchIndex: 0 };

    // Pick highest speed available
    available.sort((a, b) => b.p.stats.speed - a.p.stats.speed);
    return { type: ACTION_TYPES.SWITCH, switchIndex: available[0].idx };
  }

  // 2. Normal move decision
  const availableMoves = active.moves.filter(m => m.currentPp === undefined || m.currentPp > 0);
  if (availableMoves.length === 0) {
    return { type: ACTION_TYPES.MOVE, moveName: active.moves[0].name };
  }

  // Score available moves based on power and type effectiveness against opponent
  let bestMove = availableMoves[0];
  let bestScore = -1;

  for (const m of availableMoves) {
    let score = m.power || 0;
    if (m.category !== MOVE_CATEGORIES.STATUS) {
      const eff = getTypeEffectiveness(m.type, oppActive.types);
      score *= eff;
      if (active.types.includes(m.type)) score *= 1.5;
    } else {
      // Give status/recovery moves tactical score
      if (m.healPercent && active.currentHp < active.maxHp * 0.5) {
        score = 80;
      } else if (m.status && !oppActive.status) {
        score = 65;
      } else if (m.statChanges) {
        score = 55;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }

  return { type: ACTION_TYPES.MOVE, moveName: bestMove.name };
}

/**
 * Simulate an entire headless 6v6 battle to completion.
 * @param {object} options
 * @returns {{ winner: 'A'|'B'|'draw', turns: number, battle: object }}
 */
export function simulateFullBattle(options) {
  const battle = createBattle(options);
  let maxTurns = 200;

  while (battle.status !== BATTLE_STATUS.COMPLETED && maxTurns > 0) {
    maxTurns--;

    if (battle.status === BATTLE_STATUS.NEEDS_SWITCH) {
      if (battle.needsSwitch.A) {
        const actA = decideBattleAction(battle, 'A');
        resolveForcedSwitch(battle, 'A', actA.switchIndex);
      }
      if (battle.needsSwitch.B) {
        const actB = decideBattleAction(battle, 'B');
        resolveForcedSwitch(battle, 'B', actB.switchIndex);
      }
      continue;
    }

    const actionA = decideBattleAction(battle, 'A');
    const actionB = decideBattleAction(battle, 'B');

    executeTurn(battle, { A: actionA, B: actionB });
  }

  return {
    winner: battle.winner,
    turns: battle.turn,
    battle
  };
}
