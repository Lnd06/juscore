import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.PINECONE_API_KEY || "pcsk_51JiFH_23rfCvQ9w1sf7oo9ckJ3mgFpwkBWmSsmTem96YvNWXU4jyytuwsd5npuLUpXwSm";

const pc = new Pinecone({
  apiKey: API_KEY,
});

const DEFAULT_INDEX_NAME = "juscore-library";
let _activeIndexName = DEFAULT_INDEX_NAME;
let _isInitialized = false;
let _genAI = null;

/**
 * Retorna a instância do SDK Gemini
 */
function getGenAI() {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada no ambiente.");
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

/**
 * Gera o vetor de embedding de 768 dimensões para o texto usando o modelo text-embedding-004 do Gemini
 */
export async function gerarEmbedding(texto) {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(texto);
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    throw new Error("Nenhum embedding retornado pela API");
  } catch (err) {
    console.error("❌ [PINECONE SERVICE] Erro ao gerar embedding com Gemini:", err.message);
    throw err;
  }
}

/**
 * Inicializa a conexão com o Pinecone e proviciona o índice caso não exista.
 */
export async function inicializarPinecone() {
  if (_isInitialized) return true;
  try {
    console.log("🌲 [PINECONE] Inicializando conexão...");
    const lista = await pc.listIndexes();
    const indexName = DEFAULT_INDEX_NAME;
    const targetDimension = 3072; // gemini-embedding-001 / gemini-embedding-2
    
    const existingIndex = lista.indexes?.find(idx => idx.name === indexName) || (lista.indexes && lista.indexes.length > 0 ? lista.indexes[0] : null);
    
    if (existingIndex) {
      const existingName = existingIndex.name;
      if (existingIndex.dimension !== targetDimension) {
        console.log(`🌲 [PINECONE] Dimensão do índice existente "${existingName}" (${existingIndex.dimension}) difere de ${targetDimension}. Recriando índice...`);
        try {
          await pc.deleteIndex(existingName);
          // Aguarda a deleção
          await new Promise(resolve => setTimeout(resolve, 8000));
        } catch (e) {
          console.error("⚠️ Erro ao deletar índice antigo:", e.message);
        }
        
        console.log(`🌲 [PINECONE] Criando novo índice "${indexName}" com dimensão ${targetDimension}...`);
        await pc.createIndex({
          name: indexName,
          dimension: targetDimension,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });
        _activeIndexName = indexName;
        console.log(`🌲 [PINECONE] Índice "${indexName}" recriado com sucesso.`);
      } else {
        _activeIndexName = existingName;
        console.log(`🌲 [PINECONE] Usando índice existente: "${_activeIndexName}" com dimensão ${targetDimension}`);
      }
    } else {
      console.log(`🌲 [PINECONE] Nenhum índice encontrado. Criando novo: "${indexName}" com dimensão ${targetDimension}...`);
      await pc.createIndex({
        name: indexName,
        dimension: targetDimension,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });
      _activeIndexName = indexName;
      console.log(`🌲 [PINECONE] Índice "${indexName}" criado com sucesso.`);
    }
    _isInitialized = true;
    return true;
  } catch (err) {
    console.error("❌ [PINECONE] Falha na inicialização do Pinecone:", err.message);
    return false;
  }
}

/**
 * Segmenta o texto em blocos lógicos preservando parágrafos.
 */
