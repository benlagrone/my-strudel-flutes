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
    label: 'Starter: Glass Canopy',
    path: 'songs/starter-glass-canopy.js',
    description: 'A slower bell-and-halo sketch that is easy to reshape without breaking anything.',
    palette: ['sine', 'triangle', 'sawtooth'],
  },
  {
    id: 'starter-river-step',
    category: 'Starter',
    label: 'Starter: River Step',
    path: 'songs/starter-river-step.js',
    description: 'A slightly more rhythmic template with bright synth chords, airy echoes, and a simple beat.',
    palette: ['sawtooth', 'triangle', 'square', 'bank:crate'],
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
    id: 'pan-flute-lead',
    label: 'Pan Flute Lead',
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
    id: 'halo-pad',
    label: 'Halo Pad',
    snippet: `n("<0 3 5 6>")
  .scale("A3:minor")
  .s("sawtooth")
  .lpf(900)
  .lpq(3)
  .attack(0.02)
  .decay(0.75)
  .sustain(0)
  .release(0.08)
  .room(0.38)
  .gain(0.28)
  .slow(2)`,
  },
  {
    id: 'music-box-sparkles',
    label: 'Music Box Sparkles',
    snippet: `n("~ <7 9> ~ <11>")
  .scale("C6:major")
  .s("sine")
  .attack(0.01)
  .decay(0.16)
  .sustain(0)
  .release(0.04)
  .room(0.5)
  .gain(0.22)
  .slow(4)`,
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
    id: 'crate-pulse',
    label: 'Crate Pulse',
    snippet: `s("bd")
  .struct("x ~ ~ x")
  .bank("crate")
  .gain(0.28)
  .delay(0.04)`,
  },
  {
    id: 'soft-saw-bass',
    label: 'Soft Saw Bass',
    snippet: `n("0 ~ 0 2")
  .scale("A2:minor")
  .s("sawtooth")
  .lpf(900)
  .attack(0.01)
  .decay(0.3)
  .sustain(0)
  .release(0.06)
  .gain(0.22)
  .slow(2)`,
  },
];

