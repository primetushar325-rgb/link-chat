// Static file server for the exported web build + reverse proxy for the LINK
// backend API (/api -> 127.0.0.1:4000) and WebSocket (/ws -> 127.0.0.1:4001).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 8090);
const API_TARGET = { host: '127.0.0.1', port: 4000 };
const WS_TARGET = { host: '127.0.0.1', port: 4001 };

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.map': 'application/json', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

function send(res, code, body, type, headers = {}) {
  res.writeHead(code, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // ---- API reverse proxy ----
  if (url.pathname.startsWith('/api') || url.pathname === '/health') {
    const proxyReq = http.request({
      host: API_TARGET.host, port: API_TARGET.port,
      method: req.method, path: url.pathname + url.search, headers: { ...req.headers, host: `${API_TARGET.host}:${API_TARGET.port}` },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => send(res, 502, JSON.stringify({ success: false, error: { code: 'UPSTREAM', message: 'Backend unavailable' } }), 'application/json'));
    req.pipe(proxyReq);
    return;
  }

  // ---- Static files ----
  let filePath = path.join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!filePath.startsWith(DIST)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    // SPA fallback
    fs.readFile(path.join(DIST, 'index.html'), (e2, data) => {
      if (e2) return send(res, 404, 'Not found', 'text/plain');
      send(res, 200, data, 'text/html');
    });
  });
});

// ---- WebSocket upgrade proxy (raw TCP forward) ----
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/ws')) { socket.destroy(); return; }
  const upstream = net.connect(WS_TARGET.port, WS_TARGET.host, () => {
    // Rebuild an upgrade request line/headers for the upstream
    const lines = [`${req.method} ${url.pathname + url.search} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    upstream.write(lines.join('\r\n') + '\r\n\r\n');
    if (head && head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

import net from 'node:net';
server.listen(PORT, '0.0.0.0', () => console.log(`[web] serving ${DIST} on :${PORT}, proxying /api -> :4000 and /ws -> :4001`));
