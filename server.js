require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.json());

const MODELS = [
  { label: "A", model: "openrouter/free" },
  { label: "B", model: "openrouter/free" },
  { label: "C", model: "openrouter/free" },
];

async function callModel(model, prompt) {
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
    console.log("ERROR from model", model, ":", data);
    return "ERROR: could not get response from this model";
  }

  return data.choices[0].message.content;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function judgeOutputs(prompt, outputs) {
  const entries = Object.keys(outputs).map((label) => ({
    realLabel: label,
    text: outputs[label],
  }));

  const shuffled = shuffle(entries);
  const tempLabels = ["X", "Y", "Z"];
  const mapping = {};

  let judgeSections = "";
  shuffled.forEach((entry, i) => {
    const temp = tempLabels[i];
    mapping[temp] = entry.realLabel;
    judgeSections += `\nRESPONSE ${temp}:\n${entry.text}\n`;
  });

  const validTemps = shuffled.map((_, i) => tempLabels[i]);

  console.log("=== DEBUG: shuffle mapping (temp -> real) ===", mapping);

  const judgePrompt = `You are a neutral judge. Below is a user's question and ${validTemps.length} AI responses. Judge them purely on content quality — do not favor a response just because of its position. Rate each criterion from 1 to 5 for the best response overall, and decide which response is best.

QUESTION: ${prompt}
${judgeSections}
Reply with ONLY this JSON format, nothing else, using one of these exact labels for "winner": ${validTemps.join(", ")}
{"winner": "${validTemps[0]}", "reason": "short reason here", "ratings": {"accuracy": 4, "clarity": 5, "depth": 4, "relevance": 5, "completeness": 4}}`;

  const verdictText = await callModel("openrouter/free", judgePrompt);
  const cleaned = verdictText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
    if (!validTemps.includes(parsed.winner)) throw new Error("invalid winner label");
  } catch (e) {
    console.log("JUDGE PARSE FAILED, raw text:", verdictText);
    const randomTemp = validTemps[Math.floor(Math.random() * validTemps.length)];
    parsed = {
      winner: randomTemp,
      reason: "Could not parse judge response, picked randomly among valid options.",
      ratings: { accuracy: 4, clarity: 4, depth: 4, relevance: 4, completeness: 4 },
    };
  }

  if (!parsed.ratings) {
    parsed.ratings = { accuracy: 4, clarity: 4, depth: 4, relevance: 4, completeness: 4 };
  }

  console.log("=== DEBUG: judge picked temp label ===", parsed.winner);
  console.log("=== DEBUG: which maps to real model ===", mapping[parsed.winner]);

  return {
    winner: mapping[parsed.winner],
    reason: parsed.reason,
    ratings: parsed.ratings,
  };
}

app.post("/api/test", async (req, res) => {
  const userPrompt = req.body.prompt;

  const settled = await Promise.allSettled(
    MODELS.map((m) => callModel(m.model, userPrompt))
  );

  const outputsObj = {};
  settled.forEach((result, i) => {
    const label = MODELS[i].label;
    outputsObj[label] = result.status === "fulfilled" ? result.value : "ERROR: request failed";
  });

  const verdict = await judgeOutputs(userPrompt, outputsObj);

  const results = MODELS.map((m) => ({
    label: m.label,
    output: outputsObj[m.label],
  }));

  res.json({ results, verdict });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running here: http://localhost:${PORT}`);
});