const elements = {
  chatAutoApply: document.getElementById('chat-auto-apply'),
  chatAutoPlay: document.getElementById('chat-auto-play'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  chatMessages: document.getElementById('chat-messages'),
  chatModelSelect: document.getElementById('chat-model-select'),
  chatNote: document.getElementById('chat-note'),
  chatProviderSelect: document.getElementById('chat-provider-select'),
  chatStatus: document.getElementById('chat-status'),
  clearChatButton: document.getElementById('clear-chat'),
  codeEditor: document.getElementById('code'),
  deleteButton: document.getElementById('delete-sketch'),
  errorOutput: document.getElementById('error'),
  exportButton: document.getElementById('export-sketch'),
  importButton: document.getElementById('import-sketch'),
  importFile: document.getElementById('import-file'),
  insertPresetButton: document.getElementById('insert-preset'),
  paletteTags: document.getElementById('palette-tags'),
  playButton: document.getElementById('play-song'),
  presetSelect: document.getElementById('preset-select'),
  reloadButton: document.getElementById('reload-sketch'),
  saveButton: document.getElementById('save-sketch'),
  saveCopyButton: document.getElementById('save-copy'),
  select: document.getElementById('sketch-select'),
  sketchDescription: document.getElementById('sketch-description'),
  sketchMeta: document.getElementById('sketch-meta'),
  sketchTitle: document.getElementById('sketch-title'),
  status: document.getElementById('status'),
  stopButton: document.getElementById('stop-song'),
};

const state = {
  chat: {
    autoApply: true,
    autoPlay: false,
    fileCount: 0,
    messages: [],
    model: '',
    mode: 'loading',
    provider: 'extractive',
    providers: [],
    ready: false,
  },
  current: null,
  dirty: false,
  localSketches: loadLocalSketches(),
};

let editorInstance = null;
let audioReady = null;
let modulesLoading = null;

function getEditorCode() {
  return editorInstance?.code || '';
}

function setEditorCode(code) {
  editorInstance?.setCode(code);
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
    onEvalError: handleError,
    afterEval: () => {
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

function setChatStatus(message) {
  elements.chatStatus.textContent = message;
}

function setChatNote(message) {
  elements.chatNote.textContent = message;
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

    if (message.code) {
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
      }

      if (message.appliedLive) {
        const appliedNote = document.createElement('span');
        appliedNote.className = 'chip muted';
        appliedNote.textContent = message.appliedLive;
        actions.append(appliedNote);
      }

      article.append(actions);
    }

    if (Array.isArray(message.sources) && message.sources.length) {
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

      article.append(sources);
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
      content: 'Ask me about Strudel features, syntax, samples, effects, scheduling, or ask me to revise the current song live. For example: "Keep the bass, make the melody darker, and add a drifting pad."',
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
      `Grounded in ${state.chat.fileCount} local docs files. Using local extractive answers only. The current editor code is still sent with each question.`,
    );
    return;
  }

  if (fallback) {
    setChatStatus('Docs fallback');
    setChatNote(
      `Grounded in ${state.chat.fileCount} local docs files. ${providerLabel} failed for that answer, so the app fell back to local extractive mode.`,
    );
    return;
  }

  setChatStatus(`Docs + ${providerLabel} ready`);
  setChatNote(
    `Grounded in ${state.chat.fileCount} local docs files. Using ${providerLabel}${state.chat.model ? ` (${state.chat.model})` : ''} for synthesized answers. The current editor code is included with each question.${state.chat.autoApply ? ' Song revisions apply live to the editor.' : ''}${state.chat.autoPlay ? ' Auto-play is on.' : ''}`,
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
    elements.chatAutoApply.checked = state.chat.autoApply;
    elements.chatAutoPlay.checked = state.chat.autoPlay;
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

async function submitChatQuestion() {
  const question = elements.chatInput.value.trim();
  if (!question) {
    return;
  }

  if (!state.chat.ready) {
    setChatStatus('Docs unavailable');
    return;
  }

  pushChatMessage({
    role: 'user',
    content: question,
    sources: [],
    code: null,
  });
  elements.chatInput.value = '';
  setChatStatus('Searching docs…');

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
        currentCode: getEditorCode(),
        messages: state.chat.messages.map(({ role, content }) => ({ role, content })),
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
      intent: data.intent || 'docs',
      appliable: Boolean(data.appliable),
      appliedLive: '',
    };
    pushChatMessage(assistantMessage);
    if (state.chat.autoApply && assistantMessage.appliable && assistantMessage.code) {
      await applyChatCodeMessage(assistantMessage, {
        playAfterApply: state.chat.autoPlay,
        focusAfterApply: false,
        skipConfirm: true,
        liveApplyLabel: state.chat.autoPlay ? 'Applied live and playing' : 'Applied live',
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

async function applyChatCodeMessage(
  message,
  { playAfterApply = false, focusAfterApply = true, skipConfirm = false, liveApplyLabel = '' } = {},
) {
  if (!message?.code) {
    return;
  }

  if (!skipConfirm && !message.appliable) {
    const confirmed = window.confirm('Replace the current editor contents with this chat example?');
    if (!confirmed) {
      return;
    }
  }

  replaceEditorCode(`${message.code.trimEnd()}\n`);
  markDirty(true);

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
    return;
  }

  setStatus(message.appliable ? 'Applied the chat revision to the editor.' : 'Loaded the chat example into the editor. Press Play to hear it.');
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
}

function markDirty(isDirty) {
  state.dirty = isDirty;
  updateInspector();
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
  return !state.dirty || window.confirm('You have unsaved edits. Discard them?');
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

  replaceEditorCode(await fetchSketchText(sketch.path));
  setCurrentSketch(sketch, 'builtin');
  markDirty(false);
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

  replaceEditorCode(`${sketch.code.trimEnd()}\n`);
  setCurrentSketch(sketch, 'local');
  markDirty(false);
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
  replaceEditorCode(`${sketch.code.trimEnd()}\n`);
  setCurrentSketch(sketch, 'local');
  markDirty(false);
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
  if (state.current?.kind === 'builtin' && !state.dirty) {
    setEditorCode(await fetchSketchText(state.current.path));
  }

  const source = getEditorCode().trim();
  if (!source) {
    setStatus('The editor is empty.');
    return;
  }

  setError();
  setStatus('Evaluating...');
  await initializeCodeEditor().evaluate();
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
