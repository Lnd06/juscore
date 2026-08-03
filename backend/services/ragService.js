import { getLibraryMetadata, getDocumentContent } from "./libraryService.js";
import { buscarContextoSemantico } from "./pineconeService.js";

/**
 * Busca documentos relevantes na Biblioteca Jurídica local usando busca semântica no Pinecone.
 * Possui mecanismo de fallback automático para busca clássica em RAM em caso de falha de rede/API.
 */
export async function buscarNaBiblioteca(termoParaBusca, mensagem, precisaBiblioteca) {
  try {
    const gatilhoManualBiblioteca =
      /buscar? na biblioteca|pesquisar? nos arquivos|consultar? vade mecum|segundo (meus|os) arquivos/i.test(
        mensagem,
      );

    const shouldSearch = (precisaBiblioteca || gatilhoManualBiblioteca) &&
                         termoParaBusca &&
                         termoParaBusca !== "*" &&
                         termoParaBusca.length > 2;

    if (!shouldSearch) return "";

    const allBooks = getLibraryMetadata();
    const activeBooks = allBooks.filter((book) => book.isActive === true);
    if (activeBooks.length === 0) return "";

    const activeIds = activeBooks.map(b => b.id);

    try {
      console.log(`📚 [RAG] Iniciando Busca Semântica no Pinecone para: "${mensagem.substring(0, 50)}..."`);
      
      // Tenta a busca vetorial semântica no Pinecone (limite otimizado para 2 documentos)
      const contextoSemantico = await buscarContextoSemantico(mensagem, activeIds, 2);
      if (contextoSemantico) {
        return contextoSemantico;
      }
      
      console.warn("⚠️ [RAG] Busca semântica retornou vazio. Acionando Fallback Local...");
    } catch (err) {
      console.error("❌ [RAG] Falha na busca semântica do Pinecone:", err.message);
      console.log("🔄 [RAG] Acionando Fallback Local em RAM...");
    }

    // =========================================================================
    // FALLBACK: BUSCA CLÁSSICA LOCAL EM RAM (evita interrupção do serviço)
    // =========================================================================
    try {
      const safeTerm = termoParaBusca.replace(/['"/\\]/g, "");
      const terms = safeTerm.toLowerCase().split(/\s+/).filter(t => t.length > 2);

      console.log(`📚 [RAG - FALLBACK] Buscando na RAM (FTS Lite): "${safeTerm}"`);

      const matchedMeta = activeBooks
        .filter((book) => {
          const titleLower = book.title.toLowerCase();
          const content = getDocumentContent(book.filename);
          const contentLower = content ? content.toLowerCase() : "";

          if (titleLower.includes(safeTerm.toLowerCase()) || contentLower.includes(safeTerm.toLowerCase())) {
            return true;
          }

          let matchCount = 0;
          for (const t of terms) {
            if (titleLower.includes(t) || contentLower.includes(t)) {
              matchCount++;
            }
          }
          return terms.length > 0 && matchCount >= Math.ceil(terms.length * 0.5);
        })
        .slice(0, 2);

      const books = matchedMeta.map((meta) => ({
        title: meta.title,
        content: getDocumentContent(meta.filename) || "",
      }));

      if (books.length > 0) {
        let contextoBiblioteca = `\n📚 CONTEXTO DA BIBLIOTECA JURÍDICA (Fallback Local RAM):\n`;

        books.forEach((book) => {
          const contentLower = book.content.toLowerCase();
          const termLower = safeTerm.toLowerCase();
          
          let bestIndex = contentLower.indexOf(termLower);
          if (bestIndex === -1 && terms.length > 0) {
             for (const t of terms) {
                 const idx = contentLower.indexOf(t);
                 if (idx !== -1) {
                     bestIndex = idx;
                     break;
                 }
             }
          }

          let snippet = "";
          if (bestIndex !== -1) {
            const start = Math.max(0, bestIndex - 100);
            const end = Math.min(book.content.length, bestIndex + 500);
            snippet = book.content
              .substring(start, end)
              .replace(/\s+/g, " ");
            if (start > 0) snippet = "..." + snippet;
            if (end < book.content.length) snippet = snippet + "...";
          } else {
            snippet =
              book.content.substring(0, 500).replace(/\s+/g, " ") + "...";
          }

          contextoBiblioteca += `\n[Fonte: "${book.title}"]\n"${snippet}"\n`;
        });

        console.log(`✅ [RAG - FALLBACK] ${books.length} doc(s) encontrado(s) na RAM.`);
        return contextoBiblioteca;
      }
    } catch (fallbackErr) {
      console.error("❌ [RAG - FALLBACK] Falha crítica no Fallback de RAG:", fallbackErr.message);
    }
  } catch (globalErr) {
    console.error("❌ [RAG - GLOBAL] Erro fatal e inesperado na busca da biblioteca. Ignorando RAG:", globalErr.message);
  }

  return "";
}

/**
 * Busca documentos por categoria (ex: MODELOS).
 */
export function buscarPorCategoria(categoria, limite = 3) {
  try {
    const allBooks = getLibraryMetadata();
    const matched = allBooks
      .filter((book) => book.isActive === true && book.categoria === categoria)
      .slice(0, limite);

    return matched.map((meta) => ({
      title: meta.title,
      content: (getDocumentContent(meta.filename) || "").slice(0, 3500), // Optimized slice for templates
    }));
  } catch (err) {
    console.warn(`Erro ao buscar contexto ${categoria}:`, err.message);
    return [];
  }
}