function segmentarTexto(texto, maxChunkSize = 1200, overlap = 200) {
  if (!texto) return [];
  const paragrafos = texto.split(/\n+/);
  const chunks = [];
  let currentChunk = "";

  for (const paragrafo of paragrafos) {
    const cleanPara = paragrafo.trim();
    if (!cleanPara) continue;

    if ((currentChunk.length + cleanPara.length) <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n" : "") + cleanPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      if (cleanPara.length > maxChunkSize) {
        let tempText = cleanPara;
        while (tempText.length > 0) {
          chunks.push(tempText.substring(0, maxChunkSize));
          tempText = tempText.substring(maxChunkSize - overlap);
          if (tempText.length <= overlap) break;
        }
        currentChunk = "";
      } else {
        currentChunk = cleanPara;
      }
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}

/**
 * Vetoriza e indexa um documento completo no Pinecone.
 */
export async function indexarDocumento(docId, titulo, conteudo) {
  try {
    await inicializarPinecone();
    if (!_isInitialized) {
      throw new Error("Serviço Pinecone não inicializado.");
    }

    console.log(`🌲 [PINECONE] Indexando documento "${titulo}" (ID: ${docId})...`);
    const chunks = segmentarTexto(conteudo);
    if (chunks.length === 0) {
      console.log(`🌲 [PINECONE] Documento "${titulo}" está vazio. Pulando.`);
      return false;
    }

    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embeddingValues = await gerarEmbedding(chunkText);
      
      vectors.push({
        id: `doc_${docId}_chunk_${i}`,
        values: embeddingValues,
        metadata: {
          documentId: String(docId),
          title: String(titulo),
          text: chunkText,
          chunkIndex: i,
        },
      });
    }

    const index = pc.index(_activeIndexName);
    const BatchSize = 50;
    for (let i = 0; i < vectors.length; i += BatchSize) {
      const batch = vectors.slice(i, i + BatchSize);
      await index.upsert(batch);
    }

    console.log(`🌲 [PINECONE] Sincronização concluída: ${chunks.length} chunks vetorizados para "${titulo}"`);
    return true;
  } catch (err) {
    console.error(`❌ [PINECONE] Erro ao indexar documento "${titulo}":`, err.message);
    return false;
  }
}

/**
 * Remove todos os vetores de um documento no Pinecone.
 */
export async function removerDocumento(docId) {
  try {
    await inicializarPinecone();
    if (!_isInitialized) return false;

    console.log(`🌲 [PINECONE] Removendo vetores do documento ID: ${docId}...`);
    const index = pc.index(_activeIndexName);
    
    await index.deleteMany({
      filter: {
        documentId: String(docId),
      },
    });
    
    console.log(`🌲 [PINECONE] Remoção concluída para ID: ${docId}`);
    return true;
  } catch (err) {
    console.error(`❌ [PINECONE] Erro ao deletar documento ID ${docId}:`, err.message);
    return false;
  }
}

/**
 * Realiza a busca semântica vetorial e retorna o contexto formatado para o RAG.
 */
export async function buscarContextoSemantico(query, activeIds = [], limit = 3) {
  try {
    await inicializarPinecone();
    if (!_isInitialized) {
      throw new Error("Serviço Pinecone não inicializado.");
    }

    const queryEmbedding = await gerarEmbedding(query);
    const queryOptions = {
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
    };

    if (activeIds && activeIds.length > 0) {
      queryOptions.filter = {
        documentId: {
          $in: activeIds.map(String),
        },
      };
    }

    const index = pc.index(_activeIndexName);
    const result = await index.query(queryOptions);

    if (!result.matches || result.matches.length === 0) {
      console.log(`🌲 [PINECONE] Nenhum resultado para a busca semântica: "${query.substring(0, 30)}..."`);
      return null;
    }

    let contexto = `\n📚 CONTEXTO DA BIBLIOTECA JURÍDICA (Busca Semântica Pinecone):\n`;
    result.matches.forEach((match) => {
      const meta = match.metadata;
      if (meta && meta.text) {
        contexto += `\n[Fonte: "${meta.title}"] (Similaridade: ${Math.round(match.score * 100)}%)\n"${meta.text.trim()}"\n`;
      }
    });

    console.log(`🌲 [PINECONE] Busca semântica retornou ${result.matches.length} trechos relevantes.`);
    return contexto;
  } catch (err) {
    console.error("❌ [PINECONE] Erro na busca semântica:", err.message);
    return null; // Aciona fallback de busca clássica local
  }
}
