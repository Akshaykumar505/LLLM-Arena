require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.json());

// Teen contestant models — 2 genuine providers (OpenAI, Google Gemini)
// + ek third free model (Claude ka koi free tier nahi hai kahi bhi)
const MODELS = [
  { label: "A", provider: "openrouter", model: "openai/gpt-oss-120b:free", name: "OpenAI (gpt-oss-120b)" },
  { label: "B", provider: "gemini", model: "gemini-flash-latest", name: "Google Gemini (latest)" },
  { label: "C", provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", name: "Meta Llama 3.3 70B" },
];

// ---- OpenRouter caller ----
async function callOpenRouter(model, prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();

  if (!data.choices) {
    console.log("ERROR from OpenRouter model", model, ":", data);
    return "ERROR: could not get response from this model";
  }

  return data.choices[0].message.content;
}

// ---- Google Gemini caller (direct API, not via OpenRouter) ----
async function callGemini(model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  const data = await response.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.log("ERROR from Gemini:", JSON.stringify(data));
    return "ERROR: could not get response from Gemini";
  }

  return text;
}

// ---- Router: calls the right provider based on model entry ----
async function callModel(entry, prompt) {
  if (entry.provider === "gemini") {
    return callGemini(entry.model, prompt);
  }
  return callOpenRouter(entry.model, prompt);
}

// ---- Evaluator: analyzes all 3 responses and SYNTHESIZES a new final answer ----
// (Does NOT just pick a winner — combines the strongest parts of each.)
async function synthesizeFinalAnswer(prompt, outputs) {
  const evaluatorPrompt = `You are an expert evaluator. A user asked a question, and three independent AI models each gave their own answer below. Your job is NOT to simply pick one of them. Instead:
1. Analyze all three responses.
2. Identify the strongest, most accurate, and clearest parts of each.
3. Write a new, refined final answer that combines the best elements — do not copy any single response verbatim.

QUESTION: ${prompt}

RESPONSE A: ${outputs.A}

RESPONSE B: ${outputs.B}

RESPONSE C: ${outputs.C}

Reply with ONLY this JSON format, nothing else:
{"finalAnswer": "the new synthesized answer here", "reasoning": "1-2 sentences on how you combined the responses", "ratings": {"accuracy": 4, "clarity": 5, "depth": 4, "relevance": 5, "completeness": 4}}`;

  const raw = await callGemini("gemini-flash-latest", evaluatorPrompt);
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.finalAnswer) throw new Error("missing finalAnswer");
    if (!parsed.ratings) {
      parsed.ratings = { accuracy: 4, clarity: 4, depth: 4, relevance: 4, completeness: 4 };
    }
    return parsed;
  } catch (e) {
    console.log("EVALUATOR PARSE FAILED, raw text:", raw);
    return {
      finalAnswer: outputs.A,
      reasoning: "Could not parse evaluator response; showing Model A's answer as a fallback.",
      ratings: { accuracy: 3, clarity: 3, depth: 3, relevance: 3, completeness: 3 },
    };
  }
}

app.post("/api/test", async (req, res) => {
  const userPrompt = req.body.prompt;

  const settled = await Promise.allSettled(
    MODELS.map((m) => callModel(m, userPrompt))
  );

  const outputsObj = {};
  settled.forEach((result, i) => {
    const label = MODELS[i].label;
    outputsObj[label] = result.status === "fulfilled" ? result.value : "ERROR: request failed";
  });

  const evaluation = await synthesizeFinalAnswer(userPrompt, outputsObj);

  const results = MODELS.map((m) => ({
    label: m.label,
    name: m.name,
    output: outputsObj[m.label],
  }));

  res.json({ results, evaluation });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running here: http://localhost:${PORT}`);
});