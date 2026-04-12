import * as core from '@strudel/core';
import { StrudelMirror } from '@strudel/codemirror';
import * as draw from '@strudel/draw';
import * as mini from '@strudel/mini';
import * as tonal from '@strudel/tonal';
import { transpiler } from '@strudel/transpiler';
import * as webaudio from '@strudel/webaudio';

const STORAGE_KEYS = {
  chatConfig: 'strudelPad.chatConfig.v1',
  selection: 'strudelPad.selection.v2',
  sketches: 'strudelPad.localSketches.v2',
};

const BUILTIN_SKETCHES = [
  {
    id: 'starter-first-breath',
    category: 'Starter',
    label: 'Starter: First Breath',
    path: 'songs/starter-first-breath.js',
    description: 'The safest place to start: one airy lead, one warm pad, and a single steady kick pulse.',
    palette: ['triangle', 'sawtooth', 'bank:crate'],
  },
  {
    id: 'starter-glass-canopy',
    category: 'Starter',
    label: 'Starter: Glass Waltz',
    path: 'songs/starter-glass-canopy.js',
    description: 'A three-beat bell sketch with a chiming lead, a low step bass, and lots of room for fairytale or noir revisions.',
    palette: ['sine', 'triangle', 'square', 'bank:crate'],
  },
  {
    id: 'starter-river-step',
    category: 'Starter',
    label: 'Starter: River Step',
    path: 'songs/starter-river-step.js',
    description: 'A groove-first template with moving bass, clipped lead motion, and an easy crate rhythm to push around.',
    palette: ['sawtooth', 'triangle', 'square', 'bank:crate'],
  },
  {
    id: 'starter-neon-circuit',
    category: 'Starter',
    label: 'Starter: Neon Circuit',
    path: 'songs/starter-neon-circuit.js',
    description: 'A brighter sequencer sketch with square arps, a steady bass motor, and a clean crate pulse.',
    palette: ['square', 'triangle', 'sawtooth', 'sine', 'bank:crate'],
  },
  {
    id: 'starter-ember-dub',
    category: 'Starter',
    label: 'Starter: Ember Dub',
    path: 'songs/starter-ember-dub.js',
    description: 'A slower offbeat sketch with echo stabs, subby bass, and roomy percussion for duskier moods.',
    palette: ['triangle', 'sawtooth', 'square', 'bank:crate'],
  },
  {
    id: 'starter-paper-arcade',
    category: 'Starter',
    label: 'Starter: Paper Arcade',
    path: 'songs/starter-paper-arcade.js',
    description: 'A playful chip-like loop with quick square runs, buoyant bass, and a small bright beat.',
    palette: ['square', 'triangle', 'sine', 'bank:crate'],
  },
  {
    id: 'tawantinsuyu',
    category: 'Reference',
    label: 'Reference: Tawantinsuyu',
    path: 'songs/tawantinsuyu.js',
    description: 'Fuller airy lead writing with echo layers and FM shimmer.',
    palette: ['triangle', 'sawtooth', 'bank:crate'],
  },
  {
    id: 'mist-above-the-lake',
    category: 'Reference',
    label: 'Reference: Mist Above the Lake',
    path: 'songs/mist-above-the-lake.js',
    description: 'Slow drifting lead lines with a soft synth bed and bright sparkles.',
    palette: ['triangle', 'sine', 'sawtooth', 'bank:crate'],
  },
  {
    id: 'mountain-echos',
    category: 'Reference',
    label: 'Reference: Mountain Echos',
    path: 'songs/mountain-echos.js',
    description: 'A sparse ambient scene with more room to experiment in the melody layer.',
    palette: ['triangle', 'sine', 'sawtooth', 'bank:crate'],
  },
  {
    id: 'orinocodrift',
    category: 'Reference',
    label: 'Reference: Orinoco Drift',
    path: 'songs/orinocodrift.js',
    description: 'A warmer echo-and-bass texture with a slightly firmer pulse.',
    palette: ['triangle', 'sine', 'sawtooth', 'bank:crate'],
  },
];

const PRESET_SNIPPETS = [
  {
    id: 'air-reed-lead',
    label: 'Air Reed Lead',
    snippet: `n("[0 2 4 ~] ~ <5 7>")
  .scale("A4:dorian")
  .s("triangle")
  .lpf(1600)
  .attack(0.01)
  .decay(0.28)
  .sustain(0)
  .release(0.08)
  .room(0.42)
  .delay("<0 .125>")
  .gain(0.34)
  .slow(2)`,
  },
  {
    id: 'dub-chord-stab',
    label: 'Dub Chord Stab',
    snippet: `n("~ 0 ~ 5")
  .scale("F4:dorian")
  .s("sawtooth")
  .lpf(1200)
  .attack(0.01)
  .decay(0.16)
  .sustain(0)
  .release(0.08)
  .room(0.38)
  .delay("<.25 .375>")
  .gain(0.22)
  .slow(2)`,
  },
  {
    id: 'square-runner-arp',
    label: 'Square Runner Arp',
    snippet: `n("[0 7 10 7] [3 10 12 10]")
  .scale("E5:minor")
  .s("square")
  .attack(0.01)
  .decay(0.11)
  .sustain(0)
  .release(0.03)
  .gain(0.18)
  .fast(2)`,
  },
  {
    id: 'toybox-bells',
    label: 'Toybox Bells',
    snippet: `n("[0 ~ 4] [7 ~ 9]")
  .scale("C6:major")
  .s("sine")
  .attack(0.01)
  .decay(0.18)
  .sustain(0)
  .release(0.05)
  .room(0.44)
  .gain(0.16)
  .slow(2)`,
  },
  {
    id: 'lantern-drone',
    label: 'Lantern Drone',
    snippet: `n("<0 5 7 5>")
  .scale("G3:dorian")
  .s("sawtooth")
  .lpf(850)
  .attack(0.03)
  .decay(0.72)
  .sustain(0)
  .release(0.12)
  .room(0.42)
  .gain(0.2)
  .slow(2)`,
  },
  {
    id: 'bottle-echo',
    label: 'Bottle Echo',
    snippet: `n("<0 2 5>")
  .scale("D5:lydian")
  .s("triangle")
  .lpf(1100)
  .attack(0.01)
  .decay(0.22)
  .sustain(0)
  .release(0.06)
  .room(0.46)
  .delay("<.25 .5>")
  .gain(0.24)
  .slow(4)`,
  },
  {
    id: 'rubber-bass',
    label: 'Rubber Bass',
    snippet: `n("0 ~ 0 5")
  .scale("C2:minor")
  .s("triangle")
  .lpf(650)
  .attack(0.01)
  .decay(0.22)
  .sustain(0)
  .release(0.05)
  .gain(0.18)`,
  },
  {
    id: 'crate-pulse',
    label: 'Crate Pulse',
    snippet: `s("bd")
  .struct("x ~ ~ x")
  .bank("crate")
  .gain(0.28)
  .delay(0.04)`,
  },
  {
    id: 'rim-shuffle',
    label: 'Rim Shuffle',
    snippet: `stack(
  s("rim").struct("~ x ~ ~"),
  s("hh").struct("~ ~ x x")
)
  .bank("crate")
  .gain(0.12)`,
  },
  {
    id: 'glass-counterline',
    label: 'Glass Counterline',
    snippet: `n("~ 7 ~ 9")
  .scale("C6:major")
  .s("sine")
  .attack(0.01)
  .decay(0.08)
  .sustain(0)
  .release(0.03)
  .room(0.24)
  .gain(0.22)
  .fast(2)`,
  },
];

const VARIATION_ACTIONS = [
  {
    id: 'darker',
    label: 'Darker',
    prompt: 'Keep the current song structure and main layers, but make the song darker, warmer, and slightly more dramatic. Return a full revised sketch.',
  },
  {
    id: 'calmer',
    label: 'Calmer',
    prompt: 'Keep the current song recognizable, but make it calmer, softer, and more spacious. Return a full revised sketch.',
  },
  {
    id: 'rhythmic',
    label: 'More Rhythmic',
    prompt: 'Keep the current harmonic mood, but make the song more rhythmic and a little more propulsive without getting too busy. Return a full revised sketch.',
  },
  {
    id: 'sparse',
    label: 'More Sparse',
    prompt: 'Keep the current mood and best musical ideas, but strip the song back so it feels more sparse and open. Return a full revised sketch.',
  },
];

const PROMPT_CHIPS = [
  {
    id: 'less-busy',
    label: 'Less busy',
    seed: 'Keep the current song, but make it less busy.',
    append: 'make it less busy',
  },
  {
    id: 'warmer',
    label: 'Warmer',
    seed: 'Keep the current song, but make it warmer.',
    append: 'make it warmer',
  },
  {
    id: 'more-space',
    label: 'More space',
    seed: 'Keep the current song, but give it more space.',
    append: 'give it more space',
  },
  {
    id: 'longer-tails',
    label: 'Longer tails',
    seed: 'Keep the current song, but add longer reverb and delay tails.',
    append: 'add longer reverb and delay tails',
  },
  {
    id: 'soft-kick',
    label: 'Soft kick',
    seed: 'Keep the current song, but add a soft kick pulse.',
    append: 'add a soft kick pulse',
  },
];

