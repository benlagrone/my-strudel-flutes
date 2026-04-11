# Jester 0 Roadmap

## Scope

`Jester 0` is the current combined prototype in this repo.

It already includes:

- a browser Strudel editor/player
- built-in starter sketches and reference sketches
- insertable preset snippets
- chat-assisted revisions
- docs-grounded answers
- provider/model selection
- auto-apply revisions on response
- optional auto-play after apply
- local save, import, and export

This roadmap is for improving that prototype without turning it into `Jester 1`
yet.

## Product Goal

Make `Jester 0` feel like a tight, credible chat-to-music tool:

- faster to start
- easier to steer
- safer to trust
- easier to compare and keep good results

## Non-Goals

Not in scope for `Jester 0`:

- splitting `Jester.chat` and `Jester.land`
- full accounts and cloud persistence
- marketplace or payouts
- custom runtime rewrite
- deep infrastructure work beyond what the MVP needs

## Current Baseline

The app already has the raw pieces for a useful prototype:

- template and reference sketches
- preset insertion
- local sketch management
- export/import
- live edit chat
- grounded docs answers
- auto-apply revisions without requiring a separate manual apply click

The roadmap should build on those, not restart them.

## Prioritization Rules

Prioritize features that:

- improve the core edit loop
- make AI revisions feel controllable
- reduce typing and friction
- add trust before adding complexity

Keep this behavior as a product rule:

- when safe to do so, revised song responses should auto-apply by default so the
  user does not need a second apply click

## Roadmap

### Now: tighten the edit loop

#### 1. One-Click Variations

Goal:

- let users generate small revisions of the current sketch with one click

Examples:

- `Make darker`
- `Make calmer`
- `Make more rhythmic`
- `Make more sparse`

User value:

- keeps users in flow
- makes the app feel more musical immediately

Difficulty:

- low

Why now:

- it is the most direct upgrade to the current chat loop

#### 2. Prompt Chips

Goal:

- add reusable one-click prompt fragments near the chat box

Examples:

- `less busy`
- `warmer`
- `more space`
- `longer tails`
- `soft kick`

User value:

- lowers prompt friction
- helps non-expert users ask for useful edits

Difficulty:

- low

Why now:

- very high leverage for little implementation work

#### 3. Prompt Suggestions Drawer

Goal:

- add a small expandable drawer with richer prompt suggestions for users who
  want more guided help on larger or more structured edits

Examples:

- `Turn this into intro, lift, and outro`
- `Keep the pad, simplify the melody, add soft percussion`
- `Make this feel like a title-screen loop for a rainy game`
- `Add a brighter counterline in the second half`
- `Keep harmony, remove clutter, increase motion`

User value:

- helps users ask for more complex changes without starting from a blank prompt
- gives the chat interface more depth without making it feel heavy by default

Difficulty:

- low to medium

Why now:

- it pairs naturally with prompt chips and improves the guided composition
  experience for more complex songs

#### 4. Style Presets

Goal:

- promote the current starter sketches and preset snippets into clearer,
  named starting modes

Examples:

- `ambient flute`
- `glass canopy`
- `river pulse`
- `night drone`

User value:

- stronger first-run experience
- easier onboarding

Difficulty:

- low

Why now:

- much of the content already exists in the repo

### Next: improve trust and control

#### 5. Fix My Code

Goal:

- when generated code fails or sounds obviously broken, offer a repair action

User value:

- reduces dead ends
- makes AI assistance feel dependable

Difficulty:

- medium

Why next:

- reliability matters once users start editing more aggressively

#### 6. Live Compare

Goal:

- A/B between the current sketch and the last AI revision

User value:

- helps users judge edits quickly
- makes revisions feel reversible and safe

Difficulty:

- medium

Why next:

- trust grows when the user can compare instead of blindly accept

#### 7. Mood Controls

Goal:

- give users a small set of direct mood controls instead of requiring all mood
  changes to be typed manually

Examples:

- calmer <-> more intense
- darker <-> brighter
- sparse <-> busy

User value:

- makes the AI feel steerable, not opaque

Difficulty:

- low to medium

Why next:

- fits naturally on top of the current prompt system

### Later: structure and memory

#### 8. Chat History Replay

Goal:

- let users jump back to earlier prompts and AI revisions

User value:

- makes exploration less destructive
- turns the conversation into part of the creative history

Difficulty:

- medium

#### 9. Song States

Goal:

- let users keep named versions of a sketch such as `intro`, `lift`,
  `breakdown`, and `outro`

User value:

- gives users a sense of song structure without requiring a larger rewrite

Difficulty:

- medium

#### 10. Part Labels

Goal:

- mark layers or sections as lead, pad, bass, percussion, sparkle, or texture

User value:

- helps users understand the arrangement
- helps the AI speak about the sketch more clearly

Difficulty:

- medium

### Later: package and share

#### 11. Export Pack

Goal:

- extend the current export so users can package:
  - current code
  - prompt history
  - short summary of the sketch

