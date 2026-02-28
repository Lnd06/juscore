/**
 * Serviço de Cálculos Financeiros Jurídicos
 * Fornece funções para cálculo de juros, correção monetária, honorários e prazos
 */

/**
 * Calcula juros simples ou compostos
 * @param {number} valor - Valor principal
 * @param {number} taxa - Taxa de juros (ex: 0.01 para 1%)
 * @param {number} meses - Número de meses
 * @param {string} tipo - 'simples' ou 'compostos'
 * @returns {Object} { valorFinal, juros, detalhamento }
 */
export function calcularJuros(valor, taxa, meses, tipo = "compostos") {
  const valorInicial = parseFloat(valor);
  let valorFinal;
  let juros;

  if (tipo === "simples") {
    juros = valorInicial * taxa * meses;
    valorFinal = valorInicial + juros;
  } else {
    // Juros compostos: M = C * (1 + i)^t
    valorFinal = valorInicial * Math.pow(1 + taxa, meses);
    juros = valorFinal - valorInicial;
  }

  return {
    valorInicial,
    valorFinal,
    juros,
    taxa,
    meses,
    tipo,
  };
}

/**
 * Calcula correção monetária aplicando índices mensais
 * @param {number} valor - Valor a corrigir
 * @param {Array} indices - Array de índices mensais (ex: [1.005, 1.003, ...])
 * @returns {Object} { valorOriginal, valorCorrigido, correcao, percentualTotal }
 */
export function calcularCorrecaoMonetaria(valor, indices) {
  const valorOriginal = parseFloat(valor);
  let valorCorrigido = valorOriginal;

  // Aplica cada índice sequencialmente
  indices.forEach((indice) => {
    valorCorrigido *= 1 + indice / 100;
  });

  const correcao = valorCorrigido - valorOriginal;
  const percentualTotal = (valorCorrigido / valorOriginal - 1) * 100;

  return {
    valorOriginal,
    valorCorrigido,
    correcao,
    percentualTotal,
    numeroIndices: indices.length,
  };
}

/**
 * Calcula honorários advocatícios
 * @param {number} valorCausa - Valor da causa
 * @param {number} percentual - Percentual dos honorários (10-20)
 * @param {number} exito - Se houve êxito (0-100%)
 * @returns {Object} { valorCausa, percentual, honorarios, honorariosExito }
 */
export function calcularHonorarios(valorCausa, percentual = 10, exito = 100) {
  const valor = parseFloat(valorCausa);
  const perc = parseFloat(percentual);
  const percentualExito = parseFloat(exito);

  const honorariosBase = (valor * perc) / 100;
  const honorariosExito = (honorariosBase * percentualExito) / 100;

  return {
    valorCausa: valor,
    percentual: perc,
    honorariosBase,
    percentualExito,
    honorariosExito,
    totalHonorarios: honorariosBase + honorariosExito,
  };
}

/**
 * Calcula prazo processual considerando apenas dias úteis
 * @param {Date} dataInicial - Data inicial
 * @param {number} dias - Número de dias úteis
 * @param {Array} feriados - Array de datas de feriados (opcional)
 * @returns {Object} { dataInicial, dataFinal, diasCorridos, diasUteis }
 */
export function calcularPrazo(dataInicial, dias, feriados = []) {
  const data = new Date(dataInicial);
  let diasAdicionados = 0;
  let diasCorridos = 0;

  while (diasAdicionados < dias) {
    data.setDate(data.getDate() + 1);
    diasCorridos++;

    // Verifica se não é fim de semana
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      continue; // Pula sábados e domingos
    }

    // Verifica se não é feriado
    const dataString = data.toISOString().split("T")[0];
    if (feriados.includes(dataString)) {
      continue;
    }

    diasAdicionados++;
  }

  return {
    dataInicial: new Date(dataInicial),
    dataFinal: new Date(data),
    diasUteis: dias,
    diasCorridos,
  };
}
