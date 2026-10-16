---
doc: scope
status: draft
---

# Fine Print

An AI agent on your phone that files your personal contracts and, when you're about to sign, turns the clauses that matter to *you* into plain yes/no questions.

## The Unique Kernel
Fine Print doesn't just summarize a contract — it knows a little about you and asks, in plain language, "are you okay with this?" about the clauses that affect your life. Example: at the lawyer's office, your phone pings: *this lender says the home must be your primary residence — no rental, no short-term rental. Are you okay with this?* It gets more relevant as you tell it what matters to you.

## Who It's For
Everyday people with a life full of agreements — leases, mortgages, phone and internet plans, credit cards, warranties — who sign them and never reread them. The sharpest moment: someone about to sign a mortgage, under pressure, with 20+ pages of small print and no time to find what matters. Today they skim, trust, and hope — or scan page after page "looking for a date or dates, if that even exists."

## The Core Loop
1. Quick setup: a few general profile questions so the agent knows what's relevant to you.
2. A contract comes in (photo, page by page, or upload).
3. The agent identifies it (type, issuer), files it with a clean name (`date-party-purpose.pdf`), and checks whether it's signed.
4. If you're reviewing it to sign: 5 key highlights in a simple, casual tone, plus one "item of note," and you tap whether each is relevant to you.
5. Want to learn more? 3 questions/notes worth asking — then "are you comfortable with these points?"
6. You leave with either peace of mind or a short list to take to the issuer.

Why you come back: every new agreement gets filed and checked the same way, and it gets off your mind.

## Inspiration & Identity
- Feels like a calm, helpful agent in a chat box — not a legal tool.
- Default theme: "nice soothing professional." Alternate: "more colourful personality." Themes for mass appeal (3 in the full vision).
- Summary tone: "quite simple and casual," emojis welcome.
- Profile questions set up "the way Muse is" — light, general, revisited over time. (Reference to clarify in PRD.)

## Why This Matters to the Learner
Joann spent nearly a decade managing contracts professionally, where no agreement is signed and forgotten. Fine Print brings that discipline to personal life: "helping me have an option to organize in my life, do minor actions and get these things off my mind." She also wants hands-on practice building with AI and a clear grasp of the stages from idea to shipped product.

## What "Working" Looks Like
The demo, in her words and sequence:
0. **Video staging (not an app feature):** phone home screen with medium-to-large icons. Page 1 has everyday apps: calendar, email, phone, text, and "a stupid game." Swipe to page 2, where Fine Print sits among relevant apps (e.g. banking, files, wallet).
1. Tap the Fine Print icon; the app opens.
2. Switch theme from soothing professional to colourful personality.
3. Home: "Welcome to your agreements!" — demo agreements listed with a gradient fade, named `date-party-purpose.pdf`. Agent text box at the bottom: "Would you like to upload a new contract?"
4. Type "yes" → upload (+) and camera icons get circled in yellow.
5. Camera: framing cues, "next page" prompts, and a "done" button.
6. Send → "This is a mortgage agreement with XYZ Bank. Filed as `[name]`. It isn't signed — are you reviewing this for signing?"
7. "No" → "Stored as `[name]-unsigned`." Then "wait, I mean yes" → review continues.
8. "This is a very standard mortgage agreement…" — amortization, fixed rate (e.g., 4.2%), 3 more points, plus an item of note specific to this mortgage. User marks highlights relevant / not relevant.
9. "Learn more?" → yes → 3 questions with answers (e.g., "How does this compare to other mortgages?" → what's typical, and what this one adds).
10. "Are you comfortable with these points? Review more?" → no → summary of points to raise with the issuer, and "upload the new version when they send one."

**The "oh, that's cool" beat:** the agent connects a clause to something you told it at setup — and asks you about it plainly.

## The POC Boundary
**Guiding rule (Joann's call):** depth over breadth. Effort goes into the demoable flow that shows how usable Fine Print is. Features outside that flow can appear on screen as non-functional, clearly marked "coming soon," and be explained in the submission — that's preferable to building them half-working.

- One app that runs on a phone (in the browser, saveable to the home screen with its own icon).
- Short profile setup; relevance tap on highlights.
- Agent chat box driving the flow; theme switch (at least soothing vs. colourful).
- Demo agreement list with the naming convention.
- Contract intake by multi-page photo and by upload; real AI reading of the contract.
- Identify type + issuer, name it, detect signed/unsigned, store.
- Signing review: 5 highlights + item of note, 3 learn-more Q&As, comfort check, issuer summary.
- Mortgage is the showcase contract type.

## Later
_Any of these may show up in the app as a visible "coming soon" control, per the guiding rule — which ones gets decided in the PRD._
- Learning over time from your relevance answers and usage; profile questions revisited at intervals.
- Calendar integration: suggested date highlights with links back to the contract and clause.
- Per-user forwarding email address for contracts.
- Real folder linking (desktop) and Dropbox / Google Drive / phone files storage.
- Comparing a new contract version against the previous one.
- Deep built-in knowledge for every common contract type (rental, credit card, mobile, internet, warranties…).
- A third theme.

## Explicitly Cut
- **Separate native iPhone and Android apps** — two builds is weeks of work and a native iPhone app needs a Mac and Apple developer account; one phone-ready app shows the same experience.
