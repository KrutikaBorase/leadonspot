# LeadOnSpot

LeadOnSpot is an explainable lead qualification tool. It accepts the fields from the assessment brief and returns a deterministic 0–100 score, a Hot/Warm/Cold classification, confidence, factors, and a next action.

## Run it

```bash
npm start
```

Open <http://localhost:3000>. The project has no runtime dependencies.

Run the scoring tests with:

```bash
npm test
```

## Scoring methodology

The score is intentionally computed in code rather than delegated to an LLM:

| Signal | Maximum |
| --- | ---: |
| Profile completeness | 20 |
| Stated requirement | 20 |
| Lead source intent | 15 |
| Decision-maker seniority | 20 |
| Company size | 10 |
| Email and phone | 5 |
| Company website | 5 |
| Industry and location context | 5 |
| **Total** | **100** |

The score is capped at 100. Hot is 75–100, Warm is 50–74, and Cold is 0–49. Confidence reflects how many qualification fields are available: 9–10 is High, 6–8 is Medium, and 0–5 is Low. Missing information reduces completeness and produces a visible negative factor; it never gets silently guessed.

The sample lead is expected to score 100 / Hot / High confidence. The test suite also covers a sparse lead and a qualified non-decision-maker.

## AI boundary

The deterministic engine in `src/scoring.js` owns the score, classification, factors, and action. The browser calls `/api/score`, so the UI and tests use the same source of truth. The `/api/explanation` endpoint optionally calls an OpenAI-compatible chat-completions API only to rewrite the structured result as a short explanation. Set `OPENAI_API_KEY` (and optionally `OPENAI_API_URL` or `OPENAI_MODEL`) to enable it. Without a key, a deterministic explanation is returned.
