# Sample test cases

These examples can be reproduced from the UI or with `npm test`. Expected values come from the deterministic scoring engine, not from Gemini.

## Case 1: Complete assessment sample

**Input:** Rahul Sharma, ABC Technologies, Founder, IT Services, Bangalore, 50–100 employees, Website, “Looking for CRM software”, email and phone supplied.

| Expected output | Value |
| --- | --- |
| Score | 100 |
| Classification | Hot |
| Confidence | High |
| Positive factors | 9 |
| Negative factors | 0 |
| Next action | Contact within 1 business hour and offer a tailored CRM walkthrough |

## Case 2: Incomplete lead

**Input:** Anita Rao, Northstar Retail, Marketing Executive, Retail, Pune, 11–50 employees, Event, no requirement, email supplied, no website or phone.

| Expected output | Value |
| --- | --- |
| Score | 46 |
| Classification | Cold |
| Confidence | Medium |
| Positive factors | Recognised source, title, size, context, email |
| Negative factors | Missing requirement, website, phone, and three-field completeness gap |
| Next action | Send educational follow-up and request missing qualification details |

## Case 3: Qualified sales leader

**Input:** Vikram Mehta, CloudPeak Systems, VP of Sales, SaaS, Mumbai, 101–500 employees, Demo request, CRM automation requirement, email and phone supplied.

| Expected output | Value |
| --- | --- |
| Score | 100 |
| Classification | Hot |
| Confidence | High |
| Positive factors | 9 |
| Negative factors | 0 |
| Next action | Contact within 1 business hour and offer a tailored CRM walkthrough |

## Case 4: Qualified but not a senior decision-maker

This case is included in the automated test suite: a Marketing Executive with a stated requirement, Event source, 101–500 employees, email, and phone but no website or location.

| Expected output | Value |
| --- | --- |
| Classification | Warm |
| Confidence | Medium |
| Purpose | Confirms that a real requirement can create a promising lead without incorrectly treating every contact as a decision-maker |

## Consistency check

The tests score the same input twice and compare the complete output object. This guards against accidental randomness or LLM-controlled scoring.
