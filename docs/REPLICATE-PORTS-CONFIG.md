# Replicating port configuration in other web apps

Use this as a checklist to give another Node + Vite + Express (or similar) app the same port setup: **EXPRESS_PORT**, **VITE_DEV_PORT**, **VITE_API_PORT**, and scripts that read from `.env` so multiple instances can run in parallel.

---

## 1. Env var names

| Var | Default | Purpose |
|-----|---------|---------|
| **EXPRESS_PORT** | 3000 | Backend/API server (Express, etc.). |
| **VITE_DEV_PORT** | 5173 | Vite dev server (hot-reload). |
| **VITE_API_PORT** | (same as EXPRESS_PORT) | Target for Vite proxy to backend; set when running frontend dev alone. |

Use **EXPRESS_PORT** (not generic `PORT`) so the app’s architecture is explicit.

---

## 2. Root `.env` and `.env.example`

**Root `.env`** (project root):

- `EXPRESS_PORT=3000` (uncomment to override)
- `VITE_DEV_PORT=5173` (uncomment to override)

**Root `.env.example`**:

- Document all three: `EXPRESS_PORT`, `VITE_DEV_PORT`, `VITE_API_PORT` with defaults and one-line comments (what each is, when to set).

**Client `client/.env`** (optional):

- If you support “run only the frontend” (`cd client && npm run dev`), add commented `VITE_DEV_PORT` and `VITE_API_PORT` so the proxy targets the right backend.

---

## 3. Backend server

- **Listen on:** `parseInt(process.env.EXPRESS_PORT, 10) || 3000` (or your framework’s equivalent).
- **Single place:** e.g. `server.js` or main app entry. No hardcoded `3000` for the server port.

---

## 4. Scripts that need the ports

All of these should read **EXPRESS_PORT** (and **VITE_DEV_PORT** where relevant) from `.env` (e.g. via `require('dotenv').config({ path: path.join(__dirname, '..', '.env') })` at the top of each script).

| Script | What it does |
|--------|----------------|
| **start-server.js** | `kill-port` on EXPRESS_PORT, then start the server. |
| **dev-server.js** | `kill-port` on EXPRESS_PORT, then start dev server (e.g. nodemon). |
| **wait-and-dev-client.js** | `wait-on` EXPRESS_PORT (e.g. `http://localhost:${port}/api/config`), then spawn `npm run dev` in client with `VITE_DEV_PORT` and `VITE_API_PORT=EXPRESS_PORT` in env. |
| **open-after-wait.js** | `wait-on` EXPRESS_PORT, then open browser at `http://localhost:${port}` (for built app). |
| **open-dev-client.js** | `wait-on` VITE_DEV_PORT, then open browser at Vite URL (for dev). |
| **echo-build-url.js** | After build, print “View at: http://localhost:EXPRESS_PORT …”. |
| **load-env.js** (optional) | Load root `.env` and export `expressPort`, `viteDevPort` for other scripts. |

Use **EXPRESS_PORT** (and **VITE_DEV_PORT**) everywhere; avoid hardcoded `3000` / `5173` in these scripts.

---

## 5. Vite config (`client/vite.config.js`)

- **`server.port`:** `parseInt(process.env.VITE_DEV_PORT, 10) || 5173`
- **Proxy target:**  
  `http://localhost:${parseInt(process.env.VITE_API_PORT, 10) || parseInt(process.env.EXPRESS_PORT, 10) || 3000}`  
  for `/api`, `/upload`, `/uploads` (or your API paths).

So: dev server port from `VITE_DEV_PORT`; proxy uses `VITE_API_PORT` if set, else `EXPRESS_PORT`, else 3000.

---

## 6. `package.json` scripts

- **start** – Run the script that kills EXPRESS_PORT and starts the server (e.g. `node scripts/start-server.js`).
- **dev** – `concurrently` “dev server” and “wait-and-dev-client” (both use EXPRESS_PORT / VITE_DEV_PORT from `.env`).
- **dev:open** – `concurrently` “dev” and the script that waits for VITE_DEV_PORT and opens the browser.
- **dev:server** – Script that kills EXPRESS_PORT and starts the dev server.
- **dev:client** – `cd client && npm run dev` (Vite reads VITE_DEV_PORT / VITE_API_PORT from env when you run via wait-and-dev-client).
- **open:app** – Open `http://localhost:${process.env.EXPRESS_PORT || 3000}` (load `.env` first, e.g. `require('dotenv').config()`).
- **build** – After client build, run the script that echoes “View at: http://localhost:EXPRESS_PORT …” (so the message is correct for that app).
- **start:open** – Start server in background, then run “open-after-wait” (which uses EXPRESS_PORT).

No `PORT` or raw `3000`/`5173` in these script commands; everything goes through env and the small Node scripts.

---

## 7. Docker / Compose

- **Environment:** Set `EXPRESS_PORT=3000` (or the port the app listens on inside the container).
- **Port mapping:** e.g. `"3000:3000"` → host:container; container port is the one the app listens on (EXPRESS_PORT). If you change EXPRESS_PORT in the image, change the right side of the mapping to match.

---

## 8. Docs

- **Development / “Running the app”** – Use EXPRESS_PORT and VITE_DEV_PORT in examples and “run multiple instances” instructions.
- **Ports reference** – One short doc or section: “Ports: EXPRESS_PORT (backend), VITE_DEV_PORT (Vite), VITE_API_PORT (proxy target).”
- **Changelog** – Note the switch from `PORT` to `EXPRESS_PORT` if you’re migrating an existing app.

---

## 9. Optional: shared port utils

- **Node:** e.g. `scripts/env-ports.js` with `getPortsFromEnv(envPath, { EXPRESS_PORT: 3000, VITE_DEV_PORT: 5173 })` and optionally `loadEnvAndGetPorts` that uses `dotenv` then returns the same shape.
- **Python:** e.g. `scripts/env_ports.py` with `get_ports_from_env(path, defaults={"EXPRESS_PORT": 3000, "VITE_DEV_PORT": 5173 })`.
- Use these in any script that needs port numbers from `.env` so defaults and parsing live in one place.

---

## 10. Quick checklist for a new app

- [ ] Root `.env` / `.env.example`: EXPRESS_PORT, VITE_DEV_PORT, (optional) VITE_API_PORT with comments.
- [ ] Server listens on `process.env.EXPRESS_PORT || 3000`.
- [ ] Scripts (start, dev, wait-and-dev-client, open-after-wait, open-dev-client, echo-build-url) use EXPRESS_PORT / VITE_DEV_PORT from `.env` (no hardcoded ports).
- [ ] Vite: `server.port` from VITE_DEV_PORT; proxy target from VITE_API_PORT or EXPRESS_PORT.
- [ ] package.json: start, dev, dev:open, open:app, build, start:open point at these scripts and env.
- [ ] Docker/Compose: EXPRESS_PORT in env; port mapping matches.
- [ ] Docs and changelog updated to say EXPRESS_PORT (and optional port utils).

After this, each app can use a different `.env` (e.g. EXPRESS_PORT=3001, VITE_DEV_PORT=5174) so multiple UIs run side by side on one machine.
