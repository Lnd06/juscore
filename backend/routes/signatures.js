import express from "express";
import { auth } from "../midleware/auth.js";
import { SignatureRequest, User } from "../models/index.js";

const router = express.Router();

// [PRIVADO] Listar todas as solicitações de assinatura do advogado
router.get("/", auth, async (req, res) => {
  try {
    const requests = await SignatureRequest.findAll({
      where: { userId: req.user.id },
      attributes: {
        exclude: ["content", "signatureImage", "lawyerSignatureImage"],
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(requests);
  } catch (error) {
    console.error("Erro ao listar assinaturas:", error);
    res.status(500).json({ error: "Erro interno ao buscar assinaturas" });
  }
});

// [PRIVADO] Criar uma nova solicitação de assinatura (Gerar Link)
router.post("/", auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "Título e conteúdo são obrigatórios." });
    }

    const request = await SignatureRequest.create({
      userId: req.user.id,
      title,
      content,
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Erro ao criar link de assinatura:", error);
    res.status(500).json({ error: "Erro ao gerar solicitação de assinatura" });
  }
});

// [PRIVADO] Cancelar / Deletar uma solicitação
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await SignatureRequest.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted)
      return res.status(404).json({ error: "Solicitação não encontrada" });

    res.json({ message: "Solicitação removida com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover solicitação" });
  }
});

// [PRIVADO] Advogado assina o documento
router.post("/:id/sign-lawyer", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { signatureImage } = req.body;

    if (!signatureImage) {
      return res
        .status(400)
        .json({ error: "Imagem da assinatura é obrigatória." });
    }

    const request = await SignatureRequest.findOne({
      where: { id, userId: req.user.id },
    });
    if (!request) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }

    request.lawyerSignatureImage = signatureImage;
    await request.save();

    res.json({ message: "Assinatura do advogado registrada com sucesso." });
  } catch (error) {
    console.error("Erro ao registrar assinatura do advogado:", error);
    res.status(500).json({ error: "Erro interno ao salvar assinatura." });
  }
});

// ==========================================
// ROTAS PÚBLICAS (Para os clientes finais)
// ==========================================

// [PÚBLICO] Buscar os detalhes de um documento pelo Token
router.get("/public/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const request = await SignatureRequest.findOne({
      where: { token },
      include: [{ model: User, attributes: ["nome"] }],
    });

    if (!request) {
      return res
        .status(404)
        .json({ error: "Documento não encontrado ou link inválido." });
    }

    res.json(request);
  } catch (error) {
    console.error("Erro ao buscar link público:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// [PÚBLICO] Assinar o documento eletronicamente
router.post("/public/:token/sign", async (req, res) => {
  try {
    const { token } = req.params;
    const { cpf, signerName, signatureImage } = req.body;

    if (!cpf || !signerName) {
      return res
        .status(400)
        .json({ error: "O Nome e o CPF são obrigatórios para assinar." });
    }

    const request = await SignatureRequest.findOne({ where: { token } });

    if (!request) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }

    if (request.status === "ASSINADO") {
      return res.status(400).json({ error: "Este documento já foi assinado." });
    }

    // Capturar o IP real do cliente (confiando no NGINX X-Forwarded-For)
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Registrar a assinatura
    request.status = "ASSINADO";
    request.signerName = signerName;
    request.signerCpf = cpf.replace(/\D/g, ""); // Apenas números
    request.signerIp = ip;
    request.signatureImage = signatureImage || null;
    request.signedAt = new Date();
    await request.save();

    res.json({ message: "Documento assinado com sucesso!", request });
  } catch (error) {
    console.error("Erro ao assinar documento:", error);
    res.status(500).json({ error: "Erro interno ao registrar assinatura." });
  }
});

import { generateProfessionalPDF } from "../services/pdfGenerator.js";

// [PÚBLICO] Baixar o PDF do documento já assinado
router.get("/public/:token/download", async (req, res) => {
  try {
    const { token } = req.params;

    const request = await SignatureRequest.findOne({
      where: { token },
      include: [{ model: User }],
    });

    if (!request || request.status !== "ASSINADO") {
      return res
        .status(404)
        .json({ error: "Documento não encontrado ou ainda não assinado." });
    }

    const docOwner = request.User;

    const pdfDoc = await generateProfessionalPDF(request.content, {
      title: request.title,
      lawyerName: docOwner?.nome || "Advogado Responsável",
      officeName: docOwner?.organization?.name || docOwner?.apelido || "",
      address: "",
      logo: docOwner?.foto || null,
      date: new Date(request.signedAt).toLocaleDateString("pt-BR"),
      oabNumber: docOwner?.oab || "",
      user: docOwner,
      clientSignerName: request.signerName,
      clientSignerCpf: request.signerCpf,
      clientSignatureImage: request.signatureImage,
      lawyerSignatureImage: request.lawyerSignatureImage,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="documento_assinado_${token.substring(0, 8)}.pdf"`,
    );

    pdfDoc.pipe(res);
  } catch (error) {
    console.error("Erro ao gerar PDF de documento assinado:", error);
    res.status(500).json({ error: "Erro ao gerar PDF" });
  }
});

export default router;
