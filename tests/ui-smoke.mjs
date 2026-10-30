/**
 * DraftDex Playwright UI Smoke Test
 * Tests full bot match flow across all screens:
 * Home -> Setup -> Lobby -> Auction -> Set Break -> Scout -> Squad -> Countdown -> Battle -> Result
 *
 * Verifies:
 * - Plays at 390px and 1280px wide
 * - Captures screenshots of every screen at 390px, 768px, and 1280px in tests/screens/
 * - Fails if any uncaught JS exception, unhandled rejection, or pageerror occurs
 * - Analyzes scrolling behavior on each screen and width to reproduce scrolling bugs
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENS_DIR = path.join(ROOT_DIR, 'tests', 'screens');

if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
}

// MIME types for static server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function startServer(port = 0) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      const filePath = path.join(ROOT_DIR, urlPath);

      if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      try {
        const stats = await fs.promises.stat(filePath);
        const actualFile = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
        const ext = path.extname(actualFile).toLowerCase();
        const content = await fs.promises.readFile(actualFile);
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      } catch (err) {
        if (err.code === 'ENOENT') {
          try {
            const fallback = await fs.promises.readFile(path.join(ROOT_DIR, 'index.html'));
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fallback);
          } catch {
            res.writeHead(404);
            res.end('Not Found');
          }
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
      }
    });

    server.listen(port, '127.0.0.1', () => {
      const assignedPort = server.address().port;
      resolve({ server, port: assignedPort, url: `http://127.0.0.1:${assignedPort}` });
    });
    server.on('error', reject);
  });
}

async function launchBrowser() {
  for (const channel of ['chrome', 'msedge']) {
    try {
      const browser = await chromium.launch({ channel, headless: true });
      return browser;
    } catch (_) {}
  }
  return await chromium.launch({ headless: true });
}

export async function runSmokeTest({ exitOnFinish = true } = {}) {
  console.log('\n====================================================');
  console.log('🧪 RUNNING PLAYWRIGHT UI SMOKE TEST (PHASE 0)');
  console.log('====================================================\n');

  const { server, url } = await startServer();
  console.log(`[Server] Local test server listening at ${url}`);

  const browser = await launchBrowser();
  console.log(`[Browser] Chromium launched successfully`);

  const pageErrors = [];
  const scrollFindings = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Catch any page errors
    page.on('pageerror', err => {
      console.error('[Page Error]', err);
      pageErrors.push(err);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('404')) {
          console.error('[Console Error]', text);
          pageErrors.push(new Error(text));
        }
      }
    });

    async function checkErrorToast() {
      const toast = await page.$('#global-error-toast');
      if (toast) {
        const isVisible = await toast.evaluate(el => el.style.display !== 'none');
        if (isVisible) {
          const msg = await toast.innerText();
          throw new Error(`Global error toast appeared on screen:\n${msg}`);
        }
      }
    }

    async function analyzeAndCaptureScreen(screenName) {
      await page.waitForTimeout(400); // Settle animations/DOM
      await checkErrorToast();

      const widths = [390, 768, 1280];
      for (const w of widths) {
        const h = w === 390 ? 844 : (w === 768 ? 1024 : 800);
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(250);

        // Analyze scrolling mechanics on this screen at this width
        const metrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const root = document.getElementById('app-root');

          const docHeight = docEl.scrollHeight;
          const winHeight = window.innerHeight;
          const isTallerThanViewport = docHeight > winHeight + 10;

          // Attempt scrolling
          const initialY = window.scrollY;
          window.scrollBy(0, 150);
          const scrolledY = window.scrollY;
          const canProgrammaticScroll = scrolledY > initialY;
          window.scrollTo(0, 0);

          // Check overflow styles on containers
          const rootStyle = root ? window.getComputedStyle(root) : null;
          const bodyStyle = window.getComputedStyle(body);
          const docStyle = window.getComputedStyle(docEl);

          return {
            docHeight,
            winHeight,
            isTallerThanViewport,
            canProgrammaticScroll,
            bodyOverflowY: bodyStyle.overflowY,
            docOverflowY: docStyle.overflowY,
            rootOverflowY: rootStyle ? rootStyle.overflowY : 'none',
            overscrollBehavior: bodyStyle.overscrollBehaviorY
          };
        });

        // Test wheel scroll with Playwright mouse
        const startY = await page.evaluate(() => window.scrollY);
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(100);
        const wheelY = await page.evaluate(() => window.scrollY);
        const canWheelScroll = wheelY > startY;
        await page.evaluate(() => window.scrollTo(0, 0));

        // Test keyboard scroll (PageDown)
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(100);
        const keyY = await page.evaluate(() => window.scrollY);
        const canKeyScroll = keyY > startY;
        await page.evaluate(() => window.scrollTo(0, 0));

        scrollFindings.push({
          screen: screenName,
          width: w,
          isTaller: metrics.isTallerThanViewport,
          canScroll: metrics.canProgrammaticScroll || canWheelScroll || canKeyScroll,
          docHeight: metrics.docHeight,
          winHeight: metrics.winHeight,
          overscroll: metrics.overscrollBehavior
        });

        // Capture screenshot
        const screenshotPath = path.join(SCREENS_DIR, `${screenName}-${w}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  [Screenshot] Saved ${screenName}-${w}.png`);
      }
    }

    // ==========================================
    // 1. SCREEN: HOME
    // ==========================================
    console.log('\n--- 1. Testing Home Screen ---');
    await page.goto(`${url}/#/home`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-new-match', { state: 'visible' });
    await analyzeAndCaptureScreen('home');

    // ==========================================
    // 2. SCREEN: SETUP
    // ==========================================
    console.log('\n--- 2. Testing Setup Screen ---');
    await page.click('#btn-new-match');
    await page.waitForSelector('#btn-create-match', { state: 'visible' });
    await analyzeAndCaptureScreen('setup');

    // Select Quick Preset for fast automated smoke test
    const cardQuick = await page.$('#card-quick');
    if (cardQuick) {
      await cardQuick.click();
      await page.waitForTimeout(200);
    }

    // ==========================================
    // 3. SCREEN: LOBBY
    // ==========================================
    console.log('\n--- 3. Testing Lobby Screen ---');
    await page.click('#btn-create-match');
    await page.waitForSelector('#btn-start-auction', { state: 'visible' });
    await analyzeAndCaptureScreen('lobby');

    // ==========================================
    // 4. SCREEN: AUCTION
    // ==========================================
    console.log('\n--- 4. Testing Auction Screen ---');
    await page.click('#btn-start-auction');
    await page.waitForSelector('#btn-pass', { state: 'visible' });
    await analyzeAndCaptureScreen('auction');

    // Play through auction until set break or scout report
    console.log('\n--- Playing Through Auction Lots ---');
    let auctionLoopCount = 0;
    let reachedBreak = false;
    let reachedScout = false;

    while (auctionLoopCount < 350) {
      auctionLoopCount++;
      await page.waitForTimeout(300);
      await checkErrorToast();

      const currentHash = await page.evaluate(() => window.location.hash);

      if (currentHash.includes('break')) {
        if (!reachedBreak) {
          reachedBreak = true;
          console.log('\n--- 5. Testing Set Break Screen ---');
          await page.waitForSelector('#btn-continue-next-set', { state: 'visible' });
          await analyzeAndCaptureScreen('break');
        }
        console.log(`  [Break] Continuing past set break (iteration ${auctionLoopCount})`);
        await page.click('#btn-continue-next-set');
        await page.waitForTimeout(400);
        continue;
      }

      if (currentHash.includes('scout')) {
        reachedScout = true;
        console.log(`  [Auction] Reached Scout Report on iteration ${auctionLoopCount}!`);
        break;
      }

      if (auctionLoopCount % 10 === 0) {
        const lotInfo = await page.evaluate(() => {
          const app = window.draftDexApp;
          const lot = app?.matchState?.currentLot;
          const user = app?.matchState?.players?.find(p => p.id === 'human');
          return {
            set: (app?.matchState?.currentSetIndex || 0) + 1,
            lotIndex: (app?.matchState?.currentLotIndex || 0) + 1,
            userSquad: user?.team?.length || 0,
            targetSquad: app?.matchState?.settings?.teamSize || 4,
            leader: lot?.leaderId || 'none'
          };
        });
        console.log(`  [Auction Progress] Set ${lotInfo.set}, Lot ${lotInfo.lotIndex} | User: ${lotInfo.userSquad}/${lotInfo.targetSquad} PKMN | Leader: ${lotInfo.leader}`);
      }

      // We are in auction: prioritize bidding until squad is full, then pass
      const isUserFull = await page.evaluate(() => {
        const app = window.draftDexApp;
        const user = app?.matchState?.players?.find(p => p.id === 'human');
        const cap = app?.matchState?.settings?.teamSize || 4;
        return (user?.team?.length || 0) >= cap;
      });

      if (isUserFull) {
        const btnPass = await page.$('#btn-pass:not([disabled])');
        if (btnPass) await btnPass.click();
      } else {
        const btnBid = await page.$('#btn-bid-1:not([disabled])');
        if (btnBid) {
          await btnBid.click();
        } else {
          const btnPass = await page.$('#btn-pass:not([disabled])');
          if (btnPass) await btnPass.click();
        }
      }
    }

    if (!reachedScout) {
      throw new Error(`Auction did not reach scout screen after ${auctionLoopCount} iterations`);
    }

    // ==========================================
    // 6. SCREEN: SCOUT REPORT
    // ==========================================
    console.log('\n--- 6. Testing Scout Report Screen ---');
    await page.waitForSelector('#btn-scout-proceed', { state: 'visible' });
    await analyzeAndCaptureScreen('scout');

    // ==========================================
    // 7. SCREEN: SQUAD SELECT
    // ==========================================
    console.log('\n--- 7. Testing Squad Select Screen ---');
    await page.click('#btn-scout-proceed');
    await page.waitForSelector('#btn-lock-team', { state: 'visible' });
    await analyzeAndCaptureScreen('squad');

    // ==========================================
    // 8. SCREEN: COUNTDOWN
    // ==========================================
    console.log('\n--- 8. Testing Countdown Screen ---');
    await page.click('#btn-lock-team');
    await page.waitForSelector('#countdown-display, main', { state: 'visible' });
    await analyzeAndCaptureScreen('countdown');

    // ==========================================
    // 9. SCREEN: BATTLE ARENA
    // ==========================================
    console.log('\n--- 9. Testing Battle Arena Screen ---');
    // Wait for countdown to finish and transition to battle
    await page.waitForFunction(() => window.location.hash.includes('battle'), { timeout: 10000 });
    await page.waitForSelector('.move-card, #btn-lock-action', { state: 'visible' });
    await analyzeAndCaptureScreen('battle');

    // Play turns until battle completes
    console.log('\n--- Playing Battle Turns ---');
    let battleIteration = 0;
    while (battleIteration < 250) {
      battleIteration++;
      await page.waitForTimeout(400);
      await checkErrorToast();

      const isBattleOver = await page.$('#btn-view-result');
      if (isBattleOver) {
        console.log(`[Battle] Battle ended on iteration ${battleIteration}!`);
        await isBattleOver.click();
        break;
      }

      if (battleIteration % 10 === 0) {
        const battleInfo = await page.evaluate(() => {
          const b = window.draftDexApp?.matchState?.battle;
          if (!b) return 'no battle';
          const pA = b.sideA.party.filter(p => !p.isFainted).length;
          const pB = b.sideB.party.filter(p => !p.isFainted).length;
          return `Turn ${b.turn} | Survivors: Side A ${pA} vs Side B ${pB} | Status: ${b.status}`;
        });
        console.log(`  [Battle Progress] ${battleInfo}`);
      }

      // Check if forced switch is needed
      const lockBadgeText = await page.evaluate(() => {
        const badge = document.querySelector('#move-lock-text');
        return badge ? badge.textContent : '';
      });

      if (lockBadgeText.includes('Choose Replacement') || lockBadgeText.includes('Replacement') || lockBadgeText.includes('Confirm Switch')) {
        // Bench switch
        const availableBench = await page.$('.bench-card:not([disabled])');
        if (availableBench) {
          await availableBench.click();
          await page.waitForTimeout(200);
          const btnLock = await page.$('#btn-lock-action:not([disabled])');
          if (btnLock) await btnLock.click();
        }
      } else {
        // Normal move
        const availableMove = await page.$('.move-card:not([disabled])');
        if (availableMove) {
          await availableMove.click();
          await page.waitForTimeout(150);
          const btnLock = await page.$('#btn-lock-action:not([disabled])');
          if (btnLock) await btnLock.click();
        }
      }
    }

    // ==========================================
    // 10. SCREEN: RESULT
    // ==========================================
    console.log('\n--- 10. Testing Match Result Screen ---');
    await page.waitForFunction(() => window.location.hash.includes('result'), { timeout: 8000 });
    await page.waitForSelector('#btn-rematch', { state: 'visible' });
    await analyzeAndCaptureScreen('result');

    // Check if any page errors occurred during the entire match
    if (pageErrors.length > 0) {
      throw new Error(`Encountered ${pageErrors.length} unhandled JS error(s):\n${pageErrors.map(e => e.message || e).join('\n')}`);
    }

    console.log('\n====================================================');
    console.log('✅ UI SMOKE TEST PASSED: ALL 10 SCREENS VERIFIED');
    console.log('====================================================\n');

    return { success: true, scrollFindings };

  } finally {
    await browser.close();
    server.close();
  }
}

// Self-invoking when run directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSmokeTest()
    .then(({ scrollFindings }) => {
      console.log('\n--- Scroll Reproduction Summary ---');
      const cantScroll = scrollFindings.filter(f => f.isTaller && !f.canScroll);
      console.log(`Screens evaluated: ${scrollFindings.length}`);
      console.log(`Instances where content overflows viewport but CANNOT scroll: ${cantScroll.length}`);
      for (const item of cantScroll) {
        console.log(`  [CANNOT SCROLL] Screen: ${item.screen} | Width: ${item.width}px | Content: ${item.docHeight}px vs Viewport: ${item.winHeight}px`);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ UI SMOKE TEST FAILED:\n', err);
      process.exit(1);
    });
}
