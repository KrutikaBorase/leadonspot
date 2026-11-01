# LeadOnSpot

LeadOnSpot is an explainable lead qualification tool for sales teams. It accepts the lead fields from the assessment brief and returns a deterministic score, classification, confidence, evidence, and a recommended next action. Gemini adds a concise natural-language analysis without controlling the score.

## Run the application

Requirements: Node.js 18 or newer.

```bash
npm install     # no runtime packages are required; this is safe and optional
npm start
```

Open <http://localhost:3000>.

Run the automated test cases:

```bash
npm test
```

Load the sample lead in the UI to reproduce the assessment example. Use **Clear form** to test incomplete data handling.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/scoring.js` | Pure, deterministic scoring engine |
| `server.js` | Static server, `/api/score`, and optional Gemini explanation endpoint |
| `public/index.html` | Accessible lead-entry interface |
| `public/app.js` | Form state, API calls, and result rendering |
| `public/styles.css` | Responsive visual design |
| `test/scoring.test.js` | Reproducible scoring test cases |
| `docs/SCORING-METHODOLOGY.md` | Full weights, rules, and thresholds |
| `docs/SAMPLE-TEST-CASES.md` | Assessment-ready examples and expected outputs |

## Scoring methodology

The score is intentionally computed in code rather than delegated to an LLM. Every score is the sum of transparent weighted signals and is capped to the range 0–100. The complete methodology is documented in [docs/SCORING-METHODOLOGY.md](docs/SCORING-METHODOLOGY.md).

| Signal | Maximum |
| --- | ---: |
| Profile completeness | 20 |
| Stated requirement | 20 |
| Lead source intent | 15 |
| Decision-maker seniority | 20 |
| Company size | 10 |
| Company website | 5 |
| Industry and location context | 5 |
| Email and phone | 5 |
| **Total** | **100** |

Classification thresholds are Hot = 75–100, Warm = 50–74, and Cold = 0–49. Confidence is High for 9–11 known qualification fields, Medium for 6–8, and Low for 0–5. Missing information reduces the completeness score and creates a visible negative factor; it is never silently guessed.

## AI boundary

The browser calls `/api/score`, so the UI and tests share the same scoring source of truth. `/api/explanation` sends the lead and already-computed result to Gemini for a short analysis. Gemini is instructed to explain one positive signal and one gap; it cannot change the score, classification, factors, or recommended action. The server validates the response and uses a concise deterministic fallback if Gemini is unavailable or returns malformed output.

To enable Gemini locally, create `.env` from `.env.example`:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

`.env` is ignored by Git and is never sent to the browser. Never commit API keys.
