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
- **Theme 3:** maroon and olive with a serif, print-style font. It's used for the rest of the demo.
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
- [ ] Tapping either continues to the start choice. No account is created or required.

### Profile Setup
- [ ] The three questions appear one at a time with the exact choices listed in The Core Journey.
- [ ] Choosing **Review** leads to the empty home screen and the upload prompt.
- [ ] The answers are collected and shown as remembered. In this proof of concept they don't change what the agent says (Joann's call: "for show").
- [ ] Choosing **Learn** shows a "coming soon" message and offers to review instead.

### Agreement Upload
- [ ] The user can upload a file (PDF or image) from the phone, or take photos page by page with "next page" and "done."
- [ ] The email option is visible and marked "coming soon."
- [ ] If a photo is too blurry to read, the agent says the photo is unfocused and asks the user to retake it for clear text.
- [ ] If the upload isn't an agreement, the agent says: "The document you've uploaded looks like [a short summary of what it is]. Would you like to continue to store this document?" It stores it if the user says yes. It doesn't offer a review and doesn't reject the file (Joann's call).

### Agreement Reading
- [ ] The agent correctly names the agreement type and the other party (landlord or lender) from the actual document, not a script.
- [ ] Each filed agreement gets a clean name following `date-party-purpose.pdf`.
- [ ] The agent detects whether the agreement is signed.

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
- **Ask about missing details instead of guessing,** such as the landlord's address.
- **A non-agreement upload is just offered for storage.** No review, no rejection.

## What We're Building
Theme switching, demo sign-in, profile setup, agreement upload (file or page-by-page photos) with a blurry-photo retake, real AI reading of uploaded agreements, the rental move-out flow ending in an editable, legally complete notice as a PDF, the mortgage dates-and-actions summary with Store, and a home list showing status and pending actions.

## Submission Notes
- In the Devpost write-up, add a line on what the profile questions will do later (household management, age-tuned explanations, the Learn path), so judges see they're intentional and not unfinished. Joann: "I feel like I'm expecting it to do too much right now for a demo."

## Deferred From the POC
- **Real Google or Facebook accounts.** These are infrastructure that doesn't prove the idea.
- **Email connection and a forwarding address.** These need email account access and a mail service.
- **The Learn path,** which would need its own lesson content.
- **Full mortgage review.** The depth goes to the rental this time.
- **Preloaded demo agreements.** The video shows blank first use.

## Possible Later Enhancements
- **Household accounts:** one custodian managing agreements for several people, shareable with other users.
- **Age range:** tunes which agreements to expect and how much to explain, without being presumptuous.
- **Learn path:** contract topics matched to life stage, such as RRSP agreements versus truck lease payments.
- **Pre-signing review:** 5 highlights tied to the profile, relevance taps, "are you okay with this?" questions, and an issuer summary.
- **Calendar integration** for key dates, linked to the contract and clause.
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
