import express from "express";
import multer from "multer";
import { parsePdfAsync } from "../services/pdfService.js";
import KnowledgeDocument from "../models/mongo/KnowledgeDocument.js";
import { authAdmin } from "../midleware/auth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const CATEGORIAS_VALIDAS = ["GERAL", "OAB", "TCC", "DOCUMENTOS"];

// Upload multiple PDFs to Knowledge Base (MongoDB)
router.post(
  "/upload",
  authAdmin,
  upload.array("files", 20),
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const { categoria } = req.body;
      const categoriaFinal = CATEGORIAS_VALIDAS.includes(categoria)
        ? categoria
        : "GERAL";

      console.log(
        `📚 Processing ${files.length} PDF(s) | Categoria: ${categoriaFinal}`,
      );

      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const title = file.originalname.replace(/\.pdf$/i, "");
          const content = await parsePdfAsync(file.buffer);

          if (!content || content.trim().length === 0) {
            errors.push({
              file: file.originalname,
              error: "Texto não extraído do PDF",
            });
            continue;
          }

          const doc = await KnowledgeDocument.create({
            title,
            content,
            type: "book",
            categoria: categoriaFinal,
            uploadedBy: req.user.id,
          });

          console.log(
            `✅ Saved to MongoDB: "${doc.title}" [${categoriaFinal}] id:${doc._id}`,
          );
          results.push({ id: doc._id, title: doc.title });
        } catch (err) {
          console.error(
            `❌ Erro ao processar "${file.originalname}":`,
            err.message,
          );
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
      console.error("❌ Error in multi-upload:", error);
      const logMessage = `[${new Date().toISOString()}] Multi-Upload Error: ${error.message}\nStack: ${error.stack}\n\n`;
      try {
        const fs = await import("fs");
        fs.appendFileSync("error.log", logMessage);
      } catch {}
      res
        .status(500)
        .json({ error: error.message || "Failed to process PDFs" });
    }
  },
);

// List documents (with optional category filter)
router.get("/", authAdmin, async (req, res) => {
  try {
    const { categoria } = req.query;
    const filter = { isActive: true };
    if (categoria && CATEGORIAS_VALIDAS.includes(categoria)) {
      filter.categoria = categoria;
    }

    const docs = await KnowledgeDocument.find(filter)
      .select("title createdAt type categoria")
      .sort({ createdAt: -1 })
      .lean();

    // Map _id → id so the frontend stays compatible
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (error) {
    console.error("❌ Error fetching library:", error);
    res.status(500).json({ error: "Failed to fetch library" });
  }
});

// Delete document
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    const doc = await KnowledgeDocument.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
