import express from "express";
import { auth } from "../middleware/auth.js";
import { usageLimiter } from "../middleware/usageLimiter.js";
import { Conversation, User, Process, Client, UserUsage } from "../models/index.js";
import crypto from "crypto";
import { verificarPoliticas } from "../services/moderationService.js";
import { analisarContexto } from "../services/contextAnalyzerService.js";
import { buscarPorCategoria } from "../services/ragService.js";
import { buildSystemPrompt, buildLibraryContext } from "../prompts/systemPrompt.js";
import { chamarGeminiPrincipal, chamarGeminiPrincipalStream } from "../services/geminiService.js";
import { resolverModeloEPlano } from "../utils/modelResolver.js";
import { obterContextoExterno } from "../services/contextService.js";
import { anonymizeText, deanonymizeText } from "../services/anonymizerService.js";
import {
  formatarProcessoVinculado,
  recortarHistoricoSeguro,
  sanitizarMensagensParaSalvar,
  gerenciarLimiteConversas
} from "../services/chatService.js";

const router = express.Router();

/* =========================
   CHAT PRINCIPAL
========================= */

router.post("/", auth, usageLimiter("conversations"), async (req, res) => {
  try {
    // Detecção de desconexão do cliente
    let cancelled = false;
    req.on("close", () => {
      cancelled = true;
    });

    let {
      mensagem,
      sessionId,
      imagem,
      model = "company",
      processId,
      clientId,
    } = req.body;



    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    if (!mensagem || !mensagem.trim()) {
      if (imagem) {
        mensagem = "Analise o arquivo enviado em detalhes.";
      } else {
        return res.status(400).json({ error: "Mensagem vazia" });
      }
    }

    const userId = req.user.id;

    // Verificar se o usuário existe no banco
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`❌ Usuário não encontrado no banco: ${userId}`);
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const apelido = user.apelido || req.user.apelido || "Usuário";

    // 1. --- RESOLVER MODELO E VERIFICAR LIMITES DO PLANO ---
    const {
      model: resolvedModel,
      userPlan,
      planSlug
    } = await resolverModeloEPlano(req, model);

    // Validação estrita de acesso e limite diário do Deep Research
    if (model === "deep-research" || (resolvedModel && resolvedModel.includes("deep-research"))) {
      // 1. Verificar se o plano dá acesso ao Deep Research
      if (!userPlan.features || !userPlan.features.deepResearch) {
        return res.status(403).json({
          error: "Recurso Exclusivo",
          message: "O recurso Deep Research é exclusivo de planos acadêmicos avançados (Estudante Pro ou superior) ou planos profissionais superiores. Faça upgrade para acessar!",
          upgradeRequired: true
        });
      }

      // 2. Verificar o limite de uso diário
      const [usage] = await UserUsage.findOrCreate({
        where: { userId },
        defaults: { userId }
      });
      await usage.checkAndReset();

      const limit = userPlan.limits.dailyDeepResearch || 0;
      if (usage.dailyDeepResearch >= limit) {
        return res.status(403).json({
          error: "Limite Diário Atingido",
          message: `O seu limite diário para buscas no Deep Research acabou para o plano ${userPlan.name}. Faça upgrade ou aguarde até amanhã para continuar pesquisando!`,
          upgradeRequired: true
        });
      }

      // Incrementar uso do Deep Research
      usage.dailyDeepResearch += 1;
      await usage.save();
      console.log(`📈 [DEEP RESEARCH] Uso incrementado para o usuário ${userId}. Uso atual: ${usage.dailyDeepResearch}/${limit}`);
    }



    // Buscar ou criar conversa
    let conversa = await Conversation.findOne({
      where: { userId, sessionId },
    });

    let msgs = [];
    if (!conversa) {
      conversa = await Conversation.create({
        userId,
        sessionId,
        titulo: mensagem.slice(0, 50) + "...",
        mensagens: [],
      });
      msgs = [];
    } else {
      msgs = Array.isArray(conversa.mensagens)
        ? conversa.mensagens
        : JSON.parse(conversa.mensagens || "[]");
    }

    // Salvar mensagem do usuário no histórico em memória
    let contentPayload = mensagem;
    if (imagem) {
      contentPayload = [
        { type: "text", text: mensagem },
        { type: "image_url", image_url: { url: imagem } },
      ];
    }

    msgs.push({
      role: "user",
      content: contentPayload,
    });

    // 2. --- SEGURANÇA E ANÁLISE INICIAL (MODERAÇÃO DESATIVADA PARA OTIMIZAR LATÊNCIA) ---
    /*
    const violaçao = await verificarPoliticas(mensagem);
    if (violaçao) {
      console.warn(`⚠️ VIOLAÇÃO DETECTADA: [${violaçao}]`);
      conversa.flagged = true;
      conversa.flagReason = violaçao;
      await conversa.save();
    }
    */

    const analise = analisarContexto(mensagem, msgs);

    // Verificar se estamos sob contexto visual
    const isVisionContext = msgs.some((m) => Array.isArray(m.content));
    const isDeepResearchModel = (req.body.model === "deep-research") || (resolvedModel && resolvedModel.includes("deep-research"));

    // 3. --- AGREGAR CONTEXTO EXTERNO EM TEMPO REAL ---
    const {
      contextoPlanalto,
      atosDOU,
      contextoDOU,
      contextoBiblioteca,
      aborted
    } = await obterContextoExterno({
      mensagem,
      analise,
      model: resolvedModel,
      isVisionContext,
      isDeepResearchModel,
      cancelledCheck: () => cancelled
    });

    if (aborted || cancelled) {
      console.log("⛔ CANCELADO - Abortando processamento por desconexão do cliente.");
      return;
    }

    // 4. --- DETECTAR E VINCULAR CONTEXTO DO PROCESSO E CLIENTE ---
    let contextoProcesso = "";
    if (clientId) {
      try {
        const clientData = await Client.findOne({
          where: { id: clientId, userId },
          include: [{ model: Process, as: "processes" }],
        });

        if (clientData) {
          console.log(`📎 Cliente ${clientData.nome} vinculado à conversa (ID: ${clientId}).`);
          contextoProcesso = `
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
            contextoProcesso += `\n=== PROCESSOS VINCULADOS AO CLIENTE ===`;
            clientData.processes.forEach((proc, idx) => {
              contextoProcesso += `
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
        } else {
          console.log(`📎 ⚠️ Cliente com ID ${clientId} NÃO ENCONTRADO para o usuário ${userId}.`);
        }
      } catch (err) {
        console.error("Erro ao puxar dados do cliente para injetar no LLM:", err);
      }
    } else if (processId) {
      try {
        const procData = await Process.findOne({
          where: { id: processId, userId },
          include: [
            {
              model: Client,
              attributes: [
                "nome",
                "email",
                "telefone",
                "cpf_cnpj",
                "endereco",
                "nacionalidade",
                "estado_civil",
                "profissao",
              ],
            },
          ],
        });

        if (procData) {
          console.log(`📎 Processo ${procData.numero} vinculado à conversa (ID: ${processId}).`);
          contextoProcesso = formatarProcessoVinculado(procData);
        } else {
          console.log(`📎 ⚠️ Processo com ID ${processId} NÃO ENCONTRADO para o usuário ${userId}.`);
        }
      } catch (err) {
        console.error("Erro ao puxar dados do processo para injetar no LLM:", err);
      }
    }

    // 5. --- CONSTRUIR SYSTEM PROMPT ---
    const totalConversations = await Conversation.count({ where: { userId } });
    const isFirstInteraction = totalConversations <= 1 && msgs.length === 1;

    let introInstruction = "";
    if (isFirstInteraction && !isVisionContext) {
      introInstruction = `0. PRIORIDADE MÁXIMA - PRIMEIRA INTERAÇÃO: Esta é a PRIMEIRA vez que este usuário fala com você. Apresente-se formalmente como "JusCore AI, seu Núcleo de Assistência Jurídica". Dê as boas-vindas ao usuário ${apelido}.`;
    } else if (isVisionContext) {
      introInstruction = `0. PRIORIDADE MÁXIMA - ANÁLISE VISUAL: O usuário enviou uma IMAGEM. Sua tarefa PRINCIPAL é analisar o conteúdo visual desta imagem em detalhes e responder à pergunta do usuário sobre ela. Ignore apresentações formais longas. Foque na descricão e análise jurídica do documento ou cena visualizada.`;
    }

    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const systemPrompt = buildSystemPrompt({
      dataAtual,
      apelido,
      model: resolvedModel,
      contextoProcesso,
      introInstruction
    });

    const libraryCtx = buildLibraryContext(contextoBiblioteca);

    // Truncar histórico para se manter seguro
    const safeHistory = recortarHistoricoSeguro(msgs);

    const messages = [
      systemPrompt,
      ...(contextoPlanalto ? [{ role: "system", content: contextoPlanalto }] : []),
      ...(contextoDOU ? [{ role: "system", content: contextoDOU }] : []),
      ...(libraryCtx ? [libraryCtx] : []),
      ...safeHistory,
    ];

    // Configurar cancelamento assíncrono para chamada da IA
    const controller = new AbortController();
    const { signal } = controller;
    let requestFinished = false;

    const onDisconnect = () => {
      if (!requestFinished && !signal.aborted) {
        console.log("⛔ ❗ CLIENTE DESCONECTOU - Cancelando requisição da IA...");
        controller.abort();
      }
    };
    req.on("close", onDisconnect);

    if (signal.aborted || cancelled) {
      console.log("⛔ CANCELADO - Parando antes de invocar a IA.");
      return;
    }

    // Anonimizar todas as mensagens enviadas para a IA (Privacidade Total & LGPD Compliance)
    const anonymizationMapping = {};
    const anonymizedMessages = messages.map(msg => {
      if (typeof msg.content === "string") {
        const { anonymizedText, mapping } = anonymizeText(msg.content);
        Object.assign(anonymizationMapping, mapping);
        return { ...msg, content: anonymizedText };
      } else if (Array.isArray(msg.content)) {
        const anonymizedContent = msg.content.map(part => {
          if (part.type === "text") {
            const { anonymizedText, mapping } = anonymizeText(part.text);
            Object.assign(anonymizationMapping, mapping);
            return { ...part, text: anonymizedText };
          }
          return part;
        });
        return { ...msg, content: anonymizedContent };
      }
      return msg;
    });



    const shouldStream = req.body.stream === true;
    let rawResposta = "";

    if (shouldStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();


      rawResposta = await chamarGeminiPrincipalStream(
        anonymizedMessages,
        resolvedModel,
        signal,
        isDeepResearchModel,
        (chunk) => {
          const cleanChunk = deanonymizeText(chunk, anonymizationMapping);
          res.write(`data: ${JSON.stringify({ text: cleanChunk })}\n\n`);
        }
      );
    } else {

      rawResposta = await chamarGeminiPrincipal(
        anonymizedMessages,
        resolvedModel,
        signal,
        isDeepResearchModel
      );
    }


    // Desanonimizar a resposta da IA para restaurar dados reais no dashboard do usuário
    const resposta = deanonymizeText(rawResposta, anonymizationMapping);

    if (signal.aborted || resposta === "Requisição cancelada.") {
      console.log("🚫 Requisição abortada pelo usuário. Não salvando no banco.");
      if (shouldStream) {
        res.end();
      }
      return;
    }

    // Adicionar resposta do assistente no histórico em memória
    msgs.push({
      role: "assistant",
      content: resposta,
      model: resolvedModel,
    });

    // 7. --- SANITIZAR HISTÓRICO E PERSISTIR NO BANCO ---
    const safeMsgsToSave = sanitizarMensagensParaSalvar(msgs);
    conversa.mensagens = safeMsgsToSave;
    conversa.changed("mensagens", true);
    await conversa.save();

    // Gerenciar limite de 15 conversas e previews
    await gerenciarLimiteConversas(user, userId, conversa, mensagem, sessionId);

    requestFinished = true;

    if (shouldStream) {
      res.write(`data: ${JSON.stringify({
        done: true,
        resposta,
        sessionId,
        fontes: { planalto: !!contextoPlanalto, dou: atosDOU.length },
        ultimasConversas: user.ultimasConversas
      })}\n\n`);
      res.end();
    } else {
      res.json({
        resposta,
        sessionId,
        fontes: { planalto: !!contextoPlanalto, dou: atosDOU.length },
        ultimasConversas: user.ultimasConversas,
      });
    }
  } catch (error) {
    console.error("❌ ERRO NO CHAT:", error);
    console.error(error.stack);
    res.status(500).json({
      error: "Erro ao processar mensagem",
      resposta: "⚠️ Serviço temporariamente indisponível. Tente novamente.",
    });
  }
});

