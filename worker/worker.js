/**
 * CFA Study Hub — Cloudflare Worker
 *
 * Required secrets:
 *   ANTHROPIC_API_KEY
 *   APP_TOKEN
 *
 * Required binding:
 *   STUDY_KV (KV namespace)
 *
 * Optional binding:
 *   AI_RATE_LIMITER (Cloudflare Rate Limiting binding)
 *
 * Never commit real secret values to GitHub.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_ALLOWED_ORIGIN = 'https://ahmedshehata2002.github.io';
const MAX_BODY_BYTES = 120_000;
const MAX_SYNC_VALUE_BYTES = 750_000;
const MAX_NOTES_CHARS = 60_000;
const MAX_CHAT_CHARS = 20_000;

const DIAGNOSTIC_TYPES = [
  'concept gap',
  'mechanism gap',
  'formula gap',
  'calculation mistake',
  'misread wording',
  'CFA rule exception',
  'confused similar concepts',
];

export default {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin, env)) {
        return json({ error: 'Origin not allowed', code: 'ORIGIN_NOT_ALLOWED', requestId }, 403, cors, requestId);
      }
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const url = new URL(request.url);

      if (url.pathname === '/health' && request.method === 'GET') {
        return json({ ok: true, service: 'cfa-study-hub-worker' }, 200, cors, requestId);
      }

      if (!isAllowedOrigin(origin, env)) {
        return json({ error: 'Origin not allowed', code: 'ORIGIN_NOT_ALLOWED', requestId }, 403, cors, requestId);
      }

      const token = readBearer(request);
      if (!env.APP_TOKEN || !token || !safeEqual(token, env.APP_TOKEN)) {
        return json({ error: 'Invalid or missing app token', code: 'UNAUTHORIZED', requestId }, 401, cors, requestId);
      }

      const userHash = await sha256Hex(token).then((value) => value.slice(0, 24));

      if (url.pathname === '/auth/check' && request.method === 'GET') {
        return json({ ok: true }, 200, cors, requestId);
      }

      if (url.pathname === '/sync/list' && request.method === 'GET') {
        requireBinding(env, 'STUDY_KV');
        const data = await listStudyData(env.STUDY_KV, userHash);
        return json(data, 200, cors, requestId);
      }

      if (url.pathname === '/sync/set' && request.method === 'POST') {
        requireBinding(env, 'STUDY_KV');
        const body = await readJson(request);
        validateSyncPayload(body);
        await env.STUDY_KV.put(namespacedKey(userHash, body.key), body.value);
        return json({ ok: true }, 200, cors, requestId);
      }

      const aiRoutes = new Set(['/v1/lesson-core', '/v1/lesson-practice', '/v1/teach-back', '/v1/tutor']);
      if (aiRoutes.has(url.pathname) && request.method === 'POST') {
        await applyRateLimit(env, userHash);
      }

      if (url.pathname === '/v1/lesson-core' && request.method === 'POST') {
        const body = await readJson(request);
        const input = validateLessonInput(body);
        const upstream = await streamLessonCore(env, input, requestId);
        return new Response(upstream.body, {
          status: 200,
          headers: { ...cors, 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'x-request-id': requestId, 'x-content-type-options': 'nosniff' },
        });
      }

      if (url.pathname === '/v1/lesson-practice' && request.method === 'POST') {
        const body = await readJson(request);
        const input = validatePracticeInput(body);
        const upstream = await streamPractice(env, input, requestId);
        return new Response(upstream.body, {
          status: 200,
          headers: { ...cors, 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'x-request-id': requestId, 'x-content-type-options': 'nosniff' },
        });
      }

      if (url.pathname === '/v1/teach-back' && request.method === 'POST') {
        const body = await readJson(request);
        const input = validateTeachBackInput(body);
        const result = await assessTeachBack(env, input, requestId);
        return json(result, 200, cors, requestId);
      }

      if (url.pathname === '/v1/tutor' && request.method === 'POST') {
        const body = await readJson(request);
        const input = validateTutorInput(body);
        const result = await tutorReply(env, input, requestId);
        return json(result, 200, cors, requestId);
      }

      return json({ error: 'Route not found', code: 'NOT_FOUND', requestId }, 404, cors, requestId);
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      const code = error.code || 'INTERNAL_ERROR';
      const message = status >= 500 && !error.expose ? 'The study service could not complete the request.' : error.message;
      console.error(JSON.stringify({ requestId, code, status, message: error.message, stack: error.stack }));
      return json({ error: message, code, requestId }, status, cors, requestId);
    }
  },
};

function corsHeaders(origin, env) {
  const allowOrigin = isAllowedOrigin(origin, env) ? (origin || allowedOrigins(env)[0]) : allowedOrigins(env)[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function allowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN)
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return [...new Set(configured)];
}

function isAllowedOrigin(origin, env) {
  if (!origin) return true; // permits same-origin tools/curl only when token is also valid
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins(env).includes(normalized)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized);
}

function readBearer(request) {
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : '';
}

function safeEqual(a, b) {
  const left = new TextEncoder().encode(String(a));
  const right = new TextEncoder().encode(String(b));
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function namespacedKey(userHash, key) {
  return `u:${userHash}:${key}`;
}

async function listAll(kv, prefix) {
  const keys = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    keys.push(...page.keys.map((item) => item.name));
    cursor = page.list_complete ? undefined : page.cursor;
    if (keys.length > 5000) throw appError('Too many sync records', 413, 'SYNC_LIMIT', true);
  } while (cursor);
  return keys;
}

async function listStudyData(kv, userHash) {
  const prefix = `u:${userHash}:study:`;
  let names = await listAll(kv, prefix);
  let legacy = false;

  // One-time compatibility path for the old un-namespaced KV records.
  if (names.length === 0) {
    names = await listAll(kv, 'study:');
    legacy = names.length > 0;
  }

  const entries = await Promise.all(names.map(async (name) => {
    const value = await kv.get(name);
    const key = legacy ? name : name.slice(`u:${userHash}:`.length);
    if (legacy && value !== null) await kv.put(namespacedKey(userHash, key), value);
    return [key, value];
  }));

  return { ok: true, items: Object.fromEntries(entries), migratedFromLegacy: legacy };
}

function validateSyncPayload(body) {
  if (!body || typeof body !== 'object') throw appError('Invalid sync payload', 400, 'BAD_SYNC_PAYLOAD', true);
  if (typeof body.key !== 'string' || !/^study:[a-zA-Z0-9:_-]+$/.test(body.key)) {
    throw appError('Invalid sync key', 400, 'BAD_SYNC_KEY', true);
  }
  if (typeof body.value !== 'string') throw appError('Sync value must be a string', 400, 'BAD_SYNC_VALUE', true);
  if (new TextEncoder().encode(body.value).byteLength > MAX_SYNC_VALUE_BYTES) {
    throw appError('Sync value is too large', 413, 'SYNC_VALUE_TOO_LARGE', true);
  }
}

async function readJson(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) throw appError('Request is too large', 413, 'REQUEST_TOO_LARGE', true);
  let text;
  try {
    text = await request.text();
  } catch {
    throw appError('Could not read request body', 400, 'BODY_READ_FAILED', true);
  }
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw appError('Request is too large', 413, 'REQUEST_TOO_LARGE', true);
  }
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw appError('Request body must be valid JSON', 400, 'BAD_JSON', true);
  }
}

function validateLessonInput(body) {
  const title = boundedString(body?.readingTitle, 1, 300, 'readingTitle');
  const topicArea = boundedString(body?.topicArea, 1, 200, 'topicArea');
  const notes = optionalString(body?.notes, MAX_NOTES_CHARS, 'notes');
  return { title, topicArea, notes };
}

function validatePracticeInput(body) {
  const title = boundedString(body?.readingTitle, 1, 300, 'readingTitle');
  const topicArea = boundedString(body?.topicArea, 1, 200, 'topicArea');
  const core = body?.core;
  if (!core || typeof core !== 'object') throw appError('A generated core lesson is required', 400, 'CORE_REQUIRED', true);
  const serialized = JSON.stringify(core);
  if (serialized.length > 70_000) throw appError('Core lesson is too large', 413, 'CORE_TOO_LARGE', true);
  return { title, topicArea, core };
}

function validateTeachBackInput(body) {
  const title = boundedString(body?.readingTitle, 1, 300, 'readingTitle');
  const answer = boundedString(body?.answer, 1, 10_000, 'answer');
  const requiredIdeas = Array.isArray(body?.requiredIdeas)
    ? body.requiredIdeas.map((item) => boundedString(item, 1, 800, 'requiredIdeas item')).slice(0, 15)
    : [];
  if (!requiredIdeas.length) throw appError('Teach-back criteria are missing', 400, 'RUBRIC_REQUIRED', true);
  return { title, answer, requiredIdeas };
}

function validateTutorInput(body) {
  const title = boundedString(body?.readingTitle, 1, 300, 'readingTitle');
  const question = boundedString(body?.question, 1, 8_000, 'question');
  const context = optionalString(body?.context, MAX_CHAT_CHARS, 'context');
  const history = Array.isArray(body?.history)
    ? body.history.slice(-8).map((message) => ({
        role: message?.role === 'assistant' ? 'assistant' : 'user',
        content: optionalString(message?.content, 4_000, 'history content'),
      })).filter((message) => message.content)
    : [];
  return { title, question, context, history };
}

function boundedString(value, min, max, name) {
  if (typeof value !== 'string') throw appError(`${name} must be text`, 400, 'BAD_INPUT', true);
  const cleaned = value.trim();
  if (cleaned.length < min || cleaned.length > max) {
    throw appError(`${name} must be between ${min} and ${max} characters`, 400, 'BAD_INPUT', true);
  }
  return cleaned;
}

function optionalString(value, max, name) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > max) {
    throw appError(`${name} must be text under ${max} characters`, 400, 'BAD_INPUT', true);
  }
  return value.trim();
}

async function applyRateLimit(env, key) {
  if (!env.AI_RATE_LIMITER) return;
  const result = await env.AI_RATE_LIMITER.limit({ key });
  if (!result.success) throw appError('Too many AI requests. Pause briefly, then try again.', 429, 'RATE_LIMITED', true);
}

function requireBinding(env, name) {
  if (!env[name]) throw appError(`${name} binding is not configured`, 500, 'CONFIG_ERROR', false);
}

async function generateLessonCore(env, input, requestId) {
  const system = `You are the teaching engine for Ahmed's CFA Level I study app. Ahmed learns through mechanisms and cannot reliably retain a rule until every causal link is explicit.

Teach exactly in this order:
1. Locate the reading in a concept map.
2. Begin with the real-world problem that made the concept necessary.
3. Explain the intuition without CFA terminology.
4. Build a cause-and-effect mechanism. Every step must include WHY it follows and WHAT it causes next.
5. Derive each genuinely relevant formula from that mechanism. Never introduce a symbol without explaining its meaning and direction.
6. Work one example line by line and finish with a sanity check.
7. Translate the understood idea into CFA wording and identify the tempting trap.
8. End with a compressed exam summary.

Assume no finance background. Do not say “obviously,” “simply,” or “just.” Do not skip algebra. Do not fabricate formulas where none are needed. Remain inside the named reading. Keep each field concise enough to study on screen. Return only data matching the supplied JSON schema.`;

  const user = `TOPIC AREA: ${input.topicArea}
READING: ${input.title}

SOURCE NOTES:
${input.notes || '[No source notes were supplied. Use standard CFA Level I knowledge for this named reading and clearly avoid adjacent readings.]'}

Build the mechanism-first core lesson now.`;

  const result = await anthropicStructured(env, {
    system,
    user,
    schema: coreLessonSchema(),
    maxTokens: 7600,
    requestId,
  });
  return validateCoreOutput(result);
}

async function generatePractice(env, input, requestId) {
  const system = `You generate progressive CFA Level I practice for Ahmed after he has learned the mechanism. Test understanding in dependency order, not random difficulty.

Create exactly six multiple-choice questions:
Level 1 identify the concept.
Level 2 explain the mechanism.
Level 3 predict the direction of change.
Level 4 calculate.
Level 5 interpret the result.
Level 6 solve a realistic CFA-style mixed question.

Each question has exactly three choices and exactly one correct choice. Each choice must explain why it is right or wrong. Diagnose the likely misunderstanding using only these labels: ${DIAGNOSTIC_TYPES.join(', ')}.

Also create understanding checks that ask for reasoning before calculation and a teach-back prompt that cannot be answered by merely repeating a definition. Return only data matching the supplied JSON schema.`;

  const user = `TOPIC AREA: ${input.topicArea}
READING: ${input.title}

CORE LESSON:
${JSON.stringify(input.core)}

Generate progressive practice only for this reading.`;

  const result = await anthropicStructured(env, {
    system,
    user,
    schema: practiceSchema(),
    maxTokens: 5800,
    requestId,
  });
  return validatePracticeOutput(result);
}

async function assessTeachBack(env, input, requestId) {
  const system = `Assess whether a beginner genuinely understands the causal mechanism in a CFA reading. Reward clear cause-and-effect reasoning, not copied vocabulary. A response passes only when the required ideas are connected logically. Be precise and encouraging. Return only data matching the supplied JSON schema.`;
  const user = `READING: ${input.title}
REQUIRED IDEAS: ${JSON.stringify(input.requiredIdeas)}
AHMED'S EXPLANATION: ${input.answer}`;

  const result = await anthropicStructured(env, {
    system,
    user,
    schema: teachBackSchema(),
    maxTokens: 1200,
    requestId,
  });
  return validateTeachBackOutput(result);
}

async function tutorReply(env, input, requestId) {
  requireBinding(env, 'ANTHROPIC_API_KEY');
  const system = `You are Ahmed's mechanism-first CFA Level I tutor. Explain what problem a concept solves, then why each causal step follows, then connect the mechanism to formulas and CFA wording. Never skip algebra or assume finance intuition. Ask at most one diagnostic question when truly necessary. Stay inside the named reading. Use short paragraphs and explicit arrows when helpful.`;
  const messages = [
    ...input.history,
    { role: 'user', content: `READING: ${input.title}\nCONTEXT: ${input.context || '[none]'}\nQUESTION: ${input.question}` },
  ];

  const response = await callAnthropic(env, {
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 1400,
    system,
    messages,
  }, requestId);

  const text = extractText(response);
  if (!text) throw appError('The tutor returned an empty response', 502, 'EMPTY_AI_RESPONSE', true);
  return { text };
}

async function anthropicStructured(env, { system, user, schema, maxTokens, requestId }) {
  requireBinding(env, 'ANTHROPIC_API_KEY');
  const response = await callAnthropic(env, {
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      format: {
        type: 'json_schema',
        schema,
      },
    },
  }, requestId);

  if (response.stop_reason === 'max_tokens') {
    throw appError('The AI response reached its output limit before finishing. Shorten the source notes and try once more.', 502, 'AI_TRUNCATED', true);
  }
  if (response.stop_reason === 'refusal') {
    throw appError('The AI could not generate this lesson from the supplied material.', 502, 'AI_REFUSAL', true);
  }

  const text = extractText(response);
  if (!text) throw appError('The AI returned no lesson data', 502, 'EMPTY_AI_RESPONSE', true);

  try {
    return JSON.parse(text);
  } catch {
    throw appError('The AI response was not valid structured data', 502, 'INVALID_AI_JSON', true);
  }
}

async function callAnthropic(env, body, requestId) {
  requireBinding(env, 'ANTHROPIC_API_KEY');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 145_000);
  let response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'x-client-request-id': requestId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw appError('The AI request timed out', 504, 'AI_TIMEOUT', true);
    throw appError('Could not reach the AI service', 502, 'AI_UNAVAILABLE', true);
  } finally {
    clearTimeout(timeout);
  }

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw appError(`The AI service returned an unreadable response (${response.status})`, 502, 'AI_BAD_RESPONSE', true);
  }

  if (!response.ok) {
    const upstreamMessage = data?.error?.message || `Anthropic request failed with status ${response.status}`;
    const status = response.status === 429 ? 429 : 502;
    const code = response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_UPSTREAM_ERROR';
    throw appError(upstreamMessage, status, code, true);
  }

  return data;
}

async function callAnthropicStream(env, body, requestId) {
  requireBinding(env, 'ANTHROPIC_API_KEY');
  let response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'x-client-request-id': requestId,
      },
      body: JSON.stringify({ ...body, stream: true }),
    });
  } catch {
    throw appError('Could not reach the AI service', 502, 'AI_UNAVAILABLE', true);
  }
  if (!response.ok) {
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = {}; }
    const msg = data?.error?.message || `Anthropic error ${response.status}`;
    const status = response.status === 429 ? 429 : 502;
    throw appError(msg, status, response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_UPSTREAM_ERROR', true);
  }
  return response;
}

async function streamLessonCore(env, input, requestId) {
  const system = `You are the teaching engine for Ahmed's CFA Level I study app. Ahmed learns through mechanisms and cannot reliably retain a rule until every causal link is explicit.

Teach exactly in this order:
1. Locate the reading in a concept map.
2. Begin with the real-world problem that made the concept necessary.
3. Explain the intuition without CFA terminology.
4. Build a cause-and-effect mechanism. Every step must include WHY it follows and WHAT it causes next.
5. Derive each genuinely relevant formula from that mechanism. Never introduce a symbol without explaining its meaning and direction.
6. Work one example line by line and finish with a sanity check.
7. Translate the understood idea into CFA wording and identify the tempting trap.
8. End with a compressed exam summary.

Assume no finance background. Do not say "obviously," "simply," or "just." Do not skip algebra. Do not fabricate formulas where none are needed. Remain inside the named reading. Keep each field concise enough to study on screen. Return only data matching the supplied JSON schema.`;

  const user = `TOPIC AREA: ${input.topicArea}
READING: ${input.title}

SOURCE NOTES:
${input.notes || '[No source notes were supplied. Use standard CFA Level I knowledge for this named reading and clearly avoid adjacent readings.]'}

Build the mechanism-first core lesson now.`;

  return callAnthropicStream(env, {
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 7600,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [{ name: 'lesson_core', description: 'Generate the mechanism-first core lesson', input_schema: coreLessonSchema() }],
    tool_choice: { type: 'tool', name: 'lesson_core' },
  }, requestId);
}

async function streamPractice(env, input, requestId) {
  const system = `You generate progressive CFA Level I practice for Ahmed after he has learned the mechanism. Test understanding in dependency order, not random difficulty.

Create exactly six multiple-choice questions:
Level 1 identify the concept.
Level 2 explain the mechanism.
Level 3 predict the direction of change.
Level 4 calculate.
Level 5 interpret the result.
Level 6 solve a realistic CFA-style mixed question.

Each question has exactly three choices and exactly one correct choice. Each choice must explain why it is right or wrong. Diagnose the likely misunderstanding using only these labels: ${DIAGNOSTIC_TYPES.join(', ')}.

Also create understanding checks that ask for reasoning before calculation and a teach-back prompt that cannot be answered by merely repeating a definition. Return only data matching the supplied JSON schema.`;

  const user = `TOPIC AREA: ${input.topicArea}
READING: ${input.title}

CORE LESSON:
${JSON.stringify(input.core)}

Generate progressive practice only for this reading.`;

  return callAnthropicStream(env, {
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 5800,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [{ name: 'practice_session', description: 'Generate progressive CFA practice', input_schema: practiceSchema() }],
    tool_choice: { type: 'tool', name: 'practice_session' },
  }, requestId);
}

function extractText(response) {
  if (!Array.isArray(response?.content)) return '';
  return response.content
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('')
    .trim();
}

function validateCoreOutput(value) {
  if (!value || typeof value !== 'object') throw appError('The generated lesson had an invalid structure', 502, 'AI_SCHEMA_INVALID', true);
  if (!Array.isArray(value.map) || value.map.length === 0) throw appError('The generated concept map was empty', 502, 'AI_SCHEMA_INVALID', true);
  if (!Array.isArray(value.mechanism) || value.mechanism.length < 3) throw appError('The generated mechanism did not contain enough causal steps', 502, 'AI_SCHEMA_INVALID', true);
  if (!Array.isArray(value.formulas) || !Array.isArray(value.cfa_translation)) throw appError('The generated lesson was missing required sections', 502, 'AI_SCHEMA_INVALID', true);
  return value;
}

function validatePracticeOutput(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.practice_questions)) {
    throw appError('The generated practice had an invalid structure', 502, 'AI_SCHEMA_INVALID', true);
  }
  if (value.practice_questions.length !== 6) {
    throw appError('The generated practice did not contain exactly six levels', 502, 'AI_SCHEMA_INVALID', true);
  }
  const levels = new Set();
  for (const question of value.practice_questions) {
    if (!Number.isInteger(question.level) || question.level < 1 || question.level > 6) {
      throw appError('A practice question had an invalid level', 502, 'AI_SCHEMA_INVALID', true);
    }
    levels.add(question.level);
    if (!Array.isArray(question.choices) || question.choices.length !== 3) {
      throw appError('A practice question did not contain exactly three choices', 502, 'AI_SCHEMA_INVALID', true);
    }
    if (question.choices.filter((choice) => choice.correct === true).length !== 1) {
      throw appError('A practice question did not contain exactly one correct choice', 502, 'AI_SCHEMA_INVALID', true);
    }
    const diagnostic = DIAGNOSTIC_TYPES.find((item) => item.toLowerCase() === String(question.diagnostic_type || '').toLowerCase());
    if (!diagnostic) throw appError('A practice question used an unknown mistake diagnosis', 502, 'AI_SCHEMA_INVALID', true);
    question.diagnostic_type = diagnostic;
  }
  if (levels.size !== 6) throw appError('The generated practice repeated or skipped a difficulty level', 502, 'AI_SCHEMA_INVALID', true);
  if (!Array.isArray(value.understanding_checks) || !value.teach_back || !Array.isArray(value.teach_back.required_ideas)) {
    throw appError('The generated practice was missing reasoning checks or the teach-back rubric', 502, 'AI_SCHEMA_INVALID', true);
  }
  return value;
}

function validateTeachBackOutput(value) {
  if (!value || typeof value !== 'object' || typeof value.passed !== 'boolean' || !Array.isArray(value.missing_ideas)) {
    throw appError('The teach-back assessment had an invalid structure', 502, 'AI_SCHEMA_INVALID', true);
  }
  return value;
}

function coreLessonSchema() {
  const text = { type: 'string' };
  return {
    type: 'object',
    additionalProperties: false,
    required: ['meta', 'map', 'problem', 'intuition', 'mechanism', 'formulas', 'cfa_translation', 'exam_summary'],
    properties: {
      meta: object(['reading_title', 'topic_area', 'prerequisite', 'destination'], {
        reading_title: text,
        topic_area: text,
        prerequisite: text,
        destination: text,
      }),
      map: array(object(['concept', 'depends_on', 'unlocks'], { concept: text, depends_on: text, unlocks: text })),
      problem: object(['scenario', 'tension', 'why_concept_exists'], { scenario: text, tension: text, why_concept_exists: text }),
      intuition: object(['plain_english', 'analogy', 'formal_bridge'], { plain_english: text, analogy: text, formal_bridge: text }),
      mechanism: array(object(['step', 'because', 'leads_to'], { step: text, because: text, leads_to: text })),
      formulas: array(object(['name', 'expression', 'purpose', 'variables', 'derivation', 'worked_steps', 'answer', 'sanity_check'], {
        name: text,
        expression: text,
        purpose: text,
        variables: array(object(['symbol', 'meaning', 'direction'], { symbol: text, meaning: text, direction: text })),
        derivation: array(text),
        worked_steps: array(text),
        answer: text,
        sanity_check: text,
      })),
      cfa_translation: array(object(['plain_english', 'cfa_wording', 'trap'], { plain_english: text, cfa_wording: text, trap: text })),
      exam_summary: object(['core_idea', 'chain', 'formulas', 'traps', 'under_pressure'], {
        core_idea: text,
        chain: array(text),
        formulas: array(text),
        traps: array(text),
        under_pressure: array(text),
      }),
    },
  };
}

function practiceSchema() {
  const text = { type: 'string' };
  return {
    type: 'object',
    additionalProperties: false,
    required: ['understanding_checks', 'practice_questions', 'teach_back'],
    properties: {
      understanding_checks: array(object(['question', 'expected_reasoning', 'answer'], {
        question: text,
        expected_reasoning: text,
        answer: text,
      })),
      practice_questions: {
        type: 'array',
        description: 'Exactly six questions, one at each level from 1 through 6.',
        items: object(['level', 'stem', 'choices', 'diagnostic_type'], {
          level: { type: 'integer', description: 'An integer from 1 through 6.' },
          stem: text,
          choices: {
            type: 'array',
            description: 'Exactly three answer choices.',
            items: object(['text', 'correct', 'explanation'], {
              text,
              correct: { type: 'boolean' },
              explanation: text,
            }),
          },
          diagnostic_type: { type: 'string', description: `Use exactly one of: ${DIAGNOSTIC_TYPES.join(', ')}.` },
        }),
      },
      teach_back: object(['prompt', 'required_ideas', 'common_missing_link'], {
        prompt: text,
        required_ideas: array(text),
        common_missing_link: text,
      }),
    },
  };
}

function teachBackSchema() {
  const text = { type: 'string' };
  return {
    type: 'object',
    additionalProperties: false,
    required: ['passed', 'feedback', 'missing_ideas', 'next_prompt'],
    properties: {
      passed: { type: 'boolean' },
      feedback: text,
      missing_ideas: array(text),
      next_prompt: text,
    },
  };
}

function object(required, properties) {
  return { type: 'object', additionalProperties: false, required, properties };
}

function array(items) {
  return { type: 'array', items };
}

function json(data, status, cors, requestId) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-request-id': requestId,
      'x-content-type-options': 'nosniff',
    },
  });
}

function appError(message, status, code, expose) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.expose = expose;
  return error;
}
