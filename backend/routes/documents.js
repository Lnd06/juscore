import express from "express";
import multer from "multer";
import path from "path";
import { auth, authEspecial } from "../middleware/auth.js";
import { Document, Process, Client, UserUsage } from "../models/index.js";
import { generateProfessionalPDF } from "../services/pdfGenerator.js";
import { chamarGemini } from "../services/geminiService.js";
import { anonymizeText, deanonymizeText } from "../services/anonymizerService.js";
import { buscarPorCategoria } from "../services/ragService.js";
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
      clientId,
    } = req.body;

    if (!prompt) {
      return res
        .status(400)
        .json({ error: "O comando para a IA é obrigatório" });
    }

    // 1. Verificar Limites do Plano (e criar/rastrear uso dinâmico para o BI)
    const plan = getPlanConfig(
      req.user.subscriptionPlan || req.user.tipo || "free",
    );
    let [usage] = await UserUsage.findOrCreate({
      where: { userId: req.user.id },
      defaults: { userId: req.user.id },
    });
    await usage.checkAndReset();
    if (plan.limits.dailyDocuments < 9999 && usage.dailyDocuments >= plan.limits.dailyDocuments) {
      return res.status(403).json({
        error: "Limite diário de documentos atingido para o seu plano.",
        limit: plan.limits.dailyDocuments,
      });
    }

    // 2. Coletar Contexto do Processo ou do Cliente (se houver)
    let contextProcesso = "";
    if (clientId) {
      try {
        const clientData = await Client.findOne({
          where: { id: clientId, userId: req.user.id },
          include: [{ model: Process, as: "processes" }],
        });

        if (clientData) {
          contextProcesso = `
          === DADOS DO CLIENTE VINCULADO ===
          - Nome: ${clientData.nome}
          - E-mail: ${clientData.email || "Não informado"}
          - Telefone: ${clientData.telefone || "Não informado"}
          - CPF/CNPJ: ${clientData.cpf_cnpj || "Não informado"}
          - Endereço: ${clientData.endereco || "Não informado"}
          - Nacionalidade: ${clientData.nacionalidade || "Não informado"}
          - Estado Civil: ${clientData.estado_civil || "Não informado"}
          - Profissão: ${clientData.profissao || "Não informado"}
          `;

          if (clientData.processes && clientData.processes.length > 0) {
            contextProcesso += `\n          === PROCESSOS VINCULADOS AO CLIENTE ===`;
            clientData.processes.forEach((proc, idx) => {
              contextProcesso += `
          [Processo #${idx + 1}]
          - Número: ${proc.numero}
          - Tribunal/Vara: ${proc.tribunal || "Não informado"} / ${proc.vara || "Não informado"}
          - Status: ${proc.status || "Não informado"}
          - Descrição: ${proc.descricao || "Não informado"}
          - Valor da Causa: R$ ${proc.valorCausa || "Não informado"}
          - Partes: ${JSON.stringify(proc.partes || {})}
              `;
            });
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados do cliente para o gerador:", err);
      }
    } else if (processId) {
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

    // 2.5 Buscar modelos na biblioteca (RAG para documentos)
    const modelosCategoriaDocs = buscarPorCategoria("DOCUMENTOS", 3);
    const modelosCategoriaModelos = buscarPorCategoria("MODELO_DOCUMENTO", 3);
    const todosModelos = [...modelosCategoriaDocs, ...modelosCategoriaModelos];
    
    let contextoBiblioteca = "";
    if (todosModelos.length > 0) {
      contextoBiblioteca = `\n\n📖 MODELOS DE DOCUMENTO DISPONÍVEIS NA BIBLIOTECA (USE COMO MOLDE/INSPIRAÇÃO):\n` +
        todosModelos.map(d => `[Modelo: ${d.title}]\n${d.content}`).join("\n\n");
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
    ${contextoBiblioteca}
    
    COMANDO DO USUÁRIO: ${prompt}`;

    // Selecionar o melhor modelo do plano do usuário (Preferência por Flash para Documentos rápidos)
    const selectedModel = plan.models.default || "gemini-2.5-flash";
    console.log(`📄 [DOCUMENT MODO] Gerando documento com o modelo: ${selectedModel}`);

    // Anonimizar todas as mensagens enviadas para a IA (Privacidade Total & LGPD Compliance)
    const combinedMapping = {};
    const { anonymizedText: anonymizedSystem, mapping: mapSys } = anonymizeText(systemPrompt);
    const { anonymizedText: anonymizedUser, mapping: mapUser } = anonymizeText(prompt);
    Object.assign(combinedMapping, mapSys, mapUser);

    const rawAiContent = await chamarGemini(
      [{ role: "system", content: anonymizedSystem }, { role: "user", content: anonymizedUser }],
      selectedModel,
    );

    // Desanonimizar a resposta da IA para restaurar dados reais no documento final
    const aiContent = deanonymizeText(rawAiContent, combinedMapping);

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
