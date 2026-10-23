---
doc: prd
status: approved
---

# Fine Print — Product Requirements

A phone app with an AI agent that files your personal agreements, notices what's coming due, asks you plain questions about your situation, and does the next small task for you. It's a "Swiss Army knife" for everyday people's contracts, not a rentals app.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > What "Working" Looks Like`, `scope.md > The Core Loop`.

1. **Open.** The user taps the Fine Print icon on their phone's home screen. The app opens on the **Welcome** screen in the default beige theme.
2. **Pick a theme.** From the theme dropdown, the user tries the blue-and-black theme, then picks the maroon-and-olive serif theme. It stays for the rest of the session.
3. **Sign in (demo).** "Welcome! Please sign up or sign in." Google and Facebook buttons, labelled as demo. Tapping either continues without a real account.
4. **Choose a start.** "Welcome to Fine Print! Would you like to upload documents for storage right now, or set up your user profile?" The user picks **profile**.
5. **Profile questions.** Three questions, one at a time, as tap choices:
   - Are you looking for support with contracts for yourself or your household? → *Self / Household*
   - What is your age range? → *18–25 / 25–35 / 35–45 / 45–65 / 65+*
   - Would you like to learn about some contract topics, or review your own contracts? → *Learn / Review*
   The user picks **Review**.
6. **Empty home + upload prompt.** The home screen is empty: upload icon and "Upload your first agreement!" The agent says: "You can connect your email for us to sift through and pull out agreements (coming soon), or upload any agreements for review."
7. **Upload the rental agreement.** The user uploads a file or takes photos of the pages.
8. **Agent reads it and asks.** "Looks like you've uploaded a rental agreement. This fixed-term tenancy ended 2 months ago. Are you looking to renew with your landlord?"
9. **User answers in their own words.** "No, I want to move out."
10. **Agent explains the rule and offers help.** It explains that in Alberta, when a fixed-term tenancy has ended and continued month to month, the tenant must give one full tenancy month's written notice, and the notice needs the rental address, the end date and the tenant's signature. "Would you like me to draft the notice?" → yes.
11. **Agent fills the gaps.** "The lease doesn't list an address for the landlord. Do you have this?" → no.
12. **Notice drafted.** "I've drafted the notice for you, please review." The notice appears. "Would you like to edit the notice?" → the user can edit it.
13. **Ready to send.** "The notice is ready as a PDF to print and mail or drop off, or email if that's the agreed contact method. The next step is to deliver it to your landlord." (In the video, the user prints and mails it off-app.)
14. **Home list.** The home screen now lists the rental agreement, highlighted, with "Action pending: deliver notice to landlord."
15. **Upload the mortgage agreement.** "This looks like a signed mortgage agreement. I've noted the following dates and actions from the document:" followed by a short list. Then **Store** or **Review**. The user taps **Store**.
16. **Done.** The home list shows both agreements with their status.

**Success:** a first-time user gets from a blank app to a ready-to-send, legally complete move-out notice, plus a second agreement filed with its key dates, without reading the fine print themselves.

## Screens and Layout
- **Welcome / sign-in.** App name, theme dropdown, "Welcome! Please sign up or sign in," Google and Facebook buttons marked "Demo."
- **Start choice.** Two choices: upload documents now, or set up your profile.
- **Profile questions.** One question per screen, tap-to-answer choices.
- **Home.** Header with the app name and theme dropdown. The agreements list fills the top. The agent chat box sits at the bottom, with upload (+) and camera icons. Empty state: upload icon and "Upload your first agreement!"
- **Agent conversation.** The chat with the agent opens over or below the home list. The agent's messages, the user's typed replies, and tap choices (yes/no, Store/Review) all appear here.
- **Notice view.** The drafted notice, shown as a readable document. Edit mode, and a button to get the PDF.
- **Camera.** Page-by-page capture with "next page" and "done."

## Look and Feel
Source: `scope.md > Inspiration & Identity`.
- **Default theme:** neutral beige, calm colour scheme. This is what the app opens in.
- **Theme 2:** blue and black.
- **Theme 3 (Heirloom):** dusky plum-mauve with wine maroon and olive, serif print-style font, a "vampire-y" feel. It's used for the rest of the demo.
- **Theme 4 (Popstar):** bright pink, electric blue and lime green, with a rounded, bouncy display font. It's energetic, aimed at someone young, fun, or just feeling spunky (added during the build at Joann's request).
- The overall product should feel female-friendly, but theme names in the app stay neutral, not gendered.
- The agent feels calm and helpful, like a chat, not a legal tool. Its tone is simple and casual, and emojis are welcome.
- The theme choice applies to every screen.

