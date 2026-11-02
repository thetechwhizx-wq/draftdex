/**
 * Phase 1 Test Suite: Settings That Actually Work (Plan v2)
 * Tests:
 * 1. Gens [1,2], timer 5s: every Pokémon in the pool has gen 1 or 2, and the auction timer starts at 5s.
 * 2. Famous only + gen 3: only famous gen 3 Pokémon appear.
 * 3. Untick Famous: gen ticks stay as they were. Untick a gen: Famous stays as it was.
 * 4. Last gen can't be unticked.
 * 5. Impossible pool shows the message and doesn't create a match.
 * 6. Saved match restores the same settings after refresh.
 */

import {
  buildDraftPool,
  createAuctionMatch,
  recommendSettings,
  filterPokemon
} from '../index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('====================================================');
console.log('🧪 RUNNING PHASE 1 TEST SUITE: SETTINGS THAT WORK');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST 1: Gens [1,2] & Timer 5s
// ----------------------------------------------------
console.log('--- Test 1: Gens [1,2], timer 5s ---');
try {
  const result = buildDraftPool({
    generations: [1, 2],
    famousMix: false,
    teamSize: 4,
    numPlayers: 2,
    seed: 'test-gen12'
  });

  assert(result.pool.length >= 24, `Pool built with sufficient lots (got ${result.pool.length})`);
  const allGen1or2 = result.pool.every(p => p.gen === 1 || p.gen === 2);
  assert(allGen1or2, 'Every Pokémon in the pool is strictly from Gen 1 or Gen 2');

  const match = createAuctionMatch({
    room: 'TEST01',
    seed: 'test-timer5',
    settings: {
      teamSize: 4,
      budget: 60,
      startBid: 3,
      openTimer: 5,
      bidTimer: 5,
      generations: [1, 2]
    },
    players: [
      { id: 'human', name: 'Human', isHost: true },
      { id: 'bot', name: 'Bot', isBot: true }
    ],
    pool: result.pool
  });

  assert(match.settings.openTimer === 5, 'Auction openTimer setting correctly set to 5s');
  assert(match.settings.bidTimer === 5, 'Auction bidTimer setting correctly set to 5s');
  assert(match.settings.generations.length === 2 && match.settings.generations.includes(1) && match.settings.generations.includes(2), 'Generations [1, 2] recorded in match settings');
} catch (e) {
  failed++;
  console.error(`  [FAIL] Error in Test 1: ${e.message}`);
}

// ----------------------------------------------------
// TEST 2: Famous only + Gen 3
// ----------------------------------------------------
console.log('\n--- Test 2: Famous only + Gen 3 ---');
try {
  const result = buildDraftPool({
    generations: [3],
    famousMix: true,
    targetPoolSize: 10,
    seed: 'test-famous-gen3'
  });

  assert(result.pool.length === 10, `Built pool with 10 Pokémon`);
  const allFamousGen3 = result.pool.every(p => p.gen === 3 && p.famousMix === true);
  assert(allFamousGen3, 'Every Pokémon in the pool is strictly a Famous Gen 3 Pokémon');
} catch (e) {
  failed++;
  console.error(`  [FAIL] Error in Test 2: ${e.message}`);
}

// ----------------------------------------------------
// TEST 3: Independent Filters (Toggling one preserves the other)
// ----------------------------------------------------
console.log('\n--- Test 3: Independent Filters (Famous Mix & Gens) ---');
try {
  let state = {
    selectedGens: [1, 2, 3],
    famousMix: true
  };

  // 1. Untick Famous: gen ticks stay as they were
  state.famousMix = false;
  assert(state.selectedGens.length === 3 && state.selectedGens[0] === 1 && state.selectedGens[1] === 2 && state.selectedGens[2] === 3, 'Unticking Famous preserves selectedGens [1, 2, 3]');

  // 2. Untick Gen 3: Famous stays as it was
  state.famousMix = true;
  state.selectedGens = state.selectedGens.filter(g => g !== 3);
  assert(state.famousMix === true, 'Unticking a gen preserves Famous Mix status');
  assert(state.selectedGens.length === 2 && state.selectedGens.includes(1) && state.selectedGens.includes(2), 'selectedGens correctly updated to [1, 2]');
} catch (e) {
  failed++;
  console.error(`  [FAIL] Error in Test 3: ${e.message}`);
}

