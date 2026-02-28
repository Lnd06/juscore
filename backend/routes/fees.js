import express from "express";
import { auth } from "../midleware/auth.js";
import { Fee, Client, Process } from "../models/index.js";

const router = express.Router();

// Listar honorários
router.get("/", auth, async (req, res) => {
  try {
    const { status, clientId, processId } = req.query;
    const whereClause = { userId: req.user.id };

    if (status) whereClause.status = status;
    if (clientId) whereClause.clientId = clientId;
    if (processId) whereClause.processId = processId;

    const fees = await Fee.findAll({
      where: whereClause,
      include: [
        { model: Client, attributes: ["id", "nome"] },
        { model: Process, attributes: ["id", "numero"] },
      ],
      order: [["vencimento", "ASC"]],
    });
    res.json(fees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar honorários" });
  }
});

// Criar honorário (faturamento)
router.post("/", auth, async (req, res) => {
  try {
    const fee = await Fee.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(fee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao lançar honorário" });
  }
});

// Atualizar honorário (ex: marcar como pago)
router.put("/:id", auth, async (req, res) => {
  try {
    const [updated] = await Fee.update(req.body, {
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!updated)
      return res.status(404).json({ error: "Registro não encontrado" });

    const fee = await Fee.findByPk(req.params.id);
    res.json(fee);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar honorário" });
  }
});

// Deletar honorário
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Fee.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted)
      return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ message: "Honorário removido com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover honorário" });
  }
});

export default router;
