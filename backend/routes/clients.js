import express from "express";
import { auth } from "../middleware/auth.js";
import {
  Client,
  Process,
  Event,
  FinancialTransaction,
} from "../models/index.js";
import { Op } from "sequelize";
import { checkPlanLimits } from "../middleware/planLimits.js";

const router = express.Router();

// Listar todos os clientes do usuário logado
router.get("/", auth, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;
    const clients = await Client.findAll({
      where: { userId: ownerId },
      order: [["nome", "ASC"]],
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// Criar novo cliente
router.post("/", auth, checkPlanLimits, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;
    const client = await Client.create({
      ...req.body,
      userId: ownerId,
    });
    res.status(201).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

// Timeline do cliente (Processos, Eventos, Financeiro)
router.get("/:id/timeline", auth, async (req, res) => {
  try {
    const clientId = req.params.id;
    const ownerId = req.user.parentUserId || req.user.id;

    const client = await Client.findOne({ where: { id: clientId, userId: ownerId } });
    if (!client)
      return res.status(404).json({ error: "Cliente não encontrado" });

    const processes = await Process.findAll({
      where: { clientId, userId: ownerId },
      order: [["updatedAt", "DESC"]],
    });

    // Simplest way to get events related to this client's processes
    const processIds = processes.map((p) => p.id);
    const events = await Event.findAll({
      where: { userId: ownerId, processId: { [Op.in]: processIds } },
      order: [["dataHora", "DESC"]],
    });

    const finances = await FinancialTransaction.findAll({
      where: { clientId, userId: ownerId },
      order: [["dataVencimento", "DESC"]],
    });

    res.json({
      client,
      processes,
      finances,
      events,
    });
  } catch (error) {
    console.error("Erro na timeline do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar histórico do cliente" });
  }
});

// Buscar cliente por ID
router.get("/:id", auth, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;
    const client = await Client.findOne({
      where: { id: req.params.id, userId: ownerId },
    });
    if (!client)
      return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

// Atualizar cliente
router.put("/:id", auth, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;
    const [updated] = await Client.update(req.body, {
      where: { id: req.params.id, userId: ownerId },
    });
    if (!updated)
      return res.status(404).json({ error: "Cliente não encontrado" });

    const client = await Client.findByPk(req.params.id);
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

// Deletar cliente
router.delete("/:id", auth, async (req, res) => {
  try {
    const ownerId = req.user.parentUserId || req.user.id;
    const deleted = await Client.destroy({
      where: { id: req.params.id, userId: ownerId },
    });
    if (!deleted)
      return res.status(404).json({ error: "Cliente não encontrado" });
    res.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

export default router;
