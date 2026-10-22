const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'players.json');

function readPlayers() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch (error) {
    console.error('Could not read players.json:', error.message);
    return null;
  }
}

function send(res, status, body, format = 'json') {
  const isText = format === 'txt';
  res.writeHead(status, {
    'Content-Type': isText ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(isText ? body : JSON.stringify(body, null, 2));
}

function respondError(res, status, message, format, uid) {
  const payload = { success: false, error: message };
  if (uid !== undefined) payload.uid = uid;
  if (format === 'txt') {
    const text = Object.entries(payload)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    return send(res, status, text + '\n', 'txt');
  }
  return send(res, status, payload);
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    return send(res, 400, { success: false, error: 'Invalid URL.' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { success: false, error: 'Method not allowed. Use GET.' });
  }

  if (url.pathname === '/') {
    const base = `${url.protocol}//${url.host}`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pavel Codex Player API</title>
<style>*{box-sizing:border-box}body{margin:0;background:#0b1020;color:#eef3ff;font:16px/1.6 system-ui,Arial;padding:24px}.wrap{max-width:760px;margin:40px auto}.card{background:#141e33;border:1px solid #2c3a56;border-radius:18px;padding:24px;margin:16px 0}h1{margin:0;color:#8db6ff}p{color:#c4cde0}code{display:block;overflow-wrap:anywhere;background:#0a1222;border-radius:8px;padding:12px;color:#8ef0c3;margin:8px 0}a{color:#8ef0c3}</style></head>
<body><main class="wrap"><section class="card"><h1>Pavel Codex Player API</h1><p>Custom player data API · JSON and TXT responses</p><p>JSON endpoint</p><code>/api/player?uid=8674177274</code><p>TXT endpoint</p><code>/api/player?uid=8674177274&amp;format=txt</code><p><a href="/api/player?uid=8674177274">Try JSON</a> · <a href="/api/player?uid=8674177274&amp;format=txt">Try TXT</a></p><p>Data is read from the project's local players.json file.</p></section></main></body></html>`);
  }

  if (url.pathname !== '/api/player') {
    return send(res, 404, { success: false, error: 'Endpoint not found.' });
  }

  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  if (!['json', 'txt'].includes(format)) {
    return respondError(res, 400, 'Invalid format. Use format=json or format=txt.', 'json');
  }

  const uid = (url.searchParams.get('uid') || '').trim();
  if (!uid || uid.toLowerCase() === 'null') {
    return respondError(res, 400, "Missing parameter 'uid'. Provide a player UID.", format);
  }
  if (!/^\d{5,20}$/.test(uid)) {
    return respondError(res, 400, 'UID must contain 5 to 20 digits.', format);
  }

  const players = readPlayers();
  if (!players) {
    return respondError(res, 500, 'Unable to read players.json. Check that it contains valid JSON.', format);
  }

  const player = players[uid];
  if (!player) {
    return respondError(res, 404, 'Player not found in the local database.', format, uid);
  }

  const data = { success: true, data: player };
  if (format === 'txt') {
    const lines = ['PAVEL CODEX PLAYER API', '----------------------', 'success: true'];
    for (const [key, value] of Object.entries(player)) {
      lines.push(`${key}: ${value === null ? 'null' : value}`);
    }
    return send(res, 200, lines.join('\n') + '\n', 'txt');
  }
  return send(res, 200, data);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Pavel Codex Player API running on port ${PORT}`);
});
