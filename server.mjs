import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  answerWithProvider,
  classifyChatIntent,
  buildConversationQuery,
  buildDocsIndex,
  buildExtractiveAnswer,
  getLoadableExampleIssue,
  resolveDocsRoot,
  searchDocs,
} from './docs-rag.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await loadLocalEnv();

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number.parseInt(process.env.PORT || '8008', 10);
const providerCatalog = buildProviderCatalog();
const defaultChatConfig = resolveRequestedChatConfig();

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const ragState = await initializeRagState();

async function loadLocalEnv() {
  try {
    const source = await readFile(join(__dirname, '.env'), 'utf8');
    for (const rawLine of source.split(/\r?\n/u)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      const separator = line.indexOf('=');
      if (separator <= 0) {
        continue;
      }

      const key = line.slice(0, separator).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/gu, '');
      process.env[key] = value;
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('Could not load local .env file.', error);
    }
  }
}

function resolveChatProvider() {
  const requestedProvider = normalizeProvider(process.env.STRUDEL_CHAT_PROVIDER);
  const apiKeyOverride = (process.env.STRUDEL_CHAT_API_KEY || '').trim();
  const baseUrlOverride = (process.env.STRUDEL_CHAT_BASE_URL || '').trim();
  const modelOverride = (process.env.STRUDEL_CHAT_MODEL || '').trim();

  const presets = {
    deepseek: {
      apiKey: (process.env.DEEPSEEK_API_KEY || apiKeyOverride).trim(),
      baseUrl: baseUrlOverride || 'https://api.deepseek.com/v1',
      model: modelOverride || 'deepseek-chat',
    },
    openai: {
      apiKey: (process.env.OPENAI_API_KEY || apiKeyOverride).trim(),
      baseUrl: baseUrlOverride || 'https://api.openai.com/v1',
      model: modelOverride || 'gpt-4.1-mini',
    },
  };

  if (requestedProvider && requestedProvider !== 'auto') {
    if (requestedProvider in presets) {
      return finalizeProviderConfig(requestedProvider, presets[requestedProvider]);
    }
    return finalizeProviderConfig(requestedProvider, {
      apiKey: apiKeyOverride,
      baseUrl: baseUrlOverride,
      model: modelOverride || 'deepseek-chat',
    });
  }

  if (presets.deepseek.apiKey) {
    return finalizeProviderConfig('deepseek', presets.deepseek);
  }

  if (presets.openai.apiKey) {
    return finalizeProviderConfig('openai', presets.openai);
  }

  if (apiKeyOverride && baseUrlOverride) {
    return finalizeProviderConfig('compatible', {
      apiKey: apiKeyOverride,
      baseUrl: baseUrlOverride,
      model: modelOverride || 'deepseek-chat',
    });
  }

  return finalizeProviderConfig('extractive', {
    apiKey: '',
    baseUrl: '',
    model: modelOverride,
  });
}

function buildProviderCatalog() {
  const deepseekRequested = normalizeProvider(process.env.STRUDEL_CHAT_PROVIDER) === 'deepseek';
  const openaiRequested = normalizeProvider(process.env.STRUDEL_CHAT_PROVIDER) === 'openai';

  return [
    {
      id: 'extractive',
      label: 'Extractive only',
      available: true,
      llmEnabled: false,
      model: null,
      baseUrl: '',
      apiKey: '',
      models: [],
    },
    {
      id: 'deepseek',
      label: 'DeepSeek',
      available: Boolean(process.env.DEEPSEEK_API_KEY || deepseekRequested),
      llmEnabled: Boolean(process.env.DEEPSEEK_API_KEY),
      model: process.env.STRUDEL_CHAT_MODEL && deepseekRequested ? process.env.STRUDEL_CHAT_MODEL : 'deepseek-chat',
      baseUrl: process.env.STRUDEL_CHAT_BASE_URL && deepseekRequested ? process.env.STRUDEL_CHAT_BASE_URL : 'https://api.deepseek.com/v1',
      apiKey: (process.env.DEEPSEEK_API_KEY || '').trim(),
      models: ['deepseek-chat', 'deepseek-reasoner'],
    },
    {
      id: 'openai',
      label: 'OpenAI',
      available: Boolean(process.env.OPENAI_API_KEY || openaiRequested),
      llmEnabled: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.STRUDEL_CHAT_MODEL && openaiRequested ? process.env.STRUDEL_CHAT_MODEL : 'gpt-4.1-mini',
      baseUrl: process.env.STRUDEL_CHAT_BASE_URL && openaiRequested ? process.env.STRUDEL_CHAT_BASE_URL : 'https://api.openai.com/v1',
      apiKey: (process.env.OPENAI_API_KEY || '').trim(),
      models: ['gpt-4.1-mini', 'gpt-4.1'],
    },
  ];
}

