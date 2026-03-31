import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';

const WEBSITE_DOCS_ROOT = 'website/src/pages';
const LEGACY_DOCS_ROOT = 'docs';
const SECTION_SPLIT = /^#{1,3}\s+(.+)$/gm;
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;
const CODE_BLOCK = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'use',
  'what',
  'when',
  'with',
  'you',
  'your',
]);

export async function resolveDocsRoot(preferredRoot) {
  const candidates = [preferredRoot, resolve(process.cwd(), '../strudel'), '/docs/strudel'].filter(Boolean);

  for (const candidate of candidates) {
    if (await hasDocsTree(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function buildDocsIndex(root) {
  const websiteRoot = join(root, WEBSITE_DOCS_ROOT);
  const legacyRoot = join(root, LEGACY_DOCS_ROOT);

  const websiteFiles = await collectFiles(websiteRoot, (filePath) => {
    const rel = relative(websiteRoot, filePath).replaceAll('\\', '/');
    return isMarkdown(filePath) && !rel.startsWith('de/') && !rel.startsWith('_');
  });
  const legacyFiles = await collectFiles(legacyRoot, (filePath) => isMarkdown(filePath));

  const chunks = [];
  let fileCount = 0;

  for (const filePath of [...websiteFiles, ...legacyFiles]) {
    const relativePath = relative(root, filePath).replaceAll('\\', '/');
    const kind = relativePath.startsWith(WEBSITE_DOCS_ROOT) ? 'website' : 'docs';
    const fileChunks = await parseDocFile({ filePath, relativePath, kind });
    if (!fileChunks.length) {
      continue;
    }
    fileCount += 1;
    chunks.push(...fileChunks);
  }

  const documentFrequency = new Map();
  for (const chunk of chunks) {
    const uniqueTerms = new Set(chunk.tokens);
    for (const term of uniqueTerms) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  return {
    builtAt: new Date().toISOString(),
    chunkCount: chunks.length,
    fileCount,
    root,
    documentFrequency,
    chunks,
  };
}

export function searchDocs(index, query, limit = 5) {
  const normalizedQuery = normalizeText(query);
  const queryTerms = tokenize(normalizedQuery).filter((term) => !STOP_WORDS.has(term));
  if (!queryTerms.length) {
    return [];
  }

  const scored = index.chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk, queryTerms, normalizedQuery, index),
    }))
    .filter((chunk) => chunk.score > 0.1)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return scored.map((chunk, indexPosition) => ({
    id: chunk.id,
    title: chunk.title,
    section: chunk.section,
    relativePath: chunk.relativePath,
    route: chunk.route,
    kind: chunk.kind,
    excerpt: makeExcerpt(chunk, queryTerms),
    rawText: chunk.rawText,
    codeBlocks: chunk.codeBlocks,
    score: chunk.score,
    citation: indexPosition + 1,
  }));
}

export function buildConversationQuery(messages) {
  const recentUserMessages = messages.filter((message) => message.role === 'user').slice(-2);
  return recentUserMessages.map((message) => message.content).join('\n\n').trim();
}

export function classifyChatIntent(query, currentCode = '') {
  if (isSongEditRequest(query, currentCode)) {
    return 'song-edit';
  }

  if (isSongRequest(query)) {
    return 'song-create';
  }

  return 'docs';
}

export function buildExtractiveAnswer(query, results) {
  if (!results.length) {
    return {
      answer: 'I could not find a close match in the local Strudel docs for that yet. Try naming the feature, function, or concept more directly.',
      code: null,
      mode: 'extractive',
      provider: null,
    };
  }

  const summary = results
    .slice(0, 3)
    .map((result) => `${result.excerpt} [${result.citation}]`)
    .join('\n\n');

  const code = pickCodeExample(query, results);
  const answer = code
    ? `Based on the local Strudel docs, here is the closest guidance:\n\n${summary}\n\nExample:\n\`\`\`strudel\n${code}\n\`\`\``
    : `Based on the local Strudel docs, here is the closest guidance:\n\n${summary}`;

  return {
    answer,
    code,
    mode: 'extractive',
    provider: null,
  };
}

export async function answerWithProvider({ provider, apiKey, model, baseUrl, messages, results, currentCode = '' }) {
  if (!provider || !apiKey || !model || !baseUrl || !results.length) {
    return null;
  }

  const transcript = messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

  const context = results
    .map(
      (result) =>
        `[${result.citation}] ${result.title}${result.section ? ` > ${result.section}` : ''}\nPath: ${result.relativePath}\n${result.rawText}`,
    )
    .join('\n\n');

  const latestUserMessage = messages.filter((message) => message.role === 'user').at(-1)?.content || '';
  const responseInstructions = buildResponseInstructions(latestUserMessage, currentCode);
  const currentSketchContext = currentCode.trim()
    ? `Current sketch loaded in the editor right now:\n\`\`\`strudel\n${currentCode.trim()}\n\`\`\`\n\n`
    : '';
  const prompt = `Conversation so far:\n${transcript}\n\n${currentSketchContext}Retrieved Strudel documentation excerpts:\n${context}\n\n${responseInstructions}`;

  const systemPrompt =
    'You are a documentation-grounded Strudel assistant. Do not invent features or APIs that are not supported by the provided docs excerpts.';

  if (provider === 'openai') {
    return answerWithOpenAIResponses({
      apiKey,
      model,
      baseUrl,
      prompt,
      systemPrompt,
    });
  }

  return answerWithChatCompletions({
    provider,
    apiKey,
    model,
    baseUrl,
    prompt,
    systemPrompt,
  });
}

async function answerWithOpenAIResponses({ apiKey, model, baseUrl, prompt, systemPrompt }) {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const answer = extractOutputText(data);
  if (!answer) {
    throw new Error('OpenAI response did not include output text.');
  }

  return {
    answer,
    code: extractFirstCodeBlock(answer),
    mode: 'openai',
    provider: 'openai',
  };
}

async function answerWithChatCompletions({ provider, apiKey, model, baseUrl, prompt, systemPrompt }) {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider} request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const answer = extractChatCompletionText(data);
  if (!answer) {
    throw new Error(`${provider} response did not include output text.`);
  }

  return {
    answer,
    code: extractFirstCodeBlock(answer),
    mode: provider,
    provider,
  };
}

