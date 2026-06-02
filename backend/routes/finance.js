import express from "express";
import { auth } from "../middleware/auth.js";
import { FinancialTransaction, Client, Process } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

const router = express.Router();

// Listar transações do usuário (com filtros ERP)
router.get("/", auth, async (req, res) => {
  try {
    const { tipo, status, categoria, fromDate, toDate, clientId, processId } =
      req.query;

    let whereClause = { userId: req.user.id };

    if (tipo) whereClause.tipo = tipo;
    if (status) whereClause.status = status;
    if (categoria) whereClause.categoria = categoria;
    if (clientId) whereClause.clientId = clientId;
    if (processId) whereClause.processId = processId;

    if (fromDate || toDate) {
      whereClause.dataVencimento = {};
      if (fromDate) whereClause.dataVencimento[Op.gte] = fromDate;
      if (toDate) whereClause.dataVencimento[Op.lte] = toDate;
    }

    const transactions = await FinancialTransaction.findAll({
      where: whereClause,
      include: [
        { model: Client, attributes: ["id", "nome"] },
        { model: Process, attributes: ["id", "numero"] },
      ],
      order: [["dataVencimento", "ASC"]],
    });
    res.json(transactions);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    res.status(500).json({ error: "Erro ao buscar transações financeiras" });
  }
});

// Resumo Financeiro (Dashboard ERP)
router.get("/summary", auth, async (req, res) => {
  try {
    const { month, year } = req.query;

    // Default to current month if not provided
    const targetDate =
      month && year ? new Date(year, month - 1, 1) : new Date();
    const startDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      1,
    );
    const endDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0,
    );

    const summaries = await FinancialTransaction.findAll({
      where: {
        userId: req.user.id,
        [Op.or]: [
          { dataVencimento: { [Op.between]: [startDate, endDate] } },
          { dataPagamento: { [Op.between]: [startDate, endDate] } }, // Include items paid in this month even if overdue
        ],
      },
      attributes: [
        "tipo",
        "status",
        [sequelize.fn("sum", sequelize.col("valor")), "total"],
      ],
      group: ["tipo", "status"],
    });

    let receitasPagas = 0;
    let receitasPendentes = 0;
    let despesasPagas = 0;
    let despesasPendentes = 0;

    summaries.forEach((s) => {
      const valor = parseFloat(s.dataValues.total) || 0;
      const tipo = (s.tipo || "").toLowerCase();
      const status = (s.status || "").toLowerCase();

      if (tipo === "receita") {
        if (status === "pago") receitasPagas += valor;
        else receitasPendentes += valor;
      } else if (tipo === "despesa") {
        if (status === "pago") despesasPagas += valor;
        else despesasPendentes += valor;
      }
    });

    res.json({
      receitasPagas,
      receitasPendentes,
      despesasPagas,
      despesasPendentes,
      saldoAtual: receitasPagas - despesasPagas,
      saldoProjetado:
        receitasPagas + receitasPendentes - (despesasPagas + despesasPendentes),
    });
  } catch (error) {
    console.error("Erro ao gerar resumo financeiro:", error);
    res.status(500).json({ error: "Erro ao calcular resumo financeiro" });
  }
});

// Criar nova transação
router.post("/", auth, async (req, res) => {
  try {
    const transaction = await FinancialTransaction.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar transação financeira" });
  }
});

// Buscar transação por ID
router.get("/:id", auth, async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Client, attributes: ["id", "nome"] },
        { model: Process, attributes: ["id", "numero"] },
      ],
    });
    if (!transaction)
      return res.status(404).json({ error: "Transação não encontrada" });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar transação" });
  }
});

// Atualizar transação
router.put("/:id", auth, async (req, res) => {
  try {
    const [updated] = await FinancialTransaction.update(req.body, {
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!updated)
      return res.status(404).json({ error: "Transação não encontrada" });

    const transaction = await FinancialTransaction.findByPk(req.params.id);
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar transação" });
  }
});

// Deletar transação
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await FinancialTransaction.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted)
      return res.status(404).json({ error: "Transação não encontrada" });
    res.json({ message: "Transação deletada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar transação" });
  }
});

export default router;