/* =========================
   HISTÓRICO
========================= */

router.get("/history", auth, async (req, res) => {
  try {
    const conversas = await Conversation.findAll({
      where: { userId: req.user.id },
      order: [["updatedAt", "DESC"]],
      limit: 15,
      attributes: ["titulo", "sessionId", "updatedAt"],
    });

    res.json(conversas);
  } catch {
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

router.get("/:sessionId", auth, async (req, res) => {
  try {
    const where = { sessionId: req.params.sessionId };
    if (req.user.tipo !== "admin" && req.user.tipo !== "especial") {
      where.userId = req.user.id;
    }


    const conversa = await Conversation.findOne({
      where,
      include: [{ model: User, attributes: ["nome", "email", "apelido"] }],
    });



    if (!conversa) {
      console.log(`❌ Conversa ${req.params.sessionId} não encontrada`);
      return res.status(404).json({ error: "Conversa não encontrada" });
    }
    res.json(conversa);
  } catch (error) {
    console.error("Erro ao buscar conversa:", error);
    res.status(500).json({ error: "Erro ao buscar conversa" });
  }
});

/* =========================
   PLANO GUARD: Estudante Pro
========================= */

function requireStudentPro(req, res, next) {
  const plan = req.user?.subscriptionPlan || "free";
  const tipo = req.user?.tipo || "comum";
  const allowed = [
    "student_pro",
    "student_master",
    "lawyer_starter",
    "lawyer_growth",
    "office_master",
    "enterprise",
    "master",
    "admin",
    "especial"
  ];
  if (allowed.includes(plan) || tipo === "master" || tipo === "admin") {
    return next();
  }
  return res.status(403).json({
    error: "Recurso Exclusivo",
    message:
      "Este recurso é exclusivo do plano Estudante Pro ou superior. Faça upgrade para acessar!",
    upgradeRequired: true,
  });
}

/* =========================
   SIMULADOR DE PEÇAS OAB
========================= */

router.post("/oab-simulator", auth, requireStudentPro, async (req, res) => {
  const { tipoPeca, areaDireito, enunciado, textoPeca } = req.body;

  if (!tipoPeca || !enunciado || !textoPeca) {
    return res.status(400).json({
      error: "Tipo de peça, enunciado e texto da peça são obrigatórios.",
    });
  }

  const systemPrompt = `Você é um avaliador experiente da OAB (Ordem dos Advogados do Brasil), especialista em provas de segunda fase.
Sua função é corrigir peças jurídicas de candidatos ao exame da OAB com precisão e clareza.

Ao receber uma peça, você deve:
1. Atribuir uma **nota de 0 a 10** baseada nos critérios da banca CESPE/CEBRASPE
2. Identificar **pontos fortes** da peça
3. Identificar **pontos a melhorar** (erros graves que zeram, falhas estruturais, argumentos ausentes)
4. Apresentar a **estrutura ideal** para o tipo de peça solicitado
5. Dar uma **dica final** motivacional e técnica

Critérios de avaliação:
- Adequação ao tipo de peça (petição, recurso, etc.)
- Fundamentação jurídica (citar artigos, jurisprudência, princípios)
- Estrutura formal (endereçamento, qualificação, pedidos, fecho)
- Linguagem jurídica técnica e clara
- Atendimento ao enunciado (pedir o que foi pedido, nada mais)

Responda em português usando markdown, com as seções claramente separadas por cabeçalhos.`;

  const userMessage = `**Tipo de Peça:** ${tipoPeca}
**Área do Direito:** ${areaDireito || "Não especificada"}

**Enunciado/Caso Prático:**
${enunciado}

**Peça do Candidato:**
${textoPeca}`;

  // Injetar contexto específico do simulador OAB (via RAG)
  let oabContext = "";
  const oabDocs = buscarPorCategoria("OAB", 3);
  if (oabDocs.length > 0) {
    oabContext =
      "\n\n## Base de Conhecimento OAB:\n" +
      oabDocs
        .map((d) => `### ${d.title}\n${d.content}`)
        .join("\n\n");
  }

  try {
    const getPlanConfig = (await import("../config/plans/index.js")).default;
    const planSlug =
      req.user.subscriptionPlan && req.user.subscriptionPlan !== "free"
        ? req.user.subscriptionPlan
        : req.user.tipo || "free";
    const userPlan = getPlanConfig(planSlug);
    const selectedModel = userPlan.models.default || "gemini-2.5-flash";

    console.log(
      `⚖️ [OAB] Chamando IA: ${selectedModel} (Plan: ${userPlan.name})`,
    );

    const systemPromptAndContext = systemPrompt + oabContext;
    const { anonymizedText: anonymizedSystem, mapping: mapSys } = anonymizeText(systemPromptAndContext);
    const { anonymizedText: anonymizedUser, mapping: mapUser } = anonymizeText(userMessage);
    const combinedMapping = { ...mapSys, ...mapUser };

    const rawResposta = await chamarGeminiPrincipal(
      [
        { role: "system", content: anonymizedSystem },
        { role: "user", content: anonymizedUser },
      ],
      selectedModel,
    );

    const resposta = deanonymizeText(rawResposta, combinedMapping);
    res.json({ resultado: resposta });
  } catch (error) {
    console.error("Erro no Simulador OAB:", error);
    res.status(500).json({ error: "Erro ao processar avaliação da peça." });
  }
});

/* =========================
   ASSISTENTE TCC
========================= */

router.post("/tcc-assistant", auth, requireStudentPro, async (req, res) => {
  const { secao, tema, duvida, historico } = req.body;

  if (!duvida) {
    return res
      .status(400)
      .json({ error: "A dúvida/orientação é obrigatória." });
  }

  const systemPrompt = `Você é um orientador acadêmico especializado em Trabalhos de Conclusão de Curso (TCC) na área do Direito.

${tema ? `CONTEXTO ATUAL - TEMA DO TCC: **${tema}**` : "TEMA DO TCC: Não definido ainda pelo estudante."}
${secao ? `ESTÁGIO ATUAL - SEÇÃO DO TRABALHO: **${secao}**` : "SEÇÃO ATUAL: O estudante está em fase inicial ou geral."}

Você auxilia estudantes de graduação e pós-graduação em Direito a estruturar, escrever e aprimorar seus TCCs. Suas respostas devem ser SEMPRE contextualizadas ao Tema e à Seção informados acima.

Suas competências:
- Ajudar a definir recortes temáticos, hipóteses e objetivos
- Orientar a estrutura ABNT (NBR 14724) — capa, sumário, referências, citações
- Sugerir doutrina, legislação e jurisprudência relevantes para o tema
- Revisar argumentação jurídica e coerência lógica
- Redigir ou melhorar partes específicas do texto (introdução, desenvolvimento, conclusão)
- Listar referências bibliográficas no formato ABNT correto
- Explicar conceitos de metodologia jurídica (pesquisa dogmática, empírica, bibliográfica)

Mantenha sempre um tom acadêmico, preciso e encorajador. Responda em português usando markdown.`;

  // Injetar contexto específico do TCC (via RAG)
  let tccContext = "";
  const tccDocs = buscarPorCategoria("TCC", 3);
  if (tccDocs.length > 0) {
    tccContext =
      "\n\n## Material de Apoio TCC:\n" +
      tccDocs
        .map((d) => `### ${d.title}\n${d.content}`)
        .join("\n\n");
  }

  const messages = [
    { role: "system", content: systemPrompt + tccContext },
    ...(historico || []),
    { role: "user", content: duvida },
  ];

  try {
    const getPlanConfig = (await import("../config/plans/index.js")).default;
    const planSlug =
      req.user.subscriptionPlan && req.user.subscriptionPlan !== "free"
        ? req.user.subscriptionPlan
        : req.user.tipo || "free";
    const userPlan = getPlanConfig(planSlug);
    const selectedModel = userPlan.models.default || "gemini-2.5-flash";

    console.log(
      `🎓 [TCC] Chamando IA: ${selectedModel} (Plan: ${userPlan.name})`,
    );

    const anonymizationMapping = {};
    const anonymizedMessages = messages.map(msg => {
      if (typeof msg.content === "string") {
        const { anonymizedText, mapping } = anonymizeText(msg.content);
        Object.assign(anonymizationMapping, mapping);
        return { ...msg, content: anonymizedText };
      } else if (Array.isArray(msg.content)) {
        const anonymizedContent = msg.content.map(part => {
          if (part.type === "text") {
            const { anonymizedText, mapping } = anonymizeText(part.text);
            Object.assign(anonymizationMapping, mapping);
            return { ...part, text: anonymizedText };
          }
          return part;
        });
        return { ...msg, content: anonymizedContent };
      }
      return msg;
    });

    const rawResposta = await chamarGeminiPrincipal(anonymizedMessages, selectedModel);
    const resposta = deanonymizeText(rawResposta, anonymizationMapping);
    res.json({ resposta });
  } catch (error) {
    console.error("Erro no Assistente TCC:", error);
    res.status(500).json({ error: "Erro ao processar sua dúvida." });
  }
});

export default router;
