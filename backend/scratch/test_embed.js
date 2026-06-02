import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testEmbedding(modelName) {
  try {
    console.log(`⚡ Testando model: "${modelName}"...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.embedContent("Olá, mundo jurídico!");
    const values = result.embedding.values;
    console.log(`✅ Sucesso! Dimensões do vetor: ${values.length}`);
    return values.length;
  } catch(e) {
    console.error(`❌ Erro para "${modelName}":`, e.message);
    return null;
  }
}

async function main() {
  await testEmbedding("gemini-embedding-2");
  await testEmbedding("gemini-embedding-001");
}

main();
