import express from "express";
import { auth } from "../midleware/auth.js";
import { User, UserUsage, Conversation } from "../models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";

const router = express.Router();

// Função auxiliar para definir limite da equipe
const getTeamLimit = (planName) => {
  // Limites MAXIMOS de convite dependem do plano do proprietário do link:
  // Growth permite 1 convidado (+ 1 titular = 2 total)
  // Master permite 3 convidados (+ 1 titular = 4 total)
  let allowedInvites = 0;
  if (planName === "office_master") allowedInvites = 3;
  if (planName === "lawyer_growth") allowedInvites = 1;
  if (planName === "enterprise") allowedInvites = 999;
  return allowedInvites; // Outros não podem ter equipe
};

// Listar membros da equipe
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Apenas o dono pode listar sua equipe
    const team = await User.findAll({
      where: { parentUserId: req.user.id },
      attributes: [
        "id",
        "nome",
        "email",
        "tipo",
        "subscriptionPlan",
        "createdAt",
      ],
    });

    res.json(team);
  } catch (error) {
    console.error("Erro listar equipe:", error);
    res.status(500).json({ error: "Erro ao buscar equipe" });
  }
});

// Estatístias BI da Equipe
router.get("/bi-stats", auth, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const owner = await User.findByPk(ownerId);
    const hasPlanAccess = [
      "lawyer_growth",
      "office_master",
      "enterprise",
    ].includes(owner?.subscriptionPlan);

    if (
      !owner ||
      (!["admin", "master", "especial"].includes(owner.tipo) && !hasPlanAccess)
    ) {
      return res.status(403).json({ error: "Acesso negado ao BI." });
    }

    // Busca todos os membros da equipe (incluindo o próprio dono para as estatísticas totais)
    const teamMembers = await User.findAll({
      where: {
        [Op.or]: [{ id: ownerId }, { parentUserId: ownerId }],
      },
      attributes: ["id", "nome", "email", "tipo"],
    });

    const teamIds = teamMembers.map((u) => u.id);

    // Soma do Uso Diário de IA (Agregado de toda a equipe)
    const todayStr = new Date().toISOString().split("T")[0];
    const usages = await UserUsage.findAll({
      where: {
        userId: { [Op.in]: teamIds },
        date: todayStr,
      },
    });

    let totalDocs = 0,
      totalChats = 0,
      totalCalc = 0,
      totalVision = 0;
    const usageByMember = {};

    teamMembers.forEach((member) => {
      usageByMember[member.id] = {
        nome: member.nome,
        email: member.email,
        tipo: member.tipo,
        docs: 0,
        chats: 0,
        calc: 0,
        vision: 0,
      };
    });

    usages.forEach((use) => {
      totalDocs += use.dailyDocuments || 0;
      totalChats += use.dailyConversations || 0;
      totalCalc += use.dailyCalculations || 0;
      totalVision += use.dailyVision || 0;

      if (usageByMember[use.userId]) {
        usageByMember[use.userId].docs += use.dailyDocuments || 0;
        usageByMember[use.userId].chats += use.dailyConversations || 0;
        usageByMember[use.userId].calc += use.dailyCalculations || 0;
        usageByMember[use.userId].vision += use.dailyVision || 0;
      }
    });

    // Contagem de Casos Ativos (Conversations) de toda a equipe
    const activeCases = await Conversation.count({
      where: { userId: { [Op.in]: teamIds } },
    });

    // Cálculos de ROI (Retorno sobre Investimento)
    // Premissas: 1 Petição Gerada = 2 horas humanas economizadas. 1 Análise OCR = 0.5 horas economizadas.
    // Valor médio da hora do Advogado: R$ 150,00
    const horasPorDocumento = 2;
    const horasPorVisao = 0.5;
    const valorHora = 150;

    const horasEconomizadasHoje =
      totalDocs * horasPorDocumento + totalVision * horasPorVisao;
    const dinheiroEconomizadoHoje = horasEconomizadasHoje * valorHora;

    // Gamificação/Ranking: Ordenar o breakdown por total de documentos gerados (depois desempate por chats)
    const sortedBreakdown = Object.values(usageByMember).sort((a, b) => {
      const pontuacaoA = a.docs * 10 + a.chats;
      const pontuacaoB = b.docs * 10 + b.chats;
      return pontuacaoB - pontuacaoA; // Ordem decrescente
    });

    res.json({
      aggregate: {
        totalTeamMembers: teamMembers.length - 1, // Excluindo o dono da conta de equipe subalterna
        totalActiveCases: activeCases,
        today: {
          documents: totalDocs,
          chats: totalChats,
          calculations: totalCalc,
          vision: totalVision,
        },
        roi: {
          horasPoupadas: horasEconomizadasHoje,
          valorPoupado: dinheiroEconomizadoHoje,
        },
      },
      breakdown: sortedBreakdown,
    });
  } catch (error) {
    console.error("Erro buscar estatísticas BI:", error);
    res.status(500).json({ error: "Erro ao carregar Dashboard BI" });
  }
});

