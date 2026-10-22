# Fine Print

**You've signed dozens of contracts you'll never reread. Fine Print reads them for you.**

Fine Print is a phone app with an AI agent for your personal agreements: leases, mortgages, phone plans, warranties, anything with terms and conditions. It files your agreements, notices what's coming due, asks you plain questions about your situation, and helps you take the next small step, like drafting a move-out notice.

Built for Devpost's **Build With AI: Basics** hackathon.

> **Not legal advice.** Fine Print is a comprehension and guidance tool. It explains public rules in plain language and drafts standard documents for you to review. It doesn't replace a lawyer.

## Privacy and your data

This is a hackathon demo shell, shown with **fictional** sample documents. In the demo, an uploaded agreement is sent to one hosted AI (Claude) through a small server helper to be read. Nothing is stored on the server, and your agreements list stays on your phone.

A real version needs stronger data handling before anyone trusts it with their own contracts:
- **Bring your own AI:** connect your own API key, a private or business AI account, or a model that runs on your own device, so your agreements stay confidential.
- Control over where documents are stored, encryption, delete-anytime, a clear no-training-on-your-data policy, and retention settings.

The app is built so that only one file (`lib/ai.js`) knows which AI is used, which keeps that option open.

## Status

🛠️ Being built in slices. See [`devpost/checklist.md`](devpost/checklist.md) for progress, and [`devpost/`](devpost/) for the scope, product requirements and technical plan.

## Run it locally

```bash
node dev-server.js
# open http://localhost:3000
```

Without an API key it runs in clearly labelled **practice mode** with canned replies.

## Deploy

1. Import this repo into [Vercel](https://vercel.com) (Add New → Project).
2. Add the environment variable `ANTHROPIC_API_KEY` (Project → Settings → Environment Variables).
3. Deploy. Open the link on your phone and choose **Add to Home Screen**.

## License

MIT. Fonts: Figtree, Lora and Fredoka, SIL Open Font License (see `public/fonts/`). PDF: jsPDF 2.5.1, MIT (see `public/vendor/`).
