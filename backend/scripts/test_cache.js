import { GoogleAICacheManager } from "@google/generative-ai/server";
import dotenv from "dotenv";
dotenv.config();

const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY);
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(cacheManager)));
