# Scoring methodology

## Design principles

LeadOnSpot uses a fixed weighted model so identical inputs always produce identical outputs. The model rewards evidence of buying intent, authority, business fit, and reachability. It does not infer missing facts.

## Weight table

| Category | Rule | Maximum |
| --- | --- | ---: |
| Profile completeness | 20 points distributed evenly across the 11 supplied lead fields | 20 |
| Requirement clarity | A non-empty requirement | 20 |
| Lead source intent | Website, demo request, contact sales, or referral = 15; another known source = 8 | 15 |
| Decision authority | Founder, CEO, owner, director, VP, head, manager, or chief role = 20; another title = 10 | 20 |
| Company size | 1–10 = 2; 11–50 = 5; 50–100, 101–500, or 500+ = 10 | 10 |
| Website | Non-empty website | 5 |
| Industry and location | Both fields are present | 5 |
| Contactability | Email = 3; phone = 2 | 5 |
| **Total possible** |  | **100** |

The score is clamped to 0–100 after calculation. Text matching is case-insensitive and whitespace is trimmed. The scoring engine does not make network calls and does not use randomness.

## Classification and confidence

| Score | Classification | Meaning |
| ---: | --- | --- |
| 75–100 | Hot | Strong buying and fit signals; prioritise a timely sales conversation |
| 50–74 | Warm | Promising, but discovery is needed to confirm urgency or fit |
| 0–49 | Cold | Early-stage or under-qualified; nurture and collect missing information |

Confidence is based on the 11 available input fields (including the lead name): 9–11 known fields = High, 6–8 = Medium, and 0–5 = Low. Confidence describes evidence quality, not the lead's commercial value.

## Output contract

`scoreLead()` returns:

- `score`: integer from 0 to 100
- `classification`: `Hot`, `Warm`, or `Cold`
- `qualityAssessment`: concise fit assessment
- `positiveFactors`: evidence that increased the score
- `negativeFactors`: missing or weak signals
- `scoringExplanation`: summary of the formula
- `scoreBreakdown`: each category's earned points and maximum
- `confidence`: `High`, `Medium`, or `Low`
- `recommendedNextAction`: practical follow-up guidance

## AI boundary

The rule engine creates the complete output contract above. Gemini receives the lead and this computed result only to write a short explanation. A server-side response schema and validation reject incomplete model output. The deterministic fallback keeps the application usable without an API key or during an API failure.
