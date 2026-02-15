const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");

// -------- GROK (chat) --------
const grokClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// -------- GEMINI (embeddings) --------
const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 🔹 Generate AI response (GROK)
async function generateResponse(messages) {
  // messages must be ARRAY of { role, content }

  const prompt = messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n")
    .slice(-12000); // safety limit

  console.log("\n🧠 GROK PROMPT ↓↓↓\n", prompt);

  const response = await grokClient.responses.create({
    model: "openai/gpt-oss-20b",
    input: prompt,
  });

  return response.output_text || "";
}

// 🔹 Generate embeddings (GEMINI)
async function generateVector(text) {
  if (!text || !text.trim()) return null;

  const response = await gemini.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: { outputDimensionality: 768 },
  });

  return response.embeddings[0].values;
}

module.exports = {
  generateResponse,
  generateVector,
};
