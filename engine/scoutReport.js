/**
 * Scout Report: Pure Deterministic In-Game Judge Logic
 * Evaluates draft squads on:
 * - Draft Grade (Value for Money: Fair Value vs Price Paid)
 * - Role Coverage and Type Synergy
 * - Speed Profile (Outspeed count in head-to-head)
 * - Projected Win Chance (Labeled as estimate)
 * - Highlights: Best Steal, Biggest Overpay, Weakness Alert, MVP Pick
 * - Winner Declaration & Awards
 *
 * Same input must always produce the same report.
 * Pure game logic - zero UI / DOM / networking imports.
 */

import { ROLES } from './roles.js';
import { TYPE_CHART, POKEMON_TYPES } from './types.js';
import { TIERS } from './pokemonData.js';

/**
 * Calculate the objective fair value (baseline credits) of a Pokémon.
 * @param {object} pokemon
 * @param {number} [budget=100]
 * @returns {number} Fair value in credits
 */
export function calculateFairValue(pokemon, budget = 100) {
  if (!pokemon) return 10;
  const bst = pokemon.bst || 500;
  // Standard scale: 300 BST is ~10 credits, 600 BST is ~26 credits, 680 BST is ~32 credits
  const bstFactor = Math.min(720, Math.max(300, bst));
  let baseCredits = 6 + ((bstFactor - 300) / 420) * 24;

  if (pokemon.tier === TIERS.MARQUEE || pokemon.isLegendary) {
    baseCredits += 4;
  }

  // Scale with match budget relative to 100
  const budgetScale = budget / 100;
  return Math.max(1, Math.round(baseCredits * budgetScale));
}

/**
 * Calculate offensive and defensive type profile for a squad.
 * @param {Array<{pokemon: object}>} team
 * @returns {{ uniqueTypes: string[], majorWeaknesses: Array<{type: string, count: number}>, coverageScore: number }}
 */
export function evaluateTypeSynergy(team) {
  const typeSet = new Set();
  const weaknessCount = {};

  for (const t of POKEMON_TYPES) {
    weaknessCount[t] = 0;
  }

  for (const item of team) {
    const p = item.pokemon;
    if (!p) continue;
    p.types.forEach(t => typeSet.add(t));

    // Check defensive weaknesses across all 18 types
    for (const attackingType of POKEMON_TYPES) {
      let mult = 1;
      for (const defType of p.types) {
        mult *= (TYPE_CHART[attackingType]?.[defType] ?? 1);
      }
      if (mult > 1) {
        weaknessCount[attackingType]++;
      }
    }
  }

  const majorWeaknesses = Object.entries(weaknessCount)
    .filter(([_, count]) => count >= 3)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Score from 0 to 100
  // Diversity of types + absence of crippling shared weaknesses
  const diversityPts = Math.min(60, typeSet.size * 6.5);
  const weaknessPenalty = majorWeaknesses.reduce((sum, w) => sum + (w.count * 4), 0);
  const coverageScore = Math.max(10, Math.min(100, Math.round(diversityPts + 40 - weaknessPenalty)));

  return {
    uniqueTypes: Array.from(typeSet),
    majorWeaknesses,
    coverageScore
  };
}

/**
 * Evaluate role coverage for a squad.
 * @param {Array<{pokemon: object}>} team
 * @returns {{ score: number, coveredRoles: string[], missingRoles: string[] }}
 */
export function evaluateRoleCoverage(team) {
  const rolesFound = new Set();

  for (const item of team) {
    const p = item.pokemon;
    if (!p) continue;
    if (p.role) rolesFound.add(p.role);
    if (p.secondaryRole) rolesFound.add(p.secondaryRole);
  }

  const coreArchetypes = [
    { name: ROLES.PHYSICAL_SWEEPER, label: 'Physical Sweeper' },
    { name: ROLES.SPECIAL_SWEEPER, label: 'Special Sweeper' },
    { name: ROLES.SPEEDSTER, label: 'Speedster' },
    { name: ROLES.TANK_WALL, label: 'Tank/Wall' },
    {
      check: () => rolesFound.has(ROLES.SUPPORT) || rolesFound.has(ROLES.ALL_ROUNDER),
      label: 'Support/All-rounder'
    }
  ];

  const covered = [];
  const missing = [];

  for (const arch of coreArchetypes) {
    const isPresent = arch.check ? arch.check() : rolesFound.has(arch.name);
    if (isPresent) {
      covered.push(arch.label);
    } else {
      missing.push(arch.label);
    }
  }

  const score = Math.round((covered.length / coreArchetypes.length) * 100);
  return { score, coveredRoles: covered, missingRoles: missing };
}

/**
 * Compare speed profile of two squads.
 * @param {Array<{pokemon: object}>} teamA
 * @param {Array<{pokemon: object}>} teamB
 * @returns {{ teamAOutspeeds: number, teamBOutspeeds: number, ties: number, details: string }}
 */
export function compareSpeedProfile(teamA, teamB) {
  let aFaster = 0;
  let bFaster = 0;
  let ties = 0;

  const speedsA = teamA.map(item => item.pokemon?.baseStats?.speed || 0).sort((a, b) => b - a);
  const speedsB = teamB.map(item => item.pokemon?.baseStats?.speed || 0).sort((a, b) => b - a);
  const compareLen = Math.min(speedsA.length, speedsB.length);

  for (let i = 0; i < compareLen; i++) {
    if (speedsA[i] > speedsB[i]) aFaster++;
    else if (speedsB[i] > speedsA[i]) bFaster++;
    else ties++;
  }

  return {
    teamAOutspeeds: aFaster,
    teamBOutspeeds: bFaster,
    ties,
    details: `${aFaster} of ${compareLen} slot speed matchups favored`
  };
}

