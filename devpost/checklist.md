---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

**About verification in this build:** this cloud workspace can run the app and helper locally in practice mode, but it can't reach Vercel and has no API key (the key never comes into chat). So the mechanical checks run locally in practice mode, with real code paths, schema checks and browser screenshots. The **real-AI behaviour** is confirmed by Joann on her phone at the live Vercel link, as part of each learner check.

## Slices

- [ ] **1. Fine Print opens from your phone's home screen and walks you to an empty home**
  Becomes usable: A live Vercel link that opens on the phone and saves to the home screen with the Fine Print icon. It goes from Welcome (with the guidance line) through the theme switch (Linen, Midnight, Heirloom), the demo sign-in, the start choice and the three profile questions, to the empty home with "Upload your first agreement!" and the email "coming soon" tag. The theme and profile answers survive closing and reopening.
  Why now: It proves the whole delivery path first (repo → Vercel → phone → home-screen icon), which is the riskiest unfamiliar setup, and it gives every later slice a real screen to land on. It also sets the look early, while feedback can still shape it.
  PRD ref: `prd.md > The Core Journey` (steps 1–6), `prd.md > Theme Switching`, `prd.md > Demo Sign-In`, `prd.md > Profile Setup`, `prd.md > Guidance, Not Legal Advice`, `prd.md > States and Boundaries` (first use)
  Spec ref: `spec.md > App Shell and Screens`, `spec.md > Theme Switcher`, `spec.md > Phone App Feel`, `spec.md > Guidance Notice`, `spec.md > Look and Feel`, `spec.md > Data Model`, `spec.md > File Structure`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Scaffold per the spec file structure (`public/`, `api/`, `lib/`, `package.json`, `.env.example`, `dev-server.js`, README stub). Build the screens, the three themes with fonts, the local storage helpers, the manifest and icons, a stub `/api/agent` that answers a health check, and the hidden "Reset demo" link. Guide Joann through importing the repo into Vercel.
  Verify (mechanical): Start `node dev-server.js`. Load it in a headless browser at phone size. Step through Welcome → theme switch → sign-in → start → profile → home, and confirm each screen appears. Confirm `data-theme` changes and the serif font applies in Heirloom. Reload and confirm the theme and profile persist. Confirm the guidance line on Welcome. Take screenshots of each theme. Confirm no console errors.
  Learner check: Open the Vercel link on your phone, add it to your home screen, and tap the icon. Switch themes, tap through sign-in and the profile questions, and land on the empty home. Close and reopen it: is your theme still there? Tell me how it looks and feels compared with what you pictured.
  Commit: `Add phone shell: welcome, themes, demo sign-in, profile, empty home`

- [ ] **2. Upload the rental agreement and the agent reads it and asks about renewing**
  Becomes usable: Uploading the fictional Alberta lease (file picker) gets a real AI read. The agent says it's a rental agreement, notes the fixed term ended about 2 months ago, and asks "Are you looking to renew with your landlord?" The agreement appears on the home list under a clean `date-party-purpose.pdf` name with its status.
  Why now: This is the kernel and the biggest technical risk (a real document through the helper to Claude and back as structured data). Proving it early means any surprise with the AI, the PDF format or Vercel limits shows up while there's time to adjust.
  PRD ref: `prd.md > The Core Journey` (steps 7–8), `prd.md > Agreement Upload`, `prd.md > Agreement Reading`, `prd.md > Home List`
  Spec ref: `spec.md > Upload and Camera`, `spec.md > Agent Client`, `spec.md > Helper (Vercel Function)`, `spec.md > Agent Instructions`, `spec.md > AI Connector`, `spec.md > Sample Documents`, `spec.md > External Services and Dependencies`, `spec.md > Important Failure Modes`
  Build: Generate the fictional sample lease and mortgage PDFs (`tools/make-samples.py`). Build the file upload, the `read` mode in the helper, the prompts with the reply format and facts list, `lib/ai.js` for the Claude Messages API, the practice-mode replies, reply validation with one retry, the loader and timeout, chat bubbles and buttons, and the filing name and home-list row. Verify the Claude model IDs and PDF format against the docs. Joann adds `ANTHROPIC_API_KEY` in Vercel settings.
  Verify (mechanical): Run the helper's `read` mode in practice mode with the sample lease and confirm the reply passes the JSON schema check. Confirm the request body for the real call matches the documented Messages API format (model ID, document block, base64). In the headless browser, upload the sample lease and confirm the loader, the agent question bubble and the home-list row with the correct name. Confirm a missing key shows "The AI isn't connected right now" when practice mode is off.
  Learner check: On your phone, upload `sample-alberta-lease.pdf`. Does the agent correctly say what it is, who the landlord is, and that it ended about 2 months ago, then ask about renewing? Is it on your home list with a sensible name?
  Commit: `Read uploaded agreements with Claude and ask the first question`

