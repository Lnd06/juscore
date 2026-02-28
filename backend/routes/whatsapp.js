import express from "express";
import { auth } from "../midleware/auth.js";
import { WhatsappInstance, User } from "../models/index.js";
import * as evolutionApi from "../services/evolutionApi.js";
import { chamarGroqDireto } from "../services/groqService.js";

const router = express.Router();

/**
 * Helper to get the total number of allowed instances based on the owner's plan
 */
const getWhatsappLimit = (plan) => {
  if (plan === "lawyer_growth") return 1;
  if (plan === "office_master") return 2;
  if (plan === "enterprise") return 999;
  return 0;
};

// ==========================================
// FRONTEND ROUTES (Requires Authentication)
// ==========================================

// Get all instances belonging to the logged-in user (or their parent)
router.get("/", auth, async (req, res) => {
  try {
    const ownerId =
      req.user.tipo === "comum" || req.user.tipo === "especial"
        ? req.user.parentUserId || req.user.id
        : req.user.id;

    const instances = await WhatsappInstance.findAll({
      where: { userId: ownerId },
    });

    // For each instance, fetch the latest connection state from Evolution API
    // if it's not disconnected or expired
    const updatedInstances = await Promise.all(
      instances.map(async (inst) => {
        if (inst.status !== "disconnected" && inst.status !== "expired") {
          try {
            const statusCheck = await evolutionApi.checkConnectionState(
              inst.instanceName,
            );
            const remoteState = statusCheck?.instance?.state || "disconnected";

            if (inst.status !== remoteState) {
              inst.status = remoteState === "open" ? "connected" : remoteState;
              await inst.save();
            }
          } catch (e) {
            console.error(
              `Failed to check state for ${inst.instanceName}:`,
              e.message,
            );
          }
        }
        return inst;
      }),
    );

    res.json(updatedInstances);
  } catch (error) {
    console.error("Error fetching WhatsApp instances:", error);
    res.status(500).json({ error: "Erro ao buscar instâncias do WhatsApp" });
  }
});

// Create a new instance
router.post("/create", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Only office owners or admins should create instances usually
    // But let's allow "especial" to create if they have slot
    const ownerId = user.parentUserId || user.id;
    const owner = ownerId === user.id ? user : await User.findByPk(ownerId);

    const limit = getWhatsappLimit(owner.subscriptionPlan);
    if (limit <= 0) {
      return res.status(403).json({
        error: "Seu plano não permite integração com WhatsApp Inteligente.",
      });
    }

    const currentCount = await WhatsappInstance.count({
      where: { userId: owner.id },
    });
    if (currentCount >= limit) {
      return res.status(403).json({
        error: `Você atingiu o limite de ${limit} robôs do WhatsApp do seu plano.`,
      });
    }

    const { name, companyName, assistantRole } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ error: "O apelido da instância é obrigatório" });

    // Generate a unique instance name for the Evolution API to prevent collisions
    const uniqueInstanceName = `juscore_${owner.id}_${Date.now()}`;

    // 1. Create in Evolution API
    const evolutionRes = await evolutionApi.createInstance(uniqueInstanceName);

    // 2. Configure our Webhook on Evolution API for this instance
    const webhookUrl = `${process.env.APP_URL || "http://localhost:5000"}/api/whatsapp/webhook/${uniqueInstanceName}`;
    await evolutionApi.setWebhook(uniqueInstanceName, webhookUrl);

    // 3. Save to our database
    const newInstance = await WhatsappInstance.create({
      userId: owner.id,
      instanceName: uniqueInstanceName, // This is the EVOLUTION internal ID
      status: "connecting",
      qrCode: evolutionRes.qrcode?.base64 || null,
      companyName: companyName || name, // User provided or fallback
      assistantRole: assistantRole || "Atendimento Geral",
      // You may want to also save 'name' if you add a displayName column later,
      // but for now instanceName holds the unique ID. We will use companyName as the primary display if needed.
    });

    res.status(201).json({
      message: "Instância criada com sucesso",
      instance: newInstance,
    });
  } catch (error) {
    console.error("Error creating instance:", error.message || error);

    // Se for erro disparado por nós na service
    if (error.message && error.message.includes("Evolution")) {
      return res
        .status(500)
        .json({
          error:
            "O servidor Gateway de WhatsApp (Evolution API) está Offline ou a API KEY é inválida. Verifique sua porta 8080.",
        });
    }

    res
      .status(500)
      .json({
        error: `Erro na criação: ${error.message || "Falha Desconhecida"}`,
      });
  }
});

// Request to connect (get QR code if disconnected)
router.get("/connect/:id", auth, async (req, res) => {
  try {
    const inst = await WhatsappInstance.findByPk(req.params.id);
    if (!inst)
      return res.status(404).json({ error: "Instância não encontrada" });

    // Security check owner
    const ownerId = req.user.parentUserId || req.user.id;
    if (inst.userId !== ownerId)
      return res.status(403).json({ error: "Acesso negado" });

    const connectRes = await evolutionApi.connectInstance(inst.instanceName);

    if (connectRes.base64) {
      inst.qrCode = connectRes.base64;
      inst.status = "connecting";
      await inst.save();
    }

    res.json({ qrCode: connectRes.base64, status: inst.status });
  } catch (error) {
    console.error("Error connecting instance:", error);
    res.status(500).json({ error: "Erro ao gerar QR Code de conexão" });
  }
});