function extractChatCompletionText(data) {
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const content = choices.find((choice) => choice?.message?.content)?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
  }
  return '';
}

function buildResponseInstructions(query, currentCode = '') {
  const intent = classifyChatIntent(query, currentCode);

  if (intent === 'song-edit') {
    return [
      'Answer the latest USER message using only the retrieved documentation and the current sketch loaded in the editor.',
      'Treat the current sketch as the thing being revised. Preserve the useful musical identity of the current sketch unless the user explicitly asks for a rewrite.',
      'Keep the explanation brief and practical, and cite sources as [1], [2], etc.',
      'Return exactly one fenced code block containing the full revised playable sketch, not a diff and not a partial fragment.',
      'Make the revision immediately loadable into the editor as-is.',
      'Target the simplified local pad used in this app: prefer setcps(...), one top-level stack(...), n(...), s(...), .scale("A4:dorian") style scales, synth voices such as sine, triangle, square, sawtooth, and the crate sample bank.',
      'Prefer local-pad-safe effects and helpers such as .gain(...), .room(...), .delay(...), .lpf(...), .lpq(...), .attack(...), .decay(...), .sustain(...), .release(...), .slow(...), .mask(...), and .resonance(...).',
      'Do not use gm_ soundfonts, RolandTR909, note(), sound(), voicings(), or other sample banks unless the user explicitly asks for remote samples or a different runtime.',
      'For musical revisions, keep the piece fuller than a tiny snippet: prefer 3 to 6 layers and at least one melodic or rhythmic phrase that spans 16 or more steps or clearly evolves over time.',
      'Use only functions and patterns that are supported by the retrieved docs excerpts. If the docs are insufficient for a requested feature, say so explicitly and stay conservative.',
    ].join(' ');
  }

  if (intent === 'song-create') {
    return [
      'Answer the latest USER message using only the retrieved documentation.',
      'Keep the explanation brief and practical, and cite sources as [1], [2], etc.',
      'Because the user is asking for a song or full sketch, include exactly one fenced code block containing a complete playable Strudel sketch.',
      'Make it fuller than a tiny snippet: prefer setcps(...), one top-level stack(...), 3 to 5 layers, and at least one melodic or rhythmic phrase that spans 16 or more steps or clearly evolves over time.',
      'Target the simplified local pad used in this app: prefer setcps(...), stack(...), n(...), s(...), .scale("A4:dorian") style scales, synth voices such as sine, triangle, square, sawtooth, and the crate sample bank.',
      'Prefer local-pad-safe effects and helpers such as .gain(...), .room(...), .delay(...), .lpf(...), .lpq(...), .attack(...), .decay(...), .sustain(...), .release(...), .slow(...), .mask(...), and .resonance(...).',
      'Do not use gm_ soundfonts, RolandTR909, note(), sound(), voicings(), or other sample banks unless the user explicitly asks for remote samples or a different runtime.',
      'Use only functions and patterns that are supported by the retrieved docs excerpts. If the docs are insufficient for a requested feature, say so explicitly and stay conservative.',
      'Make the sketch ready to load into the editor as-is.',
    ].join(' ');
  }

  return [
    'Answer the latest USER message using only the retrieved documentation.',
    'Keep the answer concise and practical.',
    'Cite sources as [1], [2], etc.',
    'If the docs are insufficient, say so explicitly.',
    'If a Strudel code example would help, include one fenced code block.',
    'When you include code for this local pad, prefer the reliable subset: setcps, stack, n, s, .scale("A4:dorian"), synth voices like sine/triangle/square/sawtooth, and the crate bank.',
  ].join(' ');
}

