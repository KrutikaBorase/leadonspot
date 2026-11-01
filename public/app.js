const form = document.querySelector("#lead-form");
const results = document.querySelector("#results");
const sampleButton = document.querySelector("#sample-button");

const sampleLead = {
  name: "Rahul Sharma",
  companyName: "ABC Technologies",
  website: "www.abctechnologies.com",
  jobTitle: "Founder",
  industry: "IT Services",
  companyLocation: "Bangalore",
  companySize: "50-100 Employees",
  leadSource: "Website",
  requirement: "Looking for CRM software",
  email: "rahul@example.com",
  phone: "+91 9876543210"
};

function localScore(lead) {
  const fields = ["companyName", "website", "jobTitle", "industry", "companyLocation", "companySize", "leadSource", "requirement", "email", "phone"];
  const filled = fields.filter((field) => lead[field]?.trim()).length;
  const completeness = Math.round((filled / fields.length) * 20);
  const senior = /founder|co-founder|ceo|chief|owner|director|vp|vice president|head|manager/i.test(lead.jobTitle);
  const source = /website|demo|contact sales|referral/i.test(lead.leadSource);
  const size = { "1-10 Employees": 2, "11-50 Employees": 5, "50-100 Employees": 10, "101-500 Employees": 10, "500+ Employees": 10 }[lead.companySize] || 0;
  let score = completeness + (lead.requirement ? 20 : 0) + (source ? 15 : lead.leadSource ? 8 : 0) + (senior ? 20 : lead.jobTitle ? 10 : 0) + size + (lead.email ? 3 : 0) + (lead.phone ? 2 : 0) + (lead.website ? 5 : 0) + (lead.industry && lead.companyLocation ? 5 : 0);
  score = Math.min(100, score);
  const classification = score >= 75 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  const confidence = filled >= 9 ? "High" : filled >= 6 ? "Medium" : "Low";
  return { score, classification, confidence, filled, completeness, senior, source, size };
}

function render(lead) {
  const result = localScore(lead);
  const quality = result.classification === "Hot"
    ? "Strong fit with clear buying intent and enough detail for a timely sales conversation."
    : result.classification === "Warm"
      ? "Promising lead, but a short discovery conversation is needed to confirm fit and urgency."
      : "Early-stage lead with limited qualification signals; nurture before investing high-touch sales time.";
  const action = result.classification === "Hot"
    ? "Contact within 1 business hour and offer a tailored CRM walkthrough."
    : result.classification === "Warm"
      ? "Follow up within 1 business day to confirm budget, timeline, and decision process."
      : "Send a useful educational follow-up and request the missing qualification details.";
  const positives = [];
  const negatives = [];
  if (result.filled === 10) positives.push("Complete contact and qualification profile (+20)");
  else negatives.push(`${10 - result.filled} qualification field${10 - result.filled === 1 ? "" : "s"} missing`);
  if (lead.requirement) positives.push("Specific product requirement is stated (+20)");
  else negatives.push("No stated requirement");
  if (result.source) positives.push("High-intent lead source (+15)");
  if (result.senior) positives.push("Likely decision-maker role (+20)");
  if (result.size) positives.push("Company size supports sales potential");
  if (lead.website) positives.push("Company website provided");
  if (lead.industry && lead.companyLocation) positives.push("Industry and location context provided");
  if (lead.email) positives.push("Reachable email provided");
  if (lead.phone) positives.push("Phone number provided");
  if (!lead.email) negatives.push("Email is missing");
  if (!lead.phone) negatives.push("Phone number is missing");
  if (!lead.website) negatives.push("Company website is missing");
  if (!lead.industry || !lead.companyLocation) negatives.push("Industry or location context is incomplete");
  results.className = "card results-card";
  results.innerHTML = `<div class="score-header"><div><div class="score-number">${result.score}<small>/100</small></div><div class="muted">Confidence: ${result.confidence}</div></div><span class="badge ${result.classification.toLowerCase()}">${result.classification} lead</span></div>
    <div class="meter"><i style="width:${result.score}%"></i></div>
    <div class="result-section"><h3>Quality assessment</h3><p>${quality}</p></div>
    <div class="result-section"><h3>Positive signals</h3><ul class="factor-list">${positives.map((item) => `<li>${item}</li>`).join("") || "<li>None yet</li>"}</ul></div>
    <div class="result-section"><h3>Watch-outs</h3><ul class="factor-list negative">${negatives.map((item) => `<li>${item}</li>`).join("") || "<li>None identified</li>"}</ul></div>
    <div class="result-section"><h3>Recommended next action</h3><div class="next-action">${action}</div></div>
    <div class="result-section"><h3>Scoring explanation</h3><p>Profile completeness (${result.completeness}/20), requirement and intent, decision authority, company potential, and contactability combine into this deterministic score. The narrative can be polished by an LLM without changing these numbers.</p></div>`;
  requestExplanation(lead, { ...result, qualityAssessment: quality, recommendedNextAction: action, positiveFactors: positives, negativeFactors: negatives });
}

async function requestExplanation(lead, result) {
  try {
    const response = await fetch("/api/explanation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead, result }) });
    if (!response.ok) return;
    const data = await response.json();
    const heading = [...results.querySelectorAll("h3")].find((item) => item.textContent === "Scoring explanation");
    if (heading && data.explanation) heading.nextElementSibling.textContent = data.explanation;
  } catch {
    // The deterministic explanation already rendered is the offline fallback.
  }
}

function readForm() {
  return Object.fromEntries(new FormData(form).entries());
}

function fillForm(lead) {
  Object.entries(lead).forEach(([name, value]) => {
    const field = form.elements[name];
    if (field) field.value = value;
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  render(readForm());
});
sampleButton.addEventListener("click", () => {
  fillForm(sampleLead);
  render(sampleLead);
});
