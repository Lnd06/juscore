import { chamarGeminiPrincipal } from "./geminiService.js";
import { anonymizeText, deanonymizeText } from "./anonymizerService.js";

/**
 * Resume um movimento processual usando IA (Gemini) de forma confiável e livre de alucinações.
 * 
 * @param {object} processData - Dados do processo
 * @param {string} rawMovement - Texto bruto do último movimento judicial
 * @returns {Promise<{lastMovement: string, aiSummary: string, nextSteps: string}>}
 */
export async function summarizeProcessMovement(processData, rawMovement) {
  try {
    const systemPrompt = `Você é um analista jurídico especializado de altíssimo nível da plataforma JusCore AI.
Sua missão é ler os dados de um processo judicial brasileiro e o texto bruto da sua última movimentação e gerar três campos estruturados:
1. LAST_MOVEMENT (Uma descrição simplificada, humanizada e clara do que aconteceu nessa movimentação, ideal para o cliente do advogado entender).
2. SUMMARY (Um resumo técnico, preciso e resumido da situação do processo com base nesse movimento para o advogado).
3. NEXT_STEPS (Passos de ação práticos, prazos típicos aplicáveis ou sugestões estratégicas para o advogado).

REGRAS DE SEGURANÇA E CONFIABILIDADE (FATOR ALUCINAÇÃO ZERO):
- Se o movimento bruto não der informações suficientes para um passo específico, NÃO invente prazos ou decisões.
- Use um tom profissional, seguro e objetivo.
- Não alucine links, nomes de juízes ou leis que não sejam estritamente referenciados no movimento ou universalmente aplicáveis (ex: prazo geral de apelação).
- Se a movimentação for muito curta ou inconclusiva (ex: "Mero Expediente"), explique isso de forma elegante.

Você DEVE responder seguindo EXATAMENTE este formato de marcação:
---LAST_MOVEMENT---
[Conteúdo aqui]
---SUMMARY---
[Conteúdo aqui]
---NEXT_STEPS---
[Conteúdo aqui]`;

    const userContent = `Dados do Processo:
- Número: ${processData.numero}
- Tribunal: ${processData.tribunal}
- Vara: ${processData.vara}
- Comarca: ${processData.comarca}
- Fase: ${processData.fase}
- Partes: Autor - ${processData.partes?.autor || "Não especificado"}, Réu - ${processData.partes?.reu || "Não especificado"}
- Observações anteriores: ${processData.observacoes || ""}

Texto bruto do último movimento/andamento judicial:
"${rawMovement}"`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ];

    console.log(`🧠 [PROCESS SUMMARIZER] Solicitando IA para o processo ${processData.numero}...`);
    
    // Anonimizar todas as mensagens enviadas para a IA (Privacidade Total & LGPD Compliance)
    const combinedMapping = {};
    const anonymizedMessages = messages.map(msg => {
      const { anonymizedText, mapping } = anonymizeText(msg.content);
      Object.assign(combinedMapping, mapping);
      return { ...msg, content: anonymizedText };
    });

    // Roteando para o Gemini principal usando o modelo padrão rápido e confiável (gemini-2.5-flash)
    const responseTextRaw = await chamarGeminiPrincipal(anonymizedMessages, "gemini-2.5-flash");
    
    // Desanonimizar a resposta da IA para restaurar dados reais
    const responseText = deanonymizeText(responseTextRaw, combinedMapping);

    // Parsing dos resultados com fallback seguro
    let lastMovement = "Andamento processual registrado.";
    let aiSummary = "Análise automática em andamento.";
    let nextSteps = "Acompanhar novos andamentos.";

    if (responseText) {
      const matchLast = responseText.match(/---LAST_MOVEMENT---([\s\S]*?)---SUMMARY---/i);
      const matchSum = responseText.match(/---SUMMARY---([\s\S]*?)---NEXT_STEPS---/i);
      const matchSteps = responseText.match(/---NEXT_STEPS---([\s\S]*)/i);

      if (matchLast && matchLast[1]) lastMovement = matchLast[1].trim();
      if (matchSum && matchSum[1]) aiSummary = matchSum[1].trim();
      if (matchSteps && matchSteps[1]) nextSteps = matchSteps[1].trim();
      
      // Fallback secundário se o formato não vier certinho
      if (!matchLast && responseText.includes("---")) {
        // Tentar split mais bruto
        const parts = responseText.split(/---[A-Z_]+---/);
        if (parts.length >= 4) {
          lastMovement = parts[1].trim();
          aiSummary = parts[2].trim();
          nextSteps = parts[3].trim();
        }
      }
    }

    return {
      lastMovement,
      aiSummary,
      nextSteps
    };
  } catch (error) {
    console.error("❌ [PROCESS SUMMARIZER] Erro ao resumir andamento:", error);
    return {
      lastMovement: "Erro ao carregar descrição simplificada do movimento.",
      aiSummary: "Não foi possível gerar a análise por IA neste momento.",
      nextSteps: "Acessar o portal do Tribunal correspondente para verificar a movimentação oficial."
    };
  }
}