function isSongRequest(query) {
  return /\b(song|sketch|track|piece|compose|composition|full example|full pattern|sample song|write me|make me|generate)\b/i.test(query);
}

function isSongEditRequest(query, currentCode = '') {
  if (!currentCode.trim()) {
    return false;
  }

  return /\b(change|edit|modify|update|revise|rewrite|rework|make it|make the|turn it|turn the|keep|add|remove|swap|replace|simplify|complex|denser|sparser|darker|brighter|longer|shorter|more|less|this song|this sketch|current sketch|current song|same sketch|same song)\b/i.test(
    query,
  );
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputs = Array.isArray(data.output) ? data.output : [];
  const parts = [];
  for (const item of outputs) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const block of content) {
      if (typeof block.text === 'string') {
        parts.push(block.text);
      }
    }
  }

  return parts.join('\n').trim();
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/u, '');
}

async function hasDocsTree(root) {
  return (await isDirectory(join(root, WEBSITE_DOCS_ROOT))) && (await isDirectory(join(root, LEGACY_DOCS_ROOT)));
}

async function isDirectory(pathname) {
  try {
    return (await stat(pathname)).isDirectory();
  } catch {
    return false;
  }
}

async function collectFiles(root, predicate, acc = []) {
  if (!(await isDirectory(root))) {
    return acc;
  }

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = join(root, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(filePath, predicate, acc);
      continue;
    }

    if (entry.isFile() && predicate(filePath)) {
      acc.push(filePath);
    }
  }

  return acc;
}

function isMarkdown(filePath) {
  return ['.md', '.mdx'].includes(extname(filePath).toLowerCase());
}

async function parseDocFile({ filePath, relativePath, kind }) {
  const source = await readFile(filePath, 'utf8');
  const { attributes, body } = parseFrontmatter(source);
  const title = attributes.title || findFirstHeading(body) || basename(filePath, extname(filePath));
  const sections = splitSections(body, title);

  const chunks = [];
  sections.forEach((section, sectionIndex) => {
    const sectionChunks = splitSectionIntoChunks(section.content);
    sectionChunks.forEach((chunkText, partIndex) => {
      const rawText = chunkText.trim();
      if (rawText.length < 80) {
        return;
      }

      const plainText = normalizeWhitespace(stripMarkdown(rawText));
      const searchText = normalizeText(`${title}\n${section.heading}\n${plainText}\n${relativePath}`);
      const titleText = normalizeText(`${title} ${section.heading}`);
      const tokens = tokenize(searchText);

      chunks.push({
        id: `${relativePath}#${sectionIndex + 1}-${partIndex + 1}`,
        title,
        section: section.heading === title ? '' : section.heading,
        kind,
        relativePath,
        route: toRoute(relativePath, kind),
        rawText,
        plainText,
        searchText,
        titleText,
        tokens,
        tokenFrequency: countTokens(tokens),
        titleTokenFrequency: countTokens(tokenize(titleText)),
        codeBlocks: [...rawText.matchAll(CODE_BLOCK)].map((match) => match[2].trim()).filter(Boolean),
        partIndex,
      });
    });
  });

  return chunks;
}