## Features and Behavior

### Theme Switching
- [ ] The app opens in the beige theme.
- [ ] The dropdown lists three themes. Selecting one restyles every screen right away.
- [ ] The maroon-and-olive theme uses a serif font. The chosen theme stays while moving through the app.

### Demo Sign-In
- [ ] Google and Facebook buttons are visibly labelled as demo.
- [ ] The app **always opens on the sign-in screen**, whatever link or page was used last, because it holds personal contracts (Joann's call). First-timers continue to the start choice. Returning users go straight to home with their agreements and chat. No account is created or required.
- [ ] Sign out (demo) returns to sign-in and keeps the saved agreements on the phone.

### Profile Setup
Revised during the build at Joann's direction: a household needs different questions from one person.
- [ ] Question 1: "Are you looking to be supported with your contracts for yourself or your household?" → *Self / Household*.
- [ ] **Self:** "What is your age range?" → *18–25 / 25–35 / 35–45 / 45–65 / 65+*.
- [ ] **Household:** "How many people are in your household?" → *2–6* (typing up to 10 works). Then one question per person: "Person N: what is their age range?" → *1–20 / 20–40 / 40–60 / 60+*. Then "Would you like individual profiles set up, or keep all the contracts together for this household?" → *Individual profiles / Keep together*.
- [ ] Last question for both: learn about contract topics, or review your own contracts → *Learn / Review*.
- [ ] Every question has the chat box. A typed answer counts the same as tapping. Anything else typed goes to the home chat as a question.
- [ ] Choosing **Review** leads to the empty home screen and the upload prompt. Choosing **Learn** shows "coming soon" and offers Review instead.
- [ ] The answers are saved and summarized (e.g. "Household of 3 · contracts together"). In this proof of concept they don't change what the agent says (Joann's call: "for show").

### Ask Before Uploading
Added during the build at Joann's request: "A person might right away have a contract question."
- [ ] The start-choice screen (upload documents / set up profile) has a "Message Fine Print…" chat box at the bottom.
- [ ] Typing a question there opens the home chat with the question, and the agent answers it in plain language. This is general guidance, with the same one-time caption rule as other rule explanations, and no contract is needed.