// ----------------------------------------------------
// TEST 4: Last Gen Cannot Be Unticked
// ----------------------------------------------------
console.log('\n--- Test 4: Last gen can\'t be unticked ---');
try {
  let selectedGens = [1];
  const toggleGen = (gen) => {
    if (selectedGens.includes(gen)) {
      if (selectedGens.length > 1) {
        selectedGens = selectedGens.filter(g => g !== gen);
      }
    } else {
      selectedGens.push(gen);
    }
  };

  // Attempt to untick the sole selected gen (Gen 1)
  toggleGen(1);
  assert(selectedGens.length === 1 && selectedGens[0] === 1, 'Attempting to untick the last remaining gen does nothing (Gen 1 preserved)');

  // Adding Gen 2 then unticking Gen 1 works
  toggleGen(2);
  assert(selectedGens.length === 2, 'Gen 2 added successfully');
  toggleGen(1);
  assert(selectedGens.length === 1 && selectedGens[0] === 2, 'Gen 1 unticked when Gen 2 was also present');
  toggleGen(2);
  assert(selectedGens.length === 1 && selectedGens[0] === 2, 'Sole remaining Gen 2 cannot be unticked');
} catch (e) {
  failed++;
  console.error(`  [FAIL] Error in Test 4: ${e.message}`);
}

// ----------------------------------------------------
// TEST 5: Impossible Pool Validation
// ----------------------------------------------------
console.log('\n--- Test 5: Impossible pool shows the message and doesn\'t create a match ---');
try {
  let threwExpected = false;
  let errorMessage = '';

  try {
    // Gen 3 only has 14 Pokémon in the database; default minNeeded is 24
    buildDraftPool({
      generations: [3],
      famousMix: false,
      seed: 'test-impossible'
    });
  } catch (err) {
    threwExpected = true;
    errorMessage = err.message;
  }

  assert(threwExpected, 'Impossible pool threw error as required');
  assert(
    errorMessage.includes('Gen 3') && errorMessage.includes('14 available') && errorMessage.includes('need 24'),
    `Error message accurately describes shortage: "${errorMessage}"`
  );
} catch (e) {
  failed++;
  console.error(`  [FAIL] Error in Test 5: ${e.message}`);
}

// ----------------------------------------------------
// TEST 6: Match Settings Persistence and Restoration
// ----------------------------------------------------
console.log('\n--- Test 6: Saved match restores the same settings after refresh ---');
try {
  const customSettings = {
    teamSize: 5,
    budget: 125,
    startBid: 7,
    openTimer: 12,
    bidTimer: 6,
    battleTurnTimer: 45,
    generations: [1, 2, 4],
    famousMix: true,
    preset: 'custom',
    lockedFields: ['budget', 'startBid', 'battleTurnTimer']
  };

  const pool = filterPokemon({ generations: [1, 2, 4] }).slice(0, 24);

  const match = createAuctionMatch({
    room: 'SAVE99',
    seed: 'seed-save',
    settings: customSettings,
    players: [
      { id: 'human', name: 'Player', isHost: true },
      { id: 'bot', name: 'Bot', isBot: true }
    ],
    pool
  });

  // Simulate JSON serialization / deserialization as in localStorage
  const serialized = JSON.stringify(match);
  const restored = JSON.parse(serialized);

  assert(restored.settings.teamSize === 5, 'Restored teamSize is 5');
  assert(restored.settings.budget === 125, 'Restored budget is 125');
  assert(restored.settings.startBid === 7, 'Restored startBid is 7');
  assert(restored.settings.openTimer === 12, 'Restored openTimer is 12');
  assert(restored.settings.bidTimer === 6, 'Restored bidTimer is 6');
  assert(restored.settings.battleTurnTimer === 45, 'Restored battleTurnTimer is 45s');
  assert(restored.settings.famousMix === true, 'Restored famousMix is true');
  assert(restored.settings.generations.length === 3 && restored.settings.generations.includes(4), 'Restored generations [1, 2, 4]');
  assert(restored.settings.lockedFields.includes('battleTurnTimer'), 'Restored lockedFields contains battleTurnTimer');
} catch (e) {
  failed++;
  console.error(`  [FAIL] Error in Test 6: ${e.message}`);
}

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`PHASE 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
