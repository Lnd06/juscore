import express from "express";
import { Feedback, User } from "../models/index.js";
import { auth, authAdmin } from "../middleware/auth.js";

const router = express.Router();

// User: Submit new feedback
router.post("/", auth, async (req, res) => {
  try {
    const { type, title, message } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ error: "Título e mensagem são obrigatórios" });
    }

    const feedback = await Feedback.create({
      userId: req.user.userId || req.user.id,
      type: type || "SUGGESTION",
      title,
      message,
      status: "OPEN",
    });

    res.status(201).json({ message: "Feedback enviado com sucesso", feedback });
  } catch (err) {
    console.error("Erro ao enviar feedback:", err);
    res.status(500).json({ error: "Erro ao processar feedback" });
  }
});

// Admin: List all feedbacks
router.get("/", authAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nome", "email", "apelido", "tipo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(feedbacks);
  } catch (err) {
    console.error("Erro ao buscar feedbacks:", err);
    res.status(500).json({ error: "Erro ao listar feedbacks" });
  }
});

// Admin: Update feedback status
router.put("/:id", authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback não encontrado" });
    }

    if (status) {
      feedback.status = status;
    }

    await feedback.save();

    res.json({ message: "Feedback atualizado com sucesso", feedback });
  } catch (err) {
    console.error("Erro ao atualizar feedback:", err);
    res.status(500).json({ error: "Erro ao atualizar feedback" });
  }
});

export default router;