User value:

- makes the prototype feel like a real creative tool
- helps with handoff and sharing

Difficulty:

- medium

### Experimental: notation import

#### 12. Sheet Music Import

Goal:

- let users bring simple notated music into Jester and hear it through the
  existing Strudel playback path

Product rules:

- prefer `MusicXML -> Strudel` as the primary import path because it preserves
  more notation structure and can produce cleaner, more editable Strudel code
- allow `MIDI -> Strudel` as a lower-fidelity fallback when playback matters
  more than readable score structure
- do not attempt full PDF or scanned sheet-music OCR in `Jester 0`
- start with monophonic lines and simple polyphony before handling dense piano
  scores, tuplets, repeats, and multi-staff edge cases
- make the copyright boundary explicit in product copy: users should only
  import music they own, have licensed, or know is public domain
- keep parsing local in the browser when feasible so copyrighted source files
  do not need to be retained server-side

User value:

- opens a path from traditional notation into the current chat-to-music loop
- makes Jester more useful to musicians who start from scores instead of text
  prompts
- creates a bridge from score playback into editable Strudel code

Difficulty:

- medium to high

Why experimental:

- playback is already solved, but reliable notation import and clean Strudel
  generation are not
- the MusicXML path is meaningfully better than MIDI for editability, but it is
  still non-trivial to map ties, durations, voices, and articulation into
  usable Strudel

### Experimental: image mood input

#### 13. Image Mood Inference

Goal:

- let the user attach a single image and have Jester infer a mood direction for
  the music from visible emotional and scene cues

Product rules:

- treat this as mood inference, not clinical emotion detection
- keep the UI minimal: one image, one preview, one remove action
- do not add provider/model selection to the UI
- keep provider choice in server env only
- use OpenAI for image reading and DeepSeek for music generation
- do not store images in Jester 0 beyond the immediate request path

Example flow:

1. user attaches one image in chat
2. Jester reads visible cues such as expression, posture, lighting, and scene
   energy
3. Jester converts that into a compact mood summary
4. Jester uses that summary to revise or generate the current sketch
5. user hears the result and continues editing normally

User value:

- gives users a faster non-text input path
- makes Jester feel more responsive to creative context
- helps users who know the feeling they want but do not know how to describe it

Difficulty:

- medium

Why it fits Jester 0:

- it extends the existing chat-to-music loop instead of creating a new product
  surface
- it keeps the music generation core intact while adding a new way to steer it
- it is easy to position as optional and experimental

Implementation boundary:

- OpenAI image reading only
- DeepSeek music generation only
- configuration from `.env`
- no user provider dropdown
- no image library, upload manager, or account-level storage

### Experimental: opt-in camera assist

#### 13. Camera Vibe Assist

Goal:

- let the user explicitly click to enable a short camera-based vibe read and
  turn that into music recommendations

Product rules:

- never turn on automatically
- only run after explicit user action
- position it as recommendation, not authoritative emotion detection
- give the user choices instead of silently changing the music

Example flow:

1. user clicks `Use camera for vibe assist`
2. app asks browser camera permission
3. app reads a short expression/energy signal
4. app suggests a few directions such as:
   - `warmer and calmer`
   - `brighter and more rhythmic`
   - `darker and more spacious`
5. user picks one and Jester applies the revision

User value:

- gives the app a surprising, personal input mode
- helps users who do not know what to type

Difficulty:

- medium

Why it fits Jester 0:

- it is a memorable prototype feature
- it can stay fully opt-in
- it extends the existing recommendation and revision flow

Privacy constraints:

- ask every time unless the user clearly opts into remembering the choice
- do not enable passive background sensing
- prefer one-shot analysis over continuous monitoring
- do not store camera frames unless the product later has a clear reason and
  explicit consent

## Recommended Order

### Quick wins

1. One-Click Variations
2. Prompt Chips
3. Prompt Suggestions Drawer
4. Style Presets

### Next wave

5. Fix My Code
6. Live Compare
7. Mood Controls

### Later wave

8. Chat History Replay
9. Song States
10. Part Labels
11. Export Pack
12. Image Mood Inference
13. Camera Vibe Assist

## Suggested Milestones

### Milestone A: Better first session

Ship:

- One-Click Variations
- Prompt Chips
- Prompt Suggestions Drawer
- Style Presets

Success signal:

- users can get from blank page to a satisfying revision faster

### Milestone B: Better trust

Ship:

- Fix My Code
- Live Compare
- Mood Controls

Success signal:

- users feel safer accepting and testing AI edits

### Milestone C: Better retention

Ship:

- Chat History Replay
- Song States
- Export Pack

Success signal:

- users return to sketches and keep evolving them instead of starting over

## What To Build First

If only one small batch gets built next, build:

1. One-Click Variations
2. Prompt Chips
3. Prompt Suggestions Drawer
4. Fix My Code

That combination improves:

- speed
- usability
- trust

without needing a repo split or runtime rewrite.
