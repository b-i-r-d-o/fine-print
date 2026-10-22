# Fine Print

**You've signed dozens of contracts you'll never reread. Fine Print reads them for you.**

Fine Print is a phone app with an AI agent for your personal agreements: leases, mortgages, phone plans, warranties, anything with terms and conditions. It files your agreements, notices what's coming due, asks you plain questions about your situation, and helps you take the next small step, like drafting a move-out notice.

Created by Joann Dobish for Devpost's **Build With AI: Basics** hackathon, October 2026.

> **Not legal advice.** Fine Print is a comprehension and guidance tool. It explains public rules in plain language and drafts standard documents for you to review. It doesn't replace a lawyer.

## What it does

- **Reads an uploaded agreement** (PDF or photo) and works out its type, the other party, key dates, whether it's signed, and the contacts in it.
- **Files it** under a clean name (`date-party-purpose.pdf`) in categories: Housing, Medical, Financial, Marriage and Estate planning.
- **Asks you a plain question** about where you stand. For example: *"This fixed-term tenancy ended 2 months ago. Are you looking to renew with your landlord?"*
- **Helps you act.** Say "No, I want to move out" and it explains Alberta's notice rule, asks about anything missing (like the landlord's address), and drafts an editable **Notice to End Tenancy** as a PDF. The end date and deliver-by date are calculated in code.
- **Lists dates and actions** for a mortgage (payments, tax and insurance proof, renewal), and offers a **celebration post** for a new home, without your address, amounts or lender.
- **Saves contacts** from an agreement to your phone contacts, with a note about which agreement they came from.
- **Keeps each agreement's page and conversation history**, so you can continue a past chat, start a new one, or delete it.
- **Five themes:** Linen, Midnight, Heirloom, Popstar and Large Script (larger text, high contrast). It also has 🔊 read aloud.

### Try it with the demo agreements

The sign-in screen links to two **fictional** sample agreements. You can also find them in [`samples/`](samples/):
- `sample-alberta-lease.pdf`: a one-year Alberta lease that has ended. The landlord's address is deliberately missing.
- `sample-mortgage.pdf`: a signed home mortgage.

Every name, company, address and number in them is invented.

## How it works

```
Phone (the app)  ──►  Helper on Vercel (/api/agent)  ──►  Claude (Anthropic API)
 screens, themes,      adds the agent's instructions,       reads the contract once,
 notice + PDF,         holds the hidden API key,            answers in a fixed format
 saved on the phone    checks the reply's format            the app can act on
```

**The AI decides what to say; the app decides what's allowed.** Legal rules (Alberta's notice rule) are written into the agent's instructions word for word, and dates are calculated in code.

- `public/`: the app (plain HTML, CSS and JavaScript, no framework)
- `api/agent.js`: the helper (a Vercel Function)
- `lib/ai.js`: the **only** file that knows which AI is used, so it can be swapped (e.g. for Gemini, or a user's own model)
- `lib/prompts.js`: the agent's instructions and the Alberta rule
- `devpost/`: the planning documents (scope, product requirements, technical spec, build checklist)

## Privacy and your data

This is a hackathon demo shell, shown with **fictional** sample documents. An uploaded agreement is sent to one hosted AI (Claude) through the helper to be read. Nothing is stored on the server, and your agreements and chats stay on your phone.

**Left out on purpose, and next to build:**
- secure sign-in with two-factor authentication (the demo sign-in creates no account)
- storage choices (cloud or on-device)
- **bring your own AI**, so your own key, a private model or an on-device model keeps your agreements confidential
- encryption, delete-anytime, a no-training-on-your-data policy and retention settings
- full jurisdiction handling (the demo's built-in rules cover Alberta tenancies)

## Run it locally

```bash
node dev-server.js
# open http://localhost:3000
```

Without an API key it runs in clearly labelled **practice mode** with canned replies.

## Deploy

1. Import this repo into [Vercel](https://vercel.com) (Add New → Project).
2. Add the environment variable `ANTHROPIC_API_KEY` (Project → Settings → Environment Variables). Never commit a key; `.env.example` shows the name only.
3. Deploy. Open the link on your phone and choose **Add to Home Screen**.

## License

MIT. Fonts: Figtree, Lora and Fredoka, SIL Open Font License (see `public/fonts/`). PDF: jsPDF 2.5.1, MIT (see `public/vendor/`).