### Side Menu
Added during the build at Joann's request, to "make it seem more app-y."
- [ ] Tapping the Fine Print logo (top left of home) slides in a side menu with **Home**, **Profile** (showing a profile summary) and **All agreements ▾**.
- [ ] All agreements expands to **Housing, Medical, Financial, Marriage, Estate, Work, Other**, each with a count. Tapping one shows only those agreements, or "None yet in [category]."
- [ ] Each agreement gets one category when the AI reads it. Leases and mortgages go under Housing. Financial means insurance and investments (Joann's call).
- [ ] Sign out (demo) lives in the side menu.

### Agreement Upload
- [ ] The user can upload a file (PDF or image) from the phone, or take photos page by page with "next page" and "done."
- [ ] The email option is visible and marked "coming soon."
- [ ] If a photo is too blurry to read, the agent says the photo is unfocused and asks the user to retake it for clear text.
- [ ] If the upload isn't an agreement, the agent says: "The document you've uploaded looks like [a short summary of what it is]. Would you like to continue to store this document?" It stores it if the user says yes. It doesn't offer a review and doesn't reject the file (Joann's call).

### Agreement Reading
- [ ] The agent correctly names the agreement type and the other party (landlord or lender) from the actual document, not a script.
- [ ] Each filed agreement gets a clean name following `date-party-purpose.pdf`.
- [ ] The agent detects whether the agreement is signed.

### Contacts From Agreements
Added during the build at Joann's request.
- [ ] After reading an agreement, the agent shows the other party's contacts it found (name, organization, role, phone, email, address).
- [ ] **Save to phone contacts** works for real. It gives the phone a contact card that, when opened, offers "Add to contacts," with a note saying which agreement it came from (e.g. "Saved by Fine Print from: 2025-08-15-drop-tine-residential-lease.pdf (Property manager)").
- [ ] **Email contacts** (Gmail, Outlook) is a visible "coming soon" button.

### Add a Forgotten Page
A photographed agreement's page has **📷 Add a page** under its pages ("Forgot a page? Add it and I'll update the dates and contacts."). It opens the camera tray in the chat with the stored pages already in it (titled "Adding pages to <file name>"). The user photographs the missing page(s), and **Done, update it** reads them all again in the contract's page order. The agreement is updated in place, not duplicated: earlier dates and contacts are kept and new ones added. The agent says how many pages it now has, shows only the new dates and contacts (or says there were none), and offers to add new dates to the calendar.

### Add Dates to Calendar
After an agreement is stored, the agent asks: "Would you like me to add these N dates to your calendar? Each one gets a reminder." Yes gives a calendar file (.ics) the phone opens with "Add to Calendar", and No says they can add the dates any time from the agreement's page. The agreement page's dates card has the same **📅 Add to calendar** button. The move-out notice offers its deliver-by date and the tenancy end date the same way. Only upcoming or repeating dates go in, and past dates are left out. Repeating dates (monthly payments, yearly tasks) repeat until the agreement's term ends. Each event says which agreement it came from and that it's guidance, not legal advice. Linking straight into Google or Outlook calendar is a coming-soon chip, because it needs a calendar sign-in.

Whenever the agent makes a file (the notice PDF or a calendar file), the chat shows it as a file card with its name and **Open**, and it opens inside the app, with no trip to Downloads. The PDF shows in the viewer with Save a copy. The calendar file lists each event in plain words with an **Add to Google Calendar** button (the calendar opens with the event filled in), plus **Save calendar file** for iPhone and Outlook.

### Rental Agreement: Move-Out Help
Source: `scope.md > The Unique Kernel`.
- [ ] The agent notices that the fixed term ended, says how long ago relative to today, and asks whether the user wants to renew.
- [ ] It understands a free-typed reply like "no, I want to move out."
- [ ] It states the Alberta tenant notice rule correctly: one full tenancy month's written notice, plus the required notice contents. It offers to draft the notice.
- [ ] The draft pulls the lease identifiers, tenant and landlord names, rental address and dates from the lease. It calculates the end date as the last day of the next full tenancy month.
- [ ] It asks about required details missing from the lease, such as the landlord's address. If the user says no, the draft still completes, with that line left blank to fill in by hand.
- [ ] It asks "Would you like to edit the notice?" Edits the user makes show in the final notice.
- [ ] The notice can be saved as a PDF. The agent tells the user how to deliver it: print and mail, drop off, or email if that's the agreed contact method.

### Mortgage Agreement: Dates and Actions
- [ ] The agent identifies a signed mortgage agreement and the lender.
- [ ] It lists the key dates and actions found in the document, such as payment dates, the term end or renewal date, and insurance or tax requirements.
- [ ] It offers **Store** or **Review**. Store files it on the home list. Review shows "coming soon." *(Assumption.)*

### Guidance, Not Legal Advice
Joann's call: this is "a pretty important piece for what this is." Fine Print supports the user's understanding. It isn't legal advice.
- [ ] The Welcome screen shows one plain line: "Fine Print helps you understand your agreements. It's guidance, not legal advice."
- [ ] Rule explanations stay uncluttered. The first time in a session that the agent explains a rule, a small, muted one-line caption appears under its message: "General guidance, not legal advice." It doesn't repeat after that. Joann: periodic reminders are fine, but they shouldn't distract a user who already understands. How to fine-tune this is a later enhancement.
- [ ] The notice view shows "Drafted as a guide. Review it before you send it." The reminder doesn't appear on the PDF itself, since that goes to the landlord.
- [ ] The agent never says or implies it's giving legal advice.

### New Home Celebration
Added during the build at Joann's request, as part of the mortgage step (slice 5).
- [ ] After a mortgage that looks like a **new home purchase** is stored, the agent says something like "Congratulations 🎉 Good news like this is worth sharing! I wrote a social media announcement for you, if you'd like to share it."
- [ ] A short, celebratory, AI-written post appears as a card (e.g. "I bought a house! Stay tuned for housewarming party details 🥂"), with **Copy** and **Share** buttons. Share opens the phone's share sheet.
- [ ] It isn't offered for refinances or renewals, and the post never includes the address, loan amount or lender.
- [ ] Text only. An AI-generated image would need a separate image service and goes on the future list.

### Sessions, Agreement Pages and Duplicates
Added during the build at Joann's request.
- [ ] **Fresh chat each time.** Each sign-in starts a clean chat with a short "Welcome back 👋" summary (agreements on file, actions pending). The previous conversation is saved, not lost.
- [ ] **Agreement page.** Tapping an agreement on the home list opens its page: name, type · party, status, summary, key details (parties, term, rent, property, other party's address or "Not listed in the agreement", agreement number, signed, category, date added), dates and actions, contacts (with Save to phone contacts), and the past conversation about it.
- [ ] **Conversations** on the agreement page are collapsible sections (date · message count, newest open, "Current chat" tagged). Each has **Continue this chat**, which brings that conversation back into the chat (the current chat is saved first), with its messages as context for the agent.
- [ ] **Start new chat** (bottom of the page) saves the current chat and starts a fresh one about this agreement. **Delete agreement** sits at the top of the page, out of the way.
- [ ] **Delete agreement** asks for confirmation in the app ("This can't be undone"), then removes it from the phone.
- [ ] **Same agreement again.** If the date, other party and agreement number match one already stored after reading, it's also treated as a repeat (this catches photos and older uploads).
- [ ] **Same file again.** Re-uploading the exact same file is recognized on the phone by its digital fingerprint, without reading it with the AI again: "This was previously uploaded and is already stored as [name]. Would you like to review this agreement?" with **Yes, review it** and **Not now**.

### Sign-In Page About, Demo Agreements and Credit
- [ ] The sign-in screen has an **About Fine Print** section: what it does; "Please test this app with the following fictional demo agreements" with download links for the sample lease and mortgage; a note that security features (two-factor sign-in), storage choices (cloud or on the phone) and bring-your-own-AI privacy were left out on purpose and are next; and "Created by Joann Dobish for Devpost's Build With AI: Basics hackathon."

### Large Script Theme
- [ ] A fifth theme, **Large Script**: everything noticeably larger, high contrast, in hockey-night colours (Joann's request): deep navy text and buttons with bright orange highlights, stripes and outlines. Orange is never used for small text, and every text colour meets at least 4.5:1 contrast. No team name or logo is used.

### Read Aloud and Mic
- [ ] Each agent message has a 🔊 button that reads it aloud with the phone's built-in voice (tap again to stop). Hidden where the phone doesn't support it.
- [ ] A 🎤 button in the chat box replies "The mic feature is coming soon", pointing to the keyboard's own microphone for now.

### Jurisdiction
- [ ] Profile asks "Where do you live?" (13 provinces and territories, or Outside Canada). It's shown in the profile summary.
- [ ] The AI extracts each agreement's `jurisdiction`. Replies name the law they rely on (e.g. "Under Alberta's Residential Tenancies Act…"). For anything outside the Alberta tenancy rules written into the agent, it gives the general common-law position and says it varies by jurisdiction (and flags Quebec civil law).
- [ ] The Alberta notice is only drafted for Alberta agreements. Otherwise the agent explains it can't draft for that province yet.

### Write a Simple Agreement (Coming Soon)
- [ ] The side menu has **Write a simple agreement ▾**: Room or basement rental, Borrowing a vehicle, Loaning money, Cash for work, Bill of sale, Other. Each shows a "coming soon" message noting drafts will be for education and guidance only, to be reviewed with a lawyer.

### Viewing the Original
Added during the build after Joann found she couldn't open her agreements.
- [ ] Each agreement keeps its original on the phone: the PDF, or the photographed pages.
- [ ] The agreement page has **📄 View original PDF** (or **📷 View N photographed pages**), which opens the original inside the app, plus **⬇ Save a copy** to open it in the phone's own PDF viewer.
- [ ] Agreements stored before this change say "The original wasn't kept for this one. Upload it again to keep a copy." Re-uploading keeps the copy.
- [ ] Deleting an agreement or Reset demo removes the stored originals.

### Home List
- [ ] Each row shows the agreement's file name, its type and party, and its status, such as "Signed" or "Term ended."
- [ ] An agreement with something to do is highlighted with its pending action, for example "Action pending: deliver notice to landlord."

## States and Boundaries
- **First use:** an empty home with an upload icon and "Upload your first agreement!" The demo starts from blank on purpose, with no preloaded examples.
- **Blurry photo:** a retake prompt (see Agreement Upload).
- **Not an agreement:** the agent briefly says what the document looks like and asks whether to store it. No review, no rejection.
- **Missing details in the lease:** the agent asks. If the answer is no, the field is left blank on the notice.
- **Coming-soon controls:** email connect, the Learn path, and the mortgage Review are visible but marked, and tapping them explains they're coming soon.
- **What persists:** the theme, profile answers, agreements and pending actions stay while the app is open in the demo. Lasting storage between sessions is a `4-spec` decision.

## Product Decisions
- **The rental is the full showcase and the mortgage is the "half."** It's a Swiss Army knife, and two agreement types keep it from coming across as a rentals app.
- **The demo starts from a blank first use.** Showing real first-time use matters more than demo data.
- **Sign-in is shown but labelled as demo, email connect is "coming soon," and there's no Play Store install.** Depth over breadth, and honesty with judges.
- **Profile answers are for show in this proof of concept.** Their real effects come later (see Possible Later Enhancements).
- **Follow Alberta rules** for the tenancy notice. It needs to be legally right.
- **Three themes:** beige by default, blue and black, and maroon and olive with a serif font. The product is female-friendly but the theme names aren't gendered.
- **Guidance, not legal advice, stated clearly in the app**, mainly on the Welcome screen, on the notice view and in the README. In the chat it's a subtle, occasional reminder only. Joann sees this as central to what Fine Print is.
- **Ask about missing details instead of guessing,** such as the landlord's address.
- **A non-agreement upload is just offered for storage.** No review, no rejection.

## What We're Building
Theme switching, demo sign-in, profile setup, agreement upload (file or page-by-page photos) with a blurry-photo retake, real AI reading of uploaded agreements, the rental move-out flow ending in an editable, legally complete notice as a PDF, the mortgage dates-and-actions summary with Store, and a home list showing status and pending actions.

## Submission Notes
- In the Devpost write-up and README, state that Fine Print is a comprehension and guidance tool, not legal advice.
- In the write-up and README, be upfront that this is a demo shell: the demo sends fictional documents to one hosted AI, and real use would add privacy controls and bring-your-own-AI options (see Possible Later Enhancements).
- In the Devpost write-up, add a line on what the profile questions will do later (household management, age-tuned explanations, the Learn path), so judges see they're intentional and not unfinished. Joann: "I feel like I'm expecting it to do too much right now for a demo."

## Deferred From the POC
- **Real Google or Facebook accounts.** These are infrastructure that doesn't prove the idea.
- **Email connection and a forwarding address.** These need email account access and a mail service.
- **The Learn path,** which would need its own lesson content.
- **Full mortgage review.** The depth goes to the rental this time.
- **Preloaded demo agreements.** The video shows blank first use.

## Possible Later Enhancements
- **Secure sign-in:** real accounts with two-factor authentication.
- **Storage choices:** cloud or on-device, chosen by the user.
- **Speak to Fine Print:** voice input with the 🎤 button (speech recognition).
- **Write simple agreements:** the agent interviews you and drafts room rentals, vehicle loans, personal loans, cash-for-work and bills of sale, or any other type you describe, as an editable PDF marked for education and guidance only, to be reviewed with a lawyer.
- **Full jurisdiction handling:** every province and territory's rules (and other countries), not just Alberta tenancies. In real use, location and jurisdiction matter a lot; this demo is general-purpose and aspirational.
- **AI-generated celebration images** to go with the new-home announcement post.
- **Privacy and AI data handling, including bring your own AI.** Users choose which AI reads their agreements to keep them confidential: their own API key, a private or business AI account, or a model running on their own device or computer. Also: control over where documents are stored, encryption, delete-anytime, a clear no-training-on-your-data policy, and retention settings. The demo uses one hosted AI on fictional documents; this is what a real version needs before people trust it with their own contracts (Joann's call).
- **A refined in-chat guidance reminder,** for example based on how often it's shown or whether the user has acknowledged it.
- **Household accounts:** one custodian managing agreements for several people, shareable with other users.
- **Age range:** tunes which agreements to expect and how much to explain, without being presumptuous.
- **Learn path:** contract topics matched to life stage, such as RRSP agreements versus truck lease payments.
- **Pre-signing review:** 5 highlights tied to the profile, relevance taps, "are you okay with this?" questions, and an issuer summary.
- **Linked calendar integration** (Google, Outlook) for key dates, linked to the contract and clause. The demo makes a calendar file instead.
- **Learning over time** from answers and usage.
- **Folder linking and cloud storage** with Dropbox, Google Drive, or phone files.
- **Version comparison** for new contract versions.
- **Every province and contract type,** with deep built-in knowledge.

## Non-Goals
- **Native iPhone or Android apps, or app store installs.** These take weeks and need developer accounts.
- **Legal advice.** The agent explains public rules and drafts a standard notice. It doesn't replace a lawyer.
- **Sending the notice for the user.** Delivery stays with the user.
- **Provinces other than Alberta** for the tenancy rule in this proof of concept.

## Open Questions
- **Mortgage "Review":** shows "coming soon" (assumption carried from the draft; Joann didn't object).
- **Where the theme dropdown sits:** on the welcome screen and in the home header. This can be settled during the build.
- **The sample rental and mortgage documents for the video:** they'll need to be realistic but fictional. This gets settled in `4-spec`/`5-build`.
