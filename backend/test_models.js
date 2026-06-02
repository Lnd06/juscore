import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
     const model = genAI.getGenerativeModel({ model: modelName });
     const result = await model.generateContent("Hello");
     console.log(`✅ ${modelName} WORKS:`, result.response.text());
  } catch (e) {
     console.error(`❌ ${modelName} ERROR:`, e.message);
  }
}

async function run() {
  await testModel("gemini-2.5-flash");
  await testModel("gemini-2.5-pro");
  await testModel("gemini-2.0-flash");
  await testModel("gemini-2.0-flash-lite");
}
run();