const PROMPT_SUGGESTIONS = [
  {
    id: 'arrange-sections',
    label: 'Arrange into sections',
    description: 'Turn the current sketch into intro, lift, and outro without losing the original mood.',
    prompt: 'Turn the current song into a clear intro, lift, and outro. Keep the same overall mood and palette, and return a full revised sketch.',
  },
  {
    id: 'simplify-and-groove',
    label: 'Simplify and groove',
    description: 'Keep the core harmony, simplify the melody, and add a soft rhythmic pulse.',
    prompt: 'Keep the current pad and harmony, simplify the melody, add a soft percussion pulse, and return a full revised sketch that stays playable and uncluttered.',
  },
  {
    id: 'title-screen-loop',
    label: 'Title-screen loop',
    description: 'Reframe the current song as a game-ready loop with atmosphere and restraint.',
    prompt: 'Rewrite the current song as a polished title-screen loop for a rainy game menu. Keep it atmospheric, restrained, and seamless, and return a full revised sketch.',
  },
  {
    id: 'second-half-counterline',
    label: 'Add a counterline',
    description: 'Introduce a brighter counterline in the back half while keeping the lead intact.',
    prompt: 'Keep the current lead and harmony, but add a brighter counterline in the second half of the loop. Keep it musical, not crowded, and return a full revised sketch.',
  },
  {
    id: 'declutter-motion',
    label: 'Declutter, then build',
    description: 'Reduce clutter first, then add a little forward motion in the later bars.',
    prompt: 'Keep the current harmony, remove clutter, and then add a gentle sense of motion in the later bars. Return a full revised sketch.',
  },
];

const MOOD_AXES = [
  {
    id: 'energy',
    label: 'Energy',
    options: [
      { value: -1, label: 'Calmer', summary: 'calmer', prompt: 'calmer, softer, and more spacious' },
      { value: 0, label: 'Balanced', summary: 'balanced', prompt: '' },
      { value: 1, label: 'More Intense', summary: 'more intense', prompt: 'more intense and more propulsive' },
    ],
  },
  {
    id: 'tone',
    label: 'Tone',
    options: [
      { value: -1, label: 'Darker', summary: 'darker', prompt: 'darker and warmer' },
      { value: 0, label: 'Balanced', summary: 'balanced', prompt: '' },
      { value: 1, label: 'Brighter', summary: 'brighter', prompt: 'brighter and more open' },
    ],
  },
  {
    id: 'density',
    label: 'Density',
    options: [
      { value: -1, label: 'Sparser', summary: 'sparser', prompt: 'sparser and less busy' },
      { value: 0, label: 'Balanced', summary: 'balanced', prompt: '' },
      { value: 1, label: 'Busier', summary: 'busier', prompt: 'busier and more layered' },
    ],
  },
];