- [ ] **3. Tell it you're moving out and get a ready-to-send Alberta notice**
  Becomes usable: Typing "No, I want to move out" gets the Alberta rule explained (with the subtle one-time guidance caption) and an offer to draft. The agent asks about the missing landlord address. The notice is drafted with the end date calculated in code. You can edit it, then save it as a PDF. Delivery guidance appears, and the home list shows "Action pending: deliver notice to landlord."
  Why now: It completes the kernel, the demo's payoff, right after the first read works. It's built on the facts slice 2 saves.
  PRD ref: `prd.md > The Core Journey` (steps 9–14), `prd.md > Rental Agreement: Move-Out Help`, `prd.md > Guidance, Not Legal Advice`, `prd.md > Home List`
  Spec ref: `spec.md > Notice Builder`, `spec.md > Agent Instructions`, `spec.md > Agent Client`, `spec.md > Guidance Notice`, `spec.md > Data Model`
  Build: Add the `chat` and `draft` helper modes and prompts (Alberta rule word for word), general questions with no document (`prd.md > Ask Before Uploading`), free-text reply handling, the missing-details question, the end-date function, the notice view with the "Drafted as a guide" line, edit mode, jsPDF output, the one-time guidance caption, and the pending-action status on the home list.
  Verify (mechanical): Run the end-date function against test dates: Oct 20 with rent on the 1st → Nov 30; Nov 1 → Nov 30; Dec 15 → Jan 31; Feb 2 → Mar 31. In the headless browser (practice mode), go through move-out → yes → no address → notice. Confirm the notice includes the address, end date and signature line, edits persist into the PDF, a PDF file is produced, the caption appears only once, and the home row shows the pending action.
  Learner check: On your phone, reply "No, I want to move out." Does the rule explanation read right to you as a contracts person? Does the notice have everything a valid notice needs? Edit a word, save the PDF, and open it. Does your home list now show the action pending?
  Commit: `Draft editable Alberta move-out notice with PDF and pending action`

- [ ] **4. Take photos of a paper contract, with a retake prompt for blurry pages**
  Becomes usable: The camera button takes photos page by page with "next page" and "done." Photos are shrunk before sending, and a blurry or unreadable photo gets "This photo is unfocused 📷, please retake it for clear text."
  Why now: Photo intake is part of the demo but depends on the reading path from slice 2. It's isolated here so the main flow never breaks while camera handling is being worked out.
  PRD ref: `prd.md > Agreement Upload`, `prd.md > States and Boundaries` (blurry photo)
  Spec ref: `spec.md > Upload and Camera`, `spec.md > Important Failure Modes`
  Build: Add camera capture with multiple pages, client-side resize and compression, sending multiple images in a `read` request, the `readable: false` handling, and the retake flow.
  Verify (mechanical): In the headless browser, feed three large test images and confirm each is resized to about 1600px and the total request stays under 4 MB. Confirm a practice-mode `readable: false` reply shows the retake prompt and returns to the camera.
  Learner check: Print or display a couple of pages of the sample lease. Photograph them with the camera button, tap done, and see if it reads them. Then take a deliberately blurry photo. Do you get the retake prompt?
  Commit: `Add multi-page camera capture with blurry-photo retake`

- [ ] **5. Upload the mortgage, store it, and handle a non-agreement**
  Becomes usable: Uploading the sample mortgage gets "This looks like a signed mortgage agreement. I've noted these dates and actions…" with Store and Review buttons. Store files it on the home list, and Review shows "coming soon." Uploading something that isn't an agreement gets "looks like [summary], would you like to continue to store this document?" The coming-soon controls (email, Learn, mortgage Review) explain themselves, and the README is complete, including "Not legal advice."
  Why now: It shows the Swiss Army knife breadth on top of a finished kernel, and it reuses the `read` path, so it's lower risk.
  PRD ref: `prd.md > The Core Journey` (steps 15–16), `prd.md > Mortgage Agreement: Dates and Actions`, `prd.md > Agreement Upload` (not an agreement), `prd.md > States and Boundaries`, `prd.md > Guidance, Not Legal Advice`
  Spec ref: `spec.md > Agent Instructions`, `spec.md > Home List`, `spec.md > Guidance Notice`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Add mortgage-specific facts (key dates and actions) to the read prompt, the Store/Review buttons, the non-agreement storage prompt, the coming-soon handlers, and the README with how to run, deploy, and the not-legal-advice note.
  Verify (mechanical): In the headless browser (practice mode), upload the mortgage, then tap Store and confirm the home list shows both agreements with correct statuses. Tap Review and confirm coming soon. Upload a non-agreement and confirm the storage prompt, and that yes stores it as "Stored." Reload and confirm all of it persists. Run "Reset demo" and confirm a blank first use.
  Learner check: On your phone, after the rental, upload `sample-mortgage.pdf`. Are the dates and actions it lists right? Tap Store. Then upload any random photo, like a receipt. Does it describe it and offer to store it? Finally, run through the whole demo once from Reset.
  Commit: `Add mortgage dates-and-actions, non-agreement storage, and README`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2 (first real AI read on her phone), where feedback can still shape the notice and remaining slices
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Learner checks happen on the live Vercel link, so each slice is committed and pushed after mechanical verification and before the learner check. Fixes from the check become follow-up commits, and the box is ticked once the check passes. This workspace can't reach Vercel, and the key never enters chat.
- Slice 1 learner feedback: added phone back navigation, on-screen Back buttons, and a home menu (Edit profile, Sign out demo); reworked Heirloom into a dusky plum and wine theme; swapped the profile icon to 😘. Joann found she couldn't get back from home, and that Heirloom was too close to Linen.
- Added `prd.md > Ask Before Uploading`: a chat box on the start-choice screen for asking a contract question right away. Real answers get wired up with the slice 3 `chat` mode. Joann pointed out that people may have a question before uploading anything.