// Gerar link de convite para a equipe
router.post("/invite", auth, async (req, res) => {
  try {
    const { tipo } = req.body; // 'comum', 'especial', 'admin'

    // O requester (dono da conta principal)
    const owner = await User.findByPk(req.user.id);
    if (!owner) return res.status(404).json({ error: "Owner não encontrado" });

    // Regra 1: O plano permite equipe?
    const limit = getTeamLimit(owner.subscriptionPlan);
    if (limit <= 0) {
      return res
        .status(403)
        .json({ error: "Seu plano não permite criar uma equipe." });
    }

    // Regra 2: Limite atingido?
    const currentCount = await User.count({
      where: { parentUserId: owner.id },
    });
    if (currentCount >= limit) {
      return res.status(403).json({
        error: `Você atingiu o limite de ${limit} membros do seu plano.`,
      });
    }

    // Regra 3: Hierarquia de Tipos (Patente)
    let allowedTypes = ["comum"];
    if (owner.tipo === "especial") allowedTypes = ["comum", "especial"];
    if (owner.tipo === "admin" || owner.tipo === "master")
      allowedTypes = ["comum", "especial", "admin"];

    const finalTipo = allowedTypes.includes(tipo) ? tipo : "comum";

    // Cria um token de convite válido por 7 dias
    const inviteToken = jwt.sign(
      {
        parentUserId: owner.id,
        tipo: finalTipo,
        subscriptionPlan: owner.subscriptionPlan,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Link de convite gerado com sucesso!",
      inviteToken,
    });
  } catch (error) {
    console.error("Erro ao gerar link de convite:", error);
    res.status(500).json({ error: "Erro interno ao gerar link de convite." });
  }
});

// Remover membro da equipe
router.delete("/:id", auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Verifica se o alvo realmente pertence a quem está tentando deletar
    const target = await User.findOne({
      where: { id: targetUserId, parentUserId: req.user.id },
    });

    if (!target) {
      return res
        .status(404)
        .json({ error: "Membro não encontrado em sua equipe." });
    }

    await target.destroy();
    res.json({ message: "Membro removido da equipe com sucesso." });
  } catch (err) {
    console.error("Erro remover membro:", err);
    res.status(500).json({ error: "Erro interno ao remover membro." });
  }
});

// Rota Pública: Criar conta via Link de Convite
// Como ela é pública e está dentro de /api/team, nós NÃO exigimos auth aqui (não use o middleware auth).
router.post("/register-invite", async (req, res) => {
  try {
    const { token, nome, email, senha } = req.body;

    if (!token || !nome || !email || !senha) {
      return res
        .status(400)
        .json({ error: "Todos os campos e o token são obrigatórios." });
    }

    const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(senha) || senha.length < 6) {
      return res.status(400).json({
        error:
          "A senha deve ter no mínimo 6 caracteres, incluindo letra maiúscula, minúscula e número.",
      });
    }

    // Descriptografar Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Este link de convite é inválido ou expirou." });
    }

    // Verificar os limites do titular novamente (pode ter cancelado o plano ontem)
    const owner = await User.findByPk(decoded.parentUserId);
    if (!owner)
      return res
        .status(404)
        .json({ error: "O escritório que gerou este link não existe mais." });

    const limit = getTeamLimit(owner.subscriptionPlan);
    const currentCount = await User.count({
      where: { parentUserId: owner.id },
    });
    if (currentCount >= limit) {
      return res
        .status(403)
        .json({ error: "A equipe deste escritório já está cheia." });
    }

    // Verifica se e-mail já existe
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res
        .status(400)
        .json({ error: "Este e-mail já está sendo utilizado." });
    }

    // Cria o usuário
    const newUser = await User.create({
      nome,
      email,
      senha,
      apelido: nome.split(" ")[0],
      tipo: decoded.tipo, // Vindo blindado de dentro do JWT
      subscriptionPlan: owner.subscriptionPlan,
      parentUserId: owner.id,
      termosAceitos: true,
      cargo: "Associado",
      finalidade: "Escritório",
    });

    res.status(201).json({
      message: "Contra criada com sucesso! Você já pode fazer login.",
    });
  } catch (error) {
    console.error("Erro ao registrar via convite:", error);
    res.status(500).json({ error: "Erro ao criar sua conta." });
  }
});

export default router;
