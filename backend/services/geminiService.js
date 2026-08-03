import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import Cache from "../models/cache.js";
import axios from "axios";
import { chamarGroqDireto } from "./groqService.js";

let genAIInstance = null;

// ============================================================
// CACHE IN-MEMORY DE RESPOSTAS GEMINI (evita SELECT no MySQL por request)
// ============================================================
const _responseCache = new Map(); // key -> { data, expireAt }
const MAX_RESPONSE_CACHE_SIZE = 500; // Limita memória: máx 500 respostas em cache

function memCacheGet(key) {
  const entry = _responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    _responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function memCacheSet(key, data, ttlMs = 72 * 60 * 60 * 1000) {
  // Evict oldest entries if cache is full (simple FIFO)
  if (_responseCache.size >= MAX_RESPONSE_CACHE_SIZE) {
    const firstKey = _responseCache.keys().next().value;
    _responseCache.delete(firstKey);
  }
  _responseCache.set(key, { data, expireAt: Date.now() + ttlMs });
}

function getGenAI() {
  if (!genAIInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada no ambiente.");
    }
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAIInstance;
}

// Converte base64 de data:image/png;base64,... para formato do Gemini
function base64ToGenerativePart(base64Data) {
  const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Formato base64 inválido.");
  }
  return {
    inlineData: {
      data: matches[2],
      mimeType: matches[1]
    }
  };
}

async function executarChamadaGemini(messages, modelToUse, useSearchGrounding) {
  const genAI = getGenAI();

  // Extrair system prompt consolidando todas as mensagens com role === "system"
  const systemMessages = messages.filter(m => m.role === "system");
  const systemInstruction = systemMessages.length > 0
    ? systemMessages.map(m => m.content).join("\n\n")
    : undefined;

  // Formatar histórico para o Gemini
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => {
      let parts = [];
      if (Array.isArray(m.content)) {
        // Tratar conteúdo multimodal (Array do OpenAI/Groq)
        for (const item of m.content) {
          if (item.type === "text") {
            parts.push({ text: item.text });
          } else if (item.type === "image_url") {
            parts.push(base64ToGenerativePart(item.image_url.url));
          }
        }
      } else {
        parts.push({ text: String(m.content) });
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: parts,
      };
    });

  if (contents.length === 0) {
    throw new Error("Nenhuma mensagem do usuário/modelo encontrada para enviar à API do Gemini.");
  }

  const modelParams = { model: modelToUse };
  if (systemInstruction) {
    // Gemini 1.5 aceita systemInstruction na inicialização do modelo
    modelParams.systemInstruction = systemInstruction;
  }
  if (useSearchGrounding) {
    modelParams.tools = [{ googleSearch: {} }];
  }

  const model = genAI.getGenerativeModel(modelParams);

  const result = await model.generateContent({
    contents: contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      thinkingConfig: {
        thinkingBudget: 1024,
      },
    },
  });

  return result.response.text();
}

const openRouterGeminiMap = {
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-2.5-pro": "google/gemini-2.5-pro",
  "gemini-flash-latest": "google/gemini-2.5-flash",
  "gemini-pro-latest": "google/gemini-2.5-pro",
  "company": "google/gemini-2.5-flash",
  "reasoning": "google/gemini-2.5-pro",
  "deep-research": "google/gemini-2.5-pro",
};

