# AI Soft Ladder (Next.js)

This is a Next.js + TypeScript web app for emotional intelligence (EQ) assessment and development.

It has two main sides:

- **Individuals** – practice AI-powered interviews, receive structured EQ feedback, and do daily exercises with simple streak tracking.
- **Companies / HR** – run AI-powered interviews and review structured EQ + culture fit analysis for candidates.

Core flow for AI interview:

1. Candidate answers interview questions using the **microphone** in the browser.
2. Browser sends the recorded **audio** to a Next.js API route: `POST /api/interview`.
3. The backend:
   - Sends audio to **Chimege STT** (Speech-to-Text) → gets transcript
   - Sends transcript to **OpenAI (ChatGPT)** → gets structured EQ + culture-fit analysis
   - Sends candidate-friendly feedback text to **Chimege TTS** → gets audio feedback
4. The frontend shows the scores & analysis and plays the **spoken feedback** back to the user.

---

## Project structure

Key files/directories:

- `package.json` – dependencies and scripts
- `tsconfig.json` – TypeScript configuration
- `next.config.mjs` – Next.js config
- `.env.example` – template for environment variables (copy to `.env.local`)
- `src/app/layout.tsx` – root layout with navigation
- `src/app/globals.css` – base styling + utility-style classes
- `src/app/page.tsx` – landing page
- `src/app/interview/page.tsx` – **AI EQ interview** UI
- `src/app/hr/page.tsx` – **HR dashboard** with mock candidate data
- `src/app/exercises/page.tsx` – **EQ exercises & streaks** page
- `src/app/api/interview/route.ts` – **backend API** implementing STT → GPT → TTS pipeline

Routes (App Router):

- `/` – overview & explanation
- `/interview` – record answers, send to `/api/interview`, view EQ analysis & listen to feedback
- `/hr` – sample HR dashboard showing how candidate EQ data could look
- `/exercises` – simple daily EQ exercises with local streak tracking
- `/events` – event log (file-backed demo table)
- `/auth` – login / signup demo

---

## Prerequisites

You need **Node.js (LTS)** installed on your machine.

1. Download from: https://nodejs.org/en
2. Install the latest **LTS** version (this installs `node`, `npm`, and `npx`).
3. Restart VS Code / terminal after installation.

You also need **API keys** for:

- **OpenAI (ChatGPT)** – for EQ & culture fit analysis
- **Chimege STT** – for speech-to-text
- **Chimege TTS** – for text-to-speech

---

## Setup

From the `eq-ei-platform` folder:

```bash
npm install
```

This will install dependencies defined in `package.json` (Next.js, React, TypeScript, OpenAI SDK, etc.).

### Environment variables

1. Copy the example env file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` and fill in your real keys.

Using the keys you provided, it would look like **this** (do NOT commit this file):

```env
# OpenAI API key
OPENAI_API_KEY="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"

# Chimege Speech-to-Text
CHIMEGE_STT_API_KEY="5dffc0f1a9aa8b9c71db18ae2eae800ecb0b6ef960f488069a5a637c0026279e"
CHIMEGE_STT_URL="https://api.chimege.mn/v1/stt"  # Check and adjust based on Chimege docs

