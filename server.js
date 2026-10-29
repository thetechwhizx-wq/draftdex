/**
 * DraftDex Dev Server
 * Serves static files on 0.0.0.0:3000 so you can test from mobile
 * on the same Wi-Fi network using your PC's local IP address.
 *
 * Usage:  node server.js
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
};

function getLocalIPs() {
  const nets = networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ iface: name, address: net.address });
      }
    }
  }
  return results;
}

const server = createServer(async (req, res) => {
  let url = req.url.split('?')[0];

  // Default to index.html
  if (url === '/' || url === '') url = '/index.html';

  // Prevent directory traversal
  const filePath = join(__dirname, url);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      // Try index.html in the directory
      const indexPath = join(filePath, 'index.html');
      const content = await readFile(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(content);
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await readFile(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // SPA fallback: serve index.html for non-file routes
      try {
        const fallback = await readFile(join(__dirname, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(fallback);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n🎮 DraftDex Dev Server running!\n`);
  console.log(`  Local:   http://localhost:${PORT}`);

  const ips = getLocalIPs();
  if (ips.length > 0) {
    console.log(`\n  📱 On your phone (same Wi-Fi), open:`);
    for (const { iface, address } of ips) {
      console.log(`    http://${address}:${PORT}  (${iface})`);
    }
  }

  console.log(`\n  Press Ctrl+C to stop.\n`);
});
