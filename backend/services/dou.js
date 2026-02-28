import axios from "axios";
import * as cheerio from "cheerio";
import Cache from "../models/cache.js";
import { sleep } from "../utils/delay.js";

export async function buscarDOU(options) {
  try {
    let termo = "*";
    let secao = "all";
    let dateFrom = "";
    let dateTo = "";

    let force = false;

    if (typeof options === "string") {
      termo = options;
    } else if (typeof options === "object") {
      termo = options.termo || "*";
      secao = options.secao || "all";
      dateFrom = options.dateFrom || "";
      dateTo = options.dateTo || "";
      force = options.force || false;
    }

    let url = `https://www.in.gov.br/consulta/-/buscar/dou?q=${encodeURIComponent(termo)}&s=${secao}`;

    if (dateFrom && dateTo) {
      // Ensure dates are YYYY-MM-DD (ISO)
      // Analyzed from HTML source: publishFrom=2026-02-15
      const formatDate = (d) => {
        if (!d) return "";
        if (d.match(/^\d{4}-\d{2}-\d{2}$/)) return d; // Already ISO
        if (d.match(/^\d{2}[\/-]\d{2}[\/-]\d{4}$/)) {
          const parts = d.split(/[\/-]/); // Split by / or -
          return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
        }
        return d;
      };

      const fromISO = formatDate(dateFrom);
      const toISO = formatDate(dateTo);

      url += `&exactDate=personalizado&publishFrom=${fromISO}&publishTo=${toISO}`;
    }

    // 1. Check Cache
    const cacheKey = `dou_${termo}_${secao}_${dateFrom}_${dateTo}`;
    const cached = await Cache.findByPk(cacheKey);
    if (cached && !force && new Date(cached.expireAt) > new Date()) {
      console.log("📦 Returning from cache (DOU):", termo, secao);
      return cached.data;
    }

    // 2. Artificial Delay (1-3s)
    console.log("🌐 Fetching from external (DOU):", url);
    await sleep(Math.floor(Math.random() * 2000) + 1000);

    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(res.data);
    const resultados = [];

    $(".resultado-busca, .resultados-pesquisa li").each((_, el) => {
      const a = $(el).find("a").first();
      const titulo = a.text().trim();
      const href = a.attr("href");
      const data =
        $(el).find(".data").text().trim() || $(el).find(".date").text().trim();

      if (titulo && href) {
        resultados.push({
          titulo,
          link: href.startsWith("http") ? href : `https://www.in.gov.br${href}`,
          data: data || "data não informada",
        });
      }
    });

    const finalResult = resultados.slice(0, 8); // Increased to 8 for more coverage
    console.log(`🔍 Encontrados ${finalResult.length} resultados no DOU.`);

    // 3. Save to Cache
    if (finalResult.length > 0) {
      try {
        await Cache.destroy({ where: { key: cacheKey } }); // Ensure clean slate
        await Cache.create({
          key: cacheKey,
          data: finalResult,
          expireAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        });
      } catch (cacheErr) {
        console.warn(
          "⚠️ Erro ao salvar no cache (ignorado):",
          cacheErr.message,
        );
      }
    } else {
      console.warn(
        "⚠️ Nenhum resultado encontrado. Não validando cache para evitar falso negativo persistente.",
      );
    }

    return finalResult;
  } catch (err) {
    console.warn("Erro ao consultar o DOU:", err.message);
    return [];
  }
}

export async function lerConteudoDOU(url) {
  if (!url) return null;
  try {
    const cacheKey = `dou_content_${url}`;
    const cached = await Cache.findByPk(cacheKey);
    if (cached && new Date(cached.expireAt) > new Date()) return cached.data;

    console.log(`📖 Lendo conteúdo DOU: ${url}`);
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(res.data);
    // Tenta pegar o conteudo principal (classes comuns no IN.gov.br)
    let texto =
      $(".texto-dou").text() ||
      $(".materia-conteudo").text() ||
      $("body").text();

    texto = texto.replace(/\s+/g, " ").trim().slice(0, 8000); // Limite de caracteres

    await Cache.create({
      key: cacheKey,
      data: texto,
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    });

    return texto;
  } catch (err) {
    console.warn("Erro ao ler conteúdo do DOU:", err.message);
    return null;
  }
}