const elements = {
  applyMoodButton: document.getElementById('apply-mood'),
  chatAutoApply: document.getElementById('chat-auto-apply'),
  chatAutoPlay: document.getElementById('chat-auto-play'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  chatMessages: document.getElementById('chat-messages'),
  chatModelSelect: document.getElementById('chat-model-select'),
  chatNote: document.getElementById('chat-note'),
  chatPromptChips: document.getElementById('chat-prompt-chips'),
  chatPromptSuggestions: document.getElementById('chat-prompt-suggestions'),
  chatProviderSelect: document.getElementById('chat-provider-select'),
  chatStatus: document.getElementById('chat-status'),
  chatStylePresets: document.getElementById('chat-style-presets'),
  chatVariationButtons: document.getElementById('chat-variation-buttons'),
  clearChatButton: document.getElementById('clear-chat'),
  compareClearButton: document.getElementById('compare-clear'),
  compareLabelA: document.getElementById('compare-label-a'),
  compareLabelB: document.getElementById('compare-label-b'),
  compareLoadAButton: document.getElementById('compare-load-a'),
  compareLoadBButton: document.getElementById('compare-load-b'),
  compareNoteA: document.getElementById('compare-note-a'),
  compareNoteB: document.getElementById('compare-note-b'),
  comparePanel: document.getElementById('compare-panel'),
  comparePlayAButton: document.getElementById('compare-play-a'),
  comparePlayBButton: document.getElementById('compare-play-b'),
  compareSideA: document.getElementById('compare-side-a'),
  compareSideB: document.getElementById('compare-side-b'),
  compareSource: document.getElementById('compare-source'),
  compareStatus: document.getElementById('compare-status'),
  compareSummary: document.getElementById('compare-summary'),
  codeEditor: document.getElementById('code'),
  deleteButton: document.getElementById('delete-sketch'),
  errorOutput: document.getElementById('error'),
  exportButton: document.getElementById('export-sketch'),
  importButton: document.getElementById('import-sketch'),
  importFile: document.getElementById('import-file'),
  insertPresetButton: document.getElementById('insert-preset'),
  moodControls: document.getElementById('mood-controls'),
  moodSummary: document.getElementById('mood-summary'),
  paletteTags: document.getElementById('palette-tags'),
  playButton: document.getElementById('play-song'),
  presetSelect: document.getElementById('preset-select'),
  reloadButton: document.getElementById('reload-sketch'),
  repairActions: document.getElementById('repair-actions'),
  repairButton: document.getElementById('repair-code'),
  repairNote: document.getElementById('repair-note'),
  repairPlayButton: document.getElementById('repair-code-play'),
  saveButton: document.getElementById('save-sketch'),
  saveCopyButton: document.getElementById('save-copy'),
  select: document.getElementById('sketch-select'),
  sketchDescription: document.getElementById('sketch-description'),
  sketchMeta: document.getElementById('sketch-meta'),
  sketchTitle: document.getElementById('sketch-title'),
  status: document.getElementById('status'),
  stopButton: document.getElementById('stop-song'),
  toastViewport: document.getElementById('toast-viewport'),
  resetMoodButton: document.getElementById('reset-mood'),
};

const state = {
  chat: {
    autoApply: true,
    autoPlay: false,
    fileCount: 0,
    messages: [],
    model: '',
    mode: 'loading',
    mood: createDefaultMoodState(),
    provider: 'extractive',
    providers: [],
    ready: false,
  },
  current: null,
  compare: null,
  dirty: false,
  loadedCode: '',
  localSketches: loadLocalSketches(),
  repair: null,
};

let editorInstance = null;
let audioReady = null;
let modulesLoading = null;
let activeToastTimeout = null;

const LOCAL_PAD_UNSUPPORTED_RULES = [
  {
    pattern: /\bloadOrc\s*\(/u,
    reason: 'This sketch uses `loadOrc()`, which depends on the Csound runtime and is not available in this local Jester pad.',
  },
  {
    pattern: /\bcsound\s*\(/iu,
    reason: 'This sketch uses Csound-specific helpers that are not available in this local Jester pad.',
  },
  {
    pattern: /^\s*await\b/mu,
    reason: 'This sketch depends on async setup code, which is not directly runnable in this local editor.',
  },
  {
    pattern: /^\s*import\s.+$/mu,
    reason: 'This sketch expects module imports, which are not directly runnable in this local editor.',
  },
];

function getEditorCode() {
  return editorInstance?.editor?.state?.doc?.toString?.() || editorInstance?.code || '';
}

function setEditorCode(code) {
  editorInstance?.setCode(code);
}

function normalizeEditorCode(code) {
  return String(code || '').replace(/\r\n/g, '\n').trimEnd();
}

function setLoadedCode(code) {
  state.loadedCode = normalizeEditorCode(code);
}

function hasEditorChanges() {
  return normalizeEditorCode(getEditorCode()) !== normalizeEditorCode(state.loadedCode);
}

function syncDirtyFromEditor() {
  const nextDirty = hasEditorChanges();
  if (state.dirty !== nextDirty) {
    markDirty(nextDirty);
  }
  return nextDirty;
}

function getLocalPadCodeIssue(code = '') {
  const source = String(code || '').trim();
  if (!source) {
    return '';
  }

  for (const rule of LOCAL_PAD_UNSUPPORTED_RULES) {
    if (rule.pattern.test(source)) {
      return rule.reason;
    }
  }

  return '';
}

function getLoadableExampleIssue(code = '') {
  const runtimeIssue = getLocalPadCodeIssue(code);
  if (runtimeIssue) {
    return runtimeIssue;
  }

  const source = String(code || '').trim();
  if (!source) {
    return '';
  }

  if (/\bqueryArc\s*\(/u.test(source) || /\bcreateParams?\s*\(/u.test(source)) {
    return 'This docs snippet explains an API, but it is not a full playable sketch for this local Jester pad.';
  }

  if (!/\b(?:setcps|stack|n|s)\s*\(/u.test(source)) {
    return 'This docs snippet is not a full playable sketch for this local Jester pad.';
  }

  return '';
}

function buildRepairPrompt({ issue = '', sourceLabel = 'current sketch' } = {}) {
  const details = issue ? `Current problem: ${issue}` : 'Current problem: the sketch is broken or not runnable in this local Jester pad.';
  return [
    `Repair ${sourceLabel} for the local Jester pad.`,
    details,
    'Keep the main musical idea if possible, but prioritize returning one full playable sketch that runs here right now.',
    'Use only local-pad-safe syntax: setcps, one top-level stack, n, s, .scale("A4:dorian") style scales, sine/triangle/square/sawtooth, the crate bank, and safe effects like gain, room, delay, lpf, lpq, attack, decay, sustain, release, slow, mask, and resonance.',
    'Remove unsupported helpers or imports if needed.',
    'Return exactly one full revised sketch.',
  ].join(' ');
}

function getRepairTargetCode(message = null) {
  if (typeof message?.repairCode === 'string' && message.repairCode.trim()) {
    return message.repairCode;
  }

  if (message?.codeIssue && typeof message?.code === 'string' && message.code.trim()) {
    return message.code;
  }

  return '';
}

function setRepairContext(context = null) {
  const code = String(context?.code || '').trim();
  if (!code) {
    state.repair = null;
    renderRepairActions();
    return;
  }

  state.repair = {
    code,
    issue: String(context?.issue || '').trim(),
    sourceLabel: String(context?.sourceLabel || 'this sketch').trim(),
  };
  renderRepairActions();
}

function summarizeComparePrompt(prompt = '') {
  const source = String(prompt || '').trim();
  if (!source) {
    return 'Latest AI song revision is armed for quick A/B playback.';
  }

  const compact = source.replace(/\s+/g, ' ');
  return compact.length > 140 ? `${compact.slice(0, 137)}...` : compact;
}

function getCompareSide(side) {
  if (!state.compare) {
    return null;
  }

  if (side === 'a') {
    return {
      code: state.compare.baseCode,
      label: state.compare.baseLabel,
    };
  }

  if (side === 'b') {
    return {
      code: state.compare.candidateCode,
      label: state.compare.candidateLabel,
    };
  }

  return null;
}

function getCompareMatch() {
  if (!state.compare) {
    return '';
  }

  const current = normalizeEditorCode(getEditorCode());
  if (!current) {
    return '';
  }

  if (current === normalizeEditorCode(state.compare.baseCode)) {
    return 'a';
  }

  if (current === normalizeEditorCode(state.compare.candidateCode)) {
    return 'b';
  }

  return 'custom';
}

function renderComparePanel() {
  if (!elements.comparePanel) {
    return;
  }

  const compare = state.compare;
  const hasCompare = Boolean(compare?.baseCode && compare?.candidateCode);
  elements.comparePanel.hidden = !hasCompare;

  if (!hasCompare) {
    return;
  }

  const match = getCompareMatch();
  const hasCustomEdits = match === 'custom';

  elements.compareLabelA.textContent = compare.baseLabel;
  elements.compareLabelB.textContent = compare.candidateLabel;
  elements.compareSummary.textContent = summarizeComparePrompt(compare.prompt);
  elements.compareSource.textContent = compare.sourceLabel || 'Latest AI song revision is armed for quick A/B playback.';

  elements.compareSideA.classList.toggle('active', match === 'a');
  elements.compareSideB.classList.toggle('active', match === 'b');
  elements.compareNoteA.textContent = match === 'a' ? 'Loaded now' : hasCustomEdits ? 'Available' : 'Ready';
  elements.compareNoteB.textContent = match === 'b' ? 'Loaded now' : hasCustomEdits ? 'Available' : 'Ready';

  if (match === 'a') {
    elements.compareStatus.textContent = 'Current editor matches A.';
  } else if (match === 'b') {
    elements.compareStatus.textContent = 'Current editor matches B.';
  } else if (match === 'custom') {
    elements.compareStatus.textContent = 'Current editor has drifted from the compare pair.';
  } else {
    elements.compareStatus.textContent = 'Compare is ready.';
  }
}

function setCompareSession(session = null) {
  const baseCode = normalizeEditorCode(session?.baseCode || '');
  const candidateCode = normalizeEditorCode(session?.candidateCode || '');

  if (!baseCode || !candidateCode || baseCode === candidateCode) {
    state.compare = null;
    renderComparePanel();
    return;
  }

  state.compare = {
    baseCode,
    baseLabel: String(session?.baseLabel || 'A · Previous sketch').trim(),
    candidateCode,
    candidateLabel: String(session?.candidateLabel || 'B · Jester revision').trim(),
    prompt: String(session?.prompt || '').trim(),
    sourceLabel: String(session?.sourceLabel || 'Latest AI song revision is armed for quick A/B playback.').trim(),
  };
  renderComparePanel();
}

function setCompareSessionFromMessage(message) {
  if (!message?.appliable || !message?.code || !message?.compareBaseCode) {
    return false;
  }

  setCompareSession({
    baseCode: message.compareBaseCode,
    baseLabel: message.compareBaseLabel || 'A · Previous sketch',
    candidateCode: message.code,
    candidateLabel: message.compareCandidateLabel || 'B · Jester revision',
    prompt: message.comparePrompt || '',
    sourceLabel: 'Latest AI song revision is armed for quick A/B playback.',
  });
  return Boolean(state.compare);
}

function confirmCompareSwap(targetLabel) {
  const compare = state.compare;
  if (!compare) {
    return false;
  }

  const current = normalizeEditorCode(getEditorCode());
  if (!current) {
    return true;
  }

  const matchesKnownSide =
    current === normalizeEditorCode(compare.baseCode) ||
    current === normalizeEditorCode(compare.candidateCode);

  if (matchesKnownSide) {
    return true;
  }

  return window.confirm(`The editor has edits outside the current compare pair. Replace them with ${targetLabel}?`);
}

async function loadCompareSide(side, { playAfterLoad = false } = {}) {
  const snapshot = getCompareSide(side);
  if (!snapshot?.code) {
    setStatus('No compare snapshot is ready yet.');
    return;
  }

  if (!confirmCompareSwap(snapshot.label)) {
    return;
  }

  replaceEditorCode(`${snapshot.code.trimEnd()}\n`);
  setRepairContext(null);
  setError();
  syncDirtyFromEditor();
  renderComparePanel();

  if (playAfterLoad) {
    setStatus(`Loaded ${snapshot.label}. Re-evaluating...`);
    await playCurrentCode();
    showToast(`Playing ${snapshot.label}.`);
    return;
  }

  setStatus(`Loaded ${snapshot.label}. Press Play to hear it.`);
  showToast(`Loaded ${snapshot.label}.`);
}

function replaceEditorCode(code, { cursor = 0 } = {}) {
  setEditorCode(code);

  const editorView = editorInstance?.editor;
  if (!editorView) {
    setEditorCursor(cursor);
    return;
  }

  editorView.dispatch({
    selection: { anchor: cursor },
    scrollIntoView: true,
  });

  const scroller = editorInstance?.root?.querySelector?.('.cm-scroller');
  if (scroller) {
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
  }
}

function getEditorCursor() {
  return editorInstance?.getCursorLocation?.() ?? 0;
}

function setEditorCursor(cursorPosition) {
  editorInstance?.setCursorLocation?.(cursorPosition);
}

function focusEditor() {
  editorInstance?.editor?.focus?.();
}

function initializeCodeEditor() {
  if (editorInstance) {
    return editorInstance;
  }

  audioReady ||= webaudio.initAudioOnFirstClick();
  modulesLoading ||= core.evalScope(core, draw, mini, tonal, webaudio);

  editorInstance = new StrudelMirror({
    root: elements.codeEditor,
    initialCode: '// Loading...',
    pattern: core.silence,
    transpiler,
    defaultOutput: webaudio.webaudioOutput,
    getTime: () => webaudio.getAudioContext().currentTime,
    beforeStart: () => audioReady,
    prebake: async () => {
      await Promise.all([modulesLoading, webaudio.registerSynthSounds(), webaudio.samples('github:eddyflux/crate')]);
    },
    onEvalError: handleCodeEvalError,
    afterEval: () => {
      setRepairContext(null);
      setError();
      setStatus('Playing. Active mini-notation will highlight in the editor.');
    },
  });

  editorInstance.updateSettings({
    fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
    fontSize: 14,
    isActiveLineHighlighted: false,
    isLineNumbersDisplayed: false,
    isPatternHighlightingEnabled: true,
    theme: 'strudelTheme',
  });

  elements.codeEditor.addEventListener('input', () => {
    markDirty(true);
  });

  return editorInstance;
}

function setStatus(message) {
  elements.status.textContent = message;
}

function setError(message = '') {
  elements.errorOutput.hidden = message === '';
  elements.errorOutput.textContent = message;
}

function renderRepairActions() {
  if (!elements.repairActions) {
    return;
  }

  const repair = state.repair;
  const hasRepair = Boolean(repair?.code);
  elements.repairActions.hidden = !hasRepair;

  if (!hasRepair) {
    if (elements.repairNote) {
      elements.repairNote.textContent = 'Jester can try a local-pad-safe repair for this sketch.';
    }
    return;
  }

  if (elements.repairNote) {
    const issueText = repair.issue ? ` Current issue: ${repair.issue}` : '';
    elements.repairNote.textContent = `Jester can try a local-pad-safe repair for ${repair.sourceLabel}.${issueText}`;
  }
}

function setChatStatus(message) {
  elements.chatStatus.textContent = message;
}

function setChatNote(message) {
  elements.chatNote.textContent = message;
}

function showToast(message, { tone = 'success', duration = 2800 } = {}) {
  if (!elements.toastViewport || !message) {
    return;
  }

  if (activeToastTimeout) {
    window.clearTimeout(activeToastTimeout);
    activeToastTimeout = null;
  }

  elements.toastViewport.replaceChildren();

  const toast = document.createElement('div');
  toast.className = `toast ${tone}`.trim();
  toast.textContent = message;
  elements.toastViewport.append(toast);

  window.requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  activeToastTimeout = window.setTimeout(() => {
    toast.classList.remove('visible');
    window.setTimeout(() => {
      if (toast.parentNode === elements.toastViewport) {
        toast.remove();
      }
    }, 180);
    activeToastTimeout = null;
  }, duration);
}

function focusChatInput() {
  elements.chatInput.focus();
  const length = elements.chatInput.value.length;
  elements.chatInput.setSelectionRange(length, length);
}

function setChatInputValue(value, { focus = true } = {}) {
  elements.chatInput.value = value;
  if (focus) {
    focusChatInput();
  }
}

function normalizeMoodValue(value) {
  return value === -1 || value === 1 ? value : 0;
}

function createDefaultMoodState() {
  return {
    density: 0,
    energy: 0,
    tone: 0,
  };
}

function hydrateMoodState(candidate = null) {
  const next = createDefaultMoodState();
  if (!candidate || typeof candidate !== 'object') {
    return next;
  }

  MOOD_AXES.forEach((axis) => {
    next[axis.id] = normalizeMoodValue(candidate[axis.id]);
  });

  return next;
}

function joinHumanList(items) {
  const values = items.filter(Boolean);
  if (!values.length) {
    return '';
  }
  if (values.length === 1) {
    return values[0];
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function getMoodAxis(axisId) {
  return MOOD_AXES.find((axis) => axis.id === axisId) || null;
}

function getMoodOption(axisId, value) {
  const axis = getMoodAxis(axisId);
  if (!axis) {
    return null;
  }
  return axis.options.find((option) => option.value === normalizeMoodValue(value)) || axis.options[1] || null;
}

function getActiveMoodSelections() {
  return MOOD_AXES
    .map((axis) => ({ axis, option: getMoodOption(axis.id, state.chat.mood[axis.id]) }))
    .filter(({ option }) => option && option.value !== 0);
}

function getMoodSummaryText() {
  const active = getActiveMoodSelections();
  if (!active.length) {
    return 'Balanced';
  }
  return joinHumanList(active.map(({ option }) => option.summary));
}

function buildMoodPromptClause() {
  const active = getActiveMoodSelections();
  if (!active.length) {
    return '';
  }
  return joinHumanList(active.map(({ option }) => option.prompt));
}

function hasActiveMoodControls() {
  return getActiveMoodSelections().length > 0;
}

function buildMoodPromptSuffix() {
  const clause = buildMoodPromptClause();
  if (!clause) {
    return '';
  }
  return `Honor these direct mood controls: make the music ${clause}.`;
}

function buildMoodOnlyQuestion(currentCode = '') {
  const clause = buildMoodPromptClause();
  if (!clause) {
    return '';
  }

  if (String(currentCode || '').trim()) {
    return `Keep the current song recognizable, but make it ${clause}. Return a full revised sketch.`;
  }

  return `Write one full playable sketch that feels ${clause}. Return exactly one complete sketch.`;
}

function resolvePromptWithMoodControls({ question = '', currentCode = '', forceMoodOnly = false } = {}) {
  const trimmedQuestion = String(question || '').trim();
  const moodActive = hasActiveMoodControls();
  const appliesToSong = moodActive && (isSongEditRequest(trimmedQuestion, currentCode) || isSongCreateRequest(trimmedQuestion));

  if (forceMoodOnly) {
    const effectiveQuestion = buildMoodOnlyQuestion(currentCode);
    return {
      displayQuestion: String(currentCode || '').trim()
        ? `Apply mood controls to the current song.\n\nMood controls: ${getMoodSummaryText()}.`
        : `Make a new song from the current mood controls.\n\nMood controls: ${getMoodSummaryText()}.`,
      effectiveQuestion,
      moodApplied: Boolean(effectiveQuestion),
    };
  }

  if (!appliesToSong) {
    return {
      displayQuestion: trimmedQuestion,
      effectiveQuestion: trimmedQuestion,
      moodApplied: false,
    };
  }

  const suffix = buildMoodPromptSuffix();
  return {
    displayQuestion: `${trimmedQuestion}\n\nMood controls: ${getMoodSummaryText()}.`,
    effectiveQuestion: `${trimmedQuestion}${/[.!?]$/.test(trimmedQuestion) ? '' : '.'} ${suffix}`.trim(),
    moodApplied: true,
  };
}

function setMoodAxis(axisId, nextValue, { persist = true } = {}) {
  if (!Object.hasOwn(state.chat.mood, axisId)) {
    return;
  }

  state.chat.mood[axisId] = normalizeMoodValue(nextValue);
  renderMoodControls();
  refreshChatSummary();

  if (persist) {
    persistChatConfig();
  }
}

function resetMoodControls({ persist = true } = {}) {
  state.chat.mood = createDefaultMoodState();
  renderMoodControls();
  refreshChatSummary();

  if (persist) {
    persistChatConfig();
  }
}

function isSongCreateRequest(query) {
  return /\b(song|sketch|track|piece|compose|composition|full example|full pattern|sample song|write me|make me|generate)\b/i.test(
    query,
  );
}

function isSongEditRequest(query, currentCode = '') {
  if (!currentCode.trim()) {
    return false;
  }

  return /\b(change|edit|modify|update|revise|rewrite|rework|fix|repair|make it|make the|turn it|turn the|keep|add|remove|swap|replace|simplify|complex|denser|sparser|darker|brighter|longer|shorter|more|less|this song|this sketch|current sketch|current song|same sketch|same song)\b/i.test(
    query,
  );
}

function getSubmitChatStatus(query, currentCode = '') {
  if (isSongEditRequest(query, currentCode) || isSongCreateRequest(query)) {
    return 'Composing…';
  }

  return 'Thinking…';
}

function getApplyToastMessage({ appliable, playAfterApply, skipConfirm }) {
  if (!appliable) {
    return '';
  }

  if (skipConfirm) {
    return playAfterApply ? 'Jester updated the song automatically and restarted playback.' : 'Jester updated the song automatically.';
  }

  return playAfterApply ? 'Jester updated the song and started playback.' : 'Jester updated the song.';
}

function appendPromptChip(chip) {
  const current = elements.chatInput.value.trim();
  const nextPrompt = current
    ? `${current}${/[.!?]$/.test(current) ? '' : '.'} Also, ${chip.append}.`
    : chip.seed;
  setChatInputValue(nextPrompt);
  setStatus(`Added ${chip.label.toLowerCase()} to the prompt.`);
}

function loadPromptSuggestion(prompt) {
  setChatInputValue(prompt);
  setStatus('Loaded a prompt suggestion. Edit it or press Ask.');
}

function createGuideButton({ label, title = '', className = 'secondary guide-button', onClick }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  if (title) {
    button.title = title;
  }
  button.addEventListener('click', onClick);
  return button;
}

function stylePresetLabel(sketch) {
  return sketch.label.replace(/^Starter:\s*/u, '');
}

function renderVariationButtons() {
  elements.chatVariationButtons.innerHTML = '';

  VARIATION_ACTIONS.forEach((action) => {
    elements.chatVariationButtons.append(
      createGuideButton({
        label: action.label,
        title: action.prompt,
        onClick: () => {
          submitChatQuestion({ question: action.prompt, clearInput: false }).catch(handleError);
        },
      }),
    );
  });
}

function renderPromptChipButtons() {
  elements.chatPromptChips.innerHTML = '';

  PROMPT_CHIPS.forEach((chip) => {
    elements.chatPromptChips.append(
      createGuideButton({
        label: chip.label,
        title: chip.seed,
        className: 'prompt-chip-button',
        onClick: () => appendPromptChip(chip),
      }),
    );
  });
}

function renderStylePresetButtons() {
  elements.chatStylePresets.innerHTML = '';

  BUILTIN_SKETCHES.filter((sketch) => sketch.category === 'Starter').forEach((sketch) => {
    elements.chatStylePresets.append(
      createGuideButton({
        label: stylePresetLabel(sketch),
        title: sketch.description,
        onClick: () => {
          loadBuiltinSketch(sketch.id).then((loaded) => {
            if (!loaded) {
              return;
            }
            setChatInputValue('Keep the overall vibe of this sketch, but ');
            setStatus(`Loaded ${stylePresetLabel(sketch)}. Press Play or ask Jester for a revision.`);
          }).catch(handleError);
        },
      }),
    );
  });
}

function renderPromptSuggestions() {
  elements.chatPromptSuggestions.innerHTML = '';

  PROMPT_SUGGESTIONS.forEach((suggestion) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary suggestion-card';
    button.title = suggestion.prompt;

    const title = document.createElement('span');
    title.className = 'suggestion-title';
    title.textContent = suggestion.label;
    button.append(title);

    const description = document.createElement('span');
    description.className = 'suggestion-description';
    description.textContent = suggestion.description;
    button.append(description);

    button.addEventListener('click', () => loadPromptSuggestion(suggestion.prompt));
    elements.chatPromptSuggestions.append(button);
  });
}

function renderMoodControls() {
  elements.moodControls.innerHTML = '';

  MOOD_AXES.forEach((axis) => {
    const row = document.createElement('div');
    row.className = 'mood-axis';

    const label = document.createElement('div');
    label.className = 'mood-axis-label';
    label.textContent = axis.label;
    row.append(label);

    const options = document.createElement('div');
    options.className = 'mood-axis-options';

    axis.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `secondary mood-option ${state.chat.mood[axis.id] === option.value ? 'active' : ''}`.trim();
      button.textContent = option.label;
      button.setAttribute('aria-pressed', state.chat.mood[axis.id] === option.value ? 'true' : 'false');
      button.addEventListener('click', () => {
        const currentValue = state.chat.mood[axis.id];
        const nextValue = currentValue === option.value && option.value !== 0 ? 0 : option.value;
        setMoodAxis(axis.id, nextValue);
        setStatus(`Mood controls: ${getMoodSummaryText()}.`);
      });
      options.append(button);
    });

    row.append(options);
    elements.moodControls.append(row);
  });

  const active = getActiveMoodSelections();
  elements.moodSummary.textContent = active.length
    ? `Active mood: ${joinHumanList(active.map(({ option }) => option.summary))}. Ask normally, or apply the current mood directly.`
    : 'Balanced. Ask normally, or apply the current mood directly.';
}

function renderGuidedChatControls() {
  renderMoodControls();
  renderVariationButtons();
  renderPromptChipButtons();
  renderStylePresetButtons();
  renderPromptSuggestions();
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderChatMessages() {
  elements.chatMessages.innerHTML = '';

  state.chat.messages.forEach((message) => {
    const article = document.createElement('article');
    article.className = `chat-message ${message.role}`;

    const role = document.createElement('div');
    role.className = 'chat-role';
    role.textContent = message.role === 'assistant' ? 'Strudel' : 'You';
    article.append(role);

    const content = document.createElement('div');
    content.className = 'chat-content';
    content.textContent = message.content;
    article.append(content);

    if (message.codeIssue) {
      const runtimeNote = document.createElement('div');
      runtimeNote.className = 'chat-runtime-note';
      runtimeNote.textContent = message.codeIssue;
      article.append(runtimeNote);
    }

    const repairCode = getRepairTargetCode(message);
    if (message.code && !message.codeIssue) {
      const actions = document.createElement('div');
      actions.className = 'chat-actions';

      const button = document.createElement('button');
      button.className = 'secondary';
      button.type = 'button';
      button.textContent = message.appliable ? 'Apply To Song' : 'Load Example';
      button.addEventListener('click', () => {
        applyChatCodeMessage(message, { playAfterApply: false, focusAfterApply: true }).catch(handleError);
      });
      actions.append(button);

      if (message.appliable) {
        const playButton = document.createElement('button');
        playButton.className = 'secondary';
        playButton.type = 'button';
        playButton.textContent = 'Apply + Play';
        playButton.addEventListener('click', () => {
          applyChatCodeMessage(message, { playAfterApply: true, focusAfterApply: true }).catch(handleError);
        });
        actions.append(playButton);

        if (message.compareBaseCode) {
          const compareButton = document.createElement('button');
          compareButton.className = 'secondary';
          compareButton.type = 'button';
          compareButton.textContent = 'Compare A/B';
          compareButton.addEventListener('click', () => {
            if (setCompareSessionFromMessage(message)) {
              setStatus('Live Compare is ready. Load or play A and B from the compare tray.');
              showToast('Live Compare is ready for this revision.');
            }
          });
          actions.append(compareButton);
        }
      }

      if (message.appliedLive) {
        const appliedNote = document.createElement('span');
        appliedNote.className = 'chip muted';
        appliedNote.textContent = message.appliedLive;
        actions.append(appliedNote);
      }

      article.append(actions);
    } else if (message.codeIssue && repairCode) {
      const actions = document.createElement('div');
      actions.className = 'chat-actions';

      const button = document.createElement('button');
      button.className = 'secondary';
      button.type = 'button';
      button.textContent = 'Fix For This Pad';
      button.addEventListener('click', () => {
        requestCodeRepair({
          code: repairCode,
          issue: message.codeIssue,
          sourceLabel: 'this sketch',
          playAfterApply: false,
        }).catch(handleError);
      });
      actions.append(button);

      const playButton = document.createElement('button');
      playButton.className = 'secondary';
      playButton.type = 'button';
      playButton.textContent = 'Fix + Play';
      playButton.addEventListener('click', () => {
        requestCodeRepair({
          code: repairCode,
          issue: message.codeIssue,
          sourceLabel: 'this sketch',
          playAfterApply: true,
        }).catch(handleError);
      });
      actions.append(playButton);

      article.append(actions);
    }

    if (Array.isArray(message.sources) && message.sources.length) {
      const sourcesShell = document.createElement('details');
      sourcesShell.className = 'chat-sources-shell';

      const summary = document.createElement('summary');
      summary.textContent = `References (${message.sources.length})`;
      sourcesShell.append(summary);

      const sources = document.createElement('div');
      sources.className = 'chat-sources';

      message.sources.forEach((source) => {
        const label = `[${source.citation}] ${source.title}${source.section ? ` · ${source.section}` : ''}`;
        if (source.docUrl) {
          const link = document.createElement('a');
          link.className = 'source-link';
          link.href = source.docUrl;
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = label;
          sources.append(link);
          return;
        }

        const span = document.createElement('span');
        span.className = 'source-link';
        span.textContent = label;
        span.title = source.relativePath;
        sources.append(span);
      });

      sourcesShell.append(sources);
      article.append(sourcesShell);
    }

    elements.chatMessages.append(article);
  });

  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function pushChatMessage(message) {
  state.chat.messages.push(message);
  renderChatMessages();
}

function clearChat() {
  state.chat.messages = [
    {
      role: 'assistant',
      content: 'Ask me about Strudel features, syntax, samples, effects, scheduling, or ask me to revise the current song live. You can also steer revisions with the mood controls and press Apply Mood. For example: "Keep the bass, make the melody darker, and add a drifting pad."',
      sources: [],
      code: null,
    },
  ];
  renderChatMessages();
}

function loadStoredChatConfig() {
  const raw = getStorageValue(STORAGE_KEYS.chatConfig);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Could not parse stored chat config', error);
    return null;
  }
}

function persistChatConfig() {
  setStorageValue(
    STORAGE_KEYS.chatConfig,
    JSON.stringify({
      provider: state.chat.provider,
      model: state.chat.model,
      autoApply: state.chat.autoApply,
      autoPlay: state.chat.autoPlay,
      mood: state.chat.mood,
    }),
  );
}

function formatProviderName(provider) {
  if (!provider || provider === 'extractive') {
    return 'local docs';
  }

  return provider
    .split(/[-_]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function usesLlmMode(mode) {
  return Boolean(mode) && !String(mode).startsWith('extractive');
}

function getChatProvider(providerId) {
  return state.chat.providers.find((provider) => provider.id === providerId) || null;
}

function isChatProviderSelectable(provider) {
  return Boolean(provider) && (provider.id === 'extractive' || provider.llmEnabled);
}

function resolveChatModel(providerId, requestedModel = '') {
  const provider = getChatProvider(providerId);
  if (!provider || provider.id === 'extractive' || !Array.isArray(provider.models) || !provider.models.length) {
    return '';
  }

  if (provider.models.includes(requestedModel)) {
    return requestedModel;
  }

  return provider.defaultModel || provider.models[0] || '';
}

function renderChatProviderOptions() {
  elements.chatProviderSelect.innerHTML = '';

  state.chat.providers.forEach((provider) => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.id === 'extractive'
      ? 'Extractive only'
      : provider.llmEnabled
        ? provider.label
        : `${provider.label} (Unavailable)`;
    option.disabled = !isChatProviderSelectable(provider);
    elements.chatProviderSelect.append(option);
  });
}

function renderChatModelOptions() {
  const provider = getChatProvider(state.chat.provider);
  elements.chatModelSelect.innerHTML = '';

  if (!provider || provider.id === 'extractive' || !provider.models.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Docs only';
    elements.chatModelSelect.append(option);
    elements.chatModelSelect.value = '';
    elements.chatModelSelect.disabled = true;
    return;
  }

  provider.models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    elements.chatModelSelect.append(option);
  });

  elements.chatModelSelect.disabled = false;
  elements.chatModelSelect.value = resolveChatModel(state.chat.provider, state.chat.model);
}

function refreshChatSummary({ fallback = false } = {}) {
  if (!state.chat.ready) {
    return;
  }

  const provider = getChatProvider(state.chat.provider);
  const providerLabel = formatProviderName(state.chat.provider);

  if (!provider || state.chat.provider === 'extractive' || !provider.llmEnabled) {
    setChatStatus('Docs ready');
    setChatNote(
      `Grounded in ${state.chat.fileCount} local docs files. Using local extractive answers only. The current editor code is still sent with each question.${hasActiveMoodControls() ? ` Mood controls live: ${getMoodSummaryText()}.` : ''}`,
    );
    return;
  }

  if (fallback) {
    setChatStatus('Docs fallback');
    setChatNote(
      `Grounded in ${state.chat.fileCount} local docs files. ${providerLabel} failed for that answer, so the app fell back to local extractive mode.${hasActiveMoodControls() ? ` Mood controls live: ${getMoodSummaryText()}.` : ''}`,
    );
    return;
  }

  setChatStatus(`Docs + ${providerLabel} ready`);
  setChatNote(
    `Grounded in ${state.chat.fileCount} local docs files. Using ${providerLabel}${state.chat.model ? ` (${state.chat.model})` : ''} for synthesized answers. The current editor code is included with each question.${state.chat.autoApply ? ' Song revisions apply live to the editor.' : ''}${state.chat.autoPlay ? ' Auto-play is on.' : ''}${hasActiveMoodControls() ? ` Mood controls live: ${getMoodSummaryText()}.` : ''}`,
  );
}

function applyChatConfig(providerId, requestedModel = '', { persist = true } = {}) {
  const provider = getChatProvider(providerId);
  const nextProvider = isChatProviderSelectable(provider) ? provider.id : 'extractive';
  state.chat.provider = nextProvider;
  state.chat.model = resolveChatModel(nextProvider, requestedModel);

  elements.chatProviderSelect.value = nextProvider;
  renderChatModelOptions();

  if (persist) {
    persistChatConfig();
  }

  refreshChatSummary();
}

async function initializeDocsChat() {
  clearChat();
  setChatStatus('Loading local docs…');

  try {
    const response = await fetch('./api/chat/status', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Chat status failed: ${response.status}`);
    }

    const data = await response.json();
    state.chat.ready = Boolean(data.ready);
    state.chat.mode = data.mode || 'unavailable';
    state.chat.fileCount = Number(data.fileCount || 0);
    state.chat.providers = Array.isArray(data.providers) ? data.providers : [];

    if (!data.ready) {
      setChatStatus('Docs unavailable');
      setChatNote(data.reason || 'The local Strudel docs index is not available.');
      return;
    }

    renderChatProviderOptions();

    const storedConfig = loadStoredChatConfig();
    state.chat.autoApply = storedConfig?.autoApply ?? true;
    state.chat.autoPlay = storedConfig?.autoPlay ?? false;
    state.chat.mood = hydrateMoodState(storedConfig?.mood);
    elements.chatAutoApply.checked = state.chat.autoApply;
    elements.chatAutoPlay.checked = state.chat.autoPlay;
    renderMoodControls();
    const initialProvider = storedConfig?.provider || data.provider || 'extractive';
    const initialModel = storedConfig?.model || data.model || '';
    applyChatConfig(initialProvider, initialModel, { persist: false });
  } catch (error) {
    console.error(error);
    state.chat.ready = false;
    setChatStatus('Docs unavailable');
    setChatNote('Could not load the local docs index.');
  }
}

async function submitChatQuestion({
  question = null,
  clearInput = true,
  currentCodeOverride = null,
  autoApplyOverride = null,
  autoPlayOverride = null,
  forceMoodOnly = false,
  submitStatus = '',
  liveApplyLabel = '',
} = {}) {
  const nextQuestion = typeof question === 'string' ? question.trim() : elements.chatInput.value.trim();
  const shouldClearInput = question === null ? true : clearInput;
  const currentCode = typeof currentCodeOverride === 'string' ? currentCodeOverride : getEditorCode();
  const promptContext = resolvePromptWithMoodControls({
    question: nextQuestion,
    currentCode,
    forceMoodOnly,
  });
  const questionText = promptContext.displayQuestion.trim();
  const effectiveQuestion = promptContext.effectiveQuestion.trim();
  if (!effectiveQuestion) {
    setStatus(forceMoodOnly ? 'Set at least one non-balanced mood first.' : 'Ask a question first.');
    return;
  }

  if (!state.chat.ready) {
    setChatStatus('Docs unavailable');
    return;
  }

  if (shouldClearInput) {
    elements.chatInput.value = '';
  }

  const shouldAutoApply = autoApplyOverride ?? state.chat.autoApply;
  const shouldAutoPlay = autoPlayOverride ?? state.chat.autoPlay;

  pushChatMessage({
    role: 'user',
    content: questionText || effectiveQuestion,
    sources: [],
    code: null,
  });
  setChatStatus(submitStatus || getSubmitChatStatus(effectiveQuestion, currentCode));

  try {
    const response = await fetch('./api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          provider: state.chat.provider,
          model: state.chat.model,
        },
        currentCode,
        messages: [
          ...state.chat.messages.slice(0, -1).map(({ role, content }) => ({ role, content })),
          {
            role: 'user',
            content: effectiveQuestion,
          },
        ],
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Chat request failed: ${response.status}`);
    }

    const data = await response.json();
    state.chat.mode = data.mode || state.chat.mode;
    if (data.provider) {
      applyChatConfig(data.provider, data.model || state.chat.model);
    }
    const assistantMessage = {
      role: 'assistant',
      content: data.answer,
      sources: data.sources || [],
      code: data.code || null,
      compareBaseCode: currentCode || null,
      compareBaseLabel: 'A · Previous sketch',
      compareCandidateLabel: 'B · Jester revision',
      comparePrompt: effectiveQuestion,
      repairCode: data.repairCode || null,
      codeIssue: data.codeIssue || '',
      intent: data.intent || 'docs',
      appliable: Boolean(data.appliable),
      appliedLive: '',
    };
    pushChatMessage(assistantMessage);
    if (assistantMessage.appliable && assistantMessage.code && assistantMessage.compareBaseCode) {
      setCompareSessionFromMessage(assistantMessage);
    }
    if (shouldAutoApply && assistantMessage.appliable && assistantMessage.code) {
      await applyChatCodeMessage(assistantMessage, {
        playAfterApply: shouldAutoPlay,
        focusAfterApply: false,
        skipConfirm: true,
        liveApplyLabel: liveApplyLabel || (shouldAutoPlay ? 'Applied live and playing' : 'Applied live'),
      });
    }
    refreshChatSummary({ fallback: data.mode === 'extractive-fallback' });
  } catch (error) {
    console.error(error);
    pushChatMessage({
      role: 'assistant',
      content: error instanceof Error ? error.message : String(error),
      sources: [],
      code: null,
    });
    setChatStatus('There was a problem');
  }
}

async function applyCurrentMoodControls() {
  if (!hasActiveMoodControls()) {
    setStatus('Set at least one mood away from balanced first.');
    return;
  }

  const currentCode = getEditorCode();
  await submitChatQuestion({
    question: '',
    clearInput: false,
    currentCodeOverride: currentCode,
    forceMoodOnly: true,
    submitStatus: String(currentCode || '').trim() ? 'Shaping mood…' : 'Composing from mood…',
  });
}

async function requestCodeRepair({ code = '', issue = '', sourceLabel = 'this sketch', playAfterApply = false } = {}) {
  const source = String(code || '').trim();
  if (!source) {
    setStatus('There is no sketch to repair yet.');
    return;
  }

  await submitChatQuestion({
    question: buildRepairPrompt({ issue, sourceLabel }),
    clearInput: false,
    currentCodeOverride: source,
    autoApplyOverride: true,
    autoPlayOverride: playAfterApply,
    submitStatus: 'Repairing…',
    liveApplyLabel: playAfterApply ? 'Repaired live and playing' : 'Repaired live',
  });
}

async function applyChatCodeMessage(
  message,
  { playAfterApply = false, focusAfterApply = true, skipConfirm = false, liveApplyLabel = '' } = {},
) {
  if (!message?.code) {
    return;
  }

  const codeIssue = message.codeIssue || getLoadableExampleIssue(message.code);
  if (codeIssue) {
    message.codeIssue = codeIssue;
    setRepairContext({
      code: getRepairTargetCode(message),
      issue: codeIssue,
      sourceLabel: 'this sketch',
    });
    renderChatMessages();
    setError(codeIssue);
    setStatus('This example uses features the local Jester pad cannot run.');
    return;
  }

  if (!skipConfirm && !message.appliable) {
    const confirmed = window.confirm('Replace the current editor contents with this chat example?');
    if (!confirmed) {
      return;
    }
  }

  if (message.appliable && message.compareBaseCode) {
    setCompareSessionFromMessage(message);
  }

  replaceEditorCode(`${message.code.trimEnd()}\n`);
  setRepairContext(null);
  setError();
  markDirty(true);
  renderComparePanel();
  const toastMessage = getApplyToastMessage({
    appliable: message.appliable,
    playAfterApply,
    skipConfirm,
  });

  if (focusAfterApply) {
    focusEditor();
  }

  if (liveApplyLabel) {
    message.appliedLive = liveApplyLabel;
    renderChatMessages();
  }

  if (playAfterApply) {
    setStatus('Applied chat changes. Re-evaluating the song...');
    await playCurrentCode();
    showToast(toastMessage);
    return;
  }

  setStatus(message.appliable ? 'Applied the chat revision to the editor.' : 'Loaded the chat example into the editor. Press Play to hear it.');
  showToast(toastMessage);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'sketch';
}

function getStorageValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage unavailable', error);
    return null;
  }
}

function setStorageValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn('localStorage unavailable', error);
  }
}

