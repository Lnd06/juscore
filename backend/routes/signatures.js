import express from "express";
import crypto from "crypto";
import { auth } from "../middleware/auth.js";
import { SignatureRequest, User } from "../models/index.js";
import { generateProfessionalPDF } from "../services/pdfGenerator.js";
import { Op } from "sequelize";
import getPlanConfig from "../config/plans/index.js";

const router = express.Router();

// ==========================================
// ROTAS PRIVADAS (Para o advogado logado)
// ==========================================

// [PRIVADO] Listar todas as solicitações de assinatura do advogado
router.get("/", auth, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;

    // Limpeza reativa de expirados do usuário
    await SignatureRequest.destroy({
      where: {
        userId: ownerId,
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    const requests = await SignatureRequest.findAll({
      where: { userId: ownerId },
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

    const ownerId = req.user.parentUserId || req.user.id;

    // Limpeza reativa de expirados do usuário
    await SignatureRequest.destroy({
      where: {
        userId: ownerId,
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    // Resolver plano e limites do usuário
    let planSlug =
      req.user.subscriptionPlan && req.user.subscriptionPlan !== "free"
        ? req.user.subscriptionPlan
        : req.user.tipo || "free";

    if (req.user.parentUserId) {
      const parentUser = await User.findByPk(req.user.parentUserId);
      if (parentUser) {
        planSlug = parentUser.subscriptionPlan || "free";
      }
    }

    const userPlan = getPlanConfig(planSlug);
    const maxDocs = userPlan.limits?.maxSignatureDocs ?? 0;
    const expiryDays = userPlan.limits?.signatureDocExpiryDays ?? 15;

    // Se for plano grátis (ou se maxDocs for 0), bloquear
    if (maxDocs <= 0) {
      return res.status(403).json({
        error: "Seu plano atual não permite utilizar a área de assinaturas. Por favor, faça um upgrade para acessar este recurso.",
      });
    }

    // Verificar limite máximo
    const activeCount = await SignatureRequest.count({
      where: { userId: ownerId },
    });

    if (activeCount >= maxDocs) {
      return res.status(403).json({
        error: `Você atingiu o limite de ${maxDocs} documentos na área de assinaturas do seu plano (${userPlan.name}). Remova documentos antigos ou faça um upgrade de plano.`,
      });
    }

    // Calcular expiresAt
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const request = await SignatureRequest.create({
      userId: ownerId,
      title,
      content,
      expiresAt,
    });

    res.status(201).json({
      ...request.toJSON(),
      maxDocs,
      expiryDays,
      activeCount: activeCount + 1,
    });
  } catch (error) {
    console.error("Erro ao criar link de assinatura:", error);
    res.status(500).json({ error: "Erro ao gerar solicitação de assinatura" });
  }
});

// [PRIVADO] Cancelar / Deletar uma solicitação
router.delete("/:id", auth, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;
    const deleted = await SignatureRequest.destroy({
      where: { id: req.params.id, userId: ownerId },
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

    const ownerId = req.user.parentUserId || req.user.id;
    const request = await SignatureRequest.findOne({
      where: { id, userId: ownerId },
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

// [PRIVADO] Verificar integridade de um documento assinado
router.get("/:id/verify", auth, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;
    const request = await SignatureRequest.findOne({
      where: { id: req.params.id, userId: ownerId },
    });

    if (!request) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }

    // Recalcular hash do conteúdo atual
    const currentHash = crypto
      .createHash("sha512")
      .update(request.content)
      .digest("hex");

    const isIntact = currentHash === request.documentHash;

    res.json({
      isIntact,
      documentHash: request.documentHash,
      signatureHash: request.signatureHash,
      verificationCode: request.verificationCode,
      signedAt: request.signedAt,
      signerName: request.signerName,
      signerEmail: request.signerEmail,
      status: request.status,
    });
  } catch (error) {
    console.error("Erro ao verificar documento:", error);
    res.status(500).json({ error: "Erro ao verificar integridade." });
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
      include: [{ model: User }],
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
    const { cpf, signerName, signerEmail, signerPhone, signatureImage } = req.body;

    if (!cpf || !signerName || !signerEmail || !signerPhone) {
      return res
        .status(400)
        .json({ error: "Nome, CPF/CNPJ, Email e Telefone são obrigatórios para assinar." });
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signerEmail)) {
      return res.status(400).json({ error: "Email inválido." });
    }

    // Validação de CPF (11 dígitos) ou CNPJ (14 dígitos)
    const cleanDoc = cpf.replace(/\D/g, "");
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      return res.status(400).json({ error: "CPF ou CNPJ inválido." });
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
    const userAgent = req.headers["user-agent"] || "Desconhecido";
    const signedAt = new Date();

    // Gerar hash criptográfico da assinatura (SHA-512)
    // Combina: nome + cpf + email + telefone + ip + timestamp + hash do documento original
    const signaturePayload = [
      signerName,
      cleanDoc,
      signerEmail,
      signerPhone,
      ip,
      signedAt.toISOString(),
      request.documentHash,
    ].join("|");

    const signatureHash = crypto
      .createHash("sha512")
      .update(signaturePayload)
      .digest("hex");

    // Registrar a assinatura
    request.status = "ASSINADO";
    request.signerName = signerName;
    request.signerCpf = cleanDoc;
    request.signerEmail = signerEmail;
    request.signerPhone = signerPhone;
    request.signerIp = ip;
    request.signerUserAgent = userAgent;
    request.signatureImage = signatureImage || null;
    request.signedAt = signedAt;
    request.signatureHash = signatureHash;
    await request.save();

    res.json({
      message: "Documento assinado com sucesso!",
      signatureHash,
      verificationCode: request.verificationCode,
      signedAt,
    });
  } catch (error) {
    console.error("Erro ao assinar documento:", error);
    res.status(500).json({ error: "Erro interno ao registrar assinatura." });
  }
});

// [PÚBLICO] Verificar assinatura pelo código de verificação
router.get("/verify/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const request = await SignatureRequest.findOne({
      where: { verificationCode: code.toUpperCase() },
      attributes: [
        "title", "status", "signerName", "signerCpf", "signerEmail",
        "signedAt", "documentHash", "signatureHash", "verificationCode", "createdAt",
      ],
      include: [{ model: User, attributes: ["nome", "oab"] }],
    });

    if (!request) {
      return res.status(404).json({
        valid: false,
        error: "Código de verificação não encontrado.",
      });
    }

    // Recalcular integridade (exceto o content que não é carregado aqui)
    res.json({
      valid: true,
      title: request.title,
      status: request.status,
      signerName: request.signerName,
      signerDocument: request.signerCpf ? `***.***.${request.signerCpf.slice(-5, -2)}-${request.signerCpf.slice(-2)}` : null,
      signerEmail: request.signerEmail ? request.signerEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null,
      signedAt: request.signedAt,
      documentHash: request.documentHash ? `${request.documentHash.slice(0, 16)}...` : null,
      signatureHash: request.signatureHash ? `${request.signatureHash.slice(0, 16)}...` : null,
      verificationCode: request.verificationCode,
      createdAt: request.createdAt,
      lawyerName: request.User?.nome,
      lawyerOab: request.User?.oab,
    });
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    res.status(500).json({ error: "Erro ao verificar assinatura." });
  }
});

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
      clientSignerEmail: request.signerEmail,
      clientSignerPhone: request.signerPhone,
      clientSignatureImage: request.signatureImage,
      lawyerSignatureImage: request.lawyerSignatureImage,
      signatureHash: request.signatureHash,
      verificationCode: request.verificationCode,
      documentHash: request.documentHash,
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
