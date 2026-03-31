# Jester.land

## Purpose

`Jester.land` is the backend service layer for the Jester product family.

Its immediate job is not to replace Strudel. Its immediate job is to own the
AI behavior around music creation:

- prompt orchestration
- conversation state
- docs grounding
- code generation
- code revision
- repair loops
- provider routing
- streaming responses

`Jester 1` can stay a Strudel-powered client for now. `Jester.land` is the
platform boundary that keeps the AI product logic from being trapped inside a
single browser app.

## Product Position

### Jester 1

- chat-first browser music app
- uses Strudel for current playback and editing
- validates the user experience quickly

### Jester.land

- reusable API and prompting layer
- owns the AI workflow and product logic
- serves the current Strudel client and future clients

### Jester 2

- possible future heavier lift
- original runtime or more advanced execution engine
- should sit behind the same `Jester.land` contract when justified

## Immediate Need

The current app already contains the beginning of this layer:

- `server.mjs` exposes chat endpoints and provider configuration
- `docs-rag.mjs` handles docs indexing, search, and provider-backed answers
- `main.js` calls the chat API and applies code back into the editor

That is enough for a local assistant, but not enough for a product platform.
Without `Jester.land`, the AI logic, prompting choices, and provider handling
stay coupled to one Strudel app and become harder to reuse or replace later.

## Jester.land V1

### Core responsibility

Turn user requests like:

- "make it moodier"
- "add a soft kick"
- "make it work for a game menu loop"
- "turn this into a lighter Peruvian flute idea"

into structured music edits and grounded assistant responses.

### V1 goals

- centralize prompt logic
- support multiple model providers
- preserve conversation and project context
- ground answers in local Strudel docs and curated product docs
- generate or revise Strudel code for `Jester 1`
- stream partial assistant output to clients
- provide a stable API boundary for future non-Strudel engines

### V1 non-goals

- replacing Strudel now
- building a creator marketplace now
- solving rights and payout systems now
- shipping a full music engine API now

## Responsibilities

`Jester.land` owns:

- provider selection and failover
- system prompts and prompt templates
- retrieval and context assembly
- structured output contracts
- code-diff or full-code rewrite generation
- code repair after validation failures
- user preferences and project memory
- response streaming
- metering, auth, and billing hooks

`Jester.land` does not need to own:

- browser playback
- browser editor controls
- Strudel runtime loading
- local transport controls like play/stop

Those can remain in `Jester 1`.

## Product Contract

The client should ask for music help in terms of user intent, not model syntax.

Example contract:

1. Client sends conversation state, current code, and user request.
2. `Jester.land` classifies the task.
3. `Jester.land` retrieves relevant grounding context.
4. `Jester.land` generates a structured assistant response.
5. `Jester.land` optionally includes a full revised code block or patch plan.
6. Client chooses whether to apply, preview, or ignore the result.

This keeps the client thin and makes engine replacement possible later.

## Request Types

### Docs answer

Use when the user is asking how Strudel works.

Example:

- "how do I slow down just the melody?"
- "what does `room` do?"

### Song create

Use when the user wants a fresh sketch.

Example:

- "make a calm title-screen loop"
- "write an airy flute piece with soft percussion"

### Song edit

Use when the user wants a revision of the current sketch.

Example:

- "make this less busy"
- "add a soft bass line"
- "keep the mood but remove the drums"

### Repair

Use when generated code fails validation or playback.

Example:

- syntax error
- unsupported function
- missing sample bank reference

## Suggested API Surface

### `POST /v1/chat/respond`

Primary response endpoint.

Request:

```json
{
  "project_id": "proj_123",
  "session_id": "sess_456",
  "client": {
    "id": "jester1-web",
    "version": "0.1.0"
  },
  "mode": "auto",
  "messages": [
    {
      "role": "user",
      "content": "make it moodier and less busy"
    }
  ],
  "current_code": "stack(...)",
  "preferences": {
    "auto_apply": true,
    "auto_play": false
  }
}
```