function extractPalette(code) {
  const fromSounds = [...code.matchAll(/\.s\("([^"]+)"/g)]
    .map(([, raw]) => raw.match(/[a-zA-Z0-9_]+/g)?.[0])
    .filter(Boolean);
  const fromBanks = [...code.matchAll(/\.bank\("([^"]+)"/g)]
    .map(([, bank]) => `bank:${bank}`);
  return [...new Set([...fromSounds, ...fromBanks])].slice(0, 8);
}

function sortLocalSketches(sketches) {
  return [...sketches].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
}

function normalizeLocalSketch(sketch) {
  return {
    id: sketch.id,
    label: sketch.label || 'Untitled sketch',
    code: sketch.code || '',
    description: sketch.description || 'Saved in this browser.',
    palette: Array.isArray(sketch.palette) && sketch.palette.length ? sketch.palette : extractPalette(sketch.code || ''),
    category: 'Local',
    createdAt: Number(sketch.createdAt || Date.now()),
    updatedAt: Number(sketch.updatedAt || Date.now()),
  };
}

function loadLocalSketches() {
  const raw = getStorageValue(STORAGE_KEYS.sketches);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sortLocalSketches(parsed.filter((entry) => entry && entry.id && typeof entry.code === 'string').map(normalizeLocalSketch));
  } catch (error) {
    console.warn('Could not parse local sketches', error);
    return [];
  }
}

function persistLocalSketches() {
  setStorageValue(STORAGE_KEYS.sketches, JSON.stringify(state.localSketches));
  renderSketchOptions();
}

function makeSelectionValue(kind, id) {
  return `${kind}:${id}`;
}

function parseSelectionValue(value) {
  const [kind, ...parts] = String(value || '').split(':');
  return { kind, id: parts.join(':') };
}

function getBuiltin(id) {
  return BUILTIN_SKETCHES.find((sketch) => sketch.id === id) || null;
}

function getLocal(id) {
  return state.localSketches.find((sketch) => sketch.id === id) || null;
}

function getCurrentSelectionValue() {
  return state.current ? makeSelectionValue(state.current.kind, state.current.id) : '';
}

function setCurrentSketch(sketch, kind) {
  state.current = { ...sketch, kind };

  const selectionValue = makeSelectionValue(kind, sketch.id);
  setStorageValue(STORAGE_KEYS.selection, selectionValue);

  const url = new URL(window.location.href);
  url.searchParams.set('sketch', selectionValue);
  window.history.replaceState({}, '', url);

  renderSketchOptions();
  elements.select.value = selectionValue;
  updateInspector();
  renderComparePanel();
}

function markDirty(isDirty) {
  state.dirty = isDirty;
  updateInspector();
  renderComparePanel();
}

function renderChipRow(container, items, extraClass = '') {
  container.innerHTML = '';

  if (!items.length) {
    const chip = document.createElement('span');
    chip.className = 'chip muted';
    chip.textContent = 'No tags yet';
    container.append(chip);
    return;
  }

  items.forEach((item) => {
    const chip = document.createElement('span');
    chip.className = `chip ${extraClass}`.trim();
    chip.textContent = item;
    container.append(chip);
  });
}

function updateInspector() {
  if (!state.current) {
    elements.sketchTitle.textContent = 'Loading...';
    elements.sketchDescription.textContent = 'Preparing the sketch library.';
    elements.reloadButton.disabled = true;
    elements.deleteButton.disabled = true;
    elements.saveButton.textContent = 'Save';
    renderChipRow(elements.sketchMeta, [], '');
    renderChipRow(elements.paletteTags, [], 'palette');
    return;
  }

  elements.sketchTitle.textContent = state.current.label;
  elements.sketchDescription.textContent = state.current.description;

  const meta = [
    `${state.current.kind === 'local' ? 'Local sketch' : 'Built-in'} sketch`,
    state.current.category,
    state.dirty ? 'Unsaved edits' : 'Saved state',
  ];

  renderChipRow(elements.sketchMeta, meta, '');
  renderChipRow(elements.paletteTags, (state.current.palette || []).map((item) => `Palette: ${item}`), 'palette');

  elements.reloadButton.disabled = state.current.kind !== 'builtin';
  elements.deleteButton.disabled = state.current.kind !== 'local';
  elements.saveButton.textContent = state.current.kind === 'local' ? 'Save Local' : 'Save as Local';
}

function addOptionGroup(label, sketches, kind) {
  if (!sketches.length) {
    return null;
  }

  const group = document.createElement('optgroup');
  group.label = label;

  sketches.forEach((sketch) => {
    const option = document.createElement('option');
    option.value = makeSelectionValue(kind, sketch.id);
    option.textContent = sketch.label;
    group.append(option);
  });

  return group;
}

function renderSketchOptions() {
  const selectedValue = getCurrentSelectionValue() || getStorageValue(STORAGE_KEYS.selection) || '';

  elements.select.innerHTML = '';

  const starters = BUILTIN_SKETCHES.filter((sketch) => sketch.category === 'Starter');
  const references = BUILTIN_SKETCHES.filter((sketch) => sketch.category === 'Reference');

  [addOptionGroup('Starter templates', starters, 'builtin'), addOptionGroup('Reference sketches', references, 'builtin'), addOptionGroup('My sketches', state.localSketches, 'local')]
    .filter(Boolean)
    .forEach((group) => elements.select.append(group));

  if ([...elements.select.options].some((option) => option.value === selectedValue)) {
    elements.select.value = selectedValue;
  } else if (elements.select.options.length) {
    elements.select.value = elements.select.options[0].value;
  }
}

function renderPresetOptions() {
  PRESET_SNIPPETS.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.label;
    elements.presetSelect.append(option);
  });
}

