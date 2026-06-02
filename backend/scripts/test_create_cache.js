import { GoogleAICacheManager } from "@google/generative-ai/server";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY);
    
    // We need some text. 35000 tokens is roughly 140,000 chars.
    const longText = "This is a repeated sentence to fill up context space. ".repeat(3000); 

    const cacheResult = await cacheManager.create({
      model: "models/gemini-2.5-flash",
      displayName: "test-cache",
      contents: [
        {
          role: "user",
          parts: [{ text: longText }],
        },
      ],
      ttlSeconds: 300, // 5 mins
    });
    console.log("Cache created successfully:", cacheResult.name);

    await cacheManager.delete(cacheResult.name);
    console.log("Cache deleted.");
  } catch (e) {
    console.error("Error creating cache:", e.message);
  }
}
run();
