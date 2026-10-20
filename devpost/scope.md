---
doc: scope
status: approved
---
<!-- Revised 2026-10-20 at Joann's direction during 3-prd: rental agreement becomes the full showcase,
     mortgage the "half" example; Play Store install dropped; sign-in shown as demo; email connect "coming soon". -->

# Fine Print

A "Swiss Army knife" AI agent on your phone for every personal agreement: it files your contracts, notices what's coming up, asks you plain questions about your situation, and helps you take the next step.

## The Unique Kernel
Fine Print doesn't just store or summarize a contract — it reads it, notices what matters for *your* situation, asks you a plain question, and then helps you act. Example: you upload a rental agreement and it says *this fixed-term tenancy ended 2 months ago — are you looking to renew with your landlord?* You say "no, I want to move out," and it explains the Alberta notice rule and drafts the notice for you.

## Who It's For
Everyday people with a life full of agreements — leases, mortgages, phone and internet plans, credit cards, warranties — who sign them and never reread them, then scramble when something comes due. Today they skim, trust, and hope, or scan "20 pages of small print looking for a date or dates, if that even exists."

## The Core Loop
1. Sign in (demo) and answer a few quick profile questions.
2. Upload an agreement.
3. The agent identifies it, notes key dates and actions, and asks a plain question about where you stand.
4. You answer in your own words; the agent explains your options and offers to do the next minor action (e.g. draft a notice).
5. The agreement sits on your home list with its status and any pending action.

Why you come back: every new agreement gets filed and checked the same way, and it gets off your mind.

## Inspiration & Identity
- Feels like a calm, helpful agent in a chat box — not a legal tool.
- A Swiss Army knife for agreements, not a rentals app — the demo shows two contract types on purpose.
- Three themes, female-friendly with neutral names: neutral beige (default), blue and black, maroon and olive with a serif font. Details in `prd.md > Look and Feel`.
- Summary tone: "quite simple and casual," emojis welcome.

## Why This Matters to the Learner
Joann spent nearly a decade managing contracts professionally, where no agreement is signed and forgotten. Fine Print brings that discipline to personal life: "helping me have an option to organize in my life, do minor actions and get these things off my mind." She also wants hands-on practice building with AI and a clear grasp of the stages from idea to shipped product.

## What "Working" Looks Like
The demo, in Joann's sequence:
1. Tap the Fine Print icon on the phone home screen (video staging: everyday apps on page 1, swipe to page 2 where Fine Print sits among related apps).
2. "Welcome! Please sign up or sign in" with Google / Facebook buttons — labelled as demo.
3. "Welcome to Fine Print — upload documents for storage now, or set up your user profile?" → profile.
4. Profile questions: support for yourself or your household; age range; learn about contract topics or review your own contracts → Review.
5. "Connect your email for us to sift through (coming soon), or upload agreements for review." → upload a rental agreement.
6. "Looks like you've uploaded a rental agreement. This fixed-term tenancy ended 2 months ago — are you looking to renew with your landlord?" → "No, I want to move out."
7. The agent explains Alberta's rule (one full tenancy month's written notice) and asks "Would you like me to draft the notice?" → yes.
8. The agent drafts the notice to the landlord: "I've drafted the notice for you, please review. Next step: deliver it to your landlord." (User prints and mails it — off-app.)
9. Home view: the rental agreement listed with a highlight and "action pending."
10. Upload a signed mortgage agreement → "This looks like a signed mortgage agreement. I've noted these dates and actions…" → Store or Review → Store.

**The "oh, that's cool" beat:** the agent spots that the lease already ended, asks what you want, and hands you a ready-to-send notice.

## The POC Boundary
**Guiding rule (Joann's call):** depth over breadth. Effort goes into the demoable flow that shows how usable Fine Print is. Features outside that flow can appear on screen as non-functional, clearly marked "coming soon" or "demo," and be explained in the submission — that's preferable to building them half-working.

- One app that runs on a phone (in the browser, saveable to the home screen with its own icon).
- Sign-in screen (demo, no real accounts) and profile questions.
- Agent chat driving the flow; three themes.
- Upload an agreement; real AI reading of it.
- Rental agreement (full showcase): identify, spot the ended term, ask intent, explain Alberta notice rule, draft the notice.
- Mortgage agreement (the "half"): identify as signed, list key dates and actions, store.
- Home list of agreements with status and pending actions.

## Later
_Any of these may appear in the app as a visible "coming soon" control, per the guiding rule._
- Connecting email to find agreements automatically; per-user forwarding address.
- Full pre-signing review: 5 highlights tied to your profile, relevance taps, "are you okay with this?" questions, issuer summary.
- "Learn about contract topics" path.
- Real Google / Facebook sign-in and accounts.
- Learning over time from your answers and usage.
- Calendar integration for key dates, linked to the contract and clause.
- Real folder linking (desktop), Dropbox / Google Drive / phone files storage.
- Comparing a new contract version against the previous one.
- Deep built-in knowledge for every common contract type and province.

## Explicitly Cut
- **Separate native iPhone and Android apps** — weeks of work, plus a Mac and developer accounts; one phone-ready app shows the same experience.
- **Installing from the Play Store in the demo** — requires a published native app; the demo starts at the home-screen icon instead.
