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
  getDocumentContent,
  updateDocumentContent
} from "../services/libraryService.js";
import { authAdmin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const CATEGORIAS_VALIDAS = ["GERAL", "OAB", "TCC", "DOCUMENTOS", "MODELO_DOCUMENTO"];

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

      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const title = file.originalname.replace(/\.pdf$/i, "");
          const content = await parsePdfAsync(file.buffer);

          if (!content || content.trim().length === 0) {
            errors.push({ file: file.originalname, error: "Texto não extraído" });
            continue;
          }

          const newDoc = addDocument(title, categoriaFinal, content, req.user.id, true);
          results.push(newDoc);
        } catch (err) {
          errors.push({ file: file.originalname, error: err.message });
        }
      }

      res.json({
        success: true,
        saved: results.length,
        errors: errors.length,
        results,
        ...(errors.length > 0 ? { failures: errors } : {}),
      });
    } catch (error) {
      res.status(500).json({ error: "Falha ao processar PDFs" });
    }
  },
);

/* ========================================
   GET / — Listar documentos
   ======================================== */
router.get("/", authAdmin, (req, res) => {
  try {
    const { categoria } = req.query;
    let docs = getLibraryMetadata();

    docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (categoria && CATEGORIAS_VALIDAS.includes(categoria)) {
      docs = docs.filter((d) => d.categoria === categoria);
    }

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Falha ao listar biblioteca" });
  }
});

/* ========================================
   POST /manual — Cria documento a partir de texto inserido
   ======================================== */
router.post("/manual", authAdmin, (req, res) => {
  try {
    const { title, categoria, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Título e conteúdo são obrigatórios" });

    const categoriaFinal = CATEGORIAS_VALIDAS.includes(categoria) ? categoria : "GERAL";
    
    const newDoc = addDocument(title, categoriaFinal, content, req.user.id, true);
    res.json({ success: true, document: newDoc });
  } catch (error) {
    res.status(500).json({ error: "Falha ao salvar texto manual" });
  }
});

/* ========================================
   PUT /:id/content — Editar o conteúdo do texto
   ======================================== */
router.put("/:id/content", authAdmin, (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Conteúdo não pode ser vazio" });

    const success = updateDocumentContent(req.params.id, content);
    if (!success) return res.status(404).json({ error: "Documento não encontrado" });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Falha ao atualizar conteúdo" });
  }
});

/* ========================================
   GET /:id/content — Obter o conteúdo do texto
   ======================================== */
router.get("/:id/content", authAdmin, (req, res) => {
  try {
    const content = getDocumentContent(req.params.id);
    if (content === null) return res.status(404).json({ error: "Documento não encontrado" });
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: "Falha ao ler conteúdo" });
  }
});

/* ========================================
   PUT /:id — Editar título, categoria ou ativar/desativar
   ======================================== */
router.put("/:id", authAdmin, (req, res) => {
  try {
    const { title, categoria, isActive } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (categoria !== undefined) updates.categoria = categoria;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = updateDocument(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: "Documento não encontrado" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Falha ao atualizar documento" });
  }
});

/* ========================================
   DELETE /:id — Excluir permanentemente
   ======================================== */
router.delete("/:id", authAdmin, (req, res) => {
  try {
    const success = deleteDocument(req.params.id);
    if (!success) return res.status(404).json({ error: "Documento não encontrado" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Falha ao excluir documento" });
  }
});

export default router;
