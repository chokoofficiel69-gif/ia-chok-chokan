// IA Chok Chokan — serveur statique facultatif (l'appli tourne entièrement dans le navigateur).
// En ligne gratuitement via GitHub Pages (dossier docs/). Pour tester en local : node server.js
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000, ROOT = path.join(__dirname, 'docs');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  const file = path.join(ROOT, p === '/' ? 'index.html' : path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('introuvable'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`IA Chok Chokan sur :${PORT}`));