function parseFrontmatter(source) {
  const match = source.match(FRONTMATTER);
  if (!match) {
    return { attributes: {}, body: source };
  }

  const attributes = {};
  match[1].split('\n').forEach((line) => {
    const separator = line.indexOf(':');
    if (separator === -1) {
      return;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    attributes[key] = value;
  });

  return {
    attributes,
    body: source.slice(match[0].length),
  };
}

function findFirstHeading(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function splitSections(body, fallbackTitle) {
  const cleaned = body
    .replace(/^import\s.+$/gm, '')
    .replace(/^export\s.+$/gm, '')
    .trim();

  const sections = [];
  let lastIndex = 0;
  let currentHeading = fallbackTitle;
  let match;

  while ((match = SECTION_SPLIT.exec(cleaned))) {
    if (match.index > lastIndex) {
      sections.push({
        heading: currentHeading,
        content: cleaned.slice(lastIndex, match.index).trim(),
      });
    }
    currentHeading = match[1].trim();
    lastIndex = SECTION_SPLIT.lastIndex;
  }

  sections.push({
    heading: currentHeading,
    content: cleaned.slice(lastIndex).trim(),
  });

  return sections.filter((section) => section.content);
}

function splitSectionIntoChunks(content, limit = 1600) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return [];
  }

  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= limit || !current) {
      current = candidate;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function toRoute(relativePath, kind) {
  if (kind !== 'website') {
    return null;
  }

  let route = relativePath.replace(`${WEBSITE_DOCS_ROOT}/`, '').replace(/\.(md|mdx)$/u, '');
  if (route.endsWith('/index')) {
    route = route.slice(0, -'/index'.length);
  }
  return `/${route}`.replace(/\/+/g, '/');
}

function stripMarkdown(source) {
  return source
    .replace(CODE_BLOCK, (_, __, code) => `\n${code}\n`)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/<[^>\n]+>/g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/[*_~]/g, ' ');
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeText(text) {
  return normalizeWhitespace(text.toLowerCase());
}

function tokenize(text) {
  return text.match(/[a-z0-9_./:-]+/g) || [];
}

function countTokens(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function scoreChunk(chunk, queryTerms, normalizedQuery, index) {
  let score = 0;

  if (normalizedQuery.length > 3) {
    if (chunk.searchText.includes(normalizedQuery)) {
      score += 14;
    }
    if (chunk.titleText.includes(normalizedQuery)) {
      score += 20;
    }
  }

  for (const term of queryTerms) {
    const idf = 1 + Math.log((index.chunkCount + 1) / ((index.documentFrequency.get(term) || 0) + 1));
    score += Math.min(chunk.tokenFrequency.get(term) || 0, 8) * idf;
    score += Math.min(chunk.titleTokenFrequency.get(term) || 0, 4) * idf * 4;
    if (chunk.relativePath.includes(term)) {
      score += idf * 2;
    }
  }

  return score / (1 + chunk.plainText.length / 2200);
}

function makeExcerpt(chunk, queryTerms) {
  const sentences = chunk.plainText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: queryTerms.reduce((sum, term) => sum + countOccurrences(normalizeText(sentence), term), 0),
    }))
    .sort((left, right) => right.score - left.score)
    .filter((entry) => entry.score > 0);

  if (ranked.length) {
    return ranked
      .slice(0, 2)
      .map((entry) => entry.sentence)
      .join(' ');
  }

  return sentences.slice(0, 2).join(' ');
}

function pickCodeExample(query, results) {
  const queryWantsCode = /\b(code|example|snippet|pattern|write|play|use)\b/i.test(query);
  const code = results.flatMap((result) => result.codeBlocks).find(Boolean);
  return queryWantsCode ? code || null : null;
}

function countOccurrences(text, term) {
  if (!term) {
    return 0;
  }
  const matches = text.match(new RegExp(`(?<![a-z0-9])${escapeRegExp(term)}(?![a-z0-9])`, 'g'));
  return matches ? matches.length : 0;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractFirstCodeBlock(text) {
  const match = text.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}
