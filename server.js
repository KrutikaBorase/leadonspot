import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function localExplanation(lead, result) {
  const positives = result.positiveFactors.length
    ? result.positiveFactors.join("; ")
    : "No strong positive signals were provided.";
  const negatives = result.negativeFactors.length
    ? result.negativeFactors.join("; ")
    : "No material risk signals were identified.";
  return `The lead scored ${result.score}/100 and is classified as ${result.classification}. ${result.qualityAssessment} The strongest positive signals are ${positives} The main gaps are ${negatives} ${result.recommendedNextAction}`;
}

async function createExplanation(lead, result) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return localExplanation(lead, result);

  const response = await fetch(process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You explain a deterministic sales lead score. Never change the score, classification, factors, or next action. Use two concise, human-sounding sentences."
        },
        {
          role: "user",
          content: JSON.stringify({ lead, result })
        }
      ]
    })
  });
  if (!response.ok) throw new Error(`LLM request failed with status ${response.status}`);
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim() || localExplanation(lead, result);
}

async function serveStatic(request, response) {
  const requestedPath = request.url === "/" ? "index.html" : request.url.slice(1).split("?")[0];
  const filePath = normalize(join(publicDir, requestedPath));
  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/explanation") {
    try {
      let raw = "";
      for await (const chunk of request) raw += chunk;
      const { lead, result } = JSON.parse(raw);
      const explanation = await createExplanation(lead, result);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ explanation }));
    } catch (error) {
      response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  if (request.method === "GET") return serveStatic(request, response);
  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`LeadOnSpot running at http://localhost:${port}`);
});
