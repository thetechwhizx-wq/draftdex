/**
 * scripts/build-images.mjs
 * Phase 2: Download and resize Pokémon sprites from PokeAPI sprite repository.
 *
 * Run after build-data.mjs:
 *   node scripts/build-images.mjs
 *
 * Downloads into assets/sprites/:
 *   {id}.png  — official artwork (card art, ~256px)
 *   front/{id}.png — battle front sprite
 *   back/{id}.png  — battle back sprite
 *   icon/{id}.png  — small icon (56x56)
 *
 * Target: <25 MB total. Reports any missing images.
 * Resumable: skips already-downloaded files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ASSETS_DIR = path.join(ROOT, 'assets', 'sprites');

const CONCURRENCY = 25;
const DELAY_MS = 20;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function downloadFile(url, destPath) {
  // Skip if already downloaded
  if (fs.existsSync(destPath)) return { ok: true, skipped: true };

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, status: res.status };

    const buffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
    return { ok: true, skipped: false };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

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

async function main() {
  console.log('=== DraftDex Phase 2: Build Images ===');

  // Load pokemon data
  const pokemonPath = path.join(DATA_DIR, 'pokemon.json');
  if (!fs.existsSync(pokemonPath)) {
    console.error('✗ data/pokemon.json not found. Run build-data.mjs first.');
    process.exit(1);
  }
  const pokemon = JSON.parse(fs.readFileSync(pokemonPath, 'utf8'));
  console.log(`Loaded ${pokemon.length} Pokémon from data/pokemon.json`);

  // Create output directories
  const dirs = [
    ASSETS_DIR,
    path.join(ASSETS_DIR, 'artwork'),
    path.join(ASSETS_DIR, 'front'),
    path.join(ASSETS_DIR, 'back'),
    path.join(ASSETS_DIR, 'icon')
  ];
  for (const d of dirs) fs.mkdirSync(d, { recursive: true });

  const missing = { artwork: [], front: [], back: [], icon: [] };
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  // --- Official artwork (card art) ---
  console.log('\n[1/4] Downloading official artwork...');
  const artworkResults = await processBatched(pokemon, async (p) => {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;
    const dest = path.join(ASSETS_DIR, 'artwork', `${p.id}.png`);
    const result = await downloadFile(url, dest);
    if (result.skipped) skipped++;
    else if (result.ok) downloaded++;
    else {
      failed++;
      missing.artwork.push(p.id);
    }
    return result;
  });

  // --- Battle front sprites ---
  console.log('\n[2/4] Downloading battle front sprites...');
  downloaded = 0; skipped = 0; failed = 0;
  await processBatched(pokemon, async (p) => {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
    const dest = path.join(ASSETS_DIR, 'front', `${p.id}.png`);
    const result = await downloadFile(url, dest);
    if (result.skipped) skipped++;
    else if (result.ok) downloaded++;
    else {
      failed++;
      missing.front.push(p.id);
    }
    return result;
  });

  // --- Battle back sprites ---
  console.log('\n[3/4] Downloading battle back sprites...');
  downloaded = 0; skipped = 0; failed = 0;
  await processBatched(pokemon, async (p) => {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${p.id}.png`;
    const dest = path.join(ASSETS_DIR, 'back', `${p.id}.png`);
    let result = await downloadFile(url, dest);
    // Fallback: If back sprite doesn't exist (e.g. Gen 9), copy from front sprite
    if (!result.ok) {
      const frontPath = path.join(ASSETS_DIR, 'front', `${p.id}.png`);
      if (fs.existsSync(frontPath)) {
        fs.copyFileSync(frontPath, dest);
        result = { ok: true, skipped: false };
      }
    }
    if (result.skipped) skipped++;
    else if (result.ok) downloaded++;
    else {
      failed++;
      missing.back.push(p.id);
    }
    return result;
  });

  // --- Icons (small sprites from Gen 8 icon set) ---
  console.log('\n[4/4] Downloading icons...');
  downloaded = 0; skipped = 0; failed = 0;
  await processBatched(pokemon, async (p) => {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${p.id}.png`;
    const dest = path.join(ASSETS_DIR, 'icon', `${p.id}.png`);
    let result = await downloadFile(url, dest);

    // Fallback 1: try regular sprite icon path
    if (!result.ok) {
      const fallbackUrl = `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/regular/${p.slug}.png`;
      result = await downloadFile(fallbackUrl, dest);
    }

    // Fallback 2: front sprite
    if (!result.ok) {
      const frontPath = path.join(ASSETS_DIR, 'front', `${p.id}.png`);
      if (fs.existsSync(frontPath)) {
        fs.copyFileSync(frontPath, dest);
        result = { ok: true, skipped: false };
      }
    }

    if (result.skipped) skipped++;
    else if (result.ok) downloaded++;
    else {
      failed++;
      missing.icon.push(p.id);
    }
    return result;
  });

  // --- Summary ---
  console.log('\n=== Image Download Summary ===');

  const totalSize = getDirSizeMB(ASSETS_DIR);
  console.log(`Total assets size: ${totalSize.toFixed(1)} MB`);

  // Print missing
  for (const [category, ids] of Object.entries(missing)) {
    if (ids.length > 0) {
      console.log(`\nMissing ${category} sprites (${ids.length}): ${ids.slice(0, 20).join(', ')}${ids.length > 20 ? '...' : ''}`);
    }
  }

  // Write missing report
  const report = {
    generatedAt: new Date().toISOString(),
    totalPokemon: pokemon.length,
    assetsSizeMB: parseFloat(totalSize.toFixed(1)),
    missing
  };
  fs.writeFileSync(path.join(DATA_DIR, 'image-report.json'), JSON.stringify(report, null, 2));
  console.log('\n✓ Written data/image-report.json');

  const totalMissing = Object.values(missing).reduce((s, a) => s + a.length, 0);
  if (totalMissing > 0) {
    console.log(`\n⚠  ${totalMissing} missing sprites (see data/image-report.json)`);
  }

  console.log('\n=== Done! ===');
}

function getDirSizeMB(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else total += fs.statSync(full).size;
    }
  };
  walk(dir);
  return total / (1024 * 1024);
}

main().catch(err => {
  console.error('✗ Fatal:', err.message);
  process.exit(1);
});
