import express from "express";
import multer from "multer";
import fs from "fs";
import { parsePdfAsync } from "../services/pdfService.js";
import {
  LIVROS_PATH,
  addDocument,
  getLibraryMetadata,
  deleteDocument,
  updateDocument,
} from "../services/libraryService.js";
import { authAdmin } from "../midleware/auth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const CATEGORIAS_VALIDAS = ["GERAL", "OAB", "TCC", "DOCUMENTOS"];

/* ========================================
   POST /upload — Processa PDFs → .txt local
   ======================================== */
router.post(
  "/upload",
  authAdmin,
  upload.array("files", 20),
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const { categoria } = req.body;
      const categoriaFinal = CATEGORIAS_VALIDAS.includes(categoria)
        ? categoria
        : "GERAL";

      console.log(
        `📚 Processando ${files.length} PDF(s) → FS Local | Categoria: ${categoriaFinal}`,
      );

      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          console.log(`📄 Iniciando parse de: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

          const title = file.originalname.replace(/\.pdf$/i, "");
          const content = await parsePdfAsync(file.buffer);

          if (!content || content.trim().length === 0) {
            console.warn(`⚠️ PDF sem texto extraível: ${file.originalname}`);
            errors.push({
              file: file.originalname,
              error: "Texto não extraído do PDF",
            });
            continue;
          }

          console.log(`📝 Texto extraído: ${content.length} caracteres`);

          // Gerar nome seguro para o arquivo .txt
          const safeName = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .substring(0, 80);
          const txtFilename = `${safeName}_${Date.now()}.txt`;
          const txtPath = `${LIVROS_PATH}/${txtFilename}`;

          // Escrever o arquivo .txt fisicamente
          fs.writeFileSync(txtPath, content, "utf-8");
          console.log(`💾 Arquivo escrito: ${txtPath}`);

          // Registrar no metadata.json
          const newDoc = addDocument(
            title,
            categoriaFinal,
            txtFilename,
            req.user.id,
          );

          results.push(newDoc);
        } catch (err) {
          console.error(
            `❌ Erro ao processar "${file.originalname}":`,
            err.message,
            err.stack,
          );
          errors.push({ file: file.originalname, error: err.message });
        }
      }

      console.log(
        `✅ Upload concluído: ${results.length} sucesso(s), ${errors.length} erro(s)`,
      );

      res.json({
        success: true,
        saved: results.length,
        errors: errors.length,
        results,
        ...(errors.length > 0 ? { failures: errors } : {}),
      });
    } catch (error) {
      console.error("❌ Erro fatal no upload:", error.message, error.stack);
      res
        .status(500)
        .json({ error: error.message || "Falha ao processar PDFs" });
    }
  },
);

/* ========================================
   GET / — Listar documentos
   ======================================== */
router.get("/", authAdmin, async (req, res) => {
  try {
    const { categoria } = req.query;
    let docs = getLibraryMetadata();

    // Ordenar por data (mais recente primeiro)
    docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (categoria && CATEGORIAS_VALIDAS.includes(categoria)) {
      docs = docs.filter((d) => d.categoria === categoria);
    }

    res.json(docs);
  } catch (error) {
    console.error("❌ Erro ao listar biblioteca:", error.message);
    res.status(500).json({ error: "Falha ao listar biblioteca" });
  }
});

/* ========================================
   POST /manual — Cria documento a partir de texto inserido
   ======================================== */
router.post("/manual", authAdmin, async (req, res) => {
  try {
    const { title, categoria, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Título e conteúdo são obrigatórios" });
    }

    const categoriaFinal = CATEGORIAS_VALIDAS.includes(categoria) ? categoria : "GERAL";
    
    const safeName = title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 80);
    const txtFilename = `${safeName}_${Date.now()}.txt`;
    const txtPath = `${LIVROS_PATH}/${txtFilename}`;

    fs.writeFileSync(txtPath, content, "utf-8");
    
    const newDoc = addDocument(title, categoriaFinal, txtFilename, req.user.id);
    res.json({ success: true, document: newDoc });
  } catch (error) {
    console.error("❌ Erro no upload manual:", error.message);
    res.status(500).json({ error: "Falha ao salvar texto manual" });
  }
});

/* ========================================
   PUT /:id/content — Editar o conteúdo do texto
   ======================================== */
router.put("/:id/content", authAdmin, async (req, res) => {
  try {
    const { content } = req.body;
    const docs = getLibraryMetadata();
    const doc = docs.find(d => d.id === req.params.id);
    
    if (!doc) return res.status(404).json({ error: "Documento não encontrado" });
    if (!content) return res.status(400).json({ error: "Conteúdo não pode ser vazio" });

    const txtPath = `${LIVROS_PATH}/${doc.filename}`;
    fs.writeFileSync(txtPath, content, "utf-8");
    
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erro ao atualizar conteúdo do documento:", error.message);
    res.status(500).json({ error: "Falha ao atualizar conteúdo" });
  }
});

/* ========================================
   GET /:id/content — Obter o conteúdo do texto
   ======================================== */
router.get("/:id/content", authAdmin, async (req, res) => {
  try {
    const docs = getLibraryMetadata();
    const doc = docs.find(d => d.id === req.params.id);
    
    if (!doc) return res.status(404).json({ error: "Documento não encontrado" });

    const txtPath = `${LIVROS_PATH}/${doc.filename}`;
    if (fs.existsSync(txtPath)) {
      const content = fs.readFileSync(txtPath, "utf-8");
      return res.json({ content });
    } else {
      return res.status(404).json({ error: "Arquivo físico não encontrado" });
    }
  } catch (error) {
    console.error("❌ Erro ao ler conteúdo do documento:", error.message);
    res.status(500).json({ error: "Falha ao ler conteúdo" });
  }
});

/* ========================================
   PUT /:id — Editar título, categoria ou ativar/desativar
   ======================================== */
router.put("/:id", authAdmin, async (req, res) => {
  try {
    const { title, categoria, isActive } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (categoria !== undefined) updates.categoria = categoria;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = updateDocument(req.params.id, updates);
    if (!updated)
      return res.status(404).json({ error: "Documento não encontrado" });

    res.json(updated);
  } catch (error) {
    console.error("❌ Erro ao atualizar documento:", error.message);
    res.status(500).json({ error: "Falha ao atualizar documento" });
  }
});

/* ========================================
   DELETE /:id — Excluir permanentemente (arquivo + metadado)
   ======================================== */
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    const success = deleteDocument(req.params.id);
    if (!success)
      return res.status(404).json({ error: "Documento não encontrado" });
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erro ao excluir documento:", error.message);
    res.status(500).json({ error: "Falha ao excluir documento" });
  }
});

export default router;