Response:

```json
{
  "intent": "song-edit",
  "answer": "I thinned the rhythm and darkened the harmony.",
  "code": "stack(...)",
  "appliable": true,
  "citations": [
    {
      "title": "Mini notation",
      "path": "docs/technical-manual/index.md"
    }
  ],
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "mode": "rag"
}
```

### `POST /v1/chat/stream`

Streaming version of the same request. Intended for:

- token streaming
- step updates
- intermediate reasoning state for the app
- code-ready events

Suggested event types:

- `status`
- `retrieval`
- `delta`
- `code`
- `final`
- `error`

### `POST /v1/code/repair`

Validate and repair a candidate music program after a failed generation or edit.

### `GET /v1/providers`

Return available model providers and model choices.

### `GET /v1/healthz`

Basic service status.

## Prompting Pipeline

### 1. Classify the request

Determine whether the user wants:

- docs guidance
- a new composition
- a revision
- a repair

### 2. Gather context

Assemble only the context needed for the request:

- recent conversation turns
- current editor code
- retrieved Strudel docs
- curated Jester style guidance
- user preferences

### 3. Build the system instruction

The system prompt should encode stable product rules:

- stay grounded in available capabilities
- preserve user intent
- prefer safe, playable output
- keep revisions proportional to the request
- explain changes briefly
- return machine-usable code when applicable

### 4. Generate structured output

Prefer explicit fields over plain prose:

- `intent`
- `answer`
- `code`
- `appliable`
- `citations`
- `warnings`

### 5. Validate

For Strudel-backed responses:

- verify a code block exists when required
- verify the output is syntactically shaped like playable Strudel code
- reject unsupported features when possible

### 6. Repair if needed

If validation fails:

- send the failure plus candidate code back through a repair prompt
- constrain the repair to minimal changes
- return the corrected code with a short note

## Grounding Sources

V1 grounding sources:

- local Strudel docs
- curated starter songs in this app
- internal prompt templates
- future Jester style guides and playbooks

Grounding should stay narrow. Do not dump large irrelevant docs into every
request.

## Data Model

### Session

- session id
- user id
- provider/model selection
- recent conversation turns
- current project pointer

### Project

- project id
- title
- current code
- revision history
- tags or mood labels

### Response artifact

- request id
- intent
- answer text
- generated code
- citations
- validation status

## Client Boundary

`Jester 1` should remain responsible for:

- editor rendering
- play/stop controls
- local sketch management
- displaying citations and chat history
- applying returned code into the editor

`Jester.land` should remain responsible for:

- deciding what the assistant should do
- deciding which provider/model to use
- deciding what context to include
- deciding what code or edit to return

## Why This Matters

This creates a real moat before any engine rewrite:

- better prompting
- better repair loops
- better musical editing behavior
- better user memory
- better realtime assistant UX

Those are product assets. Strudel is currently the execution layer for one
client. `Jester.land` is the reusable intelligence layer.

## Migration Path From The Current App

### Phase 1

Keep the current app behavior, but treat the local `/api/chat` path as the
prototype of `Jester.land`.

### Phase 2

Extract chat orchestration from `server.mjs` and `docs-rag.mjs` into a separate
service package with the same request/response shape.

### Phase 3

Point `Jester 1` at remote `Jester.land` endpoints.

### Phase 4

Add streaming, auth, usage metering, and project persistence.

### Phase 5

Decide whether a custom runtime is justified for `Jester 2`.

## Build Principles

- keep the client thin
- keep prompts centralized
- keep outputs structured
- validate generated code
- optimize for revision quality, not just first-pass generation
- preserve the option to replace Strudel later without replacing the AI layer

## Decision

Build `Jester.land` now as the AI prompting and orchestration layer.

Do not wait for an engine rewrite to establish the platform boundary.
