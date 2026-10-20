// dev-server.js — a tiny local server for building and testing.
// Serves the files in public/ and runs api/agent.js the way Vercel does.
// Run: node dev-server.js   then open http://localhost:3000
// Without ANTHROPIC_API_KEY set, the helper runs in clearly labelled practice mode.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import handler from './api/agent.js';

const PORT = process.env.PORT || 3000;
const ROOT = join(process.cwd(), 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function vercelRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/agent') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    return handler(req, vercelRes(res));
  }
  const path = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  try {
    const data = await readFile(file);
    res.setHeader('content-type', TYPES[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, () => console.log(`Fine Print running at http://localhost:${PORT}`));
