// api/agent.js — the helper (a Vercel Function).
// The phone app talks to this. It holds the hidden API key (from Vercel's settings),
// adds the agent's instructions, asks the AI, checks the reply is in the agreed format,
// and passes it back. It stores nothing.
//
// GET  /api/agent                      -> { ok, practice }  (is the AI connected?)
// POST /api/agent { mode: 'read', files: [{ name, type, data(base64) }], today, profile }
// POST /api/agent { mode: 'chat', message, facts, conversation, today, profile }

import { askAI, hasKey } from '../lib/ai.js';
import { READ_PROMPT, readUserText, CHAT_PROMPT, chatUserText, CATEGORIES } from '../lib/prompts.js';
import { practiceRead, practiceChat } from '../lib/practice.js';

// Pull the JSON object out of the AI's reply, even if it wrapped it in extra text.
export function parseReply(text) {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* try harder below */ }
  // Extra text or a second object around the answer: take the first complete {...} that parses.
  for (let i = start; i !== -1; i = cleaned.indexOf('{', i + 1)) {
    let depth = 0; let inStr = false; let esc = false;
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        try { const obj = JSON.parse(cleaned.slice(i, j + 1)); if (obj && typeof obj === 'object' && 'message' in obj) return obj; } catch { /* keep looking */ }
        break;
      }
    }
  }
  return null;
}

// Last resort for chat: the AI answered but not as clean JSON. Keep its words rather than failing.
export function salvageChat(text) {
  if (!text || !text.trim()) return null;
  const m = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  let message;
  if (m) { try { message = JSON.parse(`"${m[1]}"`); } catch { message = m[1]; } }
  else if (!text.includes('{')) message = text.trim();
  if (!message || !message.trim()) return null;
  const offer = /draft (the|a|your) notice\?/i.test(message);
  return { message: message.trim().slice(0, 1500), choices: offer ? ['Yes, draft it', 'No thanks'] : null, action: offer ? 'offer_draft' : 'none', explains_rule: /Residential Tenancies Act/i.test(message) };
}

// The reply must have what the app needs before it's allowed through.
export function validRead(r) {
  if (!r || typeof r !== 'object' || typeof r.message !== 'string' || !r.message.trim()) return false;
  if (r.readable === false) return true;
  if (r.is_agreement === false) return true;
  if (!CATEGORIES.includes(r.category)) r.category = 'other';
  if (!Array.isArray(r.contacts)) r.contacts = [];
  if (!Array.isArray(r.key_dates_and_actions)) r.key_dates_and_actions = [];
  const s = r.suggested_action;
  r.suggested_action = s && typeof s.label === 'string' && s.label.trim()
    ? { label: s.label.trim().slice(0, 90), how: typeof s.how === 'string' ? s.how.trim().slice(0, 400) : '' }
    : null;
  return typeof r.type === 'string' && typeof r.signed === 'boolean';
}

export function validChat(r) {
  if (!r || typeof r !== 'object' || typeof r.message !== 'string' || !r.message.trim()) return false;
  if (!Array.isArray(r.choices)) r.choices = null;
  if (!['offer_draft', 'none'].includes(r.action)) r.action = 'none';
  r.explains_rule = r.explains_rule === true;
  return true;
}

async function chat(body) {
  const message = String(body.message || '').slice(0, 2000);
  if (!message.trim()) return { status: 400, json: { error: 'Type a message first.' } };
  if (!hasKey()) return { status: 200, json: { practice: true, reply: practiceChat(body) } };
  const facts = body.facts && typeof body.facts === 'object' ? body.facts : null;
  const conversation = Array.isArray(body.conversation) ? body.conversation.filter((m) => m && typeof m.text === 'string').slice(-10) : [];
  const content = [{ kind: 'text', text: chatUserText({ today: body.today, facts, conversation, message, profile: body.profile }) }];
  let last = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await askAI({
      speed: 'quick',
      system: CHAT_PROMPT + (attempt === 2 ? '\n\nIMPORTANT: Your last reply was not valid. Reply with the JSON object only.' : ''),
      content,
      maxTokens: 1200,
    });
    last = text;
    const reply = parseReply(text);
    if (validChat(reply)) return { status: 200, json: { practice: false, reply } };
    console.error('chat reply not valid (attempt ' + attempt + '):', String(text).slice(0, 600));
  }
  const salvaged = salvageChat(last);
  if (salvaged && validChat(salvaged)) return { status: 200, json: { practice: false, reply: salvaged } };
  return { status: 502, json: { error: 'Something went wrong. Try again?' } };
}

// Several photos are labelled "Photo 1", "Photo 2"… in the order they were taken,
// so the AI can say which order the pages really go in.
function filesToContent(files) {
  const many = files.length > 1;
  return files.flatMap((f, i) => {
    const block = f.type === 'application/pdf'
      ? { kind: 'pdf', data: f.data }
      : { kind: 'image', data: f.data, mediaType: f.type || 'image/jpeg' };
    return many ? [{ kind: 'text', text: `Photo ${i + 1}:` }, block] : [block];
  });
}

// page_order must list every photo number exactly once; otherwise it's dropped.
export function validPageOrder(order, count) {
  if (!Array.isArray(order) || order.length !== count) return null;
  const seen = new Set(order.map(Number));
  for (let n = 1; n <= count; n++) if (!seen.has(n)) return null;
  return order.map(Number);
}

async function read(body) {
  const files = Array.isArray(body.files) ? body.files.filter((f) => f && f.data) : [];
  if (!files.length) return { status: 400, json: { error: 'No file was received. Please try uploading again.' } };
  if (!hasKey()) return { status: 200, json: { practice: true, reply: practiceRead(files) } };

  const content = [...filesToContent(files), { kind: 'text', text: readUserText({ ...body, photos: files.length > 1 ? files.length : 0 }) }];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await askAI({
      speed: 'careful',
      system: READ_PROMPT + (attempt === 2 ? '\n\nIMPORTANT: Your last reply was not valid. Reply with the JSON object only.' : ''),
      content,
      maxTokens: 2000,
    });
    const reply = parseReply(text);
    if (!validRead(reply)) console.error('read reply not valid (attempt ' + attempt + '):', String(text).slice(0, 600));
    if (validRead(reply)) {
      reply.page_order = files.length > 1 ? validPageOrder(reply.page_order, files.length) : null;
      const photos = files.every((f) => f.type !== 'application/pdf');
      reply.photo_issue = photos && typeof reply.photo_issue === 'string' && reply.photo_issue.trim() ? reply.photo_issue.trim().slice(0, 300) : null;
      return { status: 200, json: { practice: false, reply } };
    }
  }
  return { status: 502, json: { error: 'Something went wrong reading that. Try again?' } };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, practice: !hasKey() });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  try {
    if (body.mode === 'read' || body.mode === 'chat') {
      const out = body.mode === 'read' ? await read(body) : await chat(body);
      return res.status(out.status).json(out.json);
    }
    return res.status(400).json({ error: 'Unknown request.' });
  } catch (err) {
    const notConnected = err.status === 401 || err.status === 403;
    const outOfCredit = err.status === 400 && /credit|billing/i.test(err.detail || '');
    console.error('agent error', err.status, err.detail || err.message);
    return res.status(502).json({
      error: notConnected || outOfCredit
        ? "The AI isn't connected right now."
        : 'Something went wrong reading that. Try again?',
    });
  }
}
