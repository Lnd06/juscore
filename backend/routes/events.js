import express from "express";
import { auth } from "../middleware/auth.js";
import { Event, Process, User } from "../models/index.js";
import * as googleService from "../services/googleCalendar.js";

const router = express.Router();

// Listar todos os eventos do usuário
router.get("/", auth, async (req, res) => {
  try {
    const { processId } = req.query;
    const whereClause = { userId: req.user.id };
    if (processId) whereClause.processId = processId;

    const events = await Event.findAll({
      where: whereClause,
      include: [{ model: Process, attributes: ["id", "numero"] }],
      order: [["dataHora", "ASC"]],
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar eventos/prazos" });
  }
});

// Criar novo evento/prazo — COM auto-sync Google
router.post("/", auth, async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      userId: req.user.id,
    });

    // 2-Way Sync: Tenta empurrar pro Google se tiver autenticação ativa
    const user = await User.findByPk(req.user.id);
    if (user?.googleTokens) {
      const googleId = await googleService.createGoogleEvent(
        req.user.id,
        event,
      );
      if (googleId) {
        await event.update({ googleEventId: googleId }); // Grava a ID do Google correspondente
      }
    }

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar evento/prazo" });
  }
});

// Atualizar evento — COM auto-sync Google
router.put("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!event) return res.status(404).json({ error: "Evento não encontrado" });

    await event.update(req.body);

    // 2-Way Sync: Sincroniza a edição pro Google
    const user = await User.findByPk(req.user.id);
    if (user?.googleTokens) {
      if (event.googleEventId) {
        await googleService.updateGoogleEvent(
          req.user.id,
          event.googleEventId,
          event,
        );
      } else {
        // Se por acaso nunca subiu, cria agora
        const googleId = await googleService.createGoogleEvent(
          req.user.id,
          event,
        );
        if (googleId) await event.update({ googleEventId: googleId });
      }
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar evento" });
  }
});

// Deletar evento — COM auto-sync Google
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!event) return res.status(404).json({ error: "Evento não encontrado" });

    const googleEventIdToDelete = event.googleEventId;
    await event.destroy();

    // 2-Way Sync: Apaga na agenda do Google se existir
    const user = await User.findByPk(req.user.id);
    if (user?.googleTokens && googleEventIdToDelete) {
      await googleService.deleteGoogleEvent(req.user.id, googleEventIdToDelete);
    }

    res.json({ message: "Evento deletado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar evento" });
  }
});

// Sincronização MANUAL com Google Agenda — só chamado quando usuário clica no botão
router.post("/sync-google", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user?.googleTokens) {
      return res.status(400).json({ error: "Conta Google não conectada." });
    }

    const googleEvents = await googleService.listGoogleEvents(req.user.id);
    let importedCount = 0;

    for (const gEvent of googleEvents) {
      // Verifica se já existe pelo googleEventId para evitar duplicação
      const existing = await Event.findOne({
        where: { googleEventId: gEvent.id, userId: req.user.id },
      });

      if (!existing && gEvent.start?.dateTime) {
        await Event.create({
          titulo: gEvent.summary || "Evento Google",
          tipo: "tarefa",
          dataHora: new Date(gEvent.start.dateTime),
          observacoes: gEvent.description || "",
          googleEventId: gEvent.id,
          userId: req.user.id,
        });
        importedCount++;
      }
    }

    res.json({
      message: `Sincronização concluída. ${importedCount} evento(s) importado(s).`,
      count: importedCount,
    });
  } catch (error) {
    console.error("Erro na sincronização manual com Google:", error);
    res.status(500).json({ error: "Erro ao sincronizar com Google Agenda." });
  }
});

export default router;
