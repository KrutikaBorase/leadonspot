const form = document.querySelector("#lead-form");
const results = document.querySelector("#results");
const sampleButton = document.querySelector("#sample-button");
const submitButton = document.querySelector("#submit-button");
const fieldCount = document.querySelector("#field-count");
const scoredFields = ["companyName", "website", "jobTitle", "industry", "companyLocation", "companySize", "leadSource", "requirement", "email", "phone"];

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

async function render(lead) {
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Analysing lead…";
  let result;
  try {
    const response = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead }) });
    if (!response.ok) throw new Error("Unable to calculate score");
    result = await response.json();
  } catch (error) {
    results.innerHTML = `<div class="empty-icon">!</div><h2>Could not score this lead</h2><p>${error.message}. Check that the app server is running and try again.</p>`;
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Calculate lead score";
    return;
  }
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
  if (result.positiveFactors.length) positives.push(...result.positiveFactors);
  if (result.negativeFactors.length) negatives.push(...result.negativeFactors);
  results.className = "card results-card";
  results.innerHTML = `<div class="score-header"><div><div class="score-number">${result.score}<small>/100</small></div><div class="muted">Confidence: ${result.confidence}</div></div><span class="badge ${result.classification.toLowerCase()}">${result.classification} lead</span></div>
    <div class="meter"><i style="width:${result.score}%"></i></div>
    <div class="result-section"><h3>Quality assessment</h3><p>${quality}</p></div>
    <div class="result-section"><h3>Positive signals</h3><ul class="factor-list">${positives.map((item) => `<li>${item}</li>`).join("") || "<li>None yet</li>"}</ul></div>
    <div class="result-section"><h3>Watch-outs</h3><ul class="factor-list negative">${negatives.map((item) => `<li>${item}</li>`).join("") || "<li>None identified</li>"}</ul></div>
    <div class="result-section"><h3>Recommended next action</h3><div class="next-action">${action}</div></div>
    <div class="result-section"><h3>Scoring explanation</h3><p>${result.scoringExplanation}</p></div>`;
  requestExplanation(lead, { ...result, qualityAssessment: quality, recommendedNextAction: action, positiveFactors: positives, negativeFactors: negatives });
  submitButton.disabled = false;
  submitButton.querySelector("span").textContent = "Recalculate score";
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

function updateFieldCount() {
  const lead = readForm();
  const count = scoredFields.filter((field) => lead[field]?.trim()).length;
  fieldCount.textContent = `${count} / 10 fields`;
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
form.addEventListener("input", updateFieldCount);
form.addEventListener("change", updateFieldCount);
sampleButton.addEventListener("click", () => {
  fillForm(sampleLead);
  render(sampleLead);
  updateFieldCount();
});