# Chimege Text-to-Speech
CHIMEGE_TTS_API_KEY="c7e6c8bad2c449ef4972c260a64ba872da878a9f6925ffb8b8e33076913a095a"
CHIMEGE_TTS_URL="https://api.chimege.mn/v1/tts"  # Check and adjust based on Chimege docs
```

> IMPORTANT:
> - Keep `.env.local` **out of version control**.
> - Confirm the exact Chimege endpoints (`CHIMEGE_STT_URL`, `CHIMEGE_TTS_URL`) from their API documentation and adjust if needed.

---

## Running the app

In the `eq-ei-platform` directory:

```bash
npm run dev
```

Then open:

- http://localhost:3000 – main site
- http://localhost:3000/interview – AI EQ interview
- http://localhost:3000/hr – HR dashboard (mock data)
- http://localhost:3000/exercises – EQ exercises & streaks

---

## AI interview API details

Endpoint: `POST /api/interview`

Expected request (from browser):

- **Body:** raw audio binary
- **Content-Type:** something like `audio/webm` (based on what `MediaRecorder` produces)

Flow implemented in `src/app/api/interview/route.ts`:

1. **Receive audio** and read it into a `Buffer`.
2. **Chimege STT** – `transcribeWithChimege`:
   - Sends the audio buffer to `CHIMEGE_STT_URL`
   - Uses header `Authorization: Bearer ${CHIMEGE_STT_API_KEY}`
   - Assumes JSON response like `{ text: "..." }`
3. **OpenAI analysis** – `analyzeEQWithOpenAI`:
   - Sends the transcript to OpenAI with a detailed system prompt
   - Uses `response_format: { type: "json_object" }` to force JSON
   - Expects a JSON object including:
     - `overall_eq_score`
     - `sub_scores` (self_awareness, self_regulation, motivation, empathy, social_skills)
     - `strengths`, `areas_to_improve`
     - `culture_fit_score`, `culture_fit_comment`
     - `hr_summary`, `candidate_feedback`
4. **Chimege TTS** – `synthesizeWithChimege`:
   - Sends `candidate_feedback` text to `CHIMEGE_TTS_URL`
   - Uses header `Authorization: Bearer ${CHIMEGE_TTS_API_KEY}`
   - Reads binary audio response and returns it as `Buffer`.
5. Response back to the browser:

```jsonc
{
  "transcript": "...",
  "analysis": { /* structured EQ analysis object from OpenAI */ },
  "feedbackAudioBase64": "..." // base64-encoded audio
}
```

The frontend decodes `feedbackAudioBase64` to a Blob and plays it with an `<audio>` element.

---

## Frontend flows

### /interview – AI EQ Interview

Key behaviors (see `src/app/interview/page.tsx`):

- Uses `MediaRecorder` to capture audio from the microphone.
- Sends the resulting Blob to `/api/interview` with `fetch`.
- Shows:
  - Current question
  - Transcript returned by STT
  - EQ scores & culture fit
  - Strengths / areas to improve
  - HR summary
  - Candidate-facing feedback text
- Plays back spoken feedback audio from Chimege TTS.

### /hr – HR Dashboard (mock data)

- Static example of how HR could:
  - See candidate list with EQ and culture fit scores
  - Review strengths and risks/watchpoints
  - Get a quick pipeline snapshot (average EQ and culture fit)

### /exercises – EQ Exercises & Streaks

- Static set of exercises across self-awareness, self-regulation, empathy, and social skills.
- Simple local-only streak tracking:
  - Mark exercise as completed today
  - Shows streak count per exercise
  - Shows total exercises completed today

---

## Design system & UI conventions

The app uses a lightweight, token-based design system in `src/app/globals.css`.

- Tokens (CSS variables) under `:root`:
  - Colors: `--bg`, `--surface`, `--surface-2`, `--text`, `--muted`, `--border`, `--primary-*`, `--accent`
  - Radii: `--radius-sm`, `--radius`, `--radius-lg`
  - Shadows: `--shadow-sm|md|lg`
  - Layout: `--container`
- Base utilities:
  - Layout: `.container`, `.grid`, `.grid-2` (stacks to 1 column under 860px)
  - Spacing: `.mt-*`, `.mb-*`, `.px-4`, `.py-6`, etc.
  - Typography: `.small`, `.text-sm`, `.text-muted`, headings h1–h3
- Components:
  - Buttons: `.btn` base with `.btn-primary` and `.btn-secondary`
  - Card: `.card` with gradient surface and border
  - Inputs: `.input` with focus ring and subtle background shift
  - Badges/Chips: `.badge`
  - Header/Nav: `.sticky-top`, `.brand`, `.nav`, `.nav-link`
  - Accessibility: `.skip-link`, focus-visible rings globally

Conventions when adding UI:

- Use `.container` for page width; avoid hardcoding max-widths.
- Prefer `<section className="card">` for panel groupings.
- Use `<a className="btn ...">` or `<button className="btn ...">` for actions.
- Keep forms using `.form-grid` for responsive columns.
- Use semantic HTML (`section`, `nav`, `main`, `h*`) and rely on the built-ins for spacing.

Example:

```tsx
<section className="card">
  <h2>Section title</h2>
  <p className="small text-muted mt-2">Helper text</p>
  <div className="mt-4" style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    <button className="btn btn-primary">Primary action</button>
    <button className="btn btn-secondary">Secondary</button>
  </div>
</section>
```

---

## Next steps / production hardening

To evolve this into a production system, you might:

- Connect the HR dashboard to a **database** (e.g., Postgres) to store candidate interviews and scores.
- Add **authentication** (e.g., NextAuth) for HR users and individual accounts.
- Persist EQ exercises & streaks per user.
- Add support for **multiple interview templates** (roles, seniority levels, languages).
- Improve error handling and user messaging for STT/TTS/LLM failures.
- Add rate limiting and logging around the `/api/interview` endpoint.

---

## Scripts

- `npm run dev` – start dev server at `http://localhost:3000`
- `npm run build` – create production build
- `npm start` – start production server (after `npm run build`)
- `npm run lint` – run ESLint
