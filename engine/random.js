/**
 * Deterministic Seeded Pseudo-Random Number Generator (Mulberry32)
 * Pure game logic - zero UI / DOM / networking imports.
 */

export function createRNG(seedInput) {
  let seed = 0;
  if (typeof seedInput === 'string') {
    for (let i = 0; i < seedInput.length; i++) {
      seed = ((seed << 5) - seed) + seedInput.charCodeAt(i);
      seed |= 0;
    }
  } else if (typeof seedInput === 'number') {
    seed = seedInput | 0;
  } else {
    seed = 123456789;
  }

  return function next() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffle an array in-place or returning a new array using an RNG.
 * @template T
 * @param {T[]} array
 * @param {() => number} rng
 * @returns {T[]}
 */
export function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
