import express from "express";
import { auth } from "../midleware/auth.js";
import { Client } from "../models/index.js";

const router = express.Router();

// Listar todos os clientes do usuário logado
router.get("/", auth, async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: { userId: req.user.id },
      order: [["nome", "ASC"]],
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// Criar novo cliente
router.post("/", auth, async (req, res) => {
  try {
    const client = await Client.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

// Buscar cliente por ID
router.get("/:id", auth, async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { id: req.params.id, userId: req.user.id },
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
    const [updated] = await Client.update(req.body, {
      where: { id: req.params.id, userId: req.user.id },
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
    const deleted = await Client.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted)
      return res.status(404).json({ error: "Cliente não encontrado" });
    res.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

export default router;