async function chamarOpenRouterFallback(messages, modelToUse, cacheKey, onChunk = null) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("⚠️ [GEMINI OPENROUTER FALLBACK] OPENROUTER_API_KEY não configurada no ambiente.");
    return null;
  }

  const preferredModel = openRouterGeminiMap[modelToUse] || "google/gemini-2.5-flash";
  const modelsToTry = [
    preferredModel,
    "google/gemma-4-26b-a4b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free"
  ];

  const uniqueModels = [...new Set(modelsToTry)];

  const formattedMessages = messages.map(m => {
    if (Array.isArray(m.content)) {
      const textParts = m.content
        .filter(part => part.type === "text")
        .map(part => part.text)
        .join("\n");
      return { role: m.role, content: textParts };
    }
    return { role: m.role, content: String(m.content) };
  });

  let lastError = null;

  for (const model of uniqueModels) {
    console.log(`🔄 [GEMINI SERVICE] Tentando fallback via OpenRouter com o modelo: ${model}`);
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: model,
          messages: formattedMessages,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://juscore.net",
            "X-Title": "JusCore AI",
            "Content-Type": "application/json",
          },
          timeout: 25000
        }
      );

      const answer = response.data?.choices?.[0]?.message?.content;
      if (answer) {
        console.log(`✅ [GEMINI SERVICE] Resposta obtida com sucesso via OpenRouter Fallback (${model})`);
        
        if (onChunk) {
          onChunk(answer);
        }

        if (answer.length > 50) {
          memCacheSet(cacheKey, answer);
          Cache.upsert({
            key: cacheKey,
            data: answer,
            expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }).catch(() => null);
        }

        return answer;
      }
    } catch (error) {
      const status = error.response?.status;
      const dataStr = error.response ? JSON.stringify(error.response.data) : error.message;
      console.warn(`⚠️ [GEMINI SERVICE] Falha no OpenRouter com ${model} (Status ${status}): ${dataStr}. Tentando próximo modelo...`);
      lastError = error;
    }
  }

  console.error("❌ [GEMINI SERVICE] Todos os modelos de fallback da OpenRouter falharam.");
  return null;
}

async function chamarGroqFallback(messages, modelToUse, cacheKey, onChunk = null) {
  try {
    const modelMap = {
      "gemini-2.5-flash": "llama-3.3-70b-versatile",
      "gemini-2.5-pro": "llama-3.3-70b-versatile",
      "gemini-flash-latest": "llama-3.1-8b-instant",
      "gemini-pro-latest": "llama-3.3-70b-versatile",
      "company": "llama-3.3-70b-versatile",
      "reasoning": "llama-3.3-70b-versatile",
      "deep-research": "llama-3.3-70b-versatile",
    };

    const groqModel = modelMap[modelToUse] || "llama-3.3-70b-versatile";
    console.log(`🔄 [GEMINI SERVICE] Iniciando fallback secundário via Groq com o modelo: ${groqModel}`);
    
    const formattedMessages = messages.map(m => {
      if (Array.isArray(m.content)) {
        const textParts = m.content
          .filter(part => part.type === "text")
          .map(part => part.text)
          .join("\n");
        return { role: m.role, content: textParts };
      }
      return { role: m.role, content: String(m.content) };
    });

    const answer = await chamarGroqDireto(formattedMessages, groqModel);
    if (answer) {
      console.log(`✅ [GEMINI SERVICE] Resposta obtida com sucesso via Groq Fallback (${groqModel})`);
      if (onChunk) {
        onChunk(answer);
      }
      if (answer.length > 50) {
        memCacheSet(cacheKey, answer);
        Cache.upsert({
          key: cacheKey,
          data: answer,
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }).catch(() => null);
      }
      return answer;
    }
  } catch (error) {
    console.error(`❌ [GEMINI SERVICE] Erro ao chamar fallback do Groq:`, error.message);
  }
  return null;
}

