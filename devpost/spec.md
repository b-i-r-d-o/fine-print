---
doc: spec
status: draft
---

# Fine Print — Technical Spec

## How This Works, In Plain Language
Fine Print has three pieces:

1. **The app.** This is a website built to look and feel like a phone app. You open it in your phone's browser and tap "Add to Home Screen," so it gets its own Fine Print icon. It's made from plain HTML (the content), CSS (the look and the three themes) and JavaScript (the behaviour). It shows every screen, runs the conversation, makes the PDF notice, and remembers your agreements on the phone itself.
2. **The helper.** This is a small program on a server (a computer that's always on, waiting to be asked) hosted free on **Vercel**. When the app needs the AI, it sends the helper the contract and the conversation. The helper adds the agent's instructions, attaches the hidden **API key** (a password that bills your AI account), asks the AI, and passes the answer back. The key lives only in Vercel's settings, never in the public GitHub code.
3. **The AI (Claude).** It reads the contract once, writes down the important facts (type, people, address, dates, signed or not), and answers in a structured format the app can act on, such as "show this message with Yes/No buttons."

**The agent rule of thumb: the AI decides what to say, the app decides what's allowed.** The app runs the fixed steps itself: sign-in, profile, buttons, the home list, and the date calculation for the notice. The AI does the reading, understanding and writing. Legal facts that must be right, the Alberta notice rule, sit word for word in the agent's instructions. The notice end date is calculated by the app's code, not guessed by the AI.

**Why this shape:** it's the smallest set of pieces that lets a real AI read a real contract on your phone while keeping the key secret. There's no database and there are no accounts. Everything for the demo is saved on the phone.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Open + theme.** Tap the icon and the app loads from Vercel in the default theme. Picking a theme saves it on the phone and restyles every screen.
2. **Sign in (demo).** The app shows the demo buttons. Tapping one just moves on, with nothing sent anywhere.
3. **Start choice + profile.** The app asks the three questions and saves the answers on the phone. Nothing goes to the AI.
4. **Empty home.** The app sees no saved agreements and shows "Upload your first agreement!" plus the agent's upload message (fixed text).
5. **Upload the rental.** The user picks a file or takes photos. The app shrinks the photos and sends the file to the helper as a **"read"** request, along with today's date from the phone.
6. **AI reads it.** The helper sends Claude the instructions plus the document. Claude returns the facts: type = residential tenancy, landlord and tenant names, rental address, landlord address missing, term start and end, rent day, signed yes or no, a short summary, and the first question to ask. The app saves those facts on the phone and files the agreement as `date-party-purpose.pdf`.
7. **Agent asks.** The app shows Claude's message: "…ended 2 months ago. Are you looking to renew?"
8. **User replies freely.** "No, I want to move out" goes to the helper as a **"chat"** request, carrying the saved facts and the conversation so far, not the whole document again. Claude explains the Alberta rule and offers to draft the notice, with Yes/No buttons.
9. **Fill the gaps.** Claude's reply notes the missing landlord address, so the app shows "Do you have this?" with Yes/No.
10. **Draft the notice.** The app calculates the end date with its own code (see `Notice Builder`), then sends a **"draft"** request. Claude writes the notice wording from the facts and the end date. The app shows it in the notice view.
11. **Edit + PDF.** "Would you like to edit the notice?" Yes makes the text editable. Tapping "Get PDF" builds the PDF on the phone. The agent gives delivery guidance.
12. **Home list.** The rental agreement is marked "Term ended" with "Action pending: deliver notice to landlord," and that's saved on the phone.
13. **Upload the mortgage.** It's another "read" request. Claude returns type = mortgage, the lender, signed = yes, and a list of key dates and actions. The app shows them with Store and Review buttons. Store saves it. Review shows "coming soon."
14. **Not an agreement (if it happens).** "read" returns is_agreement = false and a short description. The app asks "Would you like to continue to store this document?"
15. **Blurry photo (if it happens).** "read" returns readable = false. The app asks the user to retake the photo.

## Stack
- **App:** plain HTML, CSS and JavaScript, with no framework and no build step. It was chosen so every file stays readable for a first-time builder. The tradeoff is more hand-written code than a framework would need, which is fine at this size.
- **PDF:** [jsPDF](https://github.com/parallax/jsPDF) 2.5.1, loaded from the cdnjs CDN. It makes the notice PDF on the phone.
- **Fonts:** Google Fonts (see Look and Feel).
- **Helper:** one [Vercel Function](https://vercel.com/docs/functions) in Node.js, using the built-in `fetch` to call the AI. There's no AI SDK, so switching providers later only changes one file.
- **AI:** [Claude API, Messages endpoint](https://docs.claude.com/en/api/messages). Joann's choice for the demo: it's pay-as-you-go, likely under $5 for the hackathon, and strong at careful document reading. She may switch to Gemini's free tier later for a public showcase, which only changes `lib/ai.js`.
  - **Reading** (the "read" request): Claude Sonnet 5.5, for careful extraction.
  - **Chat and drafting:** Claude Haiku 5.5, which is cheaper and fast. It moves up to Sonnet if the quality isn't good enough during the build.
  - **Verify early in the build:** the exact model ID strings (expected `claude-sonnet-5-5` and `claude-haiku-5-5`) and the current PDF and image input format, from the [models overview](https://docs.claude.com/en/docs/about-claude/models/overview) and [PDF support](https://docs.claude.com/en/docs/build-with-claude/pdf-support) docs.
- **Hosting:** [Vercel](https://vercel.com/docs) Hobby, which is free. Joann agreed to create an account by signing in with GitHub.

## Where It Runs and How Someone Tries It
- **Runtime:** the app runs in the phone's browser. The helper runs on Vercel.
- **Needed:** a Vercel account linked to GitHub, and a Claude API key from the [Claude Console](https://console.anthropic.com/) with a few dollars of credit, saved in Vercel as the environment variable `ANTHROPIC_API_KEY`. The key is never pasted into chat or committed to GitHub. `.env.example` shows the name only.
- **Deploy:** in Vercel, Add New → Project → import `b-i-r-d-o/fine-print` → add `ANTHROPIC_API_KEY` → Deploy. Every push to `main` redeploys automatically.
- **Try it:** open the Vercel URL (e.g. `https://fine-print-xxxx.vercel.app`) on the phone, use the browser menu to "Add to Home Screen," then open it from the icon.
- **Local development (build agent only):** `node dev-server.js` serves the app and the helper at `http://localhost:3000`. Without a key it runs in **practice mode**, with canned AI replies clearly labelled "PRACTICE MODE" on screen, so the screens can be built and checked without spending credit. The demo is always recorded on the real Vercel URL with real AI, never in practice mode.
- **Demo recording:** screen-record on the phone (built into Android and iPhone). Use the fictional sample lease printed out (for the photo path) or saved to the phone (for the upload path), plus the fictional sample mortgage PDF.
- **Submission:** a 1–3 minute video plus the public GitHub repo. A live URL is a bonus. Joann may keep it online later and switch to Gemini.

## Look and Feel
From `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.
- **Three themes** through CSS colour variables, set on the page with `data-theme`. Names are neutral (proposed; Joann can rename):
  - **Linen** (default): warm neutral beige background, soft taupe surfaces, deep brown-grey text, a muted sage or clay accent. A clean sans-serif. Calm and spacious.
  - **Midnight:** near-black background, deep navy surfaces, crisp blue accent, white text. Same sans-serif.
  - **Heirloom:** cream-paper background, maroon primary, olive secondary, a serif print-style font for headings and body. This is the one the demo ends in.
- **Feel:** female-friendly and calm, with roomy spacing and soft rounded corners. It feels like a messaging app, not a legal tool. Tap targets are large enough for thumbs.
- **Agent voice:** simple and casual, short sentences, a few emojis, never legalese.
- **Highlights:** the "action pending" row uses the theme's accent with a small flag. Yes/No and Store/Review choices appear as pill buttons under the agent's message.
- **Demo labels:** "Demo" and "Coming soon" tags are small, visible, and honest.

## Components

### App Shell and Screens
`public/index.html`, `public/app.js`. A single page that swaps between screens: Welcome/Sign-in, Start Choice, Profile, Home (with chat), Notice, and Camera. It holds the step-by-step flow and decides which buttons appear.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Demo Sign-In`, `prd.md > Profile Setup`.

### Theme Switcher
`public/styles.css`, `public/app.js`. A dropdown on the welcome screen and in the home header sets `data-theme` on the page and saves the choice.
PRD ref: `prd.md > Theme Switching`.

### Upload and Camera
`public/upload.js`. The (+) button opens the phone's file picker for a PDF or image. The camera button uses the phone camera (`<input type="file" accept="image/*" capture="environment">`), repeated for "next page" until "done." Photos get resized to about 1600px wide and compressed so the whole upload stays under Vercel's request size limit. The email option is a "coming soon" tag.
PRD ref: `prd.md > Agreement Upload`.

### Agent Client
`public/agent.js`. Sends requests to the helper (`/api/agent`) with a `mode` of `read`, `chat` or `draft`. It shows a "Reading your agreement…" loader and turns the AI's structured reply into chat bubbles and buttons.
PRD ref: `prd.md > Agreement Reading`, `prd.md > Rental Agreement: Move-Out Help`, `prd.md > Mortgage Agreement: Dates and Actions`.

### Helper (Vercel Function)
`api/agent.js`. Receives the request, picks the instructions for that mode from `lib/prompts.js`, calls the AI through `lib/ai.js`, checks the reply is valid structured data (retrying once if not), and returns it. It never stores anything. If the key is missing, it returns practice-mode replies from `lib/practice.js`.

### Agent Instructions
`lib/prompts.js`. The system prompts for `read`, `chat` and `draft`, covering:
- **The agent's job and tone:** simple, casual, emojis welcome. It never claims to give legal advice. It sets `explains_rule: true` when a reply explains a law or rule, so the app can show its one-time guidance caption (see `Guidance Notice`).
- **The reply format.** Every reply is one JSON object:
  `{ "message": "...", "choices": ["Yes","No"] | null, "action": "none" | "offer_draft" | "ask_missing" | "store_prompt" | "retake_photo", "explains_rule": true | false, "facts": {...} | null }`
- **The Alberta rule, word for word**, from the [Government of Alberta](https://www.alberta.ca/ending-a-tenancy.aspx). A fixed-term tenancy ends on its stated date. If both sides continue without renewing, it becomes periodic. To end a monthly periodic tenancy, the tenant gives one full tenancy month's written notice. The notice must include the rental address, the end date, and the signature of the person giving notice. Tenants don't need to give a reason.
- **What to extract in `read`:** `is_agreement`, `readable`, `type`, `party_name`, `user_name`, `rental_address`, `other_party_address` (or null), `agreement_date`, `term_start`, `term_end`, `rent_day`, `lease_identifiers`, `signed`, `summary`, `key_dates_and_actions` (for the mortgage), and `first_question`.

### AI Connector
`lib/ai.js`. This is the only file that knows which AI company is used. It sends `POST https://api.anthropic.com/v1/messages` and returns the text. Switching to Gemini later means rewriting just this file.

### Notice Builder
`public/notice.js`. Implements `prd.md > Rental Agreement: Move-Out Help`.
- **End-date calculation (code, not AI):** from today and the rent day, it finds the end of the next complete tenancy month. Example: with rent due on the 1st and notice given Oct 20, the end date is Nov 30. If notice were given on the 1st itself, it would be the last day of that month. The rule is verified with a few test dates during the build.
- **Notice view:** title, date, tenant and landlord names, landlord address (or a blank line), rental address, lease identifiers, "This is my notice to end the tenancy on [end date]," and a signature line. Text becomes editable after "Yes" to edit.
- **PDF:** jsPDF turns the (possibly edited) notice into `Notice-to-End-Tenancy.pdf` for the user to save or print.

### Guidance Notice
`public/index.html`, `public/notice.js`, `lib/prompts.js`. Implements `prd.md > Guidance, Not Legal Advice`.
- **Welcome screen:** a fixed line under the sign-in buttons: "Fine Print helps you understand your agreements. It's guidance, not legal advice."
- **Rule explanations (subtle):** the app, not the AI, adds a small, muted caption, "General guidance, not legal advice," under the agent's message the first time per session that a reply includes a rule explanation. The reply flags this with `"explains_rule": true`. It isn't repeated after that, so it doesn't distract (Joann's call). The agent instructions still forbid claiming to give legal advice.
- **Notice view:** a line above the notice: "Drafted as a guide. Review it before you send it." It's not printed on the PDF.
- **README:** a short "Not legal advice" section.

### Home List
`public/app.js`, `public/storage.js`. Rows show the file name (`date-party-purpose.pdf`), type and party, a status ("Term ended," "Signed · stored," "Stored"), and a highlighted "Action pending: …" line when relevant. Empty state per `prd.md > States and Boundaries`.
PRD ref: `prd.md > Home List`.

### Phone App Feel
`public/manifest.webmanifest`, `public/icons/`. Name, icon and theme colour so "Add to Home Screen" gives a proper Fine Print icon that opens full-screen.

### Sample Documents
`samples/`. These are **fictional** documents for the demo, made during the build and clearly marked as samples in the repo:
- `sample-alberta-lease.pdf`: a residential tenancy agreement in Alberta with a fixed term that ended about two months before the demo (e.g. Sep 1, 2025 to Aug 31, 2026), rent due on the 1st, and **no landlord address**.
- `sample-mortgage.pdf`: a signed mortgage agreement from a fictional lender, with payment dates, a term and renewal date, and insurance and property-tax requirements.

## Data Model
Everything the app remembers is saved in the phone browser's **local storage**, a small notebook the browser keeps for this one site. It's still there when the app is closed and reopened, and it's cleared only if the browser's site data is cleared.

| Data | Where it lives | Updated when | Leave and come back |
|---|---|---|---|
| `theme` | local storage | the theme is picked | stays |
| `profile` (`for`, `age`, `goal`) | local storage | profile questions are answered | stays |
| `agreements[]`: `{ id, fileName, type, party, status, pendingAction, facts, addedAt }` | local storage | after each "read," draft or store | stays |
| `conversation` (messages for the current agreement) | in memory, plus local storage | each message | stays for the current agreement |
| `notice` (draft text, end date) | local storage | when drafted or edited | stays |
| The uploaded file itself | in memory only, sent once to the helper | at upload | **not kept** (see What Was Simplified) |

A small "Reset demo" link in a corner (hidden in the video) clears everything so the demo can be filmed again from a blank first use.

## File Structure

```
fine-print/
├── public/                     # Everything the phone downloads
│   ├── index.html              # The single page; all screens live here (incl. the guidance line)
│   ├── styles.css              # Layout + the three themes (Linen, Midnight, Heirloom)
│   ├── app.js                  # Screen flow, profile, home list, buttons
│   ├── agent.js                # Talks to /api/agent; turns replies into bubbles/buttons
│   ├── upload.js               # File picker, camera pages, photo shrinking
│   ├── notice.js               # End-date calculation, notice view, PDF
│   ├── storage.js              # Save/load from the phone's local storage
│   ├── manifest.webmanifest    # Makes "Add to Home Screen" look like an app
│   └── icons/                  # Fine Print app icons
├── api/
│   └── agent.js                # The helper (Vercel Function): read / chat / draft
├── lib/
│   ├── ai.js                   # The ONLY file that knows it's Claude (swap for Gemini later)
│   ├── prompts.js              # Agent instructions + Alberta rule + reply format
│   └── practice.js             # Canned replies for local building without a key
├── samples/                    # FICTIONAL demo documents
│   ├── sample-alberta-lease.pdf
│   └── sample-mortgage.pdf
├── tools/
│   └── make-samples.py         # Script that generates the sample PDFs
├── dev-server.js               # Local test server for the build (practice mode)
├── package.json                # Project info for Vercel (no heavy dependencies)
├── .env.example                # Shows ANTHROPIC_API_KEY= (no real value)
├── devpost/                    # Planning docs (scope, prd, spec, checklist)
├── LICENSE                     # MIT
└── README.md                   # What it is, how to run and deploy
```

## External Services and Dependencies

### Claude API
- **Call:** `POST https://api.anthropic.com/v1/messages`
- **Headers:** `x-api-key: $ANTHROPIC_API_KEY`, `anthropic-version: 2023-06-01`, `content-type: application/json`
- **Body ("read"):** `{ model, max_tokens: 2000, system: <read prompt>, messages: [{ role: "user", content: [ { type: "document", source: { type: "base64", media_type: "application/pdf", data } } or { type: "image", source: { type: "base64", media_type: "image/jpeg", data } } (one per page), { type: "text", text: "Today is YYYY-MM-DD. Read this." } ] }] }`
- **Body ("chat"/"draft"):** the same, but with the saved facts and conversation as text instead of the document.
- **Response:** `content[0].text`, which holds the JSON reply described under Agent Instructions.
- **Docs:** [Messages API](https://docs.claude.com/en/api/messages), [PDF support](https://docs.claude.com/en/docs/build-with-claude/pdf-support), [Vision](https://docs.claude.com/en/docs/build-with-claude/vision), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- **Cost:** Sonnet 5.5 costs $2 per million input tokens and $10 per million output tokens. Haiku 5.5 costs $0.10 and $0.50 for prompts under 100k tokens. A 20-page lease read is a few cents. The hackathon total is likely under $5.

### Vercel
- **Hobby plan (free):** static files plus Functions. **Verify early:** the request body size limit (about 4.5 MB, which is why photos get shrunk) and the function time limit for slow AI replies. [Functions limits](https://vercel.com/docs/functions/limitations).

### jsPDF (CDN)
- `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`. [Docs](https://artskydj.github.io/jsPDF/docs/).

## Important Failure Modes
- **AI is slow** → "Reading your agreement… 📄" with a gentle animation. After 60 seconds: "This is taking longer than usual — try again?" with a retry button.
- **AI reply isn't valid structured data** → the helper retries once automatically. If it fails again: "Something went wrong reading that — try again?"
- **Upload too big or unreadable photo** → photos are shrunk automatically. If the AI says the text isn't readable: "This photo is unfocused 📷 — please retake it for clear text." A PDF too big to send: "This file is too large — try a photo of the key pages."
- **Key missing or out of credit** → a plain message: "The AI isn't connected right now." (In local building only, practice mode is clearly labelled.)
- **Wrong end date** → avoided by calculating it in code, with test dates checked during the build.

## What Was Simplified and Why
- **Demo sign-in buttons** instead of real Google/Facebook accounts, because accounts don't prove the idea (Joann's call). The full version would need an identity service and secure sessions.
- **Saved on the phone** instead of a cloud database, because there's a single user and a single demo. The full version would need accounts and a database to sync across devices and household members.
- **Agreements are filed by name and facts, not by keeping the original file.** Phone browser storage is too small for PDFs. The home list shows the clean file name, status and facts. The full version would keep originals in cloud storage (Dropbox/Google Drive, already on the Later list).
- **The document is read once, then only the facts are sent on.** Follow-up chat stays fast and cheap. The full version might re-read the document for clause-level questions.
- **The notice end date is calculated in code**, because legal correctness shouldn't depend on the AI's arithmetic.
- **Practice mode for building,** so screens can be built and checked without spending credit or sharing the key. It's never used for the demo.

## Decisions and Open Issues

### Decisions
- **Guidance, not legal advice** is stated in the app, in the agent's instructions and in the README (Joann's call; see `Guidance Notice`).
- **Hosted on Vercel**, so the app reaches the phone and the key stays hidden (Joann agreed).
- **Claude for the demo,** with a possible switch to Gemini's free tier later for a public showcase (Joann's choice). Built so that only `lib/ai.js` changes.
- **No framework:** plain HTML/CSS/JS. This was recommended for readability, and Joann accepted the recommended approach.
- **"The AI decides what to say, the app decides what's allowed."** The fixed steps are app-controlled, and the reading, understanding and writing are AI-driven.
- **Neutral theme names** (Linen, Midnight, Heirloom) are proposed. Joann can rename them during the build.
- **Design and UI details:** Joann expects the build to make strong first-pass choices on styling and layout ("a fairly Claude-flavoured build") and plans to fine-tune after seeing it. Look and Feel above is the starting direction.

### Learner uncertainty
Asked what she was least sure about, Joann said she'd rather **see it during or after the build and ask questions then**, expecting plenty to come up. Agreed approach: during `5-build`, pause at visible milestones (first screen on her phone, first real AI read, the notice PDF) for her questions. The build's wrap-up app map will walk through how her phone, the helper and the AI connect. Record what she asks under the learner profile's Learning Moments.

### Open issues (non-blocking, check early in the build)
- Exact Claude model ID strings and the current PDF/image request format.
- Vercel's request size and function time limits on the Hobby plan.
- Whether her phone (Android or iPhone) shows the full-screen icon from "Add to Home Screen" with this manifest. Test on her actual phone.
- From `prd.md > Open Questions`: theme dropdown placement (welcome screen and home header, settled during the build), and the fictional sample documents (made in the build; see Sample Documents).
