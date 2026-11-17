// Dev-only static server for aero-tools (no-store, correct MIME for the PWA shell).
// Not part of the shipped app; safe to delete. Run: node serve.js
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8735;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png',
  '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain'
};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.resolve(ROOT, '.' + p);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('serving', ROOT, 'on http://localhost:' + PORT));