export async function chamarGemini(messages, modelToUse = process.env.GEMINI_MODEL || "gemini-2.5-flash", useSearchGrounding = false) {
  // Garantir modelo padrão caso venha nulo/indefinido ou ID amigável do frontend
  const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const premiumModel = process.env.GEMINI_PREMIUM_MODEL || "gemini-2.5-pro";

  if (!modelToUse) {
    modelToUse = defaultModel;
  } else if (modelToUse === "company") {
    modelToUse = defaultModel;
  } else if (modelToUse === "reasoning") {
    modelToUse = premiumModel;
  } else if (modelToUse === "deep-research") {
    modelToUse = premiumModel;
  }

  // 1. Generate Cache Key using the originally requested model
  const messagesForHashing = messages.map(m => ({
    role: m.role,
    content: Array.isArray(m.content) ? JSON.stringify(m.content) : String(m.content)
  }));

  const messagesHash = crypto
    .createHash("md5")
    .update(JSON.stringify(messagesForHashing) + modelToUse + (useSearchGrounding ? "_search" : ""))
    .digest("hex");
  const cacheKey = `gemini_response_${messagesHash}`;

  // 2. Check in-memory cache (instant, no DB round-trip)
  let cachedResponse = memCacheGet(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  // 2.5. Check DB cache (fallback if not in L1)
  try {
    const cachedRecord = await Cache.findByPk(cacheKey);
    if (cachedRecord && new Date(cachedRecord.expireAt) > new Date()) {
      memCacheSet(cacheKey, cachedRecord.data);
      return cachedRecord.data;
    }
  } catch (err) {
    console.warn(`⚠️ [GEMINI SERVICE] Falha ao consultar cache do DB para ${cacheKey}: ${err.message}`);
  }

  // Definir array de fallbacks com base no tipo de modelo solicitado
  const isProRequested = modelToUse.includes("pro") || modelToUse.includes("research") || modelToUse.includes("reasoning");

  const modelsToTry = [modelToUse];
  if (isProRequested) {
    // Pro/Reasoning Fallback Chain: Original -> gemini-pro-latest -> gemini-flash-latest -> gemini-2.5-flash
    if (modelToUse !== "gemini-pro-latest") modelsToTry.push("gemini-pro-latest");
    modelsToTry.push("gemini-flash-latest");
    modelsToTry.push("gemini-2.5-flash");
  } else {
    // Flash/Default Fallback Chain: Original -> gemini-flash-latest -> gemini-2.5-flash
    if (modelToUse !== "gemini-flash-latest") modelsToTry.push("gemini-flash-latest");
    modelsToTry.push("gemini-2.5-flash");
  }

  let lastError = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`📡 [GEMINI] Chamando modelo: ${currentModel}...`);
      const answer = await executarChamadaGemini(messages, currentModel, useSearchGrounding);

      // 3. Save to in-memory cache + write-through to DB
      if (answer && answer.length > 50) {
        memCacheSet(cacheKey, answer);
        Cache.upsert({
          key: cacheKey,
          data: answer,
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }).catch(() => null);
      }


      return answer;
    } catch (err) {
      console.warn(`⚠️ [GEMINI SERVICE] Falha com o modelo ${currentModel}: ${err.message}. Tentando próximo fallback...`);
      lastError = err;
    }
  }

  // Fallback via OpenRouter caso todos os modelos locais falhem (ex: créditos esgotados)
  const openRouterAnswer = await chamarOpenRouterFallback(messages, modelToUse, cacheKey);
  if (openRouterAnswer) {
    return openRouterAnswer;
  }

  // Fallback via Groq caso até o OpenRouter falhe (ex: rate limits ou fora de saldo)
  const groqAnswer = await chamarGroqFallback(messages, modelToUse, cacheKey);
  if (groqAnswer) {
    return groqAnswer;
  }

  console.error("❌ [GEMINI SERVICE] Todos os modelos de fallback falharam.");
  throw new Error(lastError?.message || "Falha ao comunicar com os modelos Gemini.");
}

/**
 * Chamador da IA Principal com tratamento automático de Fallback e sinal de aborto.
 */
