import { buscarDOU, lerConteudoDOU } from "./dou.js";
import { leituraPlanalto } from "./planalto.js";
import { buscarNaBiblioteca, buscarPorCategoria } from "./ragService.js";

/**
 * Agrega contextos externos em tempo real (RAG Biblioteca, DOU e Planalto)
 * baseados nos termos de busca e intenção do usuário.
 * 
 * @param {object} params
 * @param {string} params.mensagem - Mensagem enviada pelo usuário.
 * @param {object} params.analise - Análise de intenção e contexto da mensagem.
 * @param {string} params.model - O modelo final resolvido para a requisição.
 * @param {boolean} params.isVisionContext - Indica se a requisição envolve análise visual (imagens).
 * @param {boolean} params.isDeepResearchModel - Indica se é uma chamada com Deep Research ativo.
 * @param {function} [params.cancelledCheck] - Callback opcional para verificar se o cliente se desconectou.
 * @returns {Promise<{contextoPlanalto: string, atosDOU: Array, contextoDOU: string, contextoBiblioteca: string, aborted?: boolean}>}
 */
export async function obterContextoExterno({
  mensagem,
  analise,
  model,
  isVisionContext,
  isDeepResearchModel,
  cancelledCheck
}) {
  let contextoPlanalto = "";
  let atosDOU = [];
  let contextoDOU = "";
  let contextoBiblioteca = "";

  const dataAtual = new Date().toLocaleDateString("pt-BR");

  // Decidir o melhor termo de busca
  let termoParaBusca =
    analise.termoBusca ||
    (/lei|decreto|cf|constitui[çc][ãa]o/i.test(mensagem)
      ? "novas leis"
      : "destaques");
  if (termoParaBusca === "") termoParaBusca = "*";

  // 1. --- BUSCAR NA BIBLIOTECA (RAG Lite) ---
  contextoBiblioteca = await buscarNaBiblioteca(termoParaBusca, mensagem, analise.precisaBiblioteca);

  // Injetar templates de modelos se o modo for document
  if (model === "document") {
    console.log("📄 [DOCUMENT MODO] Buscando modelos de documentos...");
    const modelosDocs = buscarPorCategoria("MODELO_DOCUMENTO", 3);
    if (modelosDocs.length > 0) {
      contextoBiblioteca += "\n\n📖 MODELOS DE DOCUMENTO DISPONÍVEIS (Use como inspiração):\n" +
        modelosDocs.map(d => `[Modelo: ${d.title}]\n${d.content}`).join("\n\n");
    }
  }

  // Se for Deep Research, pula as buscas tradicionais do DOU/Planalto (pois o Gemini faz busca por si só)
  if (isDeepResearchModel) {
    console.log("🚀 [DEEP RESEARCH] Pulando busca manual DOU/Planalto.");
    return {
      contextoPlanalto,
      atosDOU,
      contextoDOU,
      contextoBiblioteca
    };
  }

  // 2. --- BUSCAS CONCORRENTES EM FONTES EXTERNAS (DOU e Planalto) ---
  const keywordsDOU =
    /lei|decreto|cf|constitui[çc][ãa]o|art|hoje|atualiza[çc][ãa]o|not[íi]cia|noticias|di[áa]rio oficial|dou|planalto|recente|novidade|agora|m[êe]s|se[çss][ãa]o|per[íi]odo/i;
  const explicitDOURequest = /dou|di[áa]rio oficial/i.test(mensagem);

  const shouldSearchDOU = ((keywordsDOU.test(mensagem) && !isVisionContext) || explicitDOURequest);
  const shouldSearchPlanalto = (/\d+/.test(mensagem) || /cf|constitui[çc][ãa]o|lei/i.test(mensagem)) && (analise.termoBusca && analise.termoBusca.length > 2);

  const douTask = async () => {
    if (!shouldSearchDOU) return { atos: [], contexto: "" };

    console.log(
      `🔍 [REAL-TIME] Buscando DOU para: "${termoParaBusca}" na seção: "${analise.secaoDOU}" de ${analise.dataInicio || "hoje"} a ${analise.dataFim || "hoje"}`
    );

    try {
      const resultados = await buscarDOU({
        termo: termoParaBusca,
        secao: analise.secaoDOU,
        dateFrom: analise.dataInicio,
        dateTo: analise.dataFim,
      });

      let contexto = "";
      if (resultados?.length) {
        contexto = `NOTÍCIAS E ATUALIZAÇÕES EM TEMPO REAL (DOU Seção ${analise.secaoDOU} - ${dataAtual}):\n${resultados
          .map((a) => `- ${a.data} — ${a.titulo}\n  ${a.link}`)
          .join("\n")}`;

        // Se for busca por lei específica, tenta ler o conteúdo do primeiro resultado
        if (/lei|decreto|portaria/i.test(termoParaBusca)) {
          const artigoPrincipal = resultados[0];
          const subTermo = termoParaBusca
            .replace("lei ", "")
            .replace("decreto ", "")
            .split("/")[0]
            .toLowerCase();

          if (artigoPrincipal.titulo.toLowerCase().includes(subTermo)) {
            console.log(`📖 [REAL-TIME] Lendo conteúdo de: ${artigoPrincipal.titulo}`);
            const textoCompleto = await lerConteudoDOU(artigoPrincipal.link);
            if (textoCompleto) {
              contexto += `\n\n[CONTEÚDO COMPLETO DE: ${artigoPrincipal.titulo}]\n${textoCompleto}`;
            }
          }
        }
      } else {
        // Fallback para busca geral se não houver termos específicos
        const isBuscaEspecifica = analise.dataInicio || analise.dataFim || analise.secaoDOU !== "all";

        if (!isBuscaEspecifica) {
          console.log("🔍 [REAL-TIME] Busca geral vazia. Tentando 'atos hoje'...");
          const fallbackAtos = await buscarDOU("atos hoje");
          if (fallbackAtos?.length) {
            contexto = `NOTÍCIAS E ATUALIZAÇÕES EM TEMPO REAL (DOU - ${dataAtual}):\n${fallbackAtos
              .map((a) => `- ${a.data} — ${a.titulo}\n  ${a.link}`)
              .join("\n")}`;
          } else {
            contexto = `Não foi possível encontrar informações específicas no DOU para sua busca.`;
          }
        } else {
          console.log("🔍 [REAL-TIME] Busca específica retornou 0 resultados. Nenhum fallback aplicado.");
          contexto = `Não foi possível encontrar informações específicas no DOU para sua busca.`;
        }
      }

      return { atos: resultados || [], contexto };
    } catch (err) {
      console.warn("⚠️ Erro na tarefa concorrente do DOU:", err.message);
      return { atos: [], contexto: "Erro ao carregar informações do DOU." };
    }
  };

  const planaltoTask = async () => {
    if (!shouldSearchPlanalto) return "";

    console.log(`🔍 [REAL-TIME] Buscando Planalto para: "${analise.termoBusca}"`);
    try {
      const planalto = await leituraPlanalto(analise.termoBusca);
      if (planalto) {
        return `LEGISLAÇÃO ATUALIZADA (Planalto - ${dataAtual}):\n${planalto}`;
      }
    } catch (err) {
      console.warn("⚠️ Erro na tarefa concorrente do Planalto:", err.message);
    }
    return "";
  };

  // Verificação rápida de cancelamento do cliente antes de disparar promessas concorrentes
  if (cancelledCheck && cancelledCheck()) {
    console.log("⛔ CANCELADO - Parando antes de disparar buscas concorrentes.");
    return { contextoPlanalto, atosDOU, contextoDOU, contextoBiblioteca, aborted: true };
  }

  // Executar tarefas em paralelo
  const [douRes, planaltoRes] = await Promise.all([
    douTask(),
    planaltoTask(),
  ]);

  atosDOU = douRes.atos;
  contextoDOU = douRes.contexto;
  contextoPlanalto = planaltoRes;

  return {
    contextoPlanalto,
    atosDOU,
    contextoDOU,
    contextoBiblioteca
  };
}
