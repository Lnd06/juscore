import { Conversation } from "../models/index.js";

/**
 * Filtra e limpa a estrutura básica de mensagens.
 * 
 * @param {Array} messages 
 * @returns {Array}
 */
export function limparMensagens(messages) {
  return messages.map((m) => ({
    role: m.role,
    content: String(m.content),
  }));
}

/**
 * Formata os dados de um processo judicial vinculado e seu respectivo cliente
 * para injeção direta no prompt da IA.
 * 
 * @param {object} procData - Registro do banco do Processo (incluindo Client).
 * @returns {string}
 */
export function formatarProcessoVinculado(procData) {
  if (!procData) return "";

  let partesString = "";
  try {
    const partes =
      typeof procData.partes === "string"
        ? JSON.parse(procData.partes)
        : procData.partes;
    if (partes && typeof partes === "object") {
      Object.entries(partes).forEach(([polo, nomeDaParte]) => {
        partesString += `\n- ${polo}: ${nomeDaParte}`;
      });
    }
  } catch (e) {
    console.warn("⚠️ Erro ao fazer parse das partes do processo vinculado", e);
  }

  return `\nDADOS DO PROCESSO VINCULADO:\n- Número: ${procData.numero}\n- Tribunal/Vara: ${procData.tribunal} / ${procData.vara}\n- Status: ${procData.status}\n- Valor da Causa: R$ ${procData.valor_causa}\n\nPARTES DO PROCESSO:${partesString}\n\nDADOS DO CLIENTE VINCULADO (Seja cauteloso ao usar em peças reais):\n- Nome: ${procData.Client?.nome || "N/A"}\n- Documento: ${procData.Client?.cpf_cnpj || "N/A"}\n- Estado Civil: ${procData.Client?.estado_civil || "N/A"}\n- Profissão: ${procData.Client?.profissao || "N/A"}\n- Endereço: ${procData.Client?.endereco || "N/A"}`;
}

/**
 * Trunca o histórico de conversas para garantir limites seguros de memória e tokens (~1M de caracteres).
 * 
 * @param {Array} msgs - Histórico bruto de mensagens.
 * @returns {Array} - Histórico truncado seguro.
 */
export function recortarHistoricoSeguro(msgs) {
  const history = msgs.slice(-20);
  let charCount = 0;
  const safeHistory = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const contentStr = Array.isArray(msg.content)
      ? JSON.stringify(msg.content)
      : String(msg.content);

    if (safeHistory.length > 0 && charCount + contentStr.length > 1000000)
      break;

    charCount += contentStr.length;
    safeHistory.unshift(msg);
  }

  return safeHistory;
}

/**
 * Remove payloads Base64 de imagens antes de salvar o histórico no banco de dados,
 * evitando estouros de memória (OOM) e sobrecarga do MySQL.
 * 
 * @param {Array} msgs - Histórico de mensagens do chat.
 * @returns {Array} - Array de mensagens sanitizado para armazenamento seguro.
 */
export function sanitizarMensagensParaSalvar(msgs) {
  return msgs.map((m) => {
    if (Array.isArray(m.content)) {
      const textContent = m.content.find((c) => c.type === "text")?.text || "";
      return {
        role: m.role,
        content: "[IMAGEM ANEXADA PNE] " + textContent,
        model: m.model || undefined,
      };
    }
    return m;
  });
}

/**
 * Gerencia a lista de últimas conversas do usuário e remove fisicamente
 * as conversações antigas caso ultrapassem o limite de 15 conversas por conta.
 * 
 * @param {object} user - Registro do Usuário (Sequelize).
 * @param {number} userId - ID do Usuário.
 * @param {object} conversa - Registro da Conversa em questão.
 * @param {string} mensagem - Texto da última mensagem enviada pelo usuário.
 * @param {string} sessionId - ID da sessão da conversa.
 */
export async function gerenciarLimiteConversas(user, userId, conversa, mensagem, sessionId) {
  let ultimas = user.ultimasConversas || [];
  if (!Array.isArray(ultimas)) ultimas = [];

  // Remover duplicados pré-existentes da mesma sessão
  ultimas = ultimas.filter((u) => u.sessionId !== sessionId);

  ultimas.unshift({
    titulo: conversa.titulo,
    preview: mensagem.slice(0, 100),
    data: new Date(),
    sessionId,
  });

  const count = await Conversation.count({ where: { userId } });
  if (count > 15) {
    const oldest = await Conversation.findAll({
      where: { userId },
      order: [["createdAt", "ASC"]],
      limit: count - 15,
    });

    const idsToDelete = oldest.map((c) => c.id);
    const sessionIdsToDelete = oldest.map((c) => c.sessionId);

    await Conversation.destroy({ where: { id: idsToDelete } });
    console.log(
      `🧹 Limpeza: ${idsToDelete.length} conversas antigas removidas para o usuário ${userId}`
    );

    // Filtrar do array de visualização rápida do usuário
    ultimas = ultimas.filter(
      (u) => !sessionIdsToDelete.includes(u.sessionId)
    );
  }

  user.ultimasConversas = ultimas.slice(0, 15);
  user.changed("ultimasConversas", true);
  await user.save();
}
