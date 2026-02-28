import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import Groq from "groq-sdk";

async function listModels() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const models = await groq.models.list();
    console.log("Available Models:");
    models.data.forEach((m) => {
      console.log(`- ${m.id} (Owner: ${m.owned_by})`);
    });
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