function confirmDiscard() {
  const dirty = syncDirtyFromEditor();
  return !dirty || window.confirm('You have unsaved edits. Discard them?');
}

async function fetchSketchText(path) {
  const response = await fetch(`./${path}?cacheBust=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return `${(await response.text()).trimEnd()}\n`;
}

async function loadBuiltinSketch(id, { force = false } = {}) {
  if (!force && !confirmDiscard()) {
    return false;
  }

  const sketch = getBuiltin(id);
  if (!sketch) {
    return false;
  }

  const code = await fetchSketchText(sketch.path);
  replaceEditorCode(code);
  setLoadedCode(code);
  setCurrentSketch(sketch, 'builtin');
  markDirty(false);
  setCompareSession(null);
  setRepairContext(null);
  setError();
  setStatus(`Loaded ${sketch.label}. Press Play to hear it.`);
  return true;
}

async function loadLocalSketch(id, { force = false } = {}) {
  if (!force && !confirmDiscard()) {
    return false;
  }

  const sketch = getLocal(id);
  if (!sketch) {
    return false;
  }

  const code = `${sketch.code.trimEnd()}\n`;
  replaceEditorCode(code);
  setLoadedCode(code);
  setCurrentSketch(sketch, 'local');
  markDirty(false);
  setCompareSession(null);
  setRepairContext(null);
  setError();
  setStatus(`Loaded ${sketch.label} from this browser.`);
  return true;
}

async function loadSelection(value, options = {}) {
  const { kind, id } = parseSelectionValue(value);
  if (kind === 'local') {
    return loadLocalSketch(id, options);
  }
  return loadBuiltinSketch(id, options);
}

function promptForName(defaultName) {
  const result = window.prompt('Sketch name', defaultName);
  if (result === null) {
    return null;
  }

  const trimmed = result.trim();
  if (!trimmed) {
    setStatus('Sketch name was empty.');
    return null;
  }

  return trimmed;
}

function upsertLocalSketch({ id, label, code, createdAt }) {
  const now = Date.now();
  const nextSketch = normalizeLocalSketch({
    id: id || `local-${slugify(label)}-${now}`,
    label,
    code,
    description: 'Saved in this browser.',
    palette: extractPalette(code),
    createdAt: createdAt || now,
    updatedAt: now,
  });

  state.localSketches = sortLocalSketches([...state.localSketches.filter((entry) => entry.id !== nextSketch.id), nextSketch]);
  persistLocalSketches();
  return nextSketch;
}

function activateLocalSketch(sketch, message) {
  const code = `${sketch.code.trimEnd()}\n`;
  replaceEditorCode(code);
  setLoadedCode(code);
  setCurrentSketch(sketch, 'local');
  markDirty(false);
  setCompareSession(null);
  setRepairContext(null);
  setError();
  setStatus(message);
}

async function saveCurrentSketch() {
  const code = getEditorCode().trim();
  if (!code) {
    setStatus('Nothing to save yet.');
    return;
  }

  if (state.current?.kind === 'local') {
    const saved = upsertLocalSketch({
      id: state.current.id,
      label: state.current.label,
      code: getEditorCode(),
      createdAt: state.current.createdAt,
    });
    activateLocalSketch(saved, `Saved ${saved.label}.`);
    return;
  }

  const defaultName = state.current ? `${state.current.label} copy` : 'New sketch';
  const name = promptForName(defaultName);
  if (!name) {
    return;
  }

  const saved = upsertLocalSketch({ label: name, code: getEditorCode() });
  activateLocalSketch(saved, `Saved ${name} to My sketches.`);
}

async function saveCopy() {
  const code = getEditorCode().trim();
  if (!code) {
    setStatus('Nothing to copy yet.');
    return;
  }

  const defaultName = state.current ? `${state.current.label} copy` : 'New sketch';
  const name = promptForName(defaultName);
  if (!name) {
    return;
  }

  const saved = upsertLocalSketch({ label: name, code: getEditorCode() });
  activateLocalSketch(saved, `Created ${name}.`);
}

async function deleteCurrentSketch() {
  if (state.current?.kind !== 'local') {
    setStatus('Delete only applies to local sketches.');
    return;
  }

  if (!window.confirm(`Delete ${state.current.label}? This cannot be undone.`)) {
    return;
  }

  const deletedLabel = state.current.label;
  state.localSketches = state.localSketches.filter((entry) => entry.id !== state.current.id);
  persistLocalSketches();

  const fallbackValue = makeSelectionValue('builtin', BUILTIN_SKETCHES[0].id);
  await loadSelection(fallbackValue, { force: true });
  setStatus(`Deleted ${deletedLabel}.`);
}

function exportCurrentSketch() {
  const source = getEditorCode().trim();
  if (!source) {
    setStatus('Nothing to export yet.');
    return;
  }

  const filename = `${slugify(state.current?.label || 'strudel-sketch')}.js`;
  const blob = new Blob([getEditorCode()], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${filename}.`);
}

