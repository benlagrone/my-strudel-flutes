# Repo Structure And Deploy Plan

## Decision

Keep `my-strudel-flutes` as the actual product repo.

Do not turn the parent workspace into the product repo. The sibling `strudel/`
tree should remain an external reference and local docs source, not the home of
the Jester product.

Near term, keep one repo and split it into:

- `Jester 1` web client
- `Jester.land` API service
- shared packages for prompting and retrieval

This gives us a clean boundary now without forcing the `Jester 2` rewrite yet.

## Current State

Today the repo is effectively one app:

- browser UI in `index.html` and `main.js`
- generated browser bundle in `app.js`
- local Node server in `server.mjs`
- docs retrieval logic in `docs-rag.mjs`
- deployment scripts in `deploy/production/`

This is enough for a prototype, but it mixes:

- web client concerns
- API concerns
- prompt orchestration
- docs indexing
- deployment concerns

That coupling is what we are fixing.

## Repo Boundary

### Product repo

Use [`my-strudel-flutes`](/Users/benjaminlagrone/Documents/projects/MediaStudio/Strudel_main/my-strudel-flutes) as the GitHub repo and source of truth.

### External reference

Use the sibling `strudel/` directory only for:

- local reference
- docs snapshot generation
- behavior research

Do not depend on local `../strudel` in production builds. Production should rely
on published packages and generated docs snapshots.

## Target Structure

Recommended target structure inside the product repo:

```text
my-strudel-flutes/
  apps/
    jester-chat-web/
      src/
      public/
      songs/
      package.json
    jester-land-api/
      src/
      package.json
  packages/
    docs-rag/
      src/
      package.json
    prompt-engine/
      src/
      package.json
    music-schema/
      src/
      package.json
    strudel-adapter/
      src/
      package.json
  data/
    docs-snapshots/
    fixtures/
  deploy/
    local/
    production/
  docs/
    jester-land.md
    repo-structure-deploy.md
  scripts/
  tests/
    e2e/
    integration/
  package.json
  package-lock.json
```

## What Moves Where

### `Jester 1` web client

Move these into `apps/jester-chat-web/`:

- `index.html`
- `main.js`
- `songs/`
- browser assets and client-side UI code

Responsibilities:

- editor UI
- chat UI
- play/stop controls
- local sketch handling
- applying returned code into the editor

### `Jester.land` API

Move these into `apps/jester-land-api/`:

- `server.mjs`
- HTTP routes
- provider config
- health checks
- future auth and billing hooks

Responsibilities:

- prompt orchestration
- model routing
- session handling
- streaming responses
- code generation and repair

### Shared packages

Extract these into `packages/`:

- `docs-rag.mjs` -> `packages/docs-rag/`
- prompt templates and classifier logic -> `packages/prompt-engine/`
- request/response types and validation -> `packages/music-schema/`
- Strudel-specific generation and validation helpers -> `packages/strudel-adapter/`

This matters because `Jester 2` should replace the adapter, not the whole
platform.

## Recommended Package Roles

### `packages/docs-rag`

Owns:

- docs discovery
- docs chunking
- indexing
- retrieval
- citations

### `packages/prompt-engine`

Owns:

- system prompts
- request classification
- context assembly
- structured response formatting
- repair prompts

### `packages/music-schema`

Owns:

- request schemas
- response schemas
- validation
- shared types used by web and API

### `packages/strudel-adapter`

Owns:

- Strudel-specific prompt hints
- Strudel code validation
- Strudel repair rules
- future import/export helpers

This package should be treated as replaceable.

## Repo Needs

### 1. One actual repo boundary

The product repo should be the GitHub repo at `my-strudel-flutes`, not the
parent folder with local experiments and vendored references.

### 2. Workspace support

Add npm workspaces at the repo root so we can build multiple apps and packages
without splitting repos yet.

Why npm workspaces:

- the repo already uses npm and `package-lock.json`
- it minimizes tooling churn
- it is enough for the current scale

### 3. Generated assets should not be source of truth

`app.js` is a build artifact. The source of truth should live under `src/`.

Recommended rule:

- build artifacts produced in CI/Docker
- source committed
- generated browser bundle not hand-edited

### 4. Empty directories should become real homes

The repo already has empty `src/`, `tests/`, and `data/` directories.

Use them intentionally:

