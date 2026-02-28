import express from "express";
import { auth } from "../midleware/auth.js";
import {
  calcularJuros,
  calcularCorrecaoMonetaria,
  calcularHonorarios,
  calcularPrazo,
} from "../services/financialCalculator.js";

const router = express.Router();

/**
 * POST /api/calculator/interest
 * Calcula juros simples ou compostos
 */
router.post("/interest", auth, async (req, res) => {
  try {
    const { valor, taxa, meses, tipo } = req.body;

    if (!valor || !taxa || !meses) {
      return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    const resultado = calcularJuros(valor, taxa, meses, tipo);
    res.json(resultado);
  } catch (error) {
    console.error("Erro no cálculo de juros:", error);
    res.status(500).json({ error: "Erro ao calcular juros" });
  }
});

/**
 * POST /api/calculator/correction
 * Calcula correção monetária
 */
router.post("/correction", auth, async (req, res) => {
  try {
    const { valor, indices } = req.body;

    if (!valor || !indices || !Array.isArray(indices)) {
      return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    const resultado = calcularCorrecaoMonetaria(valor, indices);
    res.json(resultado);
  } catch (error) {
    console.error("Erro no cálculo de correção:", error);
    res.status(500).json({ error: "Erro ao calcular correção monetária" });
  }
});

/**
 * POST /api/calculator/fees
 * Calcula honorários advocatícios
 */
router.post("/fees", auth, async (req, res) => {
  try {
    const { valorCausa, percentual, exito } = req.body;

    if (!valorCausa) {
      return res.status(400).json({ error: "Valor da causa é obrigatório" });
    }

    const resultado = calcularHonorarios(valorCausa, percentual, exito);
    res.json(resultado);
  } catch (error) {
    console.error("Erro no cálculo honorários:", error);
    res.status(500).json({ error: "Erro ao calcular honorários" });
  }
});

/**
 * POST /api/calculator/deadline
 * Calcula prazo processual
 */
router.post("/deadline", auth, async (req, res) => {
  try {
    const { dataInicial, dias, feriados } = req.body;

    if (!dataInicial || !dias) {
      return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    const resultado = calcularPrazo(dataInicial, dias, feriados);
    res.json(resultado);
  } catch (error) {
    console.error("Erro no cálculo de prazo:", error);
    res.status(500).json({ error: "Erro ao calcular prazo" });
  }
});

/* ============================================
   REAL-TIME ECONOMIC INDICES FROM BACEN API
   ============================================ */

// Cache to avoid hammering BACEN API (1 hour TTL)
let indicesCache = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// BACEN SGS series codes
const BACEN_SERIES = {
  selic: 432, // Taxa SELIC (meta) %a.a.
  inpc: 188, // INPC mensal
  ipca: 433, // IPCA mensal
  igpm: 189, // IGP-M mensal
  tr: 226, // TR mensal
  cdi: 4389, // CDI diário
  poupanca: 25, // Poupança mensal
};

async function fetchBacenSeries(seriesCode, lastN = 12) {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados/ultimos/${lastN}?formato=json`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro ao buscar série BACEN ${seriesCode}:`, error.message);
    return null;
  }
}

async function fetchAllIndices() {
  // Check cache first
  if (indicesCache.data && Date.now() - indicesCache.timestamp < CACHE_TTL) {
    return indicesCache.data;
  }

  console.log("[Calculator] Fetching real-time economic indices from BACEN...");

  const results = {};
  const promises = Object.entries(BACEN_SERIES).map(async ([key, code]) => {
    const data = await fetchBacenSeries(code, 13); // Last 13 months for 12m average
    if (data && data.length > 0) {
      const lastValue = parseFloat(data[data.length - 1].valor);
      const lastDate = data[data.length - 1].data;

      // Calculate 12-month average
      const values = data
        .map((d) => parseFloat(d.valor))
        .filter((v) => !isNaN(v));
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      // Calculate 12-month accumulated (multiplicative for indices)
      const accumulated = values.reduce((acc, v) => acc * (1 + v / 100), 1);
      const accumulatedPercent = (accumulated - 1) * 100;

      results[key] = {
        ultimo: lastValue,
        data: lastDate,
        media12m: parseFloat(avg.toFixed(4)),
        acumulado12m: parseFloat(accumulatedPercent.toFixed(4)),
        historico: data.map((d) => ({
          data: d.data,
          valor: parseFloat(d.valor),
        })),
      };
    }
  });

  await Promise.all(promises);

  // Add current minimum wage (2025)
  results.salarioMinimo = { valor: 1518.0, ano: 2025 };

  // FGTS rate is fixed at 8%
  results.fgts = { taxa: 8.0, multaRescisao: 40.0 };

  // Cache it
  indicesCache = { data: results, timestamp: Date.now() };
  console.log("[Calculator] Economic indices cached successfully");

  return results;
}

/**
 * GET /api/calculator/indices
 * Returns real-time economic indices from BACEN (authenticated)
 */
router.get("/indices", auth, async (req, res) => {
  try {
    const indices = await fetchAllIndices();
    res.json({
      success: true,
      atualizadoEm: new Date().toISOString(),
      cached: Date.now() - indicesCache.timestamp < 1000,
      indices,
    });
  } catch (error) {
    console.error("Erro ao buscar índices:", error);
    res.status(500).json({ error: "Erro ao buscar índices econômicos" });
  }
});

/**
 * GET /api/calculator/indices-public
 * Same but no auth required (for landing page demo)
 */
router.get("/indices-public", async (req, res) => {
  try {
    const indices = await fetchAllIndices();
    // Return limited data for public users
    const publicData = {};
    for (const [key, val] of Object.entries(indices)) {
      if (val.ultimo !== undefined) {
        publicData[key] = {
          ultimo: val.ultimo,
          data: val.data,
          acumulado12m: val.acumulado12m,
        };
      } else {
        publicData[key] = val;
      }
    }
    res.json({ success: true, indices: publicData });
  } catch (error) {
    console.error("Erro ao buscar índices públicos:", error);
    res.status(500).json({ error: "Erro ao buscar índices econômicos" });
  }
});

export default router;
