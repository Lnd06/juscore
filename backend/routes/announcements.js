import express from "express";
import { Announcement, User } from "../models/index.js";
import { auth, authAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * Retorna os avisos ativos relevantes para o usuário logado.
 */
router.get("/active", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Todos os avisos ativos no banco
    const allActive = await Announcement.findAll({ where: { isActive: true } });

    // Filtra para o usuário atual
    const relevantAnnouncements = allActive.filter((ann) => {
      if (ann.targetType === "all") return true;
      if (ann.targetType === "user" && ann.targetValue === user.email)
        return true;
      if (
        ann.targetType === "plan" &&
        ann.targetValue === user.subscriptionPlan
      )
        return true;
      return false;
    });

    res.json(relevantAnnouncements);
  } catch (error) {
    console.error("Erro ao buscar avisos ativos:", error);
    res.status(500).json({ error: "Erro ao buscar avisos" });
  }
});

/**
 * [ADMIN] Cria um novo aviso
 */
router.post("/", auth, authAdmin, async (req, res) => {
  try {
    const { message, targetType, targetValue, type } = req.body;

    if (!message || !targetType || !type) {
      return res
        .status(400)
        .json({ error: "Preencha todos os campos obrigatórios" });
    }

    const newAnnouncement = await Announcement.create({
      message,
      targetType,
      targetValue: targetType !== "all" ? targetValue : null,
      type,
      isActive: true,
    });

    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error("Erro ao criar aviso:", error);
    res.status(500).json({ error: "Erro ao criar aviso" });
  }
});

/**
 * [ADMIN] Lista todos os avisos (Histórico)
 */
router.get("/", auth, authAdmin, async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(announcements);
  } catch (error) {
    console.error("Erro ao listar avisos:", error);
    res.status(500).json({ error: "Erro ao listar avisos" });
  }
});

/**
 * [ADMIN] Desativa (ou reativa) um aviso
 */
router.put("/:id/toggle", auth, authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ann = await Announcement.findByPk(id);
    if (!ann) return res.status(404).json({ error: "Aviso não encontrado" });

    ann.isActive = !ann.isActive;
    await ann.save();

    res.json(ann);
  } catch (error) {
    console.error("Erro ao alternar aviso:", error);
    res.status(500).json({ error: "Erro ao alternar aviso" });
  }
});

/**
 * [ADMIN] Deleta fisicamente um aviso
 */
router.delete("/:id", auth, authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.destroy({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar aviso:", error);
    res.status(500).json({ error: "Erro ao deletar aviso" });
  }
});

export default router;
