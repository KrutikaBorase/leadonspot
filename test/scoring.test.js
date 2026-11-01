import test from "node:test";
import assert from "node:assert/strict";
import { scoreLead } from "../src/scoring.js";

const completeLead = {
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

test("scores the sample lead consistently as hot", () => {
  const first = scoreLead(completeLead);
  const second = scoreLead(completeLead);
  assert.deepEqual(first, second);
  assert.equal(first.score, 100);
  assert.equal(first.classification, "Hot");
  assert.equal(first.confidence, "High");
  assert.equal(first.scoreBreakdown.reduce((total, item) => total + item.max, 0), 100);
  assert.equal(first.scoreBreakdown.reduce((total, item) => total + item.score, 0), first.score);
});

test("handles a sparse lead without throwing", () => {
  const result = scoreLead({ companyName: "Small Co" });
  assert.equal(result.score, 2);
  assert.equal(result.classification, "Cold");
  assert.equal(result.confidence, "Low");
  assert.ok(result.negativeFactors.length > 0);
  assert.equal(result.scoreBreakdown.length, 8);
});

test("a qualified but not decision-maker lead is warm", () => {
  const result = scoreLead({
    companyName: "Northstar",
    jobTitle: "Marketing Executive",
    industry: "SaaS",
    companySize: "101-500 Employees",
    leadSource: "Event",
    requirement: "Need pipeline reporting",
    email: "buyer@northstar.io",
    phone: "555-0100"
  });
  assert.equal(result.classification, "Warm");
  assert.equal(result.confidence, "Medium");
});
