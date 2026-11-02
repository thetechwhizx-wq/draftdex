/**
 * scripts/build-data.mjs
 * Phase 2: Fetch Pokémon data from PokéAPI and write static JSON files.
 *
 * Run once on a machine with internet access:
 *   node scripts/build-data.mjs
 *
 * Rate-limited: max 20 concurrent requests, 50ms between batches.
 * Resumable: responses cached in scripts/.cache/ so interrupted runs continue.
 *
 * Output:
 *   data/pokemon.json    - ~1,025 species with stats, types, gen, flags
 *   data/moves.json      - Competitive move table
 *   data/learnsets.json  - Per-Pokémon legal move lists
 *   data/abilities.json  - Ability data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(__dirname, '.cache');
const DATA_DIR = path.join(ROOT, 'data');

const BASE_URL = 'https://pokeapi.co/api/v2';
const CONCURRENCY = 10;
const DELAY_MS = 100;

// -------------------------------------------------------------------
// Helper: Cache-backed fetch (JSON only)
// -------------------------------------------------------------------
function cacheKey(url) {
  return url.replace(/[^a-z0-9]/gi, '_').slice(0, 200) + '.json';
}

async function cachedFetch(url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, cacheKey(url));
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Process array in batches with concurrency limit
async function processBatched(items, fn, concurrency = CONCURRENCY, delay = DELAY_MS) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) await sleep(delay);
    process.stdout.write(`\r  ${Math.min(i + concurrency, items.length)}/${items.length}`);
  }
  console.log('');
  return results;
}

// -------------------------------------------------------------------
// Generation mapping by Pokédex ID ranges
// -------------------------------------------------------------------
function getGenFromId(id) {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

// -------------------------------------------------------------------
// Determine if a Pokémon is fully evolved (no further evolutions)
// Uses cached species data — evolution chain check done post-fetch.
// Simple heuristic: marked as fully evolved if no "evolves_to" in chain.
// We store a set built from species data.
// -------------------------------------------------------------------
const NOT_FULLY_EVOLVED_IDS = new Set();

async function buildEvolutionData(speciesList) {
  console.log('  Building evolution chain data...');
  const chainUrls = new Set();
  for (const species of speciesList) {
    if (species.evolution_chain?.url) chainUrls.add(species.evolution_chain.url);
  }

  const urls = [...chainUrls];
  console.log(`  Fetching ${urls.length} evolution chains...`);

  await processBatched(urls, async (url) => {
    try {
      const data = await cachedFetch(url);
      function markNonFinal(node) {
        if (!node) return;
        if (node.evolves_to && node.evolves_to.length > 0) {
          // This species evolves further — not fully evolved
          const id = parseInt(node.species.url.split('/').filter(Boolean).pop());
          NOT_FULLY_EVOLVED_IDS.add(id);
          for (const next of node.evolves_to) markNonFinal(next);
        }
      }
      markNonFinal(data.chain);
    } catch (e) {
      // silent — some chains may not load
    }
  });
}

// -------------------------------------------------------------------
// Famous Mix: curated list of iconic Pokémon IDs
// Starters (final stage), mascots, legendaries, pseudo-legendaries,
// fan favourites. Used as the "Famous Mix" draft pool filter.
// -------------------------------------------------------------------
const FAMOUS_IDS = new Set([
  // Gen 1 starters + mascot
  3, 6, 9, 25,
  // Gen 1 iconic
  38, 52, 54, 59, 65, 68, 76, 94, 107, 113, 130, 131, 135, 136, 143, 144, 145, 146, 147, 149, 150, 151,
  // Gen 2 starters + legendary + pseudo
  154, 157, 160, 175, 196, 197, 212, 230, 242, 243, 244, 245, 248, 249, 250, 251,
  // Gen 3 starters + legendary + pseudo
  254, 257, 260, 282, 330, 350, 373, 376, 380, 381, 382, 383, 384, 385, 386,
  // Gen 4 starters + legendary + pseudo
  389, 392, 395, 445, 448, 461, 468, 472, 479, 483, 484, 485, 486, 487, 491, 492, 493,
  // Gen 5 starters + legendary + pseudo
  497, 500, 503, 530, 534, 571, 598, 609, 612, 635, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Gen 6 starters + legendary + pseudo
  652, 655, 658, 663, 681, 700, 701, 706, 715, 716, 717, 718, 719, 720, 721,
  // Gen 7 starters + legendary + pseudo
  724, 727, 730, 745, 748, 778, 784, 785, 786, 787, 788, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802,
  // Gen 8 starters + legendary + pseudo
  812, 815, 818, 823, 849, 858, 861, 884, 887, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898,
  // Gen 9 starters + legendary + pseudo + paradox
  908, 911, 914, 977, 979, 983, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017, 1020, 1021, 1022, 1023, 1024, 1025
]);

// -------------------------------------------------------------------
// Main: Build pokemon.json
// -------------------------------------------------------------------
async function buildPokemonData() {
  console.log('\n[1/4] Fetching Pokémon list...');
  const list = await cachedFetch(`${BASE_URL}/pokemon?limit=10000&offset=0`);

  // Filter to only national dex IDs 1-1025 (exclude forms/variants above 10000)
  const mainSeries = list.results
    .map(p => ({ name: p.name, id: parseInt(p.url.split('/').filter(Boolean).pop()) }))
    .filter(p => p.id >= 1 && p.id <= 1025);

  console.log(`  Found ${mainSeries.length} main-series Pokémon (IDs 1-1025)`);

  // Fetch species data (for legendary/mythical flags and evolution chains)
  console.log('\n  Fetching species data...');
  const speciesData = await processBatched(mainSeries, async ({ id }) => {
    try {
      return await cachedFetch(`${BASE_URL}/pokemon-species/${id}/`);
    } catch {
      return null;
    }
  });

  // Build evolution data (marks non-final evolutions)
  const validSpecies = speciesData.filter(Boolean);
  await buildEvolutionData(validSpecies);

  // Build species lookup
  const speciesById = new Map();
  for (const s of validSpecies) {
    const id = parseInt(s.id);
    speciesById.set(id, s);
  }

  // Fetch individual Pokémon data (stats, types)
  console.log('\n  Fetching Pokémon stat/type data...');
  const pokemonData = await processBatched(mainSeries, async ({ id, name }) => {
    try {
      return await cachedFetch(`${BASE_URL}/pokemon/${id}/`);
    } catch {
      console.warn(`\n  WARN: Failed to fetch pokemon/${id}`);
      return null;
    }
  });

  // Build final dataset
  const pokemon = [];
  for (let i = 0; i < mainSeries.length; i++) {
    const p = pokemonData[i];
    const sp = speciesById.get(mainSeries[i].id);
    if (!p || !sp) continue;

    const id = p.id;
    const gen = getGenFromId(id);

    const baseStats = {};
    for (const stat of p.stats) {
      const statName = stat.stat.name;
      const val = stat.base_stat;
      if (statName === 'hp') baseStats.hp = val;
      else if (statName === 'attack') baseStats.attack = val;
      else if (statName === 'defense') baseStats.defense = val;
      else if (statName === 'special-attack') baseStats.spAttack = val;
      else if (statName === 'special-defense') baseStats.spDefense = val;
      else if (statName === 'speed') baseStats.speed = val;
    }

    const types = p.types
      .sort((a, b) => a.slot - b.slot)
      .map(t => t.type.name);

    const isLegendary = sp.is_legendary === true;
    const isMythical = sp.is_mythical === true;
    const isFullyEvolved = !NOT_FULLY_EVOLVED_IDS.has(id);
    const famousMix = FAMOUS_IDS.has(id) || isLegendary || isMythical;

    // Clean display name: prefer species name over form name
    const displayName = sp.names?.find(n => n.language.name === 'en')?.name || p.name;

    pokemon.push({
      id,
      name: displayName,
      slug: p.name, // e.g. "pikachu", used for sprite URLs
      types,
      baseStats,
      gen,
      isFullyEvolved,
      isLegendary,
      isMythical,
      famousMix
    });
  }

  // Sort by ID
  pokemon.sort((a, b) => a.id - b.id);

  console.log(`\n  Built ${pokemon.length} Pokémon entries`);

  // Print gen breakdown
  const genCounts = {};
  for (const p of pokemon) genCounts[p.gen] = (genCounts[p.gen] || 0) + 1;
  console.log('  Gen breakdown:', genCounts);

  return pokemon;
}

// -------------------------------------------------------------------
// Build moves.json — competitive move table from PokéAPI
// We fetch the top competitive moves (damage moves from common types)
// -------------------------------------------------------------------
async function buildMovesData() {
  console.log('\n[2/4] Fetching moves list...');

  // Get all moves
  const moveList = await cachedFetch(`${BASE_URL}/move?limit=10000`);
  const allMoves = moveList.results.map(m => ({
    name: m.name,
    id: parseInt(m.url.split('/').filter(Boolean).pop())
  }));

  // We want competitive moves: damage moves (power > 0) from named categories
  // Limit to moves with IDs 1-900 (existing moves, not HOME-only)
  const mainMoves = allMoves.filter(m => m.id >= 1 && m.id <= 900);

  console.log(`  Fetching details for ${mainMoves.length} moves...`);
  const moveDetails = await processBatched(mainMoves, async ({ id }) => {
    try {
      return await cachedFetch(`${BASE_URL}/move/${id}/`);
    } catch {
      return null;
    }
  });

  const moves = [];
  for (const m of moveDetails) {
    if (!m) continue;
    if (!m.power || m.power < 40) continue; // Skip weak/status moves for now
    if (m.damage_class?.name === 'status') continue;

    const enName = m.names?.find(n => n.language.name === 'en')?.name || m.name;
    const enEffect = m.effect_entries?.find(e => e.language.name === 'en')?.short_effect || '';

    moves.push({
      id: m.id,
      name: enName,
      slug: m.name,
      type: m.type?.name || 'normal',
      category: m.damage_class?.name || 'physical', // physical/special
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp,
      priority: m.priority || 0,
      effect: enEffect.slice(0, 120)
    });
  }

  // Also add important status moves
  const statusMoveIds = [
    // Swords Dance, Nasty Plot, Calm Mind, Dragon Dance, etc.
    14, 50, 96, 97, 104, 143, 182, 219, 256, 347, 349,
    // Will-O-Wisp, Thunder Wave, Toxic
    83, 86, 92,
    // Recover, Roost, Soft-Boiled, Moonlight, Synthesis
    105, 355, 135, 236, 241,
    // Spore, Sleep Powder
    147, 79,
    // Stealth Rock, Spikes
    360, 191,
    // Protect
    182,
    // U-turn, Volt Switch
    369, 521,
    // Substitute
    164
  ];

  for (const id of statusMoveIds) {
    if (moves.find(m => m.id === id)) continue;
    try {
      const m = await cachedFetch(`${BASE_URL}/move/${id}/`);
      if (!m) continue;
      const enName = m.names?.find(n => n.language.name === 'en')?.name || m.name;
      const enEffect = m.effect_entries?.find(e => e.language.name === 'en')?.short_effect || '';
      moves.push({
        id: m.id,
        name: enName,
        slug: m.name,
        type: m.type?.name || 'normal',
        category: m.damage_class?.name || 'status',
        power: m.power || 0,
        accuracy: m.accuracy,
        pp: m.pp,
        priority: m.priority || 0,
        effect: enEffect.slice(0, 120)
      });
    } catch {
      // skip
    }
  }

  moves.sort((a, b) => a.id - b.id);
  console.log(`  Built ${moves.length} competitive moves`);
  return moves;
}

// -------------------------------------------------------------------
// Build learnsets.json — per-Pokémon legal move list (latest game)
// -------------------------------------------------------------------
async function buildLearnsets(pokemonSlugs) {
  console.log('\n[3/4] Building learnsets (latest game moves)...');
  console.log(`  Fetching learnsets for ${pokemonSlugs.length} Pokémon...`);

  const learnsets = {};
  await processBatched(pokemonSlugs, async ({ id, slug }) => {
    try {
      const data = await cachedFetch(`${BASE_URL}/pokemon/${id}/`);
      // Collect move IDs from the latest game version
      const moveIds = new Set();
      for (const m of data.moves) {
        // Only include moves learnable by level-up, TM, or egg in any version
        const learnableByLevelOrTM = m.version_group_details.some(v =>
          v.move_learn_method.name === 'level-up' ||
          v.move_learn_method.name === 'machine' ||
          v.move_learn_method.name === 'egg'
        );
        if (learnableByLevelOrTM) {
          const moveId = parseInt(m.move.url.split('/').filter(Boolean).pop());
          if (moveId <= 900) moveIds.add(moveId);
        }
      }
      learnsets[id] = [...moveIds];
    } catch {
      learnsets[id] = [];
    }
  });

  console.log(`  Built learnsets for ${Object.keys(learnsets).length} Pokémon`);
  return learnsets;
}

// -------------------------------------------------------------------
// Build abilities.json
// -------------------------------------------------------------------
async function buildAbilitiesData() {
  console.log('\n[4/4] Fetching abilities...');
  const abilityList = await cachedFetch(`${BASE_URL}/ability?limit=10000`);
  const mainAbilities = abilityList.results
    .map(a => ({ name: a.name, id: parseInt(a.url.split('/').filter(Boolean).pop()) }))
    .filter(a => a.id <= 300); // Main series abilities

  console.log(`  Fetching ${mainAbilities.length} ability details...`);
  const abilityDetails = await processBatched(mainAbilities, async ({ id }) => {
    try {
      return await cachedFetch(`${BASE_URL}/ability/${id}/`);
    } catch {
      return null;
    }
  });

  const abilities = [];
  for (const a of abilityDetails) {
    if (!a) continue;
    const enName = a.names?.find(n => n.language.name === 'en')?.name || a.name;
    const enEffect = a.effect_entries?.find(e => e.language.name === 'en')?.short_effect || '';
    abilities.push({
      id: a.id,
      name: enName,
      slug: a.name,
      effect: enEffect.slice(0, 200)
    });
  }

  abilities.sort((a, b) => a.id - b.id);
  console.log(`  Built ${abilities.length} abilities`);
  return abilities;
}

// -------------------------------------------------------------------
// Entry point
// -------------------------------------------------------------------
async function main() {
  console.log('=== DraftDex Phase 2: Build Data ===');
  console.log('Source: PokéAPI (cached in scripts/.cache/)');
  console.log('Output: data/');

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  try {
    // 1. Pokémon data
    const pokemon = await buildPokemonData();
    fs.writeFileSync(
      path.join(DATA_DIR, 'pokemon.json'),
      JSON.stringify(pokemon, null, 2)
    );
    console.log(`\n✓ data/pokemon.json written (${pokemon.length} entries)`);

    // 2. Moves
    const moves = await buildMovesData();
    fs.writeFileSync(
      path.join(DATA_DIR, 'moves.json'),
      JSON.stringify(moves, null, 2)
    );
    console.log(`✓ data/moves.json written (${moves.length} entries)`);

    // 3. Learnsets
    const pokemonSlugs = pokemon.map(p => ({ id: p.id, slug: p.slug }));
    const learnsets = await buildLearnsets(pokemonSlugs);
    fs.writeFileSync(
      path.join(DATA_DIR, 'learnsets.json'),
      JSON.stringify(learnsets, null, 2)
    );
    console.log(`✓ data/learnsets.json written`);

    // 4. Abilities
    const abilities = await buildAbilitiesData();
    fs.writeFileSync(
      path.join(DATA_DIR, 'abilities.json'),
      JSON.stringify(abilities, null, 2)
    );
    console.log(`✓ data/abilities.json written (${abilities.length} entries)`);

    console.log('\n=== Done! ===');
    console.log('Next: node scripts/build-images.mjs');

  } catch (err) {
    console.error('\n✗ Error:', err.message);
    process.exit(1);
  }
}

main();
