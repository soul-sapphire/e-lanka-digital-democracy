# E-Lanka Digital Democracy Platform
## CIVICUS Digital Action Lab (DAL) Questionnaire — Plain-Language Guide for Clients & Evaluators

**Document Version:** 1.0  
**Format:** Plain-Language Client & Reviewer Guide  
**Date:** November 22, 2026  
**Word File (.docx):** [DAL_Questionnaire_Answers_Laymans_Terms.docx](file:///c:/Users/Admin/E-Lanka/docs/DAL_Questionnaire_Answers_Laymans_Terms.docx)

---

## Part 1: The 4 Big Questions in Simple Everyday English

### 1. Which technology or platforms do you plan to use?
> **In Plain Words:** We are building a fast, lightweight website that acts like a mobile app, specially designed to run smoothly on budget smartphones even in rural Sri Lankan villages with weak mobile signals (3G/4G).

* **Citizen Website (Frontend):** **React 18 PWA on Vercel**. A clean, fast website that works in English, Sinhala, and Tamil. It lets citizens fill out feedback even if their connection briefly drops offline.
* **Security & Logic Engine (Backend):** **Node.js on Render**. The "brain" behind the scenes that enforces privacy rules, encrypts personal answers, and stops fake votes.
* **Database (Secure Vault):** **Supabase (PostgreSQL)** in Singapore. A bank-grade cloud vault that stores policy results and petition counts safely with 24/7 backups.
* **Artificial Intelligence (AI):** **Google Gemini + Groq**. Reads public comments in Sinhala, Tamil, and English, groups similar opinions together, and summarizes what people are asking for so lawmakers can understand.
* **Email & WhatsApp:** **Brevo** for sending official system emails; native **WhatsApp links** so citizens can share petitions with their friends and family with one click without giving us their phone contacts.
* **Democracy Course:** CSLK's existing online course on **WordPress (LifterLMS)** at `www.cslk.org`.
* **Important Note on WordPress:** The voting and policy platform itself **does NOT use WordPress**. WordPress is often targeted by hackers. By building the voting engine with modern, pure code ("Zero-WordPress mandate"), we protect citizen votes from being hacked or manipulated.

---

### 2. Where will the data be stored, and who will have access to it?
> **In Plain Words:** Stored in a heavily guarded cloud database in Singapore (Supabase). Nobody—not even the website owners or government—can see who voted for what.

* **Shield 1 — Bank-Grade Encryption:** Every citizen comment and survey answer is scrambled with a secret digital key before reaching the database. If anyone tried to steal the database, all they would see is unreadable gibberish.
* **Shield 2 — The "Secret Ballot Box" (Blind Indexing):** Just like when you show your ID at a polling station but drop an anonymous ballot into the box, our system checks that you have a valid Sri Lankan National ID (NIC) to stop double-voting, but immediately converts your ID into a permanent secret code. We never save your real ID next to your vote or signature.
* **Can Administrators spy on who signed what?**
  **NO.** By law and by software design, even the top system administrators **CANNOT** see who signed a petition or what specific comment a person wrote. The system deliberately has no wire connecting a citizen's name to their signature.

---

### 3. How will people be informed and give consent, and how long will you keep the data?
> **In Plain Words:** Clear notices with no hidden legal traps, a strict 12-month deletion deadline, and a one-click button to delete your data anytime.

* **Clear, Plain Consent:** Before submitting anything, citizens see a short notice in their language (Sinhala, Tamil, or English). No tiny print, no confusing legal talk, and no pre-ticked checkboxes. Citizens must actively check "I agree".
* **Data Retention (12 Months, Then Deleted):** Data is kept securely while a policy consultation is open. Once it finishes, records are kept for **exactly 12 months** so Parliamentary committees or the Data Protection Authority can verify the final counts. After 12 months, all personal records are automatically and permanently destroyed. Only the final anonymous totals (e.g., "15,000 citizens supported this") are kept.
* **One-Click "Delete My Data" (Right to Erasure):** Under Section 14 of Sri Lanka's Personal Data Protection Act, any citizen can log into their private dashboard anytime and click **"Delete My Data"**. Their personal records are instantly and permanently erased from the system, while keeping the overall vote counter intact.

---

### 4. Where do you most need support from the technical accompaniment? (DAL Support)
> **In Plain Words:** We are asking the CIVICUS Digital Action Lab security experts to help us double-check 5 crucial safety areas:

1. **Independent Security Audit:** Having outside experts review our encryption and certify to our donors and the public that admins truly cannot spy on citizens.
2. **Multilingual AI Safety Testing:** Testing our AI in tricky Sinhala and Tamil dialects so it never accidentally leaks someone's name, village, or phone number to the public.
3. **Safe Field Work for Youth Volunteers:** Volunteers will take mobile phones into rural villages and tea estates to collect opinions offline. We need experts to make sure that if a volunteer's phone is lost or seized by police, no citizen data can ever be read.
4. **Real Citizens vs. Fake Bot Votes:** Keeping out fake bot votes without making the sign-up process so hard that rural youth give up.
5. **Child & Youth Protection (Ages 15–17):** Ensuring high school students can safely participate and learn about civic rights without collecting any forbidden personal data under child protection laws.

---

## Part 2: Exact Form Answers & Checkboxes to Tick

### Form Screen 1: What will you build?
* ☑️ **Website or web platform** — YES (Mobile-friendly web platform that works on any phone, tablet, or PC without needing an app store download).
* ☑️ **AI feature (writing, classifying, answering questions...)** — YES (AI reads citizen feedback, removes names/numbers, and summarizes public opinion).
* ☑️ **Data dashboard or open data** — YES (Public visual charts showing how citizens voted across districts, with zero personal data shown).
* ☑️ **Online course or learning platform** — YES (Youth can take civic education lessons on CSLK's Democracy Academy).
* ⬜ **Mobile app** — *Leave Unchecked* (We chose a web app instead so rural users don't have to waste expensive mobile data downloading a large app).
* ⬜ **Chatbot or messaging service** — *Leave Unchecked* (We use one-click WhatsApp sharing links rather than an automated bot).

---

### Form Screen 2: Security Risks (Which could affect your team or users?)
* ☑️ **Surveillance of communications** — YES (Monitoring in Sri Lanka is common. Our encryption ensures intercepted traffic shows no names).
* ☑️ **Website or app blocked** — YES (Authorities have previously blocked platforms during crises. Our system uses a global edge network to resist blocks).
* ☑️ **Devices seized or searched** — YES (Youth volunteers in rural areas could have phones searched at checkpoints. Offline data is locked with special keys).
* ☑️ **Accounts hacked or taken over** — YES (We enforce two-factor Google Authenticator on all staff logins so passwords alone cannot be stolen).
* ☑️ **Harassment or doxxing of staff or users** — YES (Citizens signing controversial petitions are protected because names are never saved with signatures).
* ☑️ **Legal pressure or registration problems** — YES (Strict compliance with Sri Lanka's Personal Data Protection Act protects the NGO legally).

---

### Form Screen 3: Team Security Practices (What does your team already do?)
* ☑️ **Two-step verification on key accounts** — YES (Every staff login requires a Google Authenticator code in addition to a password).
* ☑️ **A password manager** — YES (Staff use secure password managers like 1Password/Bitwarden).
* ☑️ **Encrypted messaging, such as Signal** — YES (All internal team discussions take place over Signal).
* ☑️ **Regular backups** — YES (Database is backed up automatically every single day).
* ☑️ **Security training in the last year** — YES (Staff have completed training on Sri Lankan data privacy laws and digital safety).
* ☑️ **A plan for security incidents** — YES (Formal response plan that notifies Sri Lanka CERT and the Data Protection Authority within 72 hours).

---

### Form Screen 4: Artificial Intelligence
* **Select:** ◉ **Yes, as a supporting feature**
* **Copy & Paste this into the text box:**
> "Background AI workers using Google Gemini 1.5 Pro and Groq (Llama 3.3 70B) perform four supporting civic workflows: (1) Trilingual PII sanitization to strip names, NIC numbers, phone numbers, emails, and village locations in Sinhala, Tamil, and English; (2) Thematic clustering to categorize thousands of open citizen submissions into policy priorities; (3) Qualitative sentiment and trend scoring; and (4) Synthesizing raw feedback into preliminary policy briefs.
>
> Crucially, PII scrubbing is executed locally via regex/heuristic rules BEFORE any text is dispatched to external LLM APIs, preventing any citizen identifiers from leaving the sovereign security perimeter. Every AI-generated summary and cluster passes through a mandatory human-in-the-loop review by CSLK's Policy Admin and Statutory Panel Gate before public publication."

---

## Part 3: Clear Answers to the Technical Sub-Questions

| Question | Simple Direct Answer |
| :--- | :--- |
| **Render vs. Railway?** | We chose **Render** because it provides more dependable security controls and automated health checks for our main server. Railway is kept as a backup. |
| **Supabase vs. Neon.tech?** | We chose **Supabase** because it includes built-in Row-Level Security (RLS) rules and is hosted in Singapore close to Sri Lanka. |
| **Gemini vs. Groq?** | We use **both**: Google Gemini 1.5 Pro understands Sinhala and Tamil grammar best; Groq gives us lightning-fast processing speed. All personal data is stripped out locally before touching either service. |
| **Brevo vs. Resend?** | We chose **Brevo** because it delivers emails reliably to Sri Lankan mobile networks (Dialog, Mobitel) and complies with European privacy standards. |
| **Is WordPress still used?** | **No, not on the voting platform.** The voting system uses 100% modern React code for safety. WordPress is used only on CSLK's separate educational website. |
| **Can Admins link who signed petitions?** | **No.** Even administrators cannot see who signed which petition because signatures are stored as one-way scrambled codes with no names attached. |
| **Exact data retention period?** | **Exactly 12 months** after a policy consultation finishes. Then, all personal records are automatically deleted. |
| **Does Right to Erasure preserve counts?** | **Yes.** If a citizen clicks "Delete My Data", their personal comments and identity records are permanently erased, but the total count (e.g. 1 signature) remains so the vote tally stays accurate. |

---
*Prepared by the Lead Systems Architecture & Cryptographic Engineering Team for E-Lanka.*
