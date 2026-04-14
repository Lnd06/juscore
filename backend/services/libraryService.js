import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho universal: backend/livros (funciona Windows + Docker)
const LIVROS_DIR = path.resolve(__dirname, "..", "livros");
const METADATA_FILE = path.join(LIVROS_DIR, "metadata.json");

// Certificar que o diretório e o arquivo existem
if (!fs.existsSync(LIVROS_DIR)) {
  fs.mkdirSync(LIVROS_DIR, { recursive: true });
}
if (!fs.existsSync(METADATA_FILE)) {
  fs.writeFileSync(METADATA_FILE, "[]", "utf-8");
}

export const LIVROS_PATH = LIVROS_DIR;

export const getLibraryMetadata = () => {
  try {
    let raw = fs.readFileSync(METADATA_FILE, "utf-8");
    // Remove BOM if present (safety for Windows)
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("❌ Erro ao ler metadata da biblioteca:", error.message);
    // Reset corrupted file
    fs.writeFileSync(METADATA_FILE, "[]", "utf-8");
    return [];
  }
};

export const saveLibraryMetadata = (data) => {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("❌ Erro ao salvar metadata da biblioteca:", error.message);
  }
};

export const addDocument = (title, categoria, filename, uploadedBy) => {
  const meta = getLibraryMetadata();
  const newDoc = {
    id: crypto.randomUUID(),
    title,
    categoria,
    filename,
    isActive: true,
    uploadedBy: String(uploadedBy),
    createdAt: new Date().toISOString(),
  };
  meta.push(newDoc);
  saveLibraryMetadata(meta);
  console.log(`📗 addDocument OK: "${title}" → ${filename}`);
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
  } catch (err) {
    console.error("⚠️ Não conseguiu apagar o arquivo .txt:", err.message);
  }

  const updated = meta.filter((d) => d.id !== id);
  saveLibraryMetadata(updated);
  return true;
};

export const getDocumentContent = (filename) => {
  try {
    const filepath = path.join(LIVROS_DIR, filename);
    if (fs.existsSync(filepath)) {
      return fs.readFileSync(filepath, "utf-8");
    }
  } catch (err) {
    console.error("⚠️ Erro lendo conteúdo do livro:", err.message);
  }
  return null;
};
