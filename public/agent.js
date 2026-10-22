// agent.js — the phone side of talking to the helper (/api/agent).
// It sends a request, waits (with a time limit), and hands back the AI's structured reply.
// The key never comes here: the helper on Vercel adds it.

const TIME_LIMIT_MS = 60000;

export async function askHelper(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIME_LIMIT_MS);
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let data = {};
    try { data = await res.json(); } catch { /* not JSON */ }
    if (res.status === 413) return { error: 'This file is too large. Try a photo of the key pages.' };
    if (!res.ok) return { error: data.error || 'Something went wrong reading that. Try again?' };
    return data;
  } catch (err) {
    if (err.name === 'AbortError') return { error: 'This is taking longer than usual.', slow: true };
    return { error: "Couldn't reach Fine Print. Check your connection and try again." };
  } finally {
    clearTimeout(timer);
  }
}

// Today's date on this phone, as YYYY-MM-DD (so "ended 2 months ago" uses the user's clock).
export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
