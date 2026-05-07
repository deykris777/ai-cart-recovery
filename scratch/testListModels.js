require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModel() {
  // Just use a fetch instead to avoid sdk weirdness
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  if (!res.ok) {
    console.error("Fetch failed:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log("Models:");
  data.models.forEach(m => console.log(m.name));
}

testModel();
