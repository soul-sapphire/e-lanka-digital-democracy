import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_document():
    doc = docx.Document()

    # Set normal margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styles
    title_p = doc.add_paragraph()
    title_run = title_p.add_run("E-Lanka Digital Democracy Platform")
    title_run.font.size = Pt(22)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(140, 29, 64) # Maroon

    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run("CIVICUS Digital Action Lab (DAL) Questionnaire — Plain-Language Guide & Form Submission Reference")
    sub_run.font.size = Pt(13)
    sub_run.font.bold = True
    sub_run.font.color.rgb = RGBColor(70, 70, 70)

    meta_p = doc.add_paragraph()
    meta_p.add_run("Prepared for CSLK Board, Donors & Technical Reviewers | Date: November 2026 | Version: 2.0 (Updated with exact form screenshots)").font.size = Pt(9.5)
    meta_p.runs[0].font.italic = True
    meta_p.runs[0].font.color.rgb = RGBColor(120, 120, 120)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # PART 1
    h1 = doc.add_heading("Part 1: The 4 Big Strategic Questions in Simple Layman's Terms", level=1)
    h1.runs[0].font.color.rgb = RGBColor(140, 29, 64)

    # Q1
    q1 = doc.add_heading("1. Which technology or platforms do you plan to use?", level=2)
    q1.runs[0].font.color.rgb = RGBColor(30, 41, 59)
    p = doc.add_paragraph()
    p.add_run("In Plain Words: ").bold = True
    p.add_run("We are building a lightweight website that behaves like a mobile phone app (PWA), specially designed to run smoothly on budget smartphones even in rural Sri Lankan villages with weak mobile signals (3G/4G).\n")
    p.add_run("• Citizen Portal (Frontend): React 18 on Vercel Edge Network. Fast, lightweight, trilingual (Sinhala, Tamil, English).\n")
    p.add_run("• Security & Logic Server (Backend): Node.js on Render. Manages encryption, user authentication, and anti-fraud voting limits.\n")
    p.add_run("• Database (Secure Cloud Vault): Supabase (PostgreSQL) hosted in Singapore close to Sri Lanka. Protected by bank-grade Row-Level Security.\n")
    p.add_run("• Artificial Intelligence (AI): Google Gemini & Groq (Llama 3.3). Summarizes public suggestions and categorizes feedback without touching personal identities.\n")
    p.add_run("• Messaging & Academy: Brevo for verified emails, native WhatsApp links for citizen sharing, and CSLK's existing Democracy Academy on cslk.org.\n")
    p.add_run("• Zero-WordPress Security Mandate: The voting engine contains zero WordPress or PHP code to prevent common plugin exploits and database intrusions.")

    # Q2
    q2 = doc.add_heading("2. Where will the data be stored, and who will have access to it?", level=2)
    q2.runs[0].font.color.rgb = RGBColor(30, 41, 59)
    p = doc.add_paragraph()
    p.add_run("In Plain Words: ").bold = True
    p.add_run("All data is housed in a secure Singapore cloud database (Supabase). By cryptographic design, nobody—not even system administrators or government agencies—can ever see who voted for which proposal.\n")
    p.add_run("• Layer 1 — Field-Level Encryption (AES-256-GCM): All citizen comments and survey responses are scrambled with cryptographic keys before reaching the database.\n")
    p.add_run("• Layer 2 — The Secret Ballot Box (Blind Indexing): When a citizen verifies with their National ID (NIC) to prevent double voting, the system immediately converts the ID into a permanent one-way secret token (HMAC-SHA256). The actual NIC is never saved.\n")
    p.add_run("• Administrative Non-Linkability: Signatures and votes contain only an anonymous alias and district tag. There is no link connecting a person's name to their vote.")

    # Q3
    q3 = doc.add_heading("3. How will people be informed and give consent, and how long will you keep the data?", level=2)
    q3.runs[0].font.color.rgb = RGBColor(30, 41, 59)
    p = doc.add_paragraph()
    p.add_run("In Plain Words: ").bold = True
    p.add_run("Transparent consent in plain language, a strict 12-month retention deadline, and an instant 'Delete My Data' button.\n")
    p.add_run("• Plain-Language Consent: Before taking part, citizens see a short notice in their mother tongue (Sinhala, Tamil, or English). No legal jargon or pre-ticked boxes.\n")
    p.add_run("• 12-Month Automatic Destruction: Data is kept while a policy debate is open, plus 12 months for parliamentary or regulatory verification. After 12 months, all personal records are destroyed.\n")
    p.add_run("• Instant 'Delete My Data' (PDPA Section 16): Any citizen can log into their private dashboard and delete their records with one click, while preserving aggregate tally numbers.")

    # Q4
    q4 = doc.add_heading("4. Where do you most need support from the technical accompaniment? (DAL)", level=2)
    q4.runs[0].font.color.rgb = RGBColor(30, 41, 59)
    p = doc.add_paragraph()
    p.add_run("In Plain Words: ").bold = True
    p.add_run("We are seeking Digital Action Lab expertise in 5 critical digital defense areas:\n")
    p.add_run("1. Independent Security & Cryptographic Audit: External verification certifying admin non-linkability.\n")
    p.add_run("2. Multilingual AI Dialect Redaction Testing: Ensuring dialect names and rural village nicknames in Sinhala and Tamil are never exposed.\n")
    p.add_run("3. Device Seizure Defense for Rural Youth Volunteers: Ensuring volunteer field phones carrying offline cached surveys cannot be decrypted if seized.\n")
    p.add_run("4. Sybil & Bot-Defense Calibration: Fine-tuning anti-spam defenses so genuine rural citizens aren't accidentally locked out.\n")
    p.add_run("5. Youth & Minor Protection (Ages 15–17): Legal and technical guardrails for secondary school civic participation.")

    doc.add_page_break()

    # PART 2: FORM SUBMISSION REFERENCE
    h2 = doc.add_heading("Part 2: Exact Form Checkboxes & Fill-in Responses", level=1)
    h2.runs[0].font.color.rgb = RGBColor(140, 29, 64)

    # Screen 1
    doc.add_heading("Form Section 3: Technology — What will you build?", level=2)
    table1 = doc.add_table(rows=1, cols=3)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table1.rows[0].cells
    hdr[0].text = "Option"
    hdr[1].text = "Action"
    hdr[2].text = "Rationale"
    for c in hdr:
        set_cell_background(c, "1E293B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    items1 = [
        ("Website or web platform", "[X] TICK", "React PWA web platform accessible on budget smartphones, tablets, and PCs without app store downloads."),
        ("AI feature (writing, classifying, answering questions...)", "[X] TICK", "Background AI workers handle trilingual PII sanitization, thematic clustering, and policy brief drafting."),
        ("Data dashboard or open data", "[X] TICK", "Public interactive analytics displaying regional policy feedback and transparent SHA-256 audit logs."),
        ("Map or reporting tool", "[X] TICK", "25-district Sri Lanka geographical breakdown and citizen petition/incident reporting tools."),
        ("Online course or learning platform", "[X] TICK", "CSLK Democracy Academy civic learning modules linked via LMS at cslk.org."),
        ("Mobile app", "[ ] LEAVE UNCHECKED", "We prioritize a responsive web platform so rural citizens don't consume mobile data downloading 80MB app store binaries."),
        ("Chatbot or messaging service (WhatsApp, Telegram...)", "[ ] LEAVE UNCHECKED", "We provide direct WhatsApp sharing links rather than an automated chatbot."),
        ("Other", "[ ] LEAVE UNCHECKED", "Covered under web platform and open data.")
    ]
    for opt, act, rat in items1:
        row = table1.add_row().cells
        row[0].text = opt
        row[1].text = act
        row[2].text = rat
        if "[X]" in act:
            set_cell_background(row[1], "DCFCE7") # light green
        else:
            set_cell_background(row[1], "F1F5F9") # light gray

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Screen 2
    doc.add_heading("Form Section: Security Threats — Which of these could affect your team or your users?", level=2)
    table2 = doc.add_table(rows=1, cols=3)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr2 = table2.rows[0].cells
    hdr2[0].text = "Threat Factor"
    hdr2[1].text = "Action"
    hdr2[2].text = "Why It Applies & Mitigation"
    for c in hdr2:
        set_cell_background(c, "1E293B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    items2 = [
        ("Surveillance of communications", "[X] TICK", "State/partisan surveillance in Sri Lanka. Mitigated by field-level encryption and blind-index pseudonymization."),
        ("Website or app blocked", "[X] TICK", "DNS throttling during social unrest. Mitigated by global edge distribution (Vercel CDN/Anycast)."),
        ("Devices seized or searched", "[X] TICK", "Rural youth volunteers carrying survey tablets. Mitigated by zero local storage of identifiable PII."),
        ("Accounts hacked or taken over", "[X] TICK", "Targeted administrative takeover attempts. Mitigated by mandatory RFC 6238 TOTP Authenticator 2FA."),
        ("Harassment or doxxing of staff or users", "[X] TICK", "Retaliation against citizens signing sensitive anti-corruption petitions. Mitigated by administrative non-linkability."),
        ("Legal pressure or registration problems", "[X] TICK", "Scrutiny under Online Safety Act / NGO regulations. Mitigated by strict PDPA No. 9 of 2022 compliance."),
        ("None that we know of", "[ ] LEAVE UNCHECKED", "Civic platforms face real-world risks; highlighting these justifies DAL technical accompaniment.")
    ]
    for opt, act, rat in items2:
        row = table2.add_row().cells
        row[0].text = opt
        row[1].text = act
        row[2].text = rat
        if "[X]" in act:
            set_cell_background(row[1], "DCFCE7")
        else:
            set_cell_background(row[1], "F1F5F9")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Screen 3
    doc.add_heading("Form Section: Security Posture — What does your team already do?", level=2)
    table3 = doc.add_table(rows=1, cols=3)
    table3.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr3 = table3.rows[0].cells
    hdr3[0].text = "Security Practice"
    hdr3[1].text = "Action"
    hdr3[2].text = "Operational Evidence"
    for c in hdr3:
        set_cell_background(c, "1E293B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    items3 = [
        ("Two-step verification on key accounts", "[X] TICK", "Enforced on all GitHub repos, cloud hosting, and administrator logins via Google Authenticator/TOTP."),
        ("A password manager", "[X] TICK", "1Password and Bitwarden utilized across core development and operational team members."),
        ("Encrypted messaging, such as Signal", "[X] TICK", "All team communications, partner coordination, and volunteer oversight handled via Signal."),
        ("Regular backups", "[X] TICK", "Automated daily encrypted database snapshots with Point-In-Time Recovery on Supabase."),
        ("Security training in the last year", "[X] TICK", "Staff completed PDPA legal compliance and secure digital hygiene workshops in 2026."),
        ("A plan for security incidents", "[X] TICK", "Formal 72-hour regulatory disclosure plan under PDPA Section 23 with public reporting at /security.")
    ]
    for opt, act, rat in items3:
        row = table3.add_row().cells
        row[0].text = opt
        row[1].text = act
        row[2].text = rat
        set_cell_background(row[1], "DCFCE7")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Screen 4
    doc.add_heading("Form Section: Artificial Intelligence (AI)", level=2)
    p = doc.add_paragraph()
    p.add_run("Question: Will your solution use AI?\n").bold = True
    p.add_run("Selection: ").bold = True
    p.add_run("◉ Yes, as a supporting feature\n\n")

    p.add_run("Question: If yes: what will the AI do, which provider or model, and how will people check its answers?\n").bold = True
    p.add_run("Exact Text to Copy and Paste into the Form Text Box:\n").bold = True

    callout = doc.add_table(rows=1, cols=1)
    callout.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = callout.rows[0].cells[0]
    set_cell_background(c, "F8FAFC")
    cp = c.paragraphs[0]
    c_run = cp.add_run(
        "Background AI workers using Google Gemini 1.5 Pro and Groq (Llama 3.3 70B) perform four supporting civic workflows: "
        "(1) Trilingual PII sanitization to strip names, NIC numbers, phone numbers, emails, and village locations in Sinhala, Tamil, and English; "
        "(2) Thematic clustering to categorize thousands of open citizen submissions into policy priorities; "
        "(3) Qualitative sentiment and trend scoring; and "
        "(4) Synthesizing raw feedback into preliminary policy briefs.\n\n"
        "Crucially, PII scrubbing is executed locally via regex/heuristic rules BEFORE any text is dispatched to external LLM APIs, "
        "preventing any citizen identifiers from leaving the sovereign security perimeter. Every AI-generated summary and cluster "
        "passes through a mandatory human-in-the-loop review by CSLK's Policy Admin and Statutory Panel Gate before public publication."
    )
    c_run.font.size = Pt(10)
    c_run.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # PART 3: TECHNICAL ANSWERS
    h3 = doc.add_heading("Part 3: Technical Sub-Questions Reference Table", level=1)
    h3.runs[0].font.color.rgb = RGBColor(140, 29, 64)

    tech_table = doc.add_table(rows=1, cols=2)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    thdr = tech_table.rows[0].cells
    thdr[0].text = "Technical Evaluation Question"
    thdr[1].text = "Architectural & Operational Decision"
    for c in thdr:
        set_cell_background(c, "1E293B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    tech_items = [
        ("Render vs. Railway?", "Selected Render for production reliability, automated TLS certificate provisioning, and granular network isolation. Railway maintained as an active standby replica."),
        ("Supabase vs. Neon.tech?", "Selected Supabase (PostgreSQL) hosted in Singapore (ap-southeast-1) for ultra-low latency to Sri Lanka and robust native Row-Level Security (RLS)."),
        ("Google Gemini vs. Groq?", "Utilizing both via free/subsidized tiers: Google Gemini 1.5 Flash/Pro excels at Sinhala and Tamil morphology; Groq (Llama 3.3) provides ultra-fast clustering and classification."),
        ("Can this be done with FREE APIs?", "Yes. Deterministic PII scrubbing runs 100% locally on our server ($0). Google AI Studio and Groq Cloud offer free tiers accommodating over 15,000 requests/day, easily handling our consultation volumes with zero API costs."),
        ("Brevo vs. Resend?", "Selected Brevo for high delivery rates across Sri Lankan mobile carrier domains (dialog.lk, mobitel.lk) and strict GDPR/PDPA data protection compliance."),
        ("Is WordPress used in the voting app?", "No. The voting engine operates under a strict Zero-WordPress / Zero-PHP mandate built in pure React and Node.js. WordPress is confined strictly to the external informational LMS website at cslk.org."),
        ("Can admins de-anonymize signers?", "No. Petition signatures store only an anonymous alias and district. Full names and emails are never written to the database, guaranteeing mathematical non-linkability."),
        ("Data retention period?", "Strict 12-month statutory retention following policy closure, after which all personal records are automatically and permanently purged."),
        ("Does Right to Erasure preserve tallies?", "Yes. Under PDPA Section 16, a citizen's personal comments and identity tokens are completely purged, but the anonymous aggregate count remains unchanged to preserve electoral integrity.")
    ]
    for q, a in tech_items:
        row = tech_table.add_row().cells
        row[0].text = q
        row[1].text = a
        set_cell_background(row[0], "F8FAFC")

    doc.save("c:/Users/Admin/E-Lanka/docs/DAL_Questionnaire_Answers_Laymans_Terms.docx")
    print("Successfully generated Word document at c:/Users/Admin/E-Lanka/docs/DAL_Questionnaire_Answers_Laymans_Terms.docx")

if __name__ == "__main__":
    create_document()
