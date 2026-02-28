import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  console.log("🚀 Testing Llama 4 Scout (Text Only)...");
  try {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content:
            "Explain why fast inference is critical for reasoning models",
        },
      ],
    });
    console.log(
      "✅ Model responded (Text):",
      completion.choices[0]?.message?.content?.slice(0, 100) + "...",
    );
  } catch (err) {
    console.error("❌ Text Test Failed:", err.message);
  }

  console.log("\n🚀 Testing Llama 4 Scout (Vision)...");
  try {
    const fs = await import("fs");
    const imagePath = path.join(
      __dirname,
      "../uploads/profiles/1771265679127-161085542.jpg",
    );
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is this?" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });
    console.log(
      "✅ Model responded (Vision):",
      completion.choices[0]?.message?.content?.slice(0, 100) + "...",
    );
  } catch (err) {
    console.error("❌ Vision Test Failed:", err.message);
  }
}

main().catch(console.error);
