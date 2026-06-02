import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
     const result = await model.generateContent("Hello");
     console.log("PRO LATEST WORKS:", result.response.text());
  } catch (e) {
     console.error("PRO LATEST ERROR:", e.message);
  }
}
run();
