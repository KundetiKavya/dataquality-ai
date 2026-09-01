# DataQuality AI
### Enterprise Data Quality Management Platform

Built for **Kavya Kundeti**, Data Analyst at Acme Corporation.

---

## What This Is

DataQuality AI is a web application that helps companies find and fix problems in their data. You upload a spreadsheet or CSV file, the platform scans it automatically, gives it a quality score out of 100, and then uses AI to tell you exactly how to fix every issue it finds — in plain English.

---

## Project Files

```
dataquality-ai/
├── public/
│   └── index.html              ← The HTML entry point for the app
├── src/
│   ├── index.js                ← Mounts the React app into the browser
│   └── DataQualityAssistant.jsx ← THE ENTIRE APPLICATION (1,424 lines)
├── package.json                ← Project dependencies and run scripts
├── .env                        ← Environment variables (API key goes here)
└── README.md                   ← This file
```

---

## How to Run It Locally

### Step 1 — Install Node.js
Download and install Node.js from https://nodejs.org (choose the LTS version).

### Step 2 — Install dependencies
Open your terminal, navigate to this project folder, and run:
```bash
npm install
```

### Step 3 — Add your Anthropic API key
Create a file called `.env` in the root of the project and add:
```
REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
```
Get your API key from: https://console.anthropic.com

### Step 4 — Start the app
```bash
npm start
```
The app will open automatically at http://localhost:3000

### Step 5 — Build for production (when ready to publish)
```bash
npm run build
```
This creates a `build/` folder you can deploy to any web host.

---

## How to Deploy (Publish Online)

### Option A — Netlify (easiest, free)
1. Go to https://netlify.com and create a free account
2. Drag and drop the `build/` folder onto the Netlify dashboard
3. Done — your app is live with a public URL

### Option B — Vercel (free, recommended for React)
1. Go to https://vercel.com and sign up
2. Connect your GitHub repository or upload the project
3. Set the environment variable `REACT_APP_ANTHROPIC_API_KEY` in Vercel's settings
4. Click Deploy

### Option C — GitHub Pages (free)
1. Push this project to a GitHub repository
2. Run `npm run build`
3. Deploy the `build/` folder using GitHub Pages settings

---

## The 7 Pages — What Each One Does

| Page | What it does |
|------|-------------|
| **Dashboard** | Overview of all your data quality — scores, trends, recent files |
| **Upload Dataset** | Drag and drop a CSV or Excel file to scan it automatically |
| **Analysis Results** | Full quality report — overall score, per-column breakdown, duplicates, outliers |
| **AI Recommendations** | Plain-English fix suggestions for every issue, with Apply and Undo |
| **Report History** | All past analyses saved, with a trend chart showing improvement over time |
| **Data Governance** | Who owns each file, when it was last reviewed, and whether it meets standards |
| **Settings** | Profile, security, alert preferences, and tool integrations |

---

## Authentication

The app includes a complete auth flow:
- **Sign In** — email/password or Google (simulated)
- **Sign Up** — with password strength meter
- **Forgot Password** — email → confirmation screen

Default demo login works with any email and password.

---

## AI Chat Feature

The AI Recommendations page includes a live chat powered by the Claude API (claude-sonnet-4-20250514). Users can ask any question about their data in plain English and get an instant answer.

The API is called directly from the browser using:
```
anthropic-dangerous-direct-browser-access: true
```
This is fine for demos and prototypes. For production, route the API call through your own backend server to keep the API key secure.

---

## Datasets in the Demo

The app comes pre-loaded with 5 mock datasets, each with their own unique set of realistic quality issues:

| Dataset | Score | Key Issues |
|---------|-------|-----------|
| customer_data_june.csv | 92/100 | Invalid phones, bad emails, region inconsistency |
| transactions_q2.xlsx | 78/100 | Missing dates, invalid payment codes, duplicate IDs |
| product_catalog.csv | 61/100 | Missing names, zero prices, broken image URLs |
| vendor_contacts.xlsx | 44/100 | Unformatted phones, missing emails, duplicate vendors |
| marketing_leads_may.csv | 85/100 | Unsubscribed emails still active, missing lead sources |

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI framework |
| Recharts | 2.8.0 | Charts and data visualisation |
| Claude API | claude-sonnet-4-20250514 | AI recommendations chat |
| CSS-in-JS | Built-in | All styling via inline styles |

No external CSS framework. No TypeScript. No Redux. Kept intentionally simple so anyone can read and modify the code.

---

## Colour System

| Colour | Hex | Used for |
|--------|-----|---------|
| Background | `#0A0F1E` | Page background |
| Surface | `#111827` | Sidebar and header |
| Card | `#161D2F` | Cards and panels |
| Border | `#1E293B` | All borders |
| Primary | `#4F46E5` | Buttons, active states |
| Cyan | `#06B6D4` | Scores, highlights |
| Emerald | `#10B981` | Good/Excellent status |
| Amber | `#F59E0B` | Fair/warning status |
| Rose | `#F43F5E` | Poor/error status |
| Violet | `#8B5CF6` | Governance, settings |

---

## Key Components Inside DataQualityAssistant.jsx

| Component | Lines | What it does |
|-----------|-------|-------------|
| `ScoreRing` | ~20 | Animated circular score indicator |
| `Badge` | ~3 | Coloured status pill label |
| `AuthShell` | ~50 | Left-panel + right-card auth layout |
| `SignInPage` | ~50 | Email/password + Google sign in |
| `SignUpPage` | ~75 | Registration with password strength |
| `ForgotPage` | ~35 | Password reset flow |
| `UploadZone` | ~70 | Drag-drop with animated scan progress |
| `DashboardPage` | ~140 | Stats, area chart, donut chart, dataset table |
| `UploadPage` | ~22 | Wraps UploadZone with info panel |
| `AnalysisPage` | ~220 | File selector, score hero, 4 analysis tabs |
| `RecommendationsPage` | ~280 | Dataset selector, rec cards, AI chat |
| `HistoryPage` | ~45 | Filter bar, line chart, file list |
| `GovernancePage` | ~130 | KPIs, expandable dataset cards, glossary |
| `SettingsPage` | ~170 | 4-tab settings panel |
| `ManagePlanModal` | ~130 | Billing modal with upgrade/cancel/card flows |
| `EnterprisePlansModal` | ~120 | Plan comparison with contact/demo forms |
| `App` | ~180 | Root component, routing, header, sidebar |

---

## What to Do Before Publishing

1. **Replace the Anthropic API key** — move it to a backend server, not the frontend
2. **Connect real authentication** — replace the simulated login with Auth0, Firebase Auth, or your own backend
3. **Connect a real database** — replace mock data with real API calls to your data warehouse
4. **Add your company logo** — replace the ✦ icon in the sidebar and auth screen
5. **Update the dataset list** — replace mock datasets with real ones from your system
6. **Set up HTTPS** — all production deployments must use HTTPS
7. **Test on mobile** — the layout is desktop-first; test and adjust for smaller screens

---

## Contact

Project built by Claude AI (Anthropic) for Acme Corporation.
Platform: claude.ai
