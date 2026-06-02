import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const embeddingModels = data.models.filter(m => m.name.includes("embed") || m.name.includes("text"));
    console.log(embeddingModels.map(m => m.name));
  } catch(e) {
    console.error(e);
  }
}

listModels();
