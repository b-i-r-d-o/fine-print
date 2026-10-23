// lib/ai.js — the ONLY file that knows which AI company Fine Print uses.
// To switch to another provider later (e.g. Gemini's free tier, or a user's own model),
// rewrite askAI() here; nothing else in the app needs to change.

const API_URL = 'https://api.anthropic.com/v1/messages';

export const MODELS = {
  careful: process.env.FP_MODEL_CAREFUL || 'claude-sonnet-5-5', // first read of a contract
  quick: process.env.FP_MODEL_QUICK || 'claude-haiku-5-5',      // chat and drafting
};

export function hasKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Ask the AI once.
 * @param {object} opts
 * @param {'careful'|'quick'} opts.speed  which model to use
 * @param {string} opts.system           the agent's instructions
 * @param {Array}  opts.content          content blocks: {kind:'pdf'|'image'|'text', data?, mediaType?, text?}
 * @param {number} [opts.maxTokens]
 * @returns {Promise<string>} the AI's reply text
 */
export async function askAI({ speed = 'quick', system, content, maxTokens = 1500 }) {
  const blocks = content.map((c) => {
    if (c.kind === 'pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: c.data } };
    if (c.kind === 'image') return { type: 'image', source: { type: 'base64', media_type: c.mediaType || 'image/jpeg', data: c.data } };
    return { type: 'text', text: c.text };
  });

  const send = () => fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS[speed] || MODELS.quick,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: blocks }],
    }),
  });

  // The AI service is briefly busy or rate-limited: wait a moment and try once more.
  let res = await send();
  if ([429, 500, 502, 503, 529].includes(res.status)) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await send();
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`AI request failed (${res.status})`);
    err.status = res.status;
    err.detail = detail.slice(0, 500);
    throw err;
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}
