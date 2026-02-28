import express from "express";
import { auth } from "../midleware/auth.js";
import { usageLimiter } from "../midleware/usageLimiter.js";
import { Conversation } from "../models/index.js";
import { generateConversationPDF } from "../services/pdfGenerator.js";

const router = express.Router();

/**
 * GET /api/export/pdf/:sessionId
 * Exporta uma conversa para PDF
 */
router.get("/pdf/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    console.log(`📄 Exportando PDF Completo ${sessionId} (Usuário: ${userId})`);

    const conversation = await Conversation.findOne({
      where: { sessionId, userId },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }

    // Stream do PDF
    const pdfStream = await generateConversationPDF(conversation, req.user);

    const fileName = `JusCore_${conversation.titulo?.replace(/[^a-zA-Z0-9]/g, "_") || "Consulta"}_${sessionId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-cache");

    pdfStream.pipe(res);
  } catch (error) {
    console.error("❌ Erro no export PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar PDF" });
    }
  }
});

/**
 * GET /api/export/doc/:sessionId
 * Exporta APENAS a última resposta da IA como documento formal
 */
router.get(
  "/doc/:sessionId",
  auth,
  usageLimiter("documents"),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      console.log(
        `📄 Exportando Documento Limpo ${sessionId} (Usuário: ${userId})`,
      );

      const conversation = await Conversation.findOne({
        where: { sessionId, userId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      // Pegar a última mensagem da IA
      let messages = conversation.mensagens;
      if (typeof messages === "string") messages = JSON.parse(messages || "[]");

      // Filtrar mensagens da IA
      const aiMessages = messages.filter((m) => m.role === "assistant");
      if (aiMessages.length === 0) {
        return res
          .status(400)
          .json({ error: "Nenhuma resposta da IA para exportar." });
      }

      const lastResponse = aiMessages[aiMessages.length - 1];
      let content = "";

      if (Array.isArray(lastResponse.content)) {
        content =
          lastResponse.content.find((c) => c.type === "text")?.text || "";
      } else {
        content = lastResponse.content;
      }

      // Gerar PDF Limpo
      const { generateCleanDocumentPDF } =
        await import("../services/pdfGenerator.js");
      const pdfStream = await generateCleanDocumentPDF(
        content,
        req.user,
        conversation.titulo,
      );

      const fileName = `Documento_${conversation.titulo?.replace(/[^a-zA-Z0-9]/g, "_") || "JusCore"}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.setHeader("Cache-Control", "no-cache");

      pdfStream.pipe(res);
    } catch (error) {
      console.error("❌ Erro no export doc:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erro ao gerar documento" });
      }
    }
  },
);

/**
 * POST /api/export/doc/generate
 * Gera PDF de documento limpo a partir de texto enviado (Stateless)
 */
router.post(
  "/doc/generate",
  auth,
  usageLimiter("documents"),
  async (req, res) => {
    try {
      const { content, title } = req.body;
      const user = req.user;

      console.log(`📄 Gerando Documento Limpo via POST (Usuário: ${user.id})`);

      if (!content) {
        return res.status(400).json({ error: "Conteúdo não fornecido" });
      }

      // Gerar PDF Limpo
      const { generateCleanDocumentPDF } =
        await import("../services/pdfGenerator.js");
      const pdfStream = await generateCleanDocumentPDF(
        content,
        user,
        title || "Documento Jurídico",
      );

      const fileName = `Documento_${(title || "JusCore").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.setHeader("Cache-Control", "no-cache");

      pdfStream.pipe(res);
    } catch (error) {
      console.error("❌ Erro no export doc generate:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erro ao gerar documento" });
      }
    }
  },
);

export default router;
