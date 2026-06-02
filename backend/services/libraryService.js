import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { indexarDocumento, removerDocumento } from "./pineconeService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho universal: backend/livros (No Docker será mapeado para o volume)
const LIVROS_DIR = path.resolve(__dirname, "..", "livros");
const METADATA_FILE = path.join(LIVROS_DIR, "metadata.json");

if (!fs.existsSync(LIVROS_DIR)) {
  fs.mkdirSync(LIVROS_DIR, { recursive: true });
}
if (!fs.existsSync(METADATA_FILE)) {
  fs.writeFileSync(METADATA_FILE, "[]", "utf-8");
}

export const LIVROS_PATH = LIVROS_DIR;

// ============================================================
// CACHE IN-MEMORY PARA PRODUÇÃO (evita leitura de disco por request)
// ============================================================
let _metadataCache = null;
let _metadataCacheTs = 0;
const METADATA_CACHE_TTL_MS = 60_000; // Recarrega do disco a cada 60s

const _contentCache = new Map(); // filename -> { data, ts }
const CONTENT_CACHE_TTL_MS = 300_000; // Conteúdo dos livros: 5 min

function _readMetadataFromDisk() {
  try {
    let raw = fs.readFileSync(METADATA_FILE, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("❌ Erro ao ler metadata da biblioteca:", error.message);
    fs.writeFileSync(METADATA_FILE, "[]", "utf-8");
    return [];
  }
}

export const getLibraryMetadata = () => {
  const now = Date.now();
  if (_metadataCache && (now - _metadataCacheTs) < METADATA_CACHE_TTL_MS) {
    return _metadataCache;
  }
  _metadataCache = _readMetadataFromDisk();
  _metadataCacheTs = now;
  return _metadataCache;
};

export const saveLibraryMetadata = (data) => {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    // Invalidar cache para que a próxima leitura reflita as alterações
    _metadataCache = data;
    _metadataCacheTs = Date.now();
  } catch (error) {
    console.error("❌ Erro ao salvar metadata:", error.message);
  }
};

export const addDocument = (title, categoria, filenameOrContent, uploadedBy, isDirectContent = false) => {
  const meta = getLibraryMetadata();
  
  let txtFilename = filenameOrContent;
  
  if (isDirectContent) {
    const safeName = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 80);
    txtFilename = `${safeName}_${Date.now()}.txt`;
    fs.writeFileSync(path.join(LIVROS_DIR, txtFilename), filenameOrContent, "utf-8");
  }

  const newDoc = {
    id: crypto.randomUUID(),
    title,
    categoria,
    filename: txtFilename,
    isActive: true,
    uploadedBy: String(uploadedBy),
    createdAt: new Date().toISOString(),
  };
  meta.push(newDoc);
  saveLibraryMetadata(meta);

  // Sincronizar com o Pinecone em background (assíncrono)
  indexarDocumento(newDoc.id, title, isDirectContent ? filenameOrContent : "").catch((err) => {
    console.error(`❌ [LIBRARY SERVICE] Erro de indexação em background para ${newDoc.id}:`, err.message);
  });

  return newDoc;
};

export const updateDocument = (id, updates) => {
  const meta = getLibraryMetadata();
  const index = meta.findIndex((d) => d.id === id);
  if (index === -1) return null;
  meta[index] = { ...meta[index], ...updates };
  saveLibraryMetadata(meta);
  return meta[index];
};

export const deleteDocument = (id) => {
  const meta = getLibraryMetadata();
  const index = meta.findIndex((d) => d.id === id);
  if (index === -1) return false;

  const doc = meta[index];
  const filepath = path.join(LIVROS_DIR, doc.filename);
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (err) {}

  const updated = meta.filter((d) => d.id !== id);
  saveLibraryMetadata(updated);

  // Sincronizar remoção com o Pinecone em background (assíncrono)
  removerDocumento(id).catch((err) => {
    console.error(`❌ [LIBRARY SERVICE] Erro de exclusão em background para ${id}:`, err.message);
  });

  return true;
};

export const getDocumentContent = (identifier) => {
  try {
    // Identifier can be filename or ID
    let filename = identifier;
    if (!identifier.endsWith(".txt")) {
       const meta = getLibraryMetadata();
       const doc = meta.find(d => d.id === identifier);
       if (doc) filename = doc.filename;
    }

    // Verificar cache in-memory
    const now = Date.now();
    const cached = _contentCache.get(filename);
    if (cached && (now - cached.ts) < CONTENT_CACHE_TTL_MS) {
      return cached.data;
    }

    const filepath = path.join(LIVROS_DIR, filename);
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, "utf-8");
      _contentCache.set(filename, { data: content, ts: now });
      return content;
    }
  } catch (err) {
    console.error("⚠️ Erro lendo conteúdo:", err.message);
  }
  return null;
};

export const updateDocumentContent = (id, content) => {
  try {
    const meta = getLibraryMetadata();
    const doc = meta.find(d => d.id === id);
    if (!doc) return false;
    const filepath = path.join(LIVROS_DIR, doc.filename);
    fs.writeFileSync(filepath, content, "utf-8");
    // Invalidar cache de conteúdo para este documento
    _contentCache.set(doc.filename, { data: content, ts: Date.now() });

    // Sincronizar edição com o Pinecone em background (assíncrono)
    removerDocumento(id)
      .then(() => {
        return indexarDocumento(id, doc.title, content);
      })
      .catch((err) => {
        console.error(`❌ [LIBRARY SERVICE] Erro ao sincronizar edição do documento ${id}:`, err.message);
      });

    return true;
  } catch (err) {
    console.error("❌ Erro ao atualizar conteúdo:", err.message);
    return false;
  }
};
