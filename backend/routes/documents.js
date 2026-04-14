import express from "express";
import multer from "multer";
import path from "path";
import { auth, authEspecial } from "../midleware/auth.js";
import { Document, Process, Client, UserUsage } from "../models/index.js";
import { generateProfessionalPDF } from "../services/pdfGenerator.js";
import { chamarGroqDireto } from "../services/groqService.js";
import getPlanConfig from "../config/plans/index.js";

const router = express.Router();

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/documents/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas PDFs são permitidos"));
    }
  },
});

// Listar documentos
router.get("/", auth, async (req, res) => {
  try {
    const docs = await Document.findAll({
      where: { ativo: true },
      attributes: { exclude: ["conteudo"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar documentos" });
  }
});

// Upload de PDF (apenas especial)
router.post("/upload", authEspecial, upload.single("pdf"), async (req, res) => {
  try {
    const { titulo, categoria, tipo = "modelo" } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const doc = await Document.create({
      titulo,
      tipo,
      categoria: categoria || "outro",
      conteudo: "Conteúdo do PDF enviado...",
      variaveis: [], // Será implementado manualmente no futuro se necessário
      arquivoPDF: {
        nome: req.file.originalname,
        caminho: req.file.path,
        tamanho: req.file.size,
      },
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      message: "Documento enviado com sucesso",
      documento: doc,
    });
  } catch (error) {
    console.error("Erro upload:", error);
    res.status(500).json({ error: "Erro ao processar arquivo" });
  }
});

// Deletar documento (especial)
router.delete("/:id", authEspecial, async (req, res) => {
  try {
    await Document.update(
      { ativo: false },
      {
        where: { id: req.params.id },
      },
    );
    res.json({ message: "Documento removido" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover documento" });
  }
});

// Gerar documento com IA (Normas ABNT e contexto de processo)
router.post("/generate-ai", auth, async (req, res) => {
  try {
    const {
      title,
      prompt,
      lawyerName,
      officeName,
      oabNumber,
      address,
      date,
      logo,
      processId,
    } = req.body;

    if (!prompt) {
      return res
        .status(400)
        .json({ error: "O comando para a IA é obrigatório" });
    }

    // 1. Verificar Limites do Plano
    const usage = await UserUsage.findOne({ where: { userId: req.user.id } });
    if (usage) {
      await usage.checkAndReset();
      const plan = getPlanConfig(
        req.user.subscriptionPlan || req.user.tipo || "free",
      );
      if (usage.dailyDocuments >= plan.limits.dailyDocuments) {
        return res.status(403).json({
          error: "Limite diário de documentos atingido para o seu plano.",
          limit: plan.limits.dailyDocuments,
        });
      }
    }

    // 2. Coletar Contexto do Processo (se houver)
    let contextProcesso = "";
    if (processId) {
      const proc = await Process.findOne({
        where: { id: processId, userId: req.user.id },
        include: [{ model: Client }],
      });

      if (proc) {
        contextProcesso = `
          DADOS DO PROCESSO VINCULADO:
          - Número: ${proc.numero}
          - Tribunal/Vara: ${proc.tribunal} / ${proc.vara}
          - Status: ${proc.status}
          - Valor: R$ ${proc.valorCausa || "Não informado"}
          - Partes: ${JSON.stringify(proc.partes)}
          - Cliente: ${proc.Client?.nome || "N/A"} (${proc.Client?.cpf_cnpj || "N/A"})
        `;
      }
    }

    // 3. Chamar IA para gerar o texto
    const systemPrompt = `Você é um advogado sênior especialista em redação jurídica brasileira.
    Sua tarefa é redigir um documento jurídico formal seguindo estritamente as normas da ABNT e a linguagem técnica adequada.
    
    DIRETRIZES:
    - O documento deve ser: ${title || "Documento Jurídico"}.
    - Use um tom formal, objetivo e profissional.
    - Se houver dados de um processo vinculado, use-os para preencher os fatos e fundamentos.
    - Se faltarem dados específicos (como nomes de terceiros), use placeholders genéricos como "(Nome)" ou "(CPF)".
    - NÃO inclua conversas, introduções como "Aqui está seu documento" ou conclusões. Comece diretamente no título ou preâmbulo e termine no encerramento.
    
    ${contextProcesso}
    
    COMANDO DO USUÁRIO: ${prompt}`;

    const aiContent = await chamarGroqDireto(
      [{ role: "system", content: systemPrompt }],
      "llama-3.3-70b-versatile",
    );

    // 4. Gerar PDF
    const pdfDoc = await generateProfessionalPDF(aiContent, {
      title: title || "Documento Jurídico",
      lawyerName,
      officeName,
      oabNumber,
      address,
      date,
      logo, // Base64 esperado
      user: req.user,
    });

    // 5. Incrementar Uso
    if (usage) {
      usage.dailyDocuments += 1;
      await usage.save();
    }

    // 6. Converter para Buffer e enviar via Base64 para máxima compatibilidade
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const filename =
        (title || "documento").replace(/[/\\?%*:|"<>]/g, "-") + ".pdf";

      res.json({
        success: true,
        pdf: buffer.toString("base64"),
        filename: filename,
        rawContent: aiContent,
      });
    });
  } catch (error) {
    console.error("Erro generate-ai:", error);
    res.status(500).json({ error: "Erro ao gerar documento com IA" });
  }
});

export default router;