export async function chamarGeminiPrincipal(
  messages,
  modelPreference = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  abortSignal = null,
  useSearchGrounding = false,
) {
  if (abortSignal?.aborted) return "Requisição cancelada.";

  let modelToUse = modelPreference;



  try {
    const answer = await chamarGemini(messages, modelToUse, useSearchGrounding);
    return answer;
  } catch (err) {
    const errorMessage = err.message ? err.message.toLowerCase() : "";
    const isQuotaError = errorMessage.includes("429") || errorMessage.includes("exhausted") || errorMessage.includes("quota");

    if (isQuotaError) {
      console.warn(`⚠️ Erro de Cota/Rate Limit atingido no modelo ${modelToUse}. Tentando Fallback automático para gemini-2.5-flash com Search Grounding: ${useSearchGrounding}...`);
      try {
        const answerFallback = await chamarGemini(messages, "gemini-2.5-flash", useSearchGrounding);
        return answerFallback;
      } catch (fallbackErr) {
        console.error("❌ ERRO NO FALLBACK DA IA:", fallbackErr.message);
        throw new Error("Falha ao comunicar com modelo de Fallback");
      }
    }

    if (abortSignal?.aborted) {
      console.log("🛑 Requisição cancelada pelo usuário (AbortSignal).");
      return "Requisição cancelada.";
    }
    console.error("❌ ERRO NA CHAMADA DA IA:", err.message || err);
    throw new Error("Falha ao comunicar com modelo");
  }
}

/**
 * Executa a chamada do Gemini com suporte a streaming utilizando o SDK nativo do Google.
 */
async function executarChamadaGeminiStream(messages, modelToUse, useSearchGrounding, onChunk) {
  const genAI = getGenAI();

  // Extrair system prompt consolidando todas as mensagens com role === "system"
  const systemMessages = messages.filter(m => m.role === "system");
  const systemInstruction = systemMessages.length > 0
    ? systemMessages.map(m => m.content).join("\n\n")
    : undefined;

  // Formatar histórico para o Gemini
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => {
      let parts = [];
      if (Array.isArray(m.content)) {
        for (const item of m.content) {
          if (item.type === "text") {
            parts.push({ text: item.text });
          } else if (item.type === "image_url") {
            parts.push(base64ToGenerativePart(item.image_url.url));
          }
        }
      } else {
        parts.push({ text: String(m.content) });
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: parts,
      };
    });

  if (contents.length === 0) {
    throw new Error("Nenhuma mensagem do usuário/modelo encontrada para enviar à API do Gemini.");
  }

  const modelParams = { model: modelToUse };
  if (systemInstruction) {
    modelParams.systemInstruction = systemInstruction;
  }
  if (useSearchGrounding) {
    modelParams.tools = [{ googleSearch: {} }];
  }

  const model = genAI.getGenerativeModel(modelParams);

  const resultStream = await model.generateContentStream({
    contents: contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      thinkingConfig: {
        thinkingBudget: 1024,
      },
    },
  });
  let fullText = "";

  for await (const chunk of resultStream.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    if (onChunk) {
      onChunk(chunkText);
    }
  }

  return fullText;
}

/**
 * Chamar Gemini com fallback e suporte a cache para streaming.
 */
