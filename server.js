import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreLead } from "./src/scoring.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 3000);

try {
  const envFile = await readFile(join(root, ".env"), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function localExplanation(lead, result) {
  const positive = result.positiveFactors[0]?.replace(/\s*\(\+\d+\)$/, "").toLowerCase() || "limited qualification detail";
  const negative = result.negativeFactors[0]?.replace(/\s*\(-\d+\)$/, "").toLowerCase() || "no material gaps";
  return negative === "no material gaps"
    ? `This ${result.classification.toLowerCase()} lead scored ${result.score}/100, supported by ${positive}. No material qualification gaps were identified.`
    : `This ${result.classification.toLowerCase()} lead scored ${result.score}/100, supported by ${positive}. Improve the lead by addressing ${negative}.`;
}

async function createExplanation(lead, result) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { text: localExplanation(lead, result), provider: "Deterministic fallback" };
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 120,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            analysis: { type: "STRING", description: "Two complete concise sentences explaining the classification, one positive signal, and one gap." }
          },
          required: ["analysis"]
        }
      },
      contents: [{ role: "user", parts: [{ text: `You are a sales qualification analyst. Use only these supplied facts. Return JSON with one key named analysis. Its value must be exactly two complete, human-sounding sentences, maximum 45 words. Explain why the classification fits, mention one positive signal and one gap. Never change the score or invent facts.\n\nLead: ${JSON.stringify(lead)}\nComputed deterministic result: ${JSON.stringify(result)}` }] }]
    })
  });
  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
  const payload = await response.json();
  const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("").trim();
  let text;
  try {
    const jsonText = rawText?.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    text = JSON.parse(jsonText)?.analysis?.trim();
  } catch {
    text = "";
  }
  const wordCount = text?.split(/\s+/).filter(Boolean).length || 0;
  if (!text || wordCount < 15 || !/[.!?]$/.test(text)) return { text: localExplanation(lead, result), provider: "Deterministic fallback" };
  return { text, provider: "Gemini" };
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
  if (request.method === "POST" && (request.url === "/api/score" || request.url === "/api/explanation")) {
    try {
      let raw = "";
      for await (const chunk of request) raw += chunk;
      const body = JSON.parse(raw);
      if (!body.lead || typeof body.lead !== "object" || Array.isArray(body.lead)) throw new Error("A lead object is required");
      if (request.url === "/api/score") {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(scoreLead(body.lead)));
      } else {
        const explanation = await createExplanation(body.lead, body.result);
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ explanation: explanation.text, provider: explanation.provider }));
      }
    } catch (error) {
      response.writeHead(request.url === "/api/score" ? 400 : 502, { "Content-Type": "application/json; charset=utf-8" });
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