- `src/` only if we keep the current flat app a little longer
- `tests/` for integration and e2e coverage
- `data/` for fixtures and local snapshots that are safe to commit

### 5. Shared environment strategy

We need:

- `.env.example` at the root or per app
- production env kept out of Git
- explicit variable ownership by app

### 6. CI

Minimum CI jobs:

- install
- build web
- build API
- run tests
- optionally build Docker images

### 7. Deployment scripts stay in repo

Keep deployment scripts in `deploy/production/` because they are part of the
operating model, not local-only glue.

## Minimal Workspace Layout

If we want the smallest viable restructure, use this first:

```text
my-strudel-flutes/
  apps/
    jester-chat-web/
    jester-land-api/
  packages/
    docs-rag/
    prompt-engine/
    strudel-adapter/
  deploy/
  docs/
  scripts/
  tests/
```

That is enough to separate product concerns now.

## Domain Plan

Recommended domain split:

- `jester.chat` -> primary end-user web client
- `api.jester.land` -> public and internal API
- `jester.land` -> landing page, docs, and developer/product identity

If we want to keep things even simpler at first:

- `jester.chat` -> web client
- `jester.chat/api/*` -> API
- `jester.land` -> temporary redirect or simple landing page

But the cleaner long-term boundary is still `api.jester.land`.

## Deployment Plan

### Environment 1: Local development

Run both apps locally:

- web app on a local dev port
- API on a local dev port
- API points at local docs snapshots or the sibling `strudel/` docs tree

Developer flow:

1. start API
2. start web app
3. web app calls local API

### Environment 2: Production VPS

Near-term production should stay on one Contabo VPS with Docker Compose.

Services:

- `proxy` -> Caddy
- `web` -> `Jester 1` browser app server
- `api` -> `Jester.land` API
- `redis` -> optional later for streaming/session cache
- `postgres` -> optional later when accounts/projects/history need persistence

### Near-term production topology

```text
Internet
  -> Caddy reverse proxy
    -> web container
    -> api container
```

### Route plan

- `jester.chat` -> web container
- `api.jester.land` -> API container
- `jester.land` -> landing or docs container later

### Data mounts

The API container gets:

- docs snapshot volume
- optional persistent project storage later

The web container should stay mostly stateless.

## Immediate Production Shape

The current production compose file only defines the app container. The target
production shape should explicitly include a reverse proxy and separate services
for web and API.

Recommended production services:

```text
services:
  proxy
  web
  api
```

That is the next useful operating model.

## Build And Release Flow

### Step 1

Push to GitHub repo.

### Step 2

CI runs:

- install
- build
- tests

### Step 3

Deploy to VPS.

Near term, keep the existing SSH + rsync deploy style because it is simple and
already close to working.

Later, move the deploy trigger into GitHub Actions if needed.

## Production Secrets

At minimum:

- `ACME_EMAIL`
- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`
- provider/model defaults

Later:

- auth secrets
- billing provider secrets
- database credentials
- session signing keys

## Suggested File Ownership

### `apps/jester-chat-web`

Owns:

- web UI
- code editor integration
- playback UI
- session UX

### `apps/jester-land-api`

Owns:

- chat endpoints
- streaming endpoints
- provider routing
- validation and repair loop orchestration

### `packages/*`

Own shared logic only. No app-specific UI or HTTP server concerns.

## Migration Plan

### Phase 1

Keep the current repo, but document the split and stop adding new product logic
to top-level `main.js` and `server.mjs`.

### Phase 2

Move current browser code into `apps/jester-chat-web`.

### Phase 3

Move current server code into `apps/jester-land-api`.

### Phase 4

Extract shared retrieval and prompt logic into `packages/`.

### Phase 5

Split deployment into `proxy`, `web`, and `api` containers.

### Phase 6

Add persistence, auth, and billing only when the product actually needs them.

## Practical Rules

- keep one repo for now
- keep one VPS for now
- separate web and API now
- keep Strudel-specific logic in an adapter package
- do not let `Jester.land` become inseparable from Strudel internals
- do not treat generated bundles as source

## Final Recommendation

The right immediate structure is:

- one product repo
- two apps inside it
- a few shared packages
- one VPS deployment with separate `web` and `api` services behind Caddy

That is enough to support `Jester 1` now and leave room for `Jester 2` later.