/**
 * Generate a complete, deterministic Scout Report for a finished or current auction match.
 *
 * @param {object} matchState
 * @returns {object} Full Scout Report
 */
export function generateScoutReport(matchState) {
  const budget = matchState.settings?.budget || 100;
  const players = matchState.players || [];

  const playerReports = players.map(player => {
    const team = player.team || [];
    let totalSpent = 0;
    let totalFairValue = 0;

    const evaluatedTeam = team.map(item => {
      const p = item.pokemon;
      const fv = calculateFairValue(p, budget);
      const diff = fv - item.price; // positive = steal, negative = overpay
      totalSpent += item.price;
      totalFairValue += fv;

      return {
        pokemonId: item.pokemonId,
        name: p?.name || `Pokémon #${item.pokemonId}`,
        price: item.price,
        fairValue: fv,
        valueDiff: diff,
        bst: p?.bst || 0,
        role: p?.role || 'Unknown'
      };
    });

    // Value for money metric
    const valueRatio = totalSpent > 0 ? (totalFairValue / totalSpent) : 1;
    let draftGrade = 'C';
    let valueScore = 50;

    if (valueRatio >= 1.25) { draftGrade = 'S'; valueScore = 98; }
    else if (valueRatio >= 1.08) { draftGrade = 'A'; valueScore = 88; }
    else if (valueRatio >= 0.95) { draftGrade = 'B'; valueScore = 76; }
    else if (valueRatio >= 0.82) { draftGrade = 'C'; valueScore = 64; }
    else { draftGrade = 'D'; valueScore = 45; }

    const roleEval = evaluateRoleCoverage(team);
    const typeEval = evaluateTypeSynergy(team);

    // Highlights
    const sortedBySteal = [...evaluatedTeam].sort((a, b) => b.valueDiff - a.valueDiff);
    const sortedByOverpay = [...evaluatedTeam].sort((a, b) => a.valueDiff - b.valueDiff);
    const sortedByBst = [...evaluatedTeam].sort((a, b) => b.bst - a.bst);

    const bestSteal = sortedBySteal.length > 0 && sortedBySteal[0].valueDiff > 0
      ? sortedBySteal[0]
      : null;

    const biggestOverpay = sortedByOverpay.length > 0 && sortedByOverpay[0].valueDiff < 0
      ? sortedByOverpay[0]
      : null;

    const mvpPick = sortedByBst.length > 0 ? sortedByBst[0] : null;

    const weaknessAlerts = [];
    if (roleEval.missingRoles.length > 0) {
      weaknessAlerts.push(`Missing role: ${roleEval.missingRoles.join(', ')}`);
    }
    for (const w of typeEval.majorWeaknesses) {
      weaknessAlerts.push(`${w.count} Pokémon weak to ${w.type.toUpperCase()}`);
    }

    // Composite Overall Score (0–100)
    // 35% value for money, 30% role coverage, 20% type synergy, 15% raw BST power
    const avgBst = team.length > 0 ? (evaluatedTeam.reduce((sum, p) => sum + p.bst, 0) / team.length) : 0;
    const bstScore = Math.min(100, Math.max(30, Math.round(((avgBst - 400) / 250) * 100)));

    const overallScore = Math.round(
      (valueScore * 0.35) +
      (roleEval.score * 0.30) +
      (typeEval.coverageScore * 0.20) +
      (bstScore * 0.15)
    );

    return {
      playerId: player.id,
      name: player.name,
      draftGrade,
      overallScore,
      valueRatio: Math.round(valueRatio * 100) / 100,
      totalSpent,
      totalFairValue,
      roleCoverage: roleEval,
      typeSynergy: typeEval,
      highlights: {
        bestSteal,
        biggestOverpay,
        mvpPick,
        weaknessAlerts
      },
      team: evaluatedTeam
    };
  });

  // Head-to-Head Speed & Win Probability (for 2 players)
  let speedComparison = null;
  let winChances = {};

  if (playerReports.length === 2) {
    const pA = playerReports[0];
    const pB = playerReports[1];
    speedComparison = compareSpeedProfile(players[0].team, players[1].team);

    // Logistic probability estimate based on difference in overall score
    const diff = pA.overallScore - pB.overallScore;
    const probA = Math.round((1 / (1 + Math.pow(10, -diff / 35))) * 100);
    const probB = 100 - probA;

    winChances[pA.playerId] = {
      percentage: probA,
      label: `Projected Win Chance: ~${probA}% (estimate, not a guarantee)`
    };
    winChances[pB.playerId] = {
      percentage: probB,
      label: `Projected Win Chance: ~${probB}% (estimate, not a guarantee)`
    };
  }

  // Determine Draft Winner
  const sortedByScore = [...playerReports].sort((a, b) => b.overallScore - a.overallScore);
  const draftWinner = sortedByScore.length > 0 ? sortedByScore[0].name : 'Tie';

  return {
    matchRoom: matchState.room,
    players: playerReports,
    speedComparison,
    winChances,
    draftWinner,
    summaryCommentary: `Draft complete. ${draftWinner} achieved the highest composite draft evaluation score.`
  };
}
