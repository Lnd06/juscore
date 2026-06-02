import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { indexarDocumento, inicializarPinecone } from "../services/pineconeService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIVROS_DIR = path.resolve(__dirname, "..", "livros");
const METADATA_FILE = path.join(LIVROS_DIR, "metadata.json");

async function runMigration() {
  console.log("🚀 [MIGRAÇÃO VETORIAL] Iniciando sincronização da Biblioteca com o Pinecone...");
  
  if (!fs.existsSync(METADATA_FILE)) {
    console.error("❌ Arquivo metadata.json não encontrado em:", METADATA_FILE);
    process.exit(1);
  }

  let docs = [];
  try {
    const raw = fs.readFileSync(METADATA_FILE, "utf-8");
    docs = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Erro ao ler metadata.json:", err.message);
    process.exit(1);
  }

  if (!Array.isArray(docs) || docs.length === 0) {
    console.log("ℹ️ Nenhum documento encontrado para migração.");
    process.exit(0);
  }

  console.log(`🌲 [MIGRAÇÃO VETORIAL] Encontrados ${docs.length} documentos no metadata.json.`);

  // Inicializa o Pinecone antes de tudo
  const connected = await inicializarPinecone();
  if (!connected) {
    console.error("❌ Falha ao conectar ao Pinecone. Abortando migração.");
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const doc of docs) {
    console.log(`\n--------------------------------------------------`);
    console.log(`📄 Processando: "${doc.title}" (ID: ${doc.id})`);
    
    if (!doc.isActive) {
      console.log(`⚠️ Documento está inativo. Pulando.`);
      continue;
    }

    const filepath = path.join(LIVROS_DIR, doc.filename);
    if (!fs.existsSync(filepath)) {
      console.error(`❌ Arquivo físico não encontrado: ${doc.filename}`);
      failCount++;
      continue;
    }

    let conteudo = "";
    try {
      conteudo = fs.readFileSync(filepath, "utf-8");
    } catch (err) {
      console.error(`❌ Erro ao ler arquivo ${doc.filename}:`, err.message);
      failCount++;
      continue;
    }

    if (!conteudo.trim()) {
      console.log(`⚠️ Conteúdo do arquivo está vazio. Pulando.`);
      continue;
    }

    console.log(`⚡ Vetorizando e enviando ao Pinecone (${conteudo.length} caracteres)...`);
    const success = await indexarDocumento(doc.id, doc.title, conteudo);
    
    if (success) {
      console.log(`✅ [SUCESSO] "${doc.title}" sincronizado com o Pinecone!`);
      successCount++;
    } else {
      console.error(`❌ [FALHA] Não foi possível indexar "${doc.title}".`);
      failCount++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`🏁 MIGRACAO CONCLUÍDA!`);
  console.log(`✅ Sucesso: ${successCount} documentos`);
  console.log(`❌ Falha/Erros: ${failCount} documentos`);
  console.log(`==================================================`);
}

runMigration().catch((err) => {
  console.error("❌ Erro fatal durante a migração:", err);
  process.exit(1);
});
