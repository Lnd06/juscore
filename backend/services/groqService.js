import { Groq } from "groq-sdk";
import crypto from "crypto";
import Cache from "../models/cache.js";
import axios from "axios";

const openRouterModelMap = {
  "llama-3.1-8b-instant": "meta-llama/llama-3.1-8b-instruct:free",
  "llama-3.3-70b-versatile": "meta-llama/llama-3.3-70b-instruct:free",
  "mixtral-8x7b-32768": "mistralai/mixtral-8x7b-instruct:free",
  "llama-3.2-90b-vision-preview":
    "meta-llama/llama-3.2-90b-vision-instruct:free",
  "llama-3.1-70b-versatile": "meta-llama/llama-3.1-70b-instruct:free",
};

let groqInstance = null;

export async function getGroqClient() {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY não configurada");
    }

    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqInstance;
}

export async function chamarGroqDireto(
  messages,
  modelToUse = "llama-3.1-8b-instant",
) {
  // 1. Generate Cache Key
  const messagesHash = crypto
    .createHash("md5")
    .update(JSON.stringify(messages) + modelToUse)
    .digest("hex");
  const cacheKey = `llm_response_${messagesHash}`;

  try {
    // 2. Check Cache
    const cached = await Cache.findByPk(cacheKey);
    if (cached && new Date(cached.expireAt) > new Date()) {
      return cached.data;
    }

    const groq = await getGroqClient();

    // Prepare messages for Groq
    const formattedMessages = messages.map((m) => {
      if (Array.isArray(m.content)) {
        return { role: m.role, content: m.content };
      }
      return { role: m.role, content: String(m.content) };
    });

    const completion = await groq.chat.completions.create({
      model: modelToUse,
      temperature: 0.3,
      messages: formattedMessages,
    });

    const answer =
      completion.choices?.[0]?.message?.content || "Sem resposta do modelo.";

    // 3. Save to Cache (TTL 24h)
    if (answer && answer.length > 50) {
      await Cache.create({
        key: cacheKey,
        data: answer,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }).catch(() => null);
    }

    return answer;
  } catch (err) {
    const isRateLimitOrServerError =
      err.status === 429 ||
      err.status >= 500 ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT";

    if (isRateLimitOrServerError && process.env.OPENROUTER_API_KEY) {
      console.log(
        `🔄 GROQ SERVICE FALHOU (${err.status || err.code}). ATIVANDO FALLBACK (OPENROUTER)...`,
      );
      try {
        const fallbackModel =
          openRouterModelMap[modelToUse] ||
          "meta-llama/llama-3.1-8b-instruct:free";
        const payload = {
          model: fallbackModel,
          messages: messages.map((m) => ({
            role: m.role,
            content: String(m.content),
          })),
          temperature: 0.3,
        };

        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://juscore.ai",
              "X-Title": "JusCore AI",
              "Content-Type": "application/json",
            },
          },
        );

        const answer =
          response.data.choices?.[0]?.message?.content ||
          "Sem resposta do modelo fallback.";

        // Save to cache
        if (answer && answer.length > 50) {
          await Cache.create({
            key: cacheKey,
            data: answer,
            expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }).catch(() => null);
        }

        return answer;
      } catch (fallbackErr) {
        console.error(
          "❌ ERRO NO FALLBACK TOGETHER AI (SERVICE):",
          fallbackErr.message,
        );
        throw new Error("Falha ao comunicar com os modelos de IA");
      }
    }

    console.error("❌ ERRO GROQ SERVICE:", err.message);
    throw new Error("Falha ao comunicar com modelo");
  }
}
