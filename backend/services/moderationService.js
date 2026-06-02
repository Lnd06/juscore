/**
 * moderationService.js
 * Serviço de moderação de conteúdo local — verifica se a mensagem viola políticas básicas.
 * Otimizado com Regex local de custo zero e latência zero.
 */

/**
 * Verifica localmente se uma mensagem viola as políticas de uso.
 * @param {string} mensagem - A mensagem do usuário.
 * @returns {Promise<string|null>} - Retorna o tipo de violação ou null se segura.
 */
export async function verificarPoliticas(mensagem) {
  console.log("🛡️ [START LOCAL] verificarPoliticas");
  try {
    const cleanMsg = (mensagem || "").toLowerCase().trim();

    // Lista local de palavras/termos suspeitos para moderação básica instantânea
    const selfHarmTerms = ["suicid", "me matar", "cortar pulso", "enforcar", "automutil"];
    const illegalTerms = ["comprar drogas", "vender cocaína", "como hackear", "criar vírus", "fazer bomba"];
    const hateSpeechTerms = ["macaco", "viadinho", "morte aos", "raça inferior"];

    for (const term of selfHarmTerms) {
      if (cleanMsg.includes(term)) {
        console.log(`🛡️ RESULTADO MODERAÇÃO LOCAL: "SELF_HARM" para: "${mensagem.slice(0, 30)}..."`);
        return "SELF_HARM";
      }
    }

    for (const term of illegalTerms) {
      if (cleanMsg.includes(term)) {
        console.log(`🛡️ RESULTADO MODERAÇÃO LOCAL: "ILLEGAL_CONTENT" para: "${mensagem.slice(0, 30)}..."`);
        return "ILLEGAL_CONTENT";
      }
    }

    for (const term of hateSpeechTerms) {
      if (cleanMsg.includes(term)) {
        console.log(`🛡️ RESULTADO MODERAÇÃO LOCAL: "HATE_SPEECH" para: "${mensagem.slice(0, 30)}..."`);
        return "HATE_SPEECH";
      }
    }

    console.log(`🛡️ RESULTADO MODERAÇÃO LOCAL: "SAFE" para: "${mensagem.slice(0, 30)}..."`);
    return null;
  } catch (err) {
    console.error("❌ ERRO CRÍTICO NA MODERAÇÃO LOCAL:", err.message);
    return null;
  }
}
