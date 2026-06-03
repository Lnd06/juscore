import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import Cache from "../models/cache.js";

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

function memCacheSet(key, data, ttlMs = 24 * 60 * 60 * 1000) {
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
    },
  });

  return result.response.text();
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

