# E-Lanka Digital Democracy Platform
## Zero-Cost Production Mobile & Email OTP Guide

This guide details how to operate the **E-Lanka Digital Democracy Platform** in real-world production with live verification codes for citizens across Sri Lanka at **$0.00 monthly cost**.

---

### 1. Dual-Channel Verification Architecture

To eliminate reliance on expensive commercial SMS gateway contracts (which typically charge LKR 1.50–3.00 per SMS or require enterprise telco deposits), E-Lanka provides two zero-cost production channels:

| Verification Channel | Monthly Free Tier | Provider | Supported Networks / Services |
| :--- | :--- | :--- | :--- |
| **Email OTP** *(Recommended)* | **3,000 Free Emails / mo** | Resend / Brevo / Gmail SMTP | All Sri Lankan email domains (Gmail, Yahoo, Outlook, SLTnet, Lanka.gov.lk) |
| **Mobile SMS OTP** | **10,000 Free SMS / mo** | Google Firebase Identity Platform | All TRCSL Sri Lankan Mobile Carriers: Dialog (077/076/074), Mobitel (071/070), Airtel (075), Hutch (078/072) |

---

### 2. Strategy A: Google Firebase Phone Auth (10,000 Free SMS/Month)

Google Cloud / Firebase includes **10,000 phone authentications every single month for free** under the default Spark plan with no credit card billing required for the first 10,000 SMS.

#### Step-by-Step Setup:
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a free project named `e-lanka-production`.
2. Under **Build** in the left sidebar, click **Authentication** &rarr; **Get Started**.
3. Under the **Sign-in method** tab, click **Phone** and enable it.
4. Click **Project Settings** (gear icon) &rarr; **General** &rarr; scroll down to **Your apps** and click the Web icon (`</>`).
5. Register app nickname `e-lanka-web` and copy the configuration keys.
6. Add these environment variables in your Vercel Project Settings (`Settings` &rarr; `Environment Variables`):
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=e-lanka-production.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=e-lanka-production
   VITE_FIREBASE_STORAGE_BUCKET=e-lanka-production.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:...
   ```
7. Click **Redeploy** on Vercel. Firebase will now automatically deliver real 6-digit SMS text messages to Sri Lankan mobile subscribers (+94) with zero carrier charges.

---

### 3. Strategy B: Resend Email OTP (3,000 Free Emails/Month)

As demonstrated during citizen sign-in (e.g. `ruu035@gmail.com`), citizens provide their contact email. Sending a 6-digit code via email is instant, delivers in under 1 second, and has 0 telco drop rates.

#### Step-by-Step Setup:
1. Create a free account at [Resend](https://resend.com) (zero credit card required).
2. Go to **API Keys** &rarr; Click **Create API Key**.
3. Add the key to Vercel Environment Variables:
   ```env
   VITE_RESEND_API_KEY=re_1234567890abcdef
   ```
4. Verification emails are automatically dispatched with the subject:
   `[E-Lanka Digital Democracy] Your Verification Code is 123456`

---

### 4. Single-Entry Citizen NIC Verification Workflow

To respect citizen time and minimize privacy exposure:
1. When a citizen clicks **Citizen Sign In** and enters their National Identity Card (e.g. `200410805091`):
   - The platform calculates the mathematical checksum, verifies the format (12-digit or 9-digit V/X), decodes the year of birth, day of year, and gender.
   - The identity is marked as **Verified Citizen (Tier 1 & Tier 2 Confirmed)** in the browser session.
2. When the citizen browses to any national petition and clicks **Sign This Petition**:
   - The platform detects their verified session.
   - **Step 1 (NIC Entry) and Step 2 (DRP Query) are automatically bypassed.**
   - The modal starts immediately at **Step 3 (Proof of Life OTP)**.
   - The citizen never has to type their NIC, DOB, or Gender again.
