const FIELD_LABELS = {
  name: "Full name",
  companyName: "Company name",
  website: "Website",
  jobTitle: "Job title",
  industry: "Industry",
  companyLocation: "Company location",
  companySize: "Company size",
  leadSource: "Lead source",
  requirement: "Requirement",
  email: "Email",
  phone: "Phone"
};

const ROLE_SIGNALS = ["founder", "co-founder", "ceo", "chief", "owner", "director", "vp", "vice president", "head", "manager"];
const HIGH_INTENT_SOURCES = ["website", "demo", "contact sales", "referral"];
const COMPANY_SIZES = {
  "1-10 Employees": 2,
  "11-50 Employees": 5,
  "50-100 Employees": 10,
  "101-500 Employees": 10,
  "500+ Employees": 10
};

const clean = (value) => String(value || "").trim();
const has = (value) => clean(value).length > 0;

export function scoreLead(lead = {}) {
  const normalized = Object.fromEntries(Object.keys(FIELD_LABELS).map((key) => [key, clean(lead[key])]));
  const positiveFactors = [];
  const negativeFactors = [];
  let score = 0;

  const completeness = Object.values(normalized).filter(Boolean).length;
  const completenessPoints = Math.round((completeness / Object.keys(normalized).length) * 20);
  score += completenessPoints;
  if (completeness === Object.keys(normalized).length) positiveFactors.push("Complete contact and qualification profile (+20)");
  else negativeFactors.push(`${Object.keys(normalized).length - completeness} qualification field${Object.keys(normalized).length - completeness === 1 ? "" : "s"} missing (-${20 - completenessPoints})`);

  if (has(normalized.requirement)) {
    score += 20;
    positiveFactors.push("Specific product requirement is stated (+20)");
  } else {
    negativeFactors.push("No stated requirement (-20)");
  }

  const source = normalized.leadSource.toLowerCase();
  if (HIGH_INTENT_SOURCES.some((signal) => source.includes(signal))) {
    score += 15;
    positiveFactors.push("High-intent lead source (+15)");
  } else if (has(source)) {
    score += 8;
    positiveFactors.push("Recognized lead source (+8)");
  } else {
    negativeFactors.push("Lead source is unknown (-15)");
  }

  const role = normalized.jobTitle.toLowerCase();
  if (ROLE_SIGNALS.some((signal) => role.includes(signal))) {
    score += 20;
    positiveFactors.push("Likely decision-maker role (+20)");
  } else if (has(role)) {
    score += 10;
    positiveFactors.push("Job title is available (+10)");
  } else {
    negativeFactors.push("Decision-maker role is unknown (-20)");
  }

  const sizePoints = COMPANY_SIZES[normalized.companySize] || 0;
  if (sizePoints) {
    score += sizePoints;
    positiveFactors.push(`Company size supports sales potential (+${sizePoints})`);
  } else {
    negativeFactors.push("Company size is missing or not recognised (-10)");
  }

  if (has(normalized.website)) {
    score += 5;
    positiveFactors.push("Company website provided (+5)");
  } else {
    negativeFactors.push("Company website is missing (-5)");
  }
  if (has(normalized.industry) && has(normalized.companyLocation)) {
    score += 5;
    positiveFactors.push("Industry and location context provided (+5)");
  } else {
    negativeFactors.push("Industry or location context is incomplete (-5)");
  }

  const contactPoints = (has(normalized.email) ? 3 : 0) + (has(normalized.phone) ? 2 : 0);
  score += contactPoints;
  if (has(normalized.email)) positiveFactors.push("Reachable email provided (+3)");
  else negativeFactors.push("Email is missing (-3)");
  if (has(normalized.phone)) positiveFactors.push("Phone number provided (+2)");
  else negativeFactors.push("Phone number is missing (-2)");

  score = Math.max(0, Math.min(100, score));
  const classification = score >= 75 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  const qualityAssessment = score >= 75
    ? "Strong fit with clear buying intent and enough detail for a timely sales conversation."
    : score >= 50
      ? "Promising lead, but a short discovery conversation is needed to confirm fit and urgency."
      : "Early-stage lead with limited qualification signals; nurture before investing high-touch sales time.";
  const confidence = completeness >= 9 ? "High" : completeness >= 6 ? "Medium" : "Low";
  const recommendedNextAction = classification === "Hot"
    ? "Recommended next action: Contact within 1 business hour and offer a tailored CRM walkthrough."
    : classification === "Warm"
      ? "Recommended next action: Follow up within 1 business day to confirm budget, timeline, and decision process."
      : "Recommended next action: Send a useful educational follow-up and request the missing qualification details.";

  return {
    score,
    classification,
    qualityAssessment,
    positiveFactors,
    negativeFactors,
    scoringExplanation: `Score is built from profile completeness (${completenessPoints}/20), requirement (20), source intent (up to 15), decision authority (up to 20), company size (10), web presence (5), context (5), and contactability (${contactPoints}/5).`,
    scoreBreakdown: [
      { label: "Profile completeness", score: completenessPoints, max: 20 },
      { label: "Requirement clarity", score: has(normalized.requirement) ? 20 : 0, max: 20 },
      { label: "Lead source intent", score: HIGH_INTENT_SOURCES.some((signal) => source.includes(signal)) ? 15 : has(source) ? 8 : 0, max: 15 },
      { label: "Decision authority", score: ROLE_SIGNALS.some((signal) => role.includes(signal)) ? 20 : has(role) ? 10 : 0, max: 20 },
      { label: "Company size", score: sizePoints, max: 10 },
      { label: "Website", score: has(normalized.website) ? 5 : 0, max: 5 },
      { label: "Industry & location", score: has(normalized.industry) && has(normalized.companyLocation) ? 5 : 0, max: 5 },
      { label: "Contactability", score: contactPoints, max: 5 }
    ],
    confidence,
    recommendedNextAction
  };
}

export { FIELD_LABELS };
