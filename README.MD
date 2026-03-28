# My Strudel Flutes

A small self-hosted Strudel pad for sketching ambient flute pieces in the browser.

## Local use

Requirements:

- Node.js 18 or newer

Run it locally:

```bash
cd my-strudel-flutes
npm start
```

Then open [http://localhost:8008](http://localhost:8008).

## App layout

- `index.html`: browser UI
- `main.js`: Strudel bootstrapping and editor/playback wiring
- `songs/`: editable song sketches
- `server.mjs`: built-in static server for local use or service deployment

## Running on a home server

### Option 1: systemd service

Copy the project to the server, for example into `/opt/my-strudel-flutes`, then:

```bash
cd /opt/my-strudel-flutes
sudo cp deploy/systemd/my-strudel-flutes.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now my-strudel-flutes
sudo systemctl status my-strudel-flutes
```

Notes:

- The example unit uses `User=www-data` and `WorkingDirectory=/opt/my-strudel-flutes`.
- Adjust those values in `deploy/systemd/my-strudel-flutes.service` before enabling it if your server uses a different user or path.
- The app listens on port `8008` by default. Change `Environment=PORT=...` in the unit file if needed.

### Option 2: Docker Compose

If your home server already runs Docker:

```bash
cd my-strudel-flutes
docker compose up -d --build
docker compose ps
```

That publishes the app on port `8008` by default. Override it with:

```bash
PORT=8088 docker compose up -d --build
```

## Notes

- This app is static, but playback still depends on internet access because Strudel, soundfonts, and sample banks are fetched from CDNs and GitHub at runtime.
- `Cmd/Ctrl + Enter` plays the current editor content.
- `Esc` stops playback.

## Production deploy for Contabo

This repo now includes a production deployment path for `jester.chat` and `jester.land`:

- `deploy/production/compose.yaml`: app + Caddy reverse proxy with TLS
- `deploy/production/Caddyfile`: HTTPS and redirect rules
- `deploy/production/.env.example`: production env template
- `deploy/production/bootstrap-server.sh`: installs Docker + Compose on an Ubuntu/Debian server
- `deploy/production/prepare-docs.sh`: snapshots the local Strudel docs into `.deploy-docs/` for the RAG corpus
- `deploy/production/deploy-remote.sh`: syncs the app to a remote host and runs the production Compose stack

Recommended DNS:

- `jester.chat` -> `89.117.151.145`
- `jester.land` -> `89.117.151.145`

Suggested remote path:

- `/opt/jester-chat`

### 1. Bootstrap the Contabo host

Copy `deploy/production/bootstrap-server.sh` to the server and run it as root or via sudo. It installs Docker, Docker Compose, and opens ports `80` and `443` if `ufw` is present.

### 2. Create the production env on the server

On the server, copy the example:

```bash
cd /opt/jester-chat
cp deploy/production/.env.example deploy/production/.env
```

Then fill in at least:

- `ACME_EMAIL`
- `DEEPSEEK_API_KEY`
- optional `OPENAI_API_KEY`

### 3. Deploy from this machine

From the project root:

```bash
cd my-strudel-flutes
REMOTE_USER=<your-ssh-user> bash deploy/production/deploy-remote.sh
```

That script:

- snapshots the local Strudel docs into `.deploy-docs/`
- rsyncs the app to the remote host
- runs `docker compose -f deploy/production/compose.yaml up -d --build`

### 4. Validate the deployment

Once DNS has propagated and Caddy has issued certificates:

```bash
curl https://jester.chat/healthz
curl https://jester.chat/api/chat/status
```
