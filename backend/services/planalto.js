import axios from "axios";
import Cache from "../models/cache.js";
import { sleep } from "../utils/delay.js";

const MAX_TEXTO = Number(process.env.MAX_TEXTO_PLANALTO) || 4000;

export async function leituraPlanalto(query) {
  try {
    let url = "";
    const q = query.toLowerCase();

    if (q.includes("cf") || q.includes("constituição")) {
      url =
        "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm";
    } else if (q.includes("decreto")) {
      const num = q.replace(/\\D/g, "");
      url = `https://www.planalto.gov.br/ccivil_03/decreto/d${num}.htm`;
    } else {
      const num = q.replace(/\\D/g, "");
      url = `https://www.planalto.gov.br/ccivil_03/leis/l${num}.htm`;
    }

    // 1. Check Cache
    const cacheKey = `planalto_${url}`;
    const cached = await Cache.findByPk(cacheKey);
    if (cached && new Date(cached.expireAt) > new Date()) {
      console.log("📦 Returning from cache:", url);
      return cached.data;
    }

    // 2. Artificial Delay (1-3s)
    console.log("🌐 Fetching from external:", url);
    await sleep(Math.floor(Math.random() * 2000) + 1000);

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    let texto = Buffer.from(res.data, "binary")
      .toString("latin1")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (texto.length > MAX_TEXTO) {
      texto = texto.slice(0, MAX_TEXTO) + "\\n[TEXTO TRUNCADO]";
    }

    // 3. Save to Cache
    await Cache.create({
      key: cacheKey,
      data: texto,
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return texto;
  } catch {
    return null;
  }
}
