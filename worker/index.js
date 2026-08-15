const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_QUESTION_LENGTH = 600;
const MAX_ANSWER_TOKENS = 240;

const PORTFOLIO_CONTEXT = `
You are PAKO, Neil's Portfolio Assistant.

You answer questions about Neil's professional portfolio.

Only use the information provided below.
Do not invent experience, employers, certifications, skills,
projects, or technologies.

If you don't know the answer, say:
"I don't have that information about Neil."

Be professional, friendly, and concise.
Refer to yourself only as PAKO. Do not claim to be Neil.

Neil is a Bachelor of Science in Information Technology graduate.

Technical skills:
- HTML
- CSS
- JavaScript
- React
- Angular
- Tailwind CSS
- Flutter
- Ionic
- Node.js
- Express.js
- Firebase
- PHP
- Python
- MySQL
- MongoDB
- SQLite

Projects:

HandyHome:
A household service booking platform connecting clients
with household service providers.
Technologies include React, Angular, Ionic, Node.js, and Firebase.

ParkBased:
A web-based parking reservation system.

MEETMYMEDIC:
An online hospital services platform.

EnergiX:
A real-time electricity monitoring and cost prediction system.

CARES:
An automotive repair and emergency services system.

Education:
Bachelor of Science in Information Technology
Batangas State University-TNEU Malvar Campus.
`;

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers
    }
  });
}

function getQuestion(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

async function handleAiRequest(request, env) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestOrigin) {
    return json({ error: "This request is not allowed from this site." }, 403);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "Please send a JSON request." }, 415);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Please send a valid question." }, 400);
  }

  const question = getQuestion(payload && payload.question);
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return json({ error: "Ask a question between 1 and 600 characters." }, 400);
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: PORTFOLIO_CONTEXT },
        { role: "user", content: question }
      ],
      max_tokens: MAX_ANSWER_TOKENS,
      temperature: 0.35
    });
    const answer = typeof result?.response === "string" ? result.response.trim() : "";

    if (!answer) {
      throw new Error("Workers AI returned an empty response.");
    }

    return json({ answer });
  } catch (error) {
    console.error("PAKO request failed:", error);
    return json({ error: "Sorry, I couldn't answer right now. Please try again shortly." }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ai") {
      return handleAiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
