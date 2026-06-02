/**
 * anonymizerService.js
 * Serviço de Anonimização e Desanonimização de dados pessoais sensíveis (LGPD Compliance)
 * Evita o vazamento de dados dos clientes (CPF, CNPJ, Email, Telefone) para APIs externas de IA.
 */

// Regex para padrões sensíveis comuns
const PATTERNS = {
  CPF: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  CNPJ: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
  EMAIL: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  TELEFONE: /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})\b/g,
};

/**
 * Anonimiza os dados sensíveis de uma string de texto, substituindo por tokens seguros.
 * Retorna o texto mascarado e o mapa de correspondências para desanonimização.
 * 
 * @param {string} text - Texto original
 * @returns {Object} { anonymizedText, mapping }
 */
export function anonymizeText(text) {
  if (typeof text !== "string") return { anonymizedText: text, mapping: {} };

  let anonymizedText = text;
  const mapping = {};
  let tokenCounter = 1;

  // Processar cada padrão
  for (const [key, regex] of Object.entries(PATTERNS)) {
    const matches = text.match(regex) || [];
    // Remover duplicados
    const uniqueMatches = [...new Set(matches)];

    for (const match of uniqueMatches) {
      // Ignora matches muito curtos
      if (!match || match.length < 5) continue;

      const token = `[${key}_ANONIMIZADO_${tokenCounter++}]`;
      mapping[token] = match;

      // Substitui todas as ocorrências do match pelo token
      anonymizedText = anonymizedText.split(match).join(token);
    }
  }

  return { anonymizedText, mapping };
}

/**
 * Restaura os dados reais no texto retornado pela IA utilizando o mapa de correspondências.
 * 
 * @param {string} text - Texto mascarado retornado pela IA
 * @param {Object} mapping - Mapa de correspondências { token: valorReal }
 * @returns {string} Texto desanonimizado
 */
export function deanonymizeText(text, mapping) {
  if (typeof text !== "string" || !mapping || Object.keys(mapping).length === 0) {
    return text;
  }

  let restoredText = text;
  for (const [token, realValue] of Object.entries(mapping)) {
    restoredText = restoredText.split(token).join(realValue);
  }

  return restoredText;
}