function resolveRequestedChatConfig(requested = null) {
  const desiredProvider = normalizeProvider(requested?.provider) || defaultChatProviderId();
  if (desiredProvider === 'extractive') {
    return finalizeProviderConfig('extractive', { apiKey: '', baseUrl: '', model: '' });
  }

  const provider = providerCatalog.find((entry) => entry.id === desiredProvider);
  if (!provider) {
    throw new Error(`Unsupported chat provider: ${desiredProvider}`);
  }

  if (!provider.llmEnabled) {
    throw new Error(`${provider.label} is not configured on this server.`);
  }

  const requestedModel = String(requested?.model || '').trim();
  const model = provider.models.includes(requestedModel) ? requestedModel : provider.model;
  return finalizeProviderConfig(provider.id, {
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    model,
  });
}

function defaultChatProviderId() {
  const preferredProvider = normalizeProvider(process.env.STRUDEL_CHAT_PROVIDER);
  if (preferredProvider === 'extractive') {
    return 'extractive';
  }
  if (preferredProvider && preferredProvider !== 'auto') {
    const explicitlyConfigured = providerCatalog.find((entry) => entry.id === preferredProvider);
    if (explicitlyConfigured?.llmEnabled) {
      return explicitlyConfigured.id;
    }
  }

  const deepseek = providerCatalog.find((entry) => entry.id === 'deepseek');
  if (deepseek?.llmEnabled) {
    return 'deepseek';
  }

  const openai = providerCatalog.find((entry) => entry.id === 'openai');
  if (openai?.llmEnabled) {
    return 'openai';
  }

  return 'extractive';
}

function finalizeProviderConfig(provider, config) {
  const apiKey = (config.apiKey || '').trim();
  return {
    provider,
    apiKey,
    baseUrl: (config.baseUrl || '').trim(),
    model: (config.model || '').trim(),
    llmEnabled: Boolean(apiKey),
  };
}

function normalizeProvider(value) {
  return (value || '').trim().toLowerCase();
}

function getFilePath(requestUrl) {
  const url = new URL(requestUrl, `http://${HOST}:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const relativePath = normalizedPath === '/' ? 'index.html' : normalizedPath.replace(/^\/+/, '');
  const absolutePath = resolve(join(__dirname, relativePath));

  if (!absolutePath.startsWith(__dirname)) {
    return null;
  }

  return absolutePath;
}

function setHeaders(response, filePath) {
  const extension = extname(filePath).toLowerCase();
  const isEditableAsset = extension === '.html' || extension === '.js';

  response.setHeader('Content-Type', MIME_TYPES[extension] || 'application/octet-stream');
  response.setHeader('Cache-Control', isEditableAsset ? 'no-store' : 'public, max-age=300');
}

async function serveFile(filePath, response, method) {
  let fileInfo;

  try {
    fileInfo = await stat(filePath);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  if (!fileInfo.isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  setHeaders(response, filePath);
  response.writeHead(200);

  if (method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

async function initializeRagState() {
  const sourceRoot = await resolveDocsRoot(process.env.STRUDEL_DOCS_ROOT);
  if (!sourceRoot) {
    console.warn('Strudel docs root not found. Conversational docs mode disabled.');
    return {
      ready: false,
      reason: 'Docs root not found',
      mode: 'unavailable',
      model: defaultChatConfig.model || null,
      provider: defaultChatConfig.provider,
      llmEnabled: defaultChatConfig.llmEnabled,
      sourceRoot: null,
      index: null,
    };
  }

  const index = await buildDocsIndex(sourceRoot);
  console.log(`Indexed ${index.fileCount} docs into ${index.chunkCount} retrieval chunks from ${sourceRoot}`);

  return {
    ready: true,
    reason: '',
    mode: defaultChatConfig.llmEnabled ? `${defaultChatConfig.provider}-rag` : 'extractive-rag',
    model: defaultChatConfig.model || null,
    provider: defaultChatConfig.provider,
    llmEnabled: defaultChatConfig.llmEnabled,
    sourceRoot,
    index,
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) {
    return {};
  }

  return JSON.parse(raw);
}

function serializeSource(result) {
  return {
    citation: result.citation,
    title: result.title,
    section: result.section,
    relativePath: result.relativePath,
    route: result.route,
    docUrl: result.route ? `https://strudel.cc${result.route}` : null,
    excerpt: result.excerpt,
  };
}