function triggerImport() {
  elements.importFile.value = '';
  elements.importFile.click();
}

async function importSketch(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!confirmDiscard()) {
    event.target.value = '';
    return;
  }

  const text = await file.text();
  const name = file.name.replace(/\.[^.]+$/u, '') || 'Imported sketch';
  const saved = upsertLocalSketch({ label: name, code: text });
  activateLocalSketch(saved, `Imported ${name}.`);
  event.target.value = '';
}

function insertTextAtCursor(text) {
  const source = getEditorCode();
  const cursorPosition = getEditorCursor();
  const nextCode = `${source.slice(0, cursorPosition)}${text}${source.slice(cursorPosition)}`;
  setEditorCode(nextCode);
  setEditorCursor(cursorPosition + text.length);
  focusEditor();
}

function indentBlock(text, spaces = 2) {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function findPrimaryStackStartIndex(code) {
  let depth = 0;
  let inString = '';
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < code.length; index += 1) {
    const character = code[index];
    const nextCharacter = code[index + 1];

    if (inLineComment) {
      if (character === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (character === '*' && nextCharacter === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === '\\') {
        escaped = true;
        continue;
      }

      if (character === inString) {
        inString = '';
      }
      continue;
    }

    if (character === '/' && nextCharacter === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (character === '"' || character === '\'' || character === '`') {
      inString = character;
      continue;
    }

    if (depth === 0 && code.startsWith('stack(', index)) {
      const previousCharacter = code[index - 1] || '';
      if (!/[A-Za-z0-9_$]/.test(previousCharacter)) {
        return index;
      }
    }

    if (character === '(') {
      depth += 1;
      continue;
    }

    if (character === ')') {
      depth = Math.max(0, depth - 1);
    }
  }

  return -1;
}

function findPrimaryStackCloseIndex(code) {
  const start = findPrimaryStackStartIndex(code);
  if (start === -1) {
    return -1;
  }

  let depth = 0;
  let inString = '';
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = start; index < code.length; index += 1) {
    const character = code[index];
    const nextCharacter = code[index + 1];

    if (inLineComment) {
      if (character === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (character === '*' && nextCharacter === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === '\\') {
        escaped = true;
        continue;
      }

      if (character === inString) {
        inString = '';
      }
      continue;
    }

    if (character === '/' && nextCharacter === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (character === '"' || character === '\'' || character === '`') {
      inString = character;
      continue;
    }

    if (character === '(') {
      depth += 1;
      continue;
    }

    if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function appendPresetAsLayer(label, snippet) {
  const source = getEditorCode();
  const closeIndex = findPrimaryStackCloseIndex(source);
  if (closeIndex === -1) {
    return false;
  }

  const injected = `,\n\n  // ${label}\n${indentBlock(snippet.trim(), 2)}\n`;
  setEditorCode(`${source.slice(0, closeIndex)}${injected}${source.slice(closeIndex)}`);

  const cursorPosition = closeIndex + injected.length;
  setEditorCursor(cursorPosition);
  focusEditor();
  return true;
}

function insertPreset() {
  const preset = PRESET_SNIPPETS.find((entry) => entry.id === elements.presetSelect.value);
  if (!preset) {
    return;
  }

  const insertedIntoStack = appendPresetAsLayer(preset.label, preset.snippet);
  if (!insertedIntoStack) {
    insertTextAtCursor(`\n// ${preset.label}\n${preset.snippet.trim()}\n`);
  }

  markDirty(true);
  setStatus(insertedIntoStack ? `Added ${preset.label} as a new layer. Press Play to hear it.` : `Inserted ${preset.label}.`);
}

async function playCurrentCode() {
  syncDirtyFromEditor();
  const source = getEditorCode().trim();
  if (!source) {
    setRepairContext(null);
    setStatus('The editor is empty.');
    return;
  }

  const codeIssue = getLocalPadCodeIssue(source);
  if (codeIssue) {
    setRepairContext({
      code: source,
      issue: codeIssue,
      sourceLabel: 'the current sketch',
    });
    setError(codeIssue);
    setStatus('This sketch uses features the local Jester pad cannot run.');
    return;
  }

  setRepairContext(null);
  setError();
  setStatus('Evaluating...');
  try {
    await initializeCodeEditor().evaluate();
  } catch (error) {
    handleCodeEvalError(error);
  }
}

function stopPlayback() {
  initializeCodeEditor().stop();
  setStatus('Stopped.');
}

function handleError(error) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  setError(message);
  setStatus('There was a problem. See the error message below.');
}

function handleCodeEvalError(error) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  const source = getEditorCode().trim();
  setRepairContext({
    code: source,
    issue: message,
    sourceLabel: 'the current sketch',
  });
  setError(message);
  setStatus('The sketch broke during playback. Jester can try to repair it.');
}

function wireEvents() {
  elements.select.addEventListener('change', async () => {
    const previousValue = getCurrentSelectionValue();
    try {
      const loaded = await loadSelection(elements.select.value);
      if (!loaded && previousValue) {
        elements.select.value = previousValue;
      }
    } catch (error) {
      if (previousValue) {
        elements.select.value = previousValue;
      }
      handleError(error);
    }
  });

  elements.reloadButton.addEventListener('click', async () => {
    if (state.current?.kind !== 'builtin') {
      setStatus('Reload only applies to built-in sketches.');
      return;
    }
    try {
      await loadBuiltinSketch(state.current.id);
    } catch (error) {
      handleError(error);
    }
  });

  elements.saveButton.addEventListener('click', () => {
    saveCurrentSketch().catch(handleError);
  });

  elements.saveCopyButton.addEventListener('click', () => {
    saveCopy().catch(handleError);
  });

  elements.deleteButton.addEventListener('click', () => {
    deleteCurrentSketch().catch(handleError);
  });

  elements.exportButton.addEventListener('click', exportCurrentSketch);
  elements.importButton.addEventListener('click', triggerImport);
  elements.importFile.addEventListener('change', (event) => {
    importSketch(event).catch(handleError);
  });
  elements.insertPresetButton.addEventListener('click', insertPreset);
  elements.playButton.addEventListener('click', () => {
    playCurrentCode().catch(handleError);
  });
  elements.repairButton.addEventListener('click', () => {
    requestCodeRepair({
      code: state.repair?.code,
      issue: state.repair?.issue,
      sourceLabel: state.repair?.sourceLabel || 'the current sketch',
      playAfterApply: false,
    }).catch(handleError);
  });
  elements.repairPlayButton.addEventListener('click', () => {
    requestCodeRepair({
      code: state.repair?.code,
      issue: state.repair?.issue,
      sourceLabel: state.repair?.sourceLabel || 'the current sketch',
      playAfterApply: true,
    }).catch(handleError);
  });
  elements.applyMoodButton.addEventListener('click', () => {
    applyCurrentMoodControls().catch(handleError);
  });
  elements.resetMoodButton.addEventListener('click', () => {
    resetMoodControls();
    setStatus('Reset mood controls to balanced.');
  });
  elements.compareLoadAButton.addEventListener('click', () => {
    loadCompareSide('a', { playAfterLoad: false }).catch(handleError);
  });
  elements.comparePlayAButton.addEventListener('click', () => {
    loadCompareSide('a', { playAfterLoad: true }).catch(handleError);
  });
  elements.compareLoadBButton.addEventListener('click', () => {
    loadCompareSide('b', { playAfterLoad: false }).catch(handleError);
  });
  elements.comparePlayBButton.addEventListener('click', () => {
    loadCompareSide('b', { playAfterLoad: true }).catch(handleError);
  });
  elements.compareClearButton.addEventListener('click', () => {
    setCompareSession(null);
    setStatus('Cleared the compare pair.');
  });
  elements.stopButton.addEventListener('click', stopPlayback);
  elements.chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitChatQuestion().catch(handleError);
  });
  elements.clearChatButton.addEventListener('click', clearChat);
  elements.chatAutoApply.addEventListener('change', () => {
    state.chat.autoApply = elements.chatAutoApply.checked;
    persistChatConfig();
    refreshChatSummary();
  });
  elements.chatAutoPlay.addEventListener('change', () => {
    state.chat.autoPlay = elements.chatAutoPlay.checked;
    persistChatConfig();
    refreshChatSummary();
  });
  elements.chatProviderSelect.addEventListener('change', () => {
    applyChatConfig(elements.chatProviderSelect.value, '', { persist: true });
  });
  elements.chatModelSelect.addEventListener('change', () => {
    applyChatConfig(state.chat.provider, elements.chatModelSelect.value, { persist: true });
  });
  elements.chatInput.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      submitChatQuestion().catch(handleError);
    }
  });

  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      if (document.activeElement === elements.chatInput) {
        return;
      }
      event.preventDefault();
      playCurrentCode().catch(handleError);
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveCurrentSketch().catch(handleError);
      return;
    }

    if (event.key === 'Escape') {
      stopPlayback();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  });
}

async function bootstrap() {
  renderGuidedChatControls();
  renderComparePanel();
  renderRepairActions();
  renderPresetOptions();
  renderSketchOptions();
  updateInspector();

  setStatus('Loading the Strudel engine...');
  initializeCodeEditor();
  await initializeDocsChat();

  wireEvents();

  const requestedSketch = new URL(window.location.href).searchParams.get('sketch') ||
    getStorageValue(STORAGE_KEYS.selection) ||
    makeSelectionValue('builtin', BUILTIN_SKETCHES[0].id);

  const loaded = await loadSelection(requestedSketch, { force: true });
  if (!loaded) {
    await loadBuiltinSketch(BUILTIN_SKETCHES[0].id, { force: true });
  }
}

bootstrap().catch(handleError);