// Delete an instance
router.delete("/:id", auth, async (req, res) => {
  try {
    const inst = await WhatsappInstance.findByPk(req.params.id);
    if (!inst)
      return res.status(404).json({ error: "Instância não encontrada" });

    const ownerId = req.user.parentUserId || req.user.id;
    if (inst.userId !== ownerId)
      return res.status(403).json({ error: "Acesso negado" });

    // 1. Delete from Evolution API
    await evolutionApi.deleteInstance(inst.instanceName);

    // 2. Delete from our Database
    await inst.destroy();

    res.json({ message: "Instância removida com sucesso" });
  } catch (error) {
    console.error("Error deleting instance:", error);
    res.status(500).json({ error: "Erro ao deletar instância do WhatsApp" });
  }
});

// ==========================================
// WEBHOOK ROUTE (Called by Evolution API)
// ==========================================
// We'll leave the logic inside the webhook placeholder for now.
router.post("/webhook/:instanceName", async (req, res) => {
  // Return 200 immediately to acknowledge receipt to Evolution API
  res.status(200).send("OK");

  try {
    const { instanceName } = req.params;
    const payload = req.body;

    console.log(
      `[WHATSAPP WEBHOOK] Received event on ${instanceName}:`,
      payload.event,
    );

    if (payload.event === "messages.upsert") {
      const messageData = payload.data;
      if (
        !messageData ||
        !messageData.messages ||
        messageData.messages.length === 0
      )
        return;

      const msg = messageData.messages[0];

      // Ignore messages from ourselves or from status broadcast
      if (msg.key.fromMe || msg.key.remoteJid === "status@broadcast") return;

      // Simple text extraction
      let text = "";
      if (msg.message?.conversation) text = msg.message.conversation;
      else if (msg.message?.extendedTextMessage?.text)
        text = msg.message.extendedTextMessage.text;

      if (!text) return; // Only process text for now

      const senderNumber = msg.key.remoteJid.replace("@s.whatsapp.net", "");

      console.log(`[WHATSAPP WEBHOOK] Message from ${senderNumber}: ${text}`);

      try {
        // Enviar indicador "Digitando..." se houver como

        // 1. Procurar o proprietario da instância para carregar o nome do "Agente" / Escritório
        const instanceModel = await WhatsappInstance.findOne({
          where: { instanceName },
        });
        let assistantName = "Assistente Jurídico JusCore";
        let roleInstruction =
          "atender o cliente de um advogado com cordialidade";
        let company = "um Escritório de Advocacia";

        if (instanceModel) {
          const user = await User.findByPk(instanceModel.userId);
          if (user) {
            assistantName = `Assistente Jurídico do(a) Dr(a) ${user.nome}`;
            company =
              instanceModel.companyName ||
              `Escritório do(a) Dr(a) ${user.nome}`;
          }
          if (instanceModel.assistantRole === "Triagem Inicial") {
            roleInstruction =
              "fazer a triagem inicial do cliente. Colete nome completo, qual a área do problema (Trabalhista, Civil, etc) e um breve resumo. Não dê conselhos jurídicos profundos, apenas diga que o advogado irá analisar o caso em breve.";
          } else if (instanceModel.assistantRole === "Agendamento") {
            roleInstruction =
              "focar em marcar reuniões e consultas. Verifique a disponibilidade vagamente e convide o cliente a deixar seus horários preferenciais. Mantenha as respostas curtas.";
          } else if (instanceModel.assistantRole === "Tira Dúvidas") {
            roleInstruction =
              "tirar dúvidas jurídicas simples e rápidas dos clientes do escritório. Seja útil, mas avise sempre que as respostas da IA não substituem a análise documental do advogado responsável.";
          } else {
            roleInstruction =
              "atender o cliente em geral, responder dúvidas básicas e recolher dados iniciais do processo.";
          }
        }

        // 2. Montar instrução do robô Baseada num assistente de front-desk
        const messages = [
          {
            role: "system",
            content: `
                Você é o ${assistantName}, um agente inteligente operando via WhatsApp pela empresa/escritório "${company}".
                Sua função principal é: ${roleInstruction}

                IMPORTANTE: Mantenha respostas extremamente curtas, naturais (máximo 2-3 parágrafos pequenos), como se fosse um humano digitando no WhatsApp.
                NUNCA mande markdown complexo. Seja educado e carismático.
                Se você não souber o andamento processual ou os detalhes de um caso, diga que irá encaminhar a solicitação para o(a) advogado(a) avaliar.
                `,
          },
          {
            role: "user",
            content: text,
          },
        ];

        // 3. ProcessChat (Llama 3.1 8b instant para webhooks por ser muito rápido e barato)
        console.log(`[WHATSAPP WEBHOOK] Solicitando resposta da IA (Groq)...`);
        const aiResponse = await chamarGroqDireto(
          messages,
          "llama-3.1-8b-instant",
        );

        // 4. Enviar Feedback
        console.log(
          `[WHATSAPP WEBHOOK] Enviando Resposta: ${aiResponse.substring(0, 50)}...`,
        );
        await evolutionApi.sendTextMessage(
          instanceName,
          msg.key.remoteJid,
          aiResponse,
        );
      } catch (err) {
        console.error(
          "[WHATSAPP WEBHOOK] Erro ao responder via IA:",
          err.message,
        );
      }
    }

    // Connection updates (e.g. disconnected, connected)
    if (payload.event === "connection.update") {
      const state = payload.data?.state;
      if (state) {
        const statusMap = {
          open: "connected",
          close: "disconnected",
          connecting: "connecting",
        };
        const localStatus = statusMap[state] || "disconnected";

        await WhatsappInstance.update(
          { status: localStatus },
          { where: { instanceName } },
        );
        console.log(
          `[WHATSAPP WEBHOOK] Instance ${instanceName} state updated to: ${localStatus}`,
        );
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
  }
});

export default router;
