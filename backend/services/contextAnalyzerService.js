/**
 * contextAnalyzerService.js
 * Serviço de análise de contexto local — extrai intenção, tópico e parâmetros de busca.
 * Otimizado com algoritmos estáticos locais via Regex de custo zero e latência zero.
 */

/**
 * Analisa localmente a mensagem do usuário e retorna metadados de contexto.
 * Função síncrona — todo o processamento é baseado em regex/string local.
 * @param {string} mensagem - Mensagem do usuário.
 * @param {Array} historico - Histórico da conversa para herança de contexto.
 * @returns {object} - Objeto com topico, sentimento, termoBusca, etc.
 */
export function analisarContexto(mensagem, historico = []) {
  try {
    const rawMessage = mensagem || "";
    const cleanMsg = rawMessage.toLowerCase().trim();

    // 1. Determinar Seção do DOU
    let secaoDOU = "all";
    const secaoMatch = cleanMsg.match(/se[çss][ãa]o\s+([1-3])/i);
    if (secaoMatch) {
      secaoDOU = "do" + secaoMatch[1];
    }

    // 2. Extrair Período / Datas (DD-MM-YYYY ou DD/MM/YYYY)
    const dateMatches = rawMessage.match(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/g) || [];
    const dataInicio = dateMatches[0] ? dateMatches[0].replace(/\//g, "-") : "";
    const dataFim = dateMatches[1] ? dateMatches[1].replace(/\//g, "-") : "";

    // 3. Determinar se precisa de busca na Biblioteca (RAG)
    let precisaBiblioteca = /lei|art|decreto|jurisprud[êe]ncia|tribunal|c[óo]digo|s[úu]mula|cf|constitui[çc][ãa]o|contrato|processo|peti[çc][ãa]o|agravo|recurso|oab|tcc/i.test(cleanMsg);

    // 4. Extrair Termo de Busca Jurídica
    let termoBusca = "";
    const patternMatch = rawMessage.match(/(?:lei|decreto|portaria|artigo|art\.?|s[úu]mula|resolu[çc][ãa]o|medida\s+provis[óo]ria|mp)\s+\d+[\d./-]*/i);
    if (patternMatch) {
      termoBusca = patternMatch[0];
    } else {
      // Buscar termos chaves populares
      const termosJuridicos = [
        "habeas corpus", "pl das bets", "bets", "lei felca", 
        "reforma tributária", "aliena[çc][ãa]o parental", "lgpd", 
        "c[óo]digo civil", "clt", "c[óo]digo de defesa do consumidor", "cdc"
      ];
      for (const termo of termosJuridicos) {
        const regex = new RegExp(termo.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), "i");
        if (regex.test(cleanMsg.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
          termoBusca = termo;
          break;
        }
      }
    }

    // Se ainda não encontrou e for necessário buscar na biblioteca, extraímos substantivos relevantes da mensagem
    if (!termoBusca && precisaBiblioteca) {
      const palavrasIgnoradas = ["o", "a", "os", "as", "de", "do", "da", "em", "para", "sobre", "como", "me", "fale", "explique", "quais", "qual", "um", "uma", "tudo", "sobre", "sobre o", "sobre a", "Bets", "Bets..."];
      const palavras = cleanMsg
        .replace(/[.,?/#!$%^&*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(p => p.length > 3 && !palavrasIgnoradas.includes(p));
      if (palavras.length > 0) {
        termoBusca = palavras.slice(0, 3).join(" ");
      }
    }

    // --- ALGORITMO INTELIGENTE DE HERANÇA DE CONTEXTO ---
    // Se o termo de busca estiver vazio, ou for uma pergunta de continuação (com pronomes ou muito curta),
    // nós herdamos o contexto da conversa anterior para evitar alucinações e perda do RAG.
    const isContinuation = /^(o\s+que\s+isso|explic|detalh|me\s+fale|qual\s+o\s+prazo|quais\s+os\s+requisitos|e\s+quanto\s+a|sobre\s+ele|sobre\s+ela|dela|dele|disso|desse|desse\s+artigo|citado|mencionado|anterior|o\s+que\s+significa|e\s+o\s+que\s+mais|e\s+sobre|e\s+o\s+prazo|prazo|como\s+funciona|e\s+no\s+caso|no\s+caso\s+dele|no\s+caso\s+dela|quais\s+s[ãa]o)/i.test(cleanMsg) || cleanMsg.length < 25;

    if ((!termoBusca || isContinuation) && Array.isArray(historico) && historico.length > 0) {
      
      // Exclui a própria mensagem atual se ela já estiver no final do histórico
      const cleanHistorico = historico.filter(m => {
        const textContent = Array.isArray(m.content)
          ? m.content.find(c => c.type === "text")?.text || ""
          : String(m.content);
        return textContent.toLowerCase().trim() !== cleanMsg;
      });

      // Busca regressivamente pelo último termo de busca forte nos blocos de mensagens anteriores
      for (let i = cleanHistorico.length - 1; i >= 0; i--) {
        const prevMsg = cleanHistorico[i];
        const textContent = Array.isArray(prevMsg.content)
          ? prevMsg.content.find(c => c.type === "text")?.text || ""
          : String(prevMsg.content);

        const cleanPrev = textContent.toLowerCase().trim();

        // 1. Checa por menções explícitas de lei ou termos fortes na mensagem anterior
        const prevPattern = textContent.match(/(?:lei|decreto|portaria|artigo|art\.?|s[úu]mula|resolu[çc][ãa]o|medida\s+provis[óo]ria|mp)\s+\d+[\d./-]*/i);
        let prevTerm = "";
        if (prevPattern) {
          prevTerm = prevPattern[0].trim();
        } else {
          const termosJuridicos = [
            "habeas corpus", "pl das bets", "bets", "lei felca", 
            "reforma tributária", "aliena[çc][ãa]o parental", "lgpd", 
            "c[óo]digo civil", "clt", "c[óo]digo de defesa do consumidor", "cdc"
          ];
          for (const termo of termosJuridicos) {
            const regex = new RegExp(termo.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), "i");
            if (regex.test(cleanPrev.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
              prevTerm = termo;
              break;
            }
          }
        }

        // Se encontrou um termo forte anterior, herda ele!
        if (prevTerm) {
          console.log(`🎯 [CONTEXTO INTEGRADO] Herdado termo de busca da conversa anterior: "${prevTerm}"`);
          termoBusca = prevTerm;
          precisaBiblioteca = true;
          break;
        }

        // 2. Se for uma mensagem curta e não tem termo explícito, mas o substantivo de busca da mensagem do usuário anterior é forte
        if (prevMsg.role === "user" && cleanPrev.length > 15) {
          const palavrasIgnoradas = ["o", "a", "os", "as", "de", "do", "da", "em", "para", "sobre", "como", "me", "fale", "explique", "quais", "qual", "um", "uma", "tudo", "sobre", "sobre o", "sobre a", "Bets", "Bets..."];
          const palavras = cleanPrev
            .replace(/[.,?/#!$%^&*;:{}=\-_`~()]/g, "")
            .split(/\s+/)
            .filter(p => p.length > 4 && !palavrasIgnoradas.includes(p));
          
          if (palavras.length > 0) {
            const candidateTerm = palavras.slice(0, 3).join(" ");
            console.log(`🎯 [CONTEXTO INTEGRADO] Herdado termo aproximado do histórico: "${candidateTerm}"`);
            termoBusca = candidateTerm;
            precisaBiblioteca = true;
            break;
          }
        }
      }
    }

    const result = {
      termoBusca: termoBusca.trim(),
      precisaBiblioteca,
      secaoDOU,
      dataInicio,
      dataFim,
    };

    return result;
  } catch (err) {
    console.error("❌ Erro ao analisar contexto local:", err);
    return {
      termoBusca: "",
      precisaBiblioteca: false,
      secaoDOU: "all",
      dataInicio: "",
      dataFim: "",
    };
  }
}