export async function chamarGeminiStream(
  messages,
  modelToUse = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  useSearchGrounding = false,
  onChunk = null
) {
  const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const premiumModel = process.env.GEMINI_PREMIUM_MODEL || "gemini-2.5-pro";

  if (!modelToUse) {
    modelToUse = defaultModel;
  } else if (modelToUse === "company") {
    modelToUse = defaultModel;
  } else if (modelToUse === "reasoning") {
    modelToUse = premiumModel;
  } else if (modelToUse === "deep-research") {
    modelToUse = premiumModel;
  }

  // 1. Generate Cache Key
  const messagesForHashing = messages.map(m => ({
    role: m.role,
    content: Array.isArray(m.content) ? JSON.stringify(m.content) : String(m.content)
  }));

  const messagesHash = crypto
    .createHash("md5")
    .update(JSON.stringify(messagesForHashing) + modelToUse + (useSearchGrounding ? "_search" : ""))
    .digest("hex");
  const cacheKey = `gemini_response_${messagesHash}`;

  // 2. Check in-memory cache (instant, no DB round-trip)
  let cachedResponse = memCacheGet(cacheKey);
  if (cachedResponse) {
    if (onChunk) {
      onChunk(cachedResponse);
    }
    return cachedResponse;
  }

  // 2.5. Check DB cache (fallback if not in L1)
  try {
    const cachedRecord = await Cache.findByPk(cacheKey);
    if (cachedRecord && new Date(cachedRecord.expireAt) > new Date()) {
      memCacheSet(cacheKey, cachedRecord.data);
      if (onChunk) {
        onChunk(cachedRecord.data);
      }
      return cachedRecord.data;
    }
  } catch (err) {
    console.warn(`⚠️ [GEMINI SERVICE STREAM] Falha ao consultar cache do DB para ${cacheKey}: ${err.message}`);
  }

  const isProRequested = modelToUse.includes("pro") || modelToUse.includes("research") || modelToUse.includes("reasoning");

  const modelsToTry = [modelToUse];
  if (isProRequested) {
    if (modelToUse !== "gemini-pro-latest") modelsToTry.push("gemini-pro-latest");
    modelsToTry.push("gemini-flash-latest");
    modelsToTry.push("gemini-2.5-flash");
  } else {
    if (modelToUse !== "gemini-flash-latest") modelsToTry.push("gemini-flash-latest");
    modelsToTry.push("gemini-2.5-flash");
  }

  let lastError = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`📡 [GEMINI STREAM] Chamando modelo: ${currentModel}...`);
      const answer = await executarChamadaGeminiStream(messages, currentModel, useSearchGrounding, onChunk);

      // 3. Save to in-memory cache + write-through to DB
      if (answer && answer.length > 50) {
        memCacheSet(cacheKey, answer);
        Cache.upsert({
          key: cacheKey,
          data: answer,
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }).catch(() => null);
      }


      return answer;
    } catch (err) {
      console.warn(`⚠️ [GEMINI SERVICE STREAM] Falha com o modelo ${currentModel}: ${err.message}. Tentando próximo fallback...`);
      lastError = err;
    }
  }

  // Fallback via OpenRouter caso todos os modelos locais falhem (ex: créditos esgotados)
  const openRouterAnswer = await chamarOpenRouterFallback(messages, modelToUse, cacheKey, onChunk);
  if (openRouterAnswer) {
    return openRouterAnswer;
  }

  // Fallback via Groq caso até o OpenRouter falhe (ex: rate limits ou fora de saldo)
  const groqAnswer = await chamarGroqFallback(messages, modelToUse, cacheKey, onChunk);
  if (groqAnswer) {
    return groqAnswer;
  }

  console.error("❌ [GEMINI SERVICE STREAM] Todos os modelos de fallback falharam.");
  throw new Error(lastError?.message || "Falha ao comunicar com os modelos Gemini.");
}

/**
 * Chamador da IA Principal em tempo real com fallback automático, sinal de aborto e callback de streaming.
 */
export async function chamarGeminiPrincipalStream(
  messages,
  modelPreference = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  abortSignal = null,
  useSearchGrounding = false,
  onChunk = null,
) {
  if (abortSignal?.aborted) return "Requisição cancelada.";

  let modelToUse = modelPreference;



  try {
    const answer = await chamarGeminiStream(messages, modelToUse, useSearchGrounding, onChunk);
    return answer;
  } catch (err) {
    const errorMessage = err.message ? err.message.toLowerCase() : "";
    const isQuotaError = errorMessage.includes("429") || errorMessage.includes("exhausted") || errorMessage.includes("quota");

    if (isQuotaError) {
      console.warn(`⚠️ Erro de Cota atingido (Stream) no modelo ${modelToUse}. Tentando Fallback para gemini-2.5-flash...`);
      try {
        const answerFallback = await chamarGeminiStream(messages, "gemini-2.5-flash", useSearchGrounding, onChunk);
        return answerFallback;
      } catch (fallbackErr) {
        console.error("❌ ERRO NO FALLBACK DA IA (STREAM):", fallbackErr.message);
        throw new Error("Falha ao comunicar com modelo de Fallback");
      }
    }

    if (abortSignal?.aborted) {
      console.log("🛑 Requisição cancelada pelo usuário (AbortSignal).");
      return "Requisição cancelada.";
    }
    console.error("❌ ERRO NA CHAMADA DA IA (STREAM):", err.message || err);
    throw new Error("Falha ao comunicar com modelo");
  }
}

