AI Teacher Assistant

Overview

AI Teacher Assistant helps teachers review student essays faster and more consistently. It analyzes pasted or uploaded text, generates grammar and clarity feedback, assigns an overall score, and lets teachers save results into searchable reports that can be exported to PDF or CSV. A rubric preset selector and an optional “Explain feedback” mode help align outputs to classroom expectations and make AI decisions more transparent.

Problem It Solves

- Manual essay review is time‑consuming and inconsistent across classes.
- Teachers need quick, structured feedback they can tailor to their own rubrics.
- Sharing outcomes (grades, comments) requires extra tooling for exporting and archiving.

How It Works

1) Sign in
- Teachers log in via Google Identity Services. The ID token is verified on the server for authenticity.

2) Analyze
- On the Dashboard → Upload Essay, teachers paste or upload a .txt essay, pick a rubric preset (e.g., Basic, Mechanics, Evidence & Reasoning, Customary Tone), and optionally enable “Explain feedback.”
- The frontend calls the backend `/api/analyze`, which uses OpenAI to produce:
  - Grammar and corrections summary
  - Clarity suggestions (with short explanations if enabled)
  - An overall score (0–100)

3) Save & Report
- Teachers approve results to save them into local reports (stored in the browser for now).
- Reports are searchable and exportable to PDF (jsPDF) or CSV (PapaParse).

Key Features

- Google sign‑in with server‑side ID token verification
- Essay input via paste or .txt upload and drag‑and‑drop
- Rubric presets and optional “Explain feedback” mode
- Progress indicators, autosave draft, and keyboard shortcut (Ctrl/Cmd + Enter)
- Reports: search, PDF export, CSV export
- Theming: light/dark and accent color persistence
- PWA: offline caching of core assets via service worker

Architecture

- Frontend (static): `index.html`, `dashboard.html`, `styles.css`, `js/*`, `manifest.webmanifest`, `sw.js`
  - Google Identity button on `index.html`
  - `js/auth.js`: login flow; delegates token verification to backend
  - `js/landing.js`: theme/accent persistence, mock login for dev
  - `js/dashboard.js`: analysis workflow, reports, exports, UI interactions
  - `styles.css`: Bootstrap customization, dark theme, micro‑interactions
  - `sw.js`: PWA caching (network‑first for HTML)

- Backend (Node/Express): `server/`
  - `POST /api/auth/verify`: verifies Google ID token using `google-auth-library`
  - `POST /api/analyze`: calls OpenAI with rubric/explain options and returns structured results

Languages & Technologies

- Languages: HTML, CSS, JavaScript (ES), Node.js (CommonJS)
- Frontend: Bootstrap 5, Google Identity Services, jsPDF, PapaParse
- Backend: Node.js, Express, google-auth-library, node-fetch
- PWA: Web App Manifest, Service Worker Cache

Security & Privacy Notes

- The Google Client Secret is NOT used in the frontend and must never be exposed to the browser.
- The backend verifies Google ID tokens server‑side; only verified users proceed.
- The OpenAI API key is stored server‑side and never shipped to clients.
- Reports currently live in localStorage on the device; add a database if multi‑device syncing is needed.

Getting Started

Prerequisites
- Node.js 18+

1) Backend
- Create `server/.env` with:
  - `PORT=8080`
  - `GOOGLE_CLIENT_ID=<your Google OAuth client id>`
  - `OPENAI_API_KEY=<your OpenAI key>`
  - `OPENAI_MODEL=gpt-4o-mini` (or preferred)
- Install and run:
```
cd server
npm i
npm run dev
```
- Server runs at `http://localhost:8080` by default.

2) Frontend
- Open `index.html` in a local static server or via the backend’s static hosting (the server is configured to serve files from the project root for convenience).
- First load after updates: do a hard refresh (Ctrl+F5) so the service worker fetches new files.

Environment Configuration

- Google Client ID must match the value embedded in `index.html` and the backend `.env`.
- If frontend and backend run on different origins, configure CORS in `server/src/index.js`.

Typical Flow

1. User signs in on `index.html` → server verifies the ID token → redirect to `dashboard.html`.
2. User pastes/uploads essay → selects rubric → clicks Analyze.
3. Backend calls OpenAI and returns feedback + score.
4. User approves to save → report appears under Reports; export to PDF/CSV as needed.

Roadmap Ideas

- Standards‑aligned rubrics (e.g., Common Core) with weight sliders
- Student‑friendly rewrites and reading‑level controls
- Bias/fairness checks, anonymization mode
- LMS integrations (e.g., Google Classroom) and roster/class support
- Cloud storage for reports with accounts and multi‑device sync

License

This project is provided as‑is for educational purposes.


