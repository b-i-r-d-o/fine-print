// api/agent.js — the helper (a Vercel Function).
// The app on the phone talks to this. It holds the hidden API key (from Vercel's
// settings) and, in later build steps, passes contracts and conversation to the AI.
// Slice 1: a health check so the app knows whether the AI is connected.

export default async function handler(req, res) {
  const practice = !process.env.ANTHROPIC_API_KEY;
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, practice });
  }
  return res.status(501).json({ error: 'Reading agreements arrives in the next build step.' });
}