function isValidMessage(message) {
  return message &&
    typeof message === 'object' &&
    ['user', 'assistant'].includes(message.role) &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0;
}

async function handleChatStatus(response) {
  sendJson(response, 200, {
    ready: ragState.ready,
    reason: ragState.reason,
    mode: ragState.mode,
    model: ragState.model,
    provider: ragState.provider,
    llmEnabled: ragState.llmEnabled,
    providers: providerCatalog.map((provider) => ({
      id: provider.id,
      label: provider.label,
      available: provider.available,
      llmEnabled: provider.llmEnabled,
      defaultModel: provider.model || null,
      models: provider.models,
    })),
    sourceRoot: ragState.sourceRoot,
    fileCount: ragState.index?.fileCount || 0,
    chunkCount: ragState.index?.chunkCount || 0,
    builtAt: ragState.index?.builtAt || null,
  });
}

async function handleChatRequest(request, response) {
  if (!ragState.ready || !ragState.index) {
    sendJson(response, 503, { error: ragState.reason || 'Docs index is not available.' });
    return;
  }

  const payload = await readJson(request);
  const messages = Array.isArray(payload.messages) ? payload.messages.filter(isValidMessage) : [];
  const currentCode = typeof payload.currentCode === 'string' ? payload.currentCode : '';
  const query = buildConversationQuery(messages);
  const requestConfig = resolveRequestedChatConfig(payload.config || null);
  const intent = classifyChatIntent(query, currentCode);

  if (!query) {
    sendJson(response, 400, { error: 'No user message was provided.' });
    return;
  }

  const results = searchDocs(ragState.index, query, 5);
  const sources = results.map(serializeSource);

  let answer = buildExtractiveAnswer(query, results);
  if (requestConfig.llmEnabled) {
    try {
      const llmAnswer = await answerWithProvider({
        provider: requestConfig.provider,
        apiKey: requestConfig.apiKey,
        baseUrl: requestConfig.baseUrl,
        model: requestConfig.model,
        messages,
        results,
        currentCode,
      });
      if (llmAnswer) {
        answer = llmAnswer;
      }
    } catch (error) {
      console.warn(`${requestConfig.provider}-backed docs answer failed, falling back to extractive mode.`, error);
      answer = { ...answer, mode: 'extractive-fallback' };
    }
  }

  sendJson(response, 200, {
    answer: answer.answer,
    code: answer.code,
    codeIssue: answer.codeIssue || (answer.code ? getLoadableExampleIssue(answer.code) : null),
    mode: answer.mode,
    intent,
    appliable: Boolean(answer.code && intent !== 'docs' && !String(answer.mode || '').startsWith('extractive')),
    provider: answer.provider || requestConfig.provider,
    model: requestConfig.model || null,
    query,
    sources,
  });
}

const server = createServer(async (request, response) => {
  if (!request.url || !request.method) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  const url = new URL(request.url, `http://${HOST}:${PORT}`);

  if (url.pathname === '/api/chat/status' && request.method === 'GET') {
    await handleChatStatus(response);
    return;
  }

  if ((url.pathname === '/healthz' || url.pathname === '/api/healthz') && request.method === 'GET') {
    sendJson(response, 200, {
      ok: true,
      docsReady: ragState.ready,
      provider: ragState.provider,
      model: ragState.model,
    });
    return;
  }

  if (url.pathname === '/api/chat' && request.method === 'POST') {
    try {
      await handleChatRequest(request, response);
    } catch (error) {
      console.error(error);
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  const filePath = getFilePath(request.url);

  if (!filePath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  await serveFile(filePath, response, request.method);
});

server.listen(PORT, HOST, () => {
  console.log(`Strudel pad listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down.`);
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
