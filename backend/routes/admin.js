import express from "express";
import { authEspecial, authAdmin } from "../midleware/auth.js";
import {
  User,
  Conversation,
  Setting,
  Document,
  Coupon,
  Organization,
} from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import axios from "axios";

import { brandingUpload } from "../midleware/brandingUpload.js";

const router = express.Router();

/* =========================
   WHITE LABEL / BRANDING
   ========================= */
router.post(
  "/organizations/upload",
  authAdmin,
  brandingUpload.single("logo"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      const fileUrl = `/uploads/branding/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Erro no upload de logo:", error);
      res.status(500).json({ error: "Erro ao processar upload" });
    }
  },
);

/* =========================
   DASHBOARD
========================= */
router.get("/dashboard", authEspecial, async (req, res) => {
  try {
    console.log("📊 Carregando dados do dashboard...");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const totalUsuarios = await User.count();
    const usuariosHoje = await User.count({
      where: { createdAt: { [Op.gte]: hoje } },
    });

    const totalConversas = await Conversation.count();
    const conversasHoje = await Conversation.count({
      where: { createdAt: { [Op.gte]: hoje } },
    });

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    // Usuários ativos (com conversas nos últimos 7 dias)
    const usuariosAtivos = await Conversation.findAll({
      where: { updatedAt: { [Op.gte]: seteDiasAtras } },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("userId")), "userId"],
      ],
      raw: true,
    });

    // Calcular requests (Otimizado com SQL)
    // Se o banco for MySQL, JSON_LENGTH é eficiente
    const requestsQuery = await Conversation.findAll({
      attributes: [
        [sequelize.literal("SUM(JSON_LENGTH(mensagens))"), "totalRequests"],
      ],
      raw: true,
    });
    const totalRequests = requestsQuery[0]?.totalRequests || 0;
    const requestsHoje = Math.round(
      conversasHoje * (totalRequests / (totalConversas || 1)),
    );

    // Crescimento últimos 7 dias (Otimizado com GROUP BY)
    const sevenDaysAgoStr = seteDiasAtras.toISOString().split("T")[0];
    const crescimentoRaw = await Conversation.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "data"],
        [sequelize.fn("COUNT", sequelize.col("id")), "conversas"],
      ],
      where: {
        createdAt: { [Op.gte]: seteDiasAtras },
      },
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
      raw: true,
    });

    // Normalizar crescimento para garantir que dias vazios apareçam como 0
    const crescimento = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dataStr = d.toISOString().split("T")[0];
      const found = crescimentoRaw.find((c) => c.data === dataStr);
      crescimento.push({
        data: dataStr,
        conversas: found ? parseInt(found.conversas) : 0,
      });
    }

    // Distribuição de Documentos por categoria
    const docDistrib = await Document.findAll({
      attributes: [
        "categoria",
        [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      ],
      group: ["categoria"],
      raw: true,
    });

    // Health Check
    let health = { db: true, groq: false, openrouter: false };
    try {
      await sequelize.authenticate();
      health.db = true;
    } catch {
      health.db = false;
    }

    try {
      const groqRes = await axios.get("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 2000,
      });
      if (groqRes.status === 200) health.groq = true;
    } catch (err) {
      console.log("GROQ Health Check fail:", err.message);
      health.groq = false;
    }

    try {
      if (process.env.OPENROUTER_API_KEY) {
        const fallbackRes = await axios.get(
          "https://openrouter.ai/api/v1/models",
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
            timeout: 2000,
          },
        );
        if (fallbackRes.status === 200) health.openrouter = true;
      }
    } catch (err) {
      console.log("OpenRouter Health Check fail:", err.message);
      health.openrouter = false;
    }

    // Tendências de Pesquisa (Fase 8)
    const topicos = await Conversation.findAll({
      attributes: [
        "topic",
        [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      ],
      group: ["topic"],
      order: [[sequelize.literal("total"), "DESC"]],
      limit: 5,
      raw: true,
    });

    // Sentiment Analysis (Fase 12)
    const sentimentos = await Conversation.findAll({
      attributes: [
        "sentiment",
        [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      ],
      group: ["sentiment"],
      raw: true,
    });

    console.log("✅ Dashboard carregado com sucesso");
    res.json({
      estatisticas: {
        totalUsuarios,
        usuariosHoje,
        usuariosAtivos7d: usuariosAtivos.length,
        totalConversas,
        conversasHoje,
        totalRequests,
        requestsHoje,
      },
      health,
      docDistrib,
      crescimento,
      topicos,
      sentimentos,
      usuario: {
        nome: req.user.nome,
        tipo: req.user.tipo,
      },
    });
  } catch (error) {
    console.error("❌ Erro dashboard:", error);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
});

/* =========================
   MAPA DE CALOR (Fase 12)
========================= */
router.get("/heatmap", authEspecial, async (req, res) => {
  try {
    // Pegar as últimas 1000 conversas para uma amostragem de calor
    const heatData = await Conversation.findAll({
      attributes: ["createdAt"],
      limit: 1000,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // Agrupar por hora do dia (0-23)
    const hours = Array(24).fill(0);
    heatData.forEach((c) => {
      const date = new Date(c.createdAt);
      const h = date.getHours();
      hours[h]++;
    });

    res.json(hours);
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar heatmap" });
  }
});

/* =========================
   LISTAR USUÁRIOS
========================= */
/* =========================
   LISTAR USUÁRIOS (Paginated)
========================= */
router.get("/users", authEspecial, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || ""; // Novo parâmetro de busca
    const offset = (page - 1) * limit;

    console.log(`👥 Listando usuários (Página ${page}, Busca: "${search}")...`);

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { apelido: { [Op.like]: `%${search}%` } },
        { tipo: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["senha"] },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    console.log(`✅ ${rows.length} usuários retornados de ${count} total`);

    res.json({
      users: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("❌ Erro listar usuários:", error);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

/* =========================
   EDITAR USUÁRIO
========================= */
router.put("/users/:id", authAdmin, async (req, res) => {
  try {
    const { nome, email, apelido, tipo, subscriptionPlan, subscriptionPrice } =
      req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Verificar conflito de email
    if (email && email !== user.email) {
      const existe = await User.findOne({ where: { email } });
      if (existe) {
        return res
          .status(409)
          .json({ error: "Este email já está vinculado a uma conta." });
      }
    }

    user.nome = nome;
    user.email = email;
    user.apelido = apelido;
    if (tipo) user.tipo = tipo;
    if (subscriptionPlan) user.subscriptionPlan = subscriptionPlan;
    if (req.body.organizationId !== undefined)
      user.organizationId = req.body.organizationId;
    if (subscriptionPrice !== undefined)
      user.subscriptionPrice = subscriptionPrice;

    await user.save();

    res.json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

/* =========================
   EXCLUIR USUÁRIO
========================= */
router.delete("/users/:id", authAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // impede admin de deletar a si mesmo
    if (req.user.id === user.id) {
      return res
        .status(400)
        .json({ error: "Você não pode deletar sua própria conta" });
    }

    await user.destroy();

    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
});

/* =========================
   CRIAR USUÁRIO (Qualquer Tipo)
========================= */
router.post("/users", authAdmin, async (req, res) => {
  try {
    console.log("📝 Tentativa de criar usuário pelo Admin:", req.body);
    const {
      nome,
      email,
      senha,
      apelido,
      tipo,
      subscriptionPlan,
      subscriptionPrice,
    } = req.body;

    // Validação básica de tipo
    const tiposPermitidos = ["comum", "especial", "admin", "master"];
    const novoTipo = tiposPermitidos.includes(tipo) ? tipo : "comum";

    // Verificar se já existe
    const existe = await User.findOne({ where: { email } });
    if (existe) {
      return res
        .status(409)
        .json({ error: "Este email já está vinculado a uma conta." });
    }

    const user = await User.create({
      nome,
      email,
      senha,
      apelido,
      tipo: novoTipo,
      subscriptionPlan: subscriptionPlan || "free",
      subscriptionPrice: subscriptionPrice || null,
    });

    res.status(201).json({ message: `Usuário ${novoTipo} criado com sucesso` });
  } catch (error) {
    console.error("Erro criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

/* =========================
   SISTEMA DE AVISOS
========================= */
router.get("/settings/global-alert", async (req, res) => {
  try {
    const alert = await Setting.findOne({ where: { key: "global_alert" } });
    res.json({ message: alert ? alert.value : "" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar alerta" });
  }
});

router.post("/settings/global-alert", authAdmin, async (req, res) => {
  try {
    const { message } = req.body;

    let alert = await Setting.findOne({ where: { key: "global_alert" } });
    if (alert) {
      alert.value = message;
      await alert.save();
    } else {
      await Setting.create({ key: "global_alert", value: message });
    }

    res.json({ message: "Alerta atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar alerta" });
  }
});

/* =========================
   CONFIGURAÇÕES DE CONTATO
========================= */
router.get("/settings/contact", authAdmin, async (req, res) => {
  try {
    const keys = [
      "contact_email",
      "contact_whatsapp",
      "contact_instagram",
      "contact_github",
    ];
    const settings = await Setting.findAll({ where: { key: keys } });

    const result = {};
    keys.forEach((k) => {
      const found = settings.find((s) => s.key === k);
      result[k] = found ? found.value : "";
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar configurações de contato" });
  }
});

router.post("/settings/contact", authAdmin, async (req, res) => {
  try {
    const {
      contact_email,
      contact_whatsapp,
      contact_instagram,
      contact_github,
    } = req.body;
    const data = {
      contact_email,
      contact_whatsapp,
      contact_instagram,
      contact_github,
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        let setting = await Setting.findOne({ where: { key } });
        if (setting) {
          setting.value = value;
          await setting.save();
        } else {
          await Setting.create({ key, value });
        }
      }
    }

    res.json({ message: "Configurações atualizadas com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar configurações" });
  }
});

/* =========================
   TERMOS DE USO
========================= */
router.post("/settings/terms", authAdmin, async (req, res) => {
  try {
    const { terms } = req.body;
    let setting = await Setting.findOne({ where: { key: "terms_of_use" } });
    if (setting) {
      setting.value = terms;
      await setting.save();
    } else {
      await Setting.create({ key: "terms_of_use", value: terms });
    }
    res.json({ message: "Termos atualizados com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar termos:", error);
    res.status(500).json({ error: "Erro ao salvar termos de uso" });
  }
});

/* =========================
   LOGS DE ATIVIDADE
========================= */
router.get("/activities", authEspecial, async (req, res) => {
  try {
    const conversas = await Conversation.findAll({
      limit: 20,
      order: [["updatedAt", "DESC"]],
      include: [{ model: User, attributes: ["nome", "apelido", "email"] }],
    });

    const logs = conversas.map((c) => ({
      id: c.id,
      usuario: c.User ? c.User.apelido || c.User.nome : "Convidado",
      acao: "Conversa iniciada/atualizada",
      extra: c.titulo,
      data: c.updatedAt,
    }));

    res.json(logs);
  } catch (error) {
    console.error("Erro logs:", error);
    res.status(500).json({ error: "Erro ao carregar logs" });
  }
});

/* =========================
   CONVERSAS DE USUÁRIO (Admin Only)
========================= */
router.get("/users/:id/conversations", authAdmin, async (req, res) => {
  try {
    const conversas = await Conversation.findAll({
      where: { userId: req.params.id },
      order: [["updatedAt", "DESC"]],
    });
    res.json(conversas);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar conversas do usuário" });
  }
});

/* =========================
   MONITORAMENTO DE VIOLAÇÕES (Admin & Especial)
========================= */
router.get("/violations", authEspecial, async (req, res) => {
  try {
    const violations = await Conversation.findAll({
      where: { flagged: true },
      include: [{ model: User, attributes: ["nome", "email", "apelido"] }],
      order: [["updatedAt", "DESC"]],
    });
    res.json(violations);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar violações" });
  }
});

/* =========================
   GERENCIAMENTO DE CUPONS (Admin)
========================= */
router.get("/coupons", authAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [["createdAt", "DESC"]] });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar cupons" });
  }
});

router.post("/coupons", authAdmin, async (req, res) => {
  try {
    const { code, type, value, targetType, allowedPlans } = req.body;

    // Verifica duplicidade
    const exists = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });
    if (exists) {
      return res
        .status(400)
        .json({ error: "Já existe um cupom com este código." });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type: type || "PERCENTAGE",
      value,
      targetType: targetType || "ALL",
      allowedPlans: allowedPlans || [],
      isActive: true,
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error("Erro criar cupom:", error);
    res.status(500).json({ error: "Erro ao criar cupom" });
  }
});

router.delete("/coupons/:id", authAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: "Cupom não encontrado" });

    await coupon.destroy();
    res.json({ message: "Cupom deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar cupom" });
  }
});

/* =========================
   GERENCIAMENTO DE ORGANIZAÇÕES (White Label)
========================= */
router.get("/organizations", authAdmin, async (req, res) => {
  try {
    const orgs = await Organization.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "users", attributes: ["id", "nome"] }],
    });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar organizações" });
  }
});

router.post("/organizations", authAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      logoUrl,
      primaryColor,
      secondaryColor,
      faviconUrl,
      supportEmail,
      supportWhatsapp,
      dashboardWelcome,
      footerText,
      sidebarColor,
      accentColor,
      backgroundColor,
      borderColor,
    } = req.body;

    // Validar slug
    const exists = await Organization.findOne({ where: { slug } });
    if (exists)
      return res.status(400).json({ error: "Este SLUG já está em uso." });

    const org = await Organization.create({
      name,
      slug,
      logoUrl,
      primaryColor,
      secondaryColor,
      faviconUrl,
      supportEmail,
      supportWhatsapp,
      dashboardWelcome,
      footerText,
      sidebarColor,
      accentColor,
      backgroundColor,
      borderColor,
    });
    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar organização" });
  }
});

router.put("/organizations/:id", authAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      logoUrl,
      primaryColor,
      secondaryColor,
      active,
      faviconUrl,
      supportEmail,
      supportWhatsapp,
      dashboardWelcome,
      footerText,
      sidebarColor,
      accentColor,
      backgroundColor,
      borderColor,
    } = req.body;
    const org = await Organization.findByPk(req.params.id);
    if (!org)
      return res.status(404).json({ error: "Organização não encontrada" });

    org.name = name || org.name;
    org.slug = slug || org.slug;
    org.logoUrl = logoUrl !== undefined ? logoUrl : org.logoUrl;
    org.primaryColor = primaryColor || org.primaryColor;
    org.secondaryColor = secondaryColor || org.secondaryColor;
    if (active !== undefined) org.active = active;

    org.faviconUrl = faviconUrl !== undefined ? faviconUrl : org.faviconUrl;
    org.supportEmail =
      supportEmail !== undefined ? supportEmail : org.supportEmail;
    org.supportWhatsapp =
      supportWhatsapp !== undefined ? supportWhatsapp : org.supportWhatsapp;
    org.dashboardWelcome =
      dashboardWelcome !== undefined ? dashboardWelcome : org.dashboardWelcome;
    org.footerText = footerText !== undefined ? footerText : org.footerText;

    org.sidebarColor = sidebarColor || org.sidebarColor;
    org.accentColor = accentColor || org.accentColor;
    org.backgroundColor = backgroundColor || org.backgroundColor;
    org.borderColor = borderColor || org.borderColor;

    await org.save();
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar organização" });
  }
});

/* =========================
   GERENCIAMENTO DE PREÇOS
   ========================= */
const LIBRARY_SETTING_KEY = "library_enabled";

const PRICING_PLAN_IDS = [
  "student_basic",
  "student_pro",
  "lawyer_starter",
  "lawyer_growth",
  "office_master",
];

const DEFAULT_PRICES = {
  student_basic: "17.90",
  student_pro: "34.00",
  lawyer_starter: "127.00",
  lawyer_growth: "147.00",
  office_master: "497.00",
};

router.get("/settings/prices", authAdmin, async (req, res) => {
  try {
    const keys = PRICING_PLAN_IDS.map((id) => `price_${id}`);
    const settings = await Setting.findAll({ where: { key: keys } });

    const prices = { ...DEFAULT_PRICES };
    settings.forEach((s) => {
      const planId = s.key.replace("price_", "");
      prices[planId] = s.value;
    });

    res.json(prices);
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    res.status(500).json({ error: "Erro ao buscar preços" });
  }
});

router.post("/settings/prices", authAdmin, async (req, res) => {
  try {
    const updates = req.body; // { student_basic: "19.90", lawyer_starter: "127.00", ... }

    for (const [planId, price] of Object.entries(updates)) {
      if (!PRICING_PLAN_IDS.includes(planId)) continue; // segurança: só planos conhecidos
      const key = `price_${planId}`;
      const existing = await Setting.findOne({ where: { key } });
      if (existing) {
        existing.value = String(price);
        await existing.save();
      } else {
        await Setting.create({ key, value: String(price) });
      }
    }

    res.json({ message: "Preços atualizados com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar preços:", error);
    res.status(500).json({ error: "Erro ao salvar preços" });
  }
});

/* =========================
   FINANÇAS (Admin)
   ========================= */
router.get("/finance/stats", authAdmin, async (req, res) => {
  try {
    const keys = PRICING_PLAN_IDS.map((id) => `price_${id}`);
    const settings = await Setting.findAll({ where: { key: keys } });

    const basePrices = { ...DEFAULT_PRICES };
    settings.forEach((s) => {
      const planId = s.key.replace("price_", "");
      basePrices[planId] = s.value;
    });

    const activeUsers = await User.findAll({
      where: {
        subscriptionStatus: "active",
        parentUserId: null,
      },
      attributes: ["subscriptionPlan", "subscriptionPrice"],
    });

    let monthlyRevenue = 0;
    activeUsers.forEach((u) => {
      if (u.subscriptionPrice !== null && u.subscriptionPrice > 0) {
        monthlyRevenue += parseFloat(u.subscriptionPrice);
      } else if (basePrices[u.subscriptionPlan]) {
        monthlyRevenue += parseFloat(basePrices[u.subscriptionPlan]);
      }
    });

    res.json({ monthlyRevenue });
  } catch (error) {
    console.error("Erro calcular finanças:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas financeiras" });
  }
});

/* =========================
   CONTROLE DA BIBLIOTECA (MongoDB)
   ========================= */
router.get("/settings/library", authAdmin, async (req, res) => {
  try {
    const setting = await Setting.findOne({
      where: { key: LIBRARY_SETTING_KEY },
    });
    res.json({ enabled: setting ? setting.value === "true" : false });
  } catch (error) {
    console.error("Erro ao buscar status da biblioteca:", error);
    res.status(500).json({ error: "Erro ao buscar status da biblioteca" });
  }
});

router.post("/settings/library", authAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    let setting = await Setting.findOne({
      where: { key: LIBRARY_SETTING_KEY },
    });
    if (setting) {
      setting.value = String(enabled);
      await setting.save();
    } else {
      await Setting.create({
        key: LIBRARY_SETTING_KEY,
        value: String(enabled),
      });
    }
    res.json({
      message: `Biblioteca ${enabled ? "ativada" : "desativada"} com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao atualizar status da biblioteca:", error);
    res.status(500).json({ error: "Erro ao atualizar status da biblioteca" });
  }
});

export default router;
