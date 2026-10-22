# Pavel Codex Player API

Custom JSON/TXT API backed by `players.json`.

## Endpoints
- `GET /` — API landing page
- `GET /api/player?uid=8674177274` — JSON response
- `GET /api/player?uid=8674177274&format=txt` — plain text response

## Run locally
```bash
npm start
```

## Render settings
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`

This project serves only the custom data stored in `players.json`; it does not fetch live Garena data.
