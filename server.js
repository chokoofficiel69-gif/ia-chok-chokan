// IA Chok Chokan — V1 : du son au scénario de clip.
// Aucune dépendance : Node 20+ (fetch, FormData, Blob intégrés).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API = (process.env.FREELLMAPI_URL || 'https://freellmapi.prixbasmalin.prod.page/v1').replace(/\/$/, '');
const SERVER_KEY = process.env.FREELLMAPI_KEY || '';
const STT_MODEL = process.env.STT_MODEL || 'whisper-large-v3';
const CHAT_MODEL = process.env.CHAT_MODEL || 'auto';
const MAX_AUDIO = 25 * 1024 * 1024;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function keyFrom(req) {
  const k = req.headers['x-api-key'] || SERVER_KEY;
  if (!k) throw Object.assign(new Error('Clé FreeLLMAPI manquante : colle ta clé unifiée dans Réglages.'), { status: 400 });
  return k;
}

// FreeLLMAPI s'endort après un moment : on réessaie si la réponse n'est pas du JSON.
async function callApi(pathname, init, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(API + pathname, init);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      if (data && res.ok) return data;
      if (data && res.status < 500 && res.status !== 429) {
        const msg = data.error?.message || data.error || text.slice(0, 300);
        throw Object.assign(new Error(String(msg)), { status: res.status, final: true });
      }
      last = new Error(`FreeLLMAPI indisponible (${res.status})`);
    } catch (e) {
      if (e.final) throw e;
      last = e;
    }
    await sleep(4000 * (i + 1));
  }
  throw last;
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('Fichier trop gros (25 Mo max).'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function transcribe(req) {
  const key = keyFrom(req);
  const buf = await readBody(req, MAX_AUDIO);
  if (!buf.length) throw Object.assign(new Error('Aucun son reçu.'), { status: 400 });
  const name = decodeURIComponent(req.headers['x-filename'] || 'musique.mp3');
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: req.headers['content-type'] || 'audio/mpeg' }), name);
  fd.append('model', STT_MODEL);
  fd.append('response_format', 'verbose_json');
  fd.append('temperature', '0');
  const lang = String(req.headers['x-language'] || 'fr').slice(0, 5);
  if (lang !== 'auto') fd.append('language', lang);
  // Les paroles de l'artiste guident Whisper vers les bons mots (limite ~200 mots).
  const hint = decodeURIComponent(req.headers['x-lyrics-hint'] || '').split(/\s+/).slice(0, 200).join(' ');
  if (hint) fd.append('prompt', hint);
  const data = await callApi('/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: fd });
  const segments = (data.segments || []).map((s) => ({ start: +(+s.start).toFixed(1), end: +(+s.end).toFixed(1), text: String(s.text || '').trim() }));
  return { text: data.text || segments.map((s) => s.text).join(' '), language: data.language, duration: data.duration, segments };
}

const STYLES = {
  realiste: 'photoréaliste, rendu cinéma 35 mm, lumière naturelle, grain léger, comme une vraie vidéo filmée',
  anime: 'dessin animé style anime japonais, couleurs vives, traits nets',
  cartoon3d: 'dessin animé 3D style film d\'animation, personnages expressifs',
  bd: 'style bande dessinée / comics, encrage marqué, aplats de couleurs',
};

async function plan(req) {
  const key = keyFrom(req);
  const body = JSON.parse((await readBody(req, 2 * 1024 * 1024)).toString('utf8') || '{}');
  const { transcript = {}, idea = '', style = 'realiste', artist = 'le rappeur', look = '', lyrics = '' } = body;
  const segs = (transcript.segments || []).map((s) => `[${s.start}s → ${s.end}s] ${s.text}`).join('\n');
  const words = lyrics.trim()
    ? `PAROLES OFFICIELLES écrites par l'artiste (elles font foi, mot pour mot) :\n${lyrics}\n\nIMPORTANT : la transcription horodatée ci-dessus sert UNIQUEMENT à savoir à quel moment chaque phrase est rappée. Dans le champ "paroles", recopie les PAROLES OFFICIELLES exactes, jamais la transcription automatique. Ne change, n'invente et ne corrige aucun mot.`
    : `IMPORTANT : dans le champ "paroles", recopie la transcription mot pour mot, sans rien changer ni corriger.`;
  const sys = `Tu es réalisateur de clips de rap. Tu découpes une chanson en plans, calés sur les paroles et le rythme. Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.`;
  const user = `Artiste : ${artist}.
Apparence de l'artiste (pour garder le même visage dans tout le clip) : ${look || 'à déduire des photos de référence fournies séparément'}.
Style visuel imposé : ${STYLES[style] || style}.
Idées de l'artiste pour le clip : ${idea || 'libre, colle au sens des paroles'}.
Durée du son : ${transcript.duration ? Math.round(transcript.duration) + ' s' : 'inconnue'}.
Transcription horodatée :
${segs || transcript.text || '(pas de transcription)'}
${words}

Crée le scénario complet du clip. Règles :
- un plan toutes les 3 à 8 secondes, qui couvre toute la chanson sans trou ;
- chaque plan illustre ce que disent les paroles à ce moment (s'il dit "moto", on le voit sur une moto ; "bateau" → sur un bateau) ;
- alterne plans "performance" (l'artiste rappe face caméra, lèvres synchronisées) et plans "histoire" (scènes, décors) ;
- les prompts image et vidéo sont en ANGLAIS, très détaillés, et répètent toujours la description physique de l'artiste et le style imposé ;
- les champs en français restent courts.

Format JSON exact :
{"titre":"...","resume":"une phrase en français","personnage":"description physique précise en anglais, réutilisée partout",
"plans":[{"n":1,"debut":0,"fin":5,"paroles":"...","type":"performance|histoire","scene_fr":"ce qu'on voit, en français","camera":"type de plan et mouvement","image_prompt":"...","video_prompt":"..."}]}`;
  const data = await callApi('/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, temperature: 0.7, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] }),
  });
  const content = data.choices?.[0]?.message?.content || '';
  const json = extractJson(content);
  if (!json || !Array.isArray(json.plans)) throw Object.assign(new Error("L'IA n'a pas rendu un scénario lisible, réessaie."), { status: 502 });
  return json;
}

function extractJson(s) {
  s = String(s).replace(/<think>[\s\S]*?<\/think>/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'POST' && url.pathname === '/api/transcribe') return send(res, 200, await transcribe(req));
    if (req.method === 'POST' && url.pathname === '/api/plan') return send(res, 200, await plan(req));
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, serverKey: !!SERVER_KEY });
    if (req.method !== 'GET') return send(res, 404, { error: 'introuvable' });
    const file = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : path.normalize(url.pathname).replace(/^(\.\.[\/\\])+/, ''));
    if (!file.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, { error: 'introuvable' });
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    send(res, e.status || 500, { error: e.message || 'Erreur' });
  }
}).listen(PORT, () => console.log(`IA Chok Chokan sur :${PORT}`));
