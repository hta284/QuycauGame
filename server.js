// Ignore broken pipe on process.stdin in Windows background daemon
if (process.stdin) {
  process.stdin.on('error', () => {});
  try {
    process.stdin.pause();
  } catch (e) {}
}

process.on('uncaughtException', (err) => {
  if (err && (err.code === 'UNKNOWN' || err.code === 'ECONNRESET') && err.syscall === 'read') {
    return; // Suppress broken stdin pipe error in background Windows runner
  }
  console.error('Server error:', err);
});

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const requestHandler = (req, res) => {
  // Normalize URL
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Fallback to public if not in dist
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', reqPath);
  }

  // Fallback to index.html (SPA)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
};

// Bind IPv4
const serverV4 = http.createServer(requestHandler);
serverV4.listen(PORT, '0.0.0.0', () => {
  console.log(`Game ready at http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/`);
});

// Bind IPv6 for Windows localhost resolution
const serverV6 = http.createServer(requestHandler);
serverV6.on('error', () => {}); // Ignore if IPv6 is already bound or not supported
serverV6.listen(PORT, '::1', () => {
  console.log(`IPv6 loopback bound on [::1]:${PORT}`);
});
