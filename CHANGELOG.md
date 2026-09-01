# Changelog — DataQuality AI
All major changes made during the build session, from start to finish.

---

## Final Version — v1.0

### Authentication
- Sign In page with email/password and Google OAuth simulation
- Sign Up page with password strength meter and Terms checkbox
- Forgot Password flow with email confirmation screen
- AuthShell layout with animated background glow orbs and feature list

### Dashboard
- 4 stat cards: Total Records, Missing Values, Duplicates, Outliers
- Area chart showing quality score trend (Jan–Jul)
- Donut chart showing issue breakdown by category
- Recent datasets table with quality score bar, status badge, upload time
- Live search bar in header with prefix highlighting and recent files dropdown
- Notification bell with unread count, dismiss, and mark-all-read
- PRO plan popup with usage bars and billing date
- Collapsible sidebar navigation

### Upload Dataset
- Drag-and-drop file zone with file type icons
- 7-step animated scan progress with step-by-step checklist
- File info display (name, size) before scanning
- Passes uploaded filename through to Analysis Results page

### Analysis Results
- File selector panel listing all 5 datasets plus any newly uploaded file (marked NEW)
- Score hero: animated score ring + 4 stat cards + full-width issue breakdown bars
- Issue breakdown fixed to stay inside its container (no overflow)
- 4 tabs: Overview (bar charts), Columns (fixed-width table), Duplicates, Outliers
- Export Report button using data URI CSV download (no Blob, works in sandbox)
- Re-run Analysis button with animated progress bar and success toast

### AI Recommendations
- Dataset selector at top — switching dataset resets all state and loads unique issues
- Each of the 5 datasets has its own set of realistic, relevant recommendations
- Issue cards: severity badge, affected column, plain-English summary, suggested fix box
- Apply Fix button with animation → card marks as Applied
- Undo button on applied cards and in History panel
- Version history panel — shows every fix applied with timestamp, undo any of them
- Export Applied Fixes as CSV (includes dataset, column, fix, effort, impact, time)
- AI chat powered by Claude API — context-aware per selected dataset
- Quick-question chips for common queries

### Report History
- Filter bar: All / Excellent / Good / Fair / Poor
- Line chart showing quality trend
- File list with score, status badge, size, time
- Export All button

### Data Governance (full redesign)
- Plain-English description at top explaining what the page does
- 4 KPI cards with explanatory subtitles (not just numbers)
- Red action-needed banner when datasets are breached or at risk — names the files
- Expandable dataset cards — click to see owner, last reviewed date, issue count, quality bar
- Overdue warning when dataset not reviewed in 7+ days
- Plain-English glossary explaining SLA, Quality Score, Owner, Last Reviewed

### Settings
- 4-tab layout: Profile, Security, Alerts, Integrations
- Profile: editable fields, avatar initials, bio textarea, timezone dropdown
- Security: password change with show/hide toggles and match validation, active sessions with Revoke
- Alerts: 4 toggle switches + threshold slider with preset buttons
- Integrations: 6-card grid with toggle switches
- Save → green toast confirmation

### Manage Plan Modal
- Main view: plan details, payment method, recent invoices with PDF download
- Upgrade to Annual: side-by-side comparison, savings callout
- Update Card: 4-field form
- Cancel: 2-step with lose-access warning and reason selection
- All flows end in success confirmation screens

### Enterprise Plans Modal
- 3-column plan comparison (Pro / Team / Enterprise)
- YOUR PLAN badge solid cyan on Pro card — clearly visible
- MOST POPULAR badge on Team card
- Clickable upgrade buttons (Pro shows "✓ Active Plan" non-clickable div)
- Team upgrade confirmation with billing preview
- Contact Sales form
- Book Demo form with date and time picker
- All flows end in success confirmations

### Bug Fixes Applied
- Fixed `user is not defined` error — moved name split after auth guard
- Fixed syntax error from stray quote character
- Fixed React hooks-in-conditional error — moved useState to top of ManagePlanModal
- Fixed Analysis always showing customer_data_june.csv — wired file prop through Upload→App→Analysis
- Fixed table column overflow — tableLayout fixed + colgroup percentage widths
- Fixed issue breakdown overflowing hero section — rebuilt as two-row layout
- Fixed Export button blanking screen — replaced Blob/createObjectURL with data URI
- Fixed loading spinner / blank screen — reduced file from 2,115 lines to 1,424 lines
- Fixed ISSUES is not defined error — added constant aliases after data declarations
- Fixed Enterprise Plans YOUR PLAN badge — changed from transparent to solid cyan
- Fixed Analysis page always showing same file regardless of selection
- Fixed RecommendationsPage showing same issues for all datasets

---

## Architecture Decisions

**Single file** — The entire app lives in one JSX file. This was a deliberate choice to keep it simple for a demo/prototype. For a production app, split into individual component files.

**Inline styles** — All CSS is written as inline style objects. No external stylesheet, no CSS modules, no Tailwind. Makes the file self-contained.

**No routing library** — Page navigation uses a simple `page` state string in the App component instead of React Router. Fine for a demo; use React Router for a real multi-page app.

**Mock data as constants** — All dataset data, trend data, and column health data are defined as constants at the top of the file. Replace these with real API calls for production.

**Direct API calls** — The Claude API is called directly from the browser with `anthropic-dangerous-direct-browser-access: true`. For production, create a backend endpoint that proxies the request.
