import express from "express";
import { auth } from "../midleware/auth.js";
import { Process, Client } from "../models/index.js";
import { Op } from "sequelize";
import { checkPlanLimits } from "../middleware/planLimits.js";

const router = express.Router();

// Listar todos os processos do usuário logado (com filtros ERP)
router.get("/", auth, async (req, res) => {
  try {
    const { status, fase, clientId, search, fromDate, toDate } = req.query;

    let whereClause = { userId: req.user.id };

    if (status) whereClause.status = status;
    if (fase) whereClause.fase = fase;
    if (clientId) whereClause.clientId = clientId;

    if (search) {
      whereClause[Op.or] = [
        { numero: { [Op.like]: `%${search}%` } },
        { tribunal: { [Op.like]: `%${search}%` } },
        { comarca: { [Op.like]: `%${search}%` } },
      ];
    }

    if (fromDate || toDate) {
      whereClause.dataDistribuicao = {};
      if (fromDate) whereClause.dataDistribuicao[Op.gte] = fromDate;
      if (toDate) whereClause.dataDistribuicao[Op.lte] = toDate;
    }

    const processes = await Process.findAll({
      where: whereClause,
      include: [{ model: Client, attributes: ["id", "nome", "cpf_cnpj"] }],
      order: [["updatedAt", "DESC"]],
    });
    res.json(processes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar processos" });
  }
});

// Criar novo processo
router.post("/", auth, checkPlanLimits, async (req, res) => {
  try {
    const process = await Process.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(process);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar processo" });
  }
});

// Buscar processo por ID
router.get("/:id", auth, async (req, res) => {
  try {
    const process = await Process.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Client,
          attributes: ["id", "nome", "cpf_cnpj", "telefone", "email"],
        },
      ],
    });
    if (!process)
      return res.status(404).json({ error: "Processo não encontrado" });
    res.json(process);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar processo" });
  }
});

// Atualizar processo
router.put("/:id", auth, async (req, res) => {
  try {
    const [updated] = await Process.update(req.body, {
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!updated)
      return res.status(404).json({ error: "Processo não encontrado" });

    const process = await Process.findByPk(req.params.id);
    res.json(process);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar processo" });
  }
});

// Deletar processo
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Process.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted)
      return res.status(404).json({ error: "Processo não encontrado" });
    res.json({ message: "Processo deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar processo" });
  }
});

export default router;
