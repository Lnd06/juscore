import express from "express";
import { Setting } from "../models/index.js";

const router = express.Router();

// GET /api/public/contact
router.get("/contact", async (req, res) => {
  try {
    const settings = await Setting.findAll({
      where: {
        key: [
          "contact_email",
          "contact_whatsapp",
          "contact_instagram",
          "contact_github",
        ],
      },
    });

    const contactInfo = {
      contact_email: "",
      contact_whatsapp: "",
      contact_instagram: "",
      contact_github: "",
    };

    settings.forEach((setting) => {
      if (setting.key === "contact_email")
        contactInfo.contact_email = setting.value;
      if (setting.key === "contact_whatsapp")
        contactInfo.contact_whatsapp = setting.value;
      if (setting.key === "contact_instagram")
        contactInfo.contact_instagram = setting.value;
      if (setting.key === "contact_github")
        contactInfo.contact_github = setting.value;
    });

    // If no settings found, return defaults used in frontend so it doesn't break
    if (Object.values(contactInfo).every((val) => val === "")) {
      return res.json({
        contact_email: "contato@juscore.ai",
        contact_whatsapp: "5511999999999",
        contact_instagram: "https://instagram.com/juscore",
        contact_github: "https://github.com/juscore",
      });
    }

    res.json(contactInfo);
  } catch (error) {
    console.error("Error fetching contact info:", error);
    res.status(500).json({ error: "Erro ao buscar informações de contato" });
  }
});

// GET /api/public/prices (sem autenticação — landing page pode consumir)
router.get("/prices", async (req, res) => {
  const PLAN_IDS = [
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

  try {
    const keys = PLAN_IDS.map((id) => `price_${id}`);
    const settings = await Setting.findAll({ where: { key: keys } });

    const prices = { ...DEFAULT_PRICES };
    settings.forEach((s) => {
      const planId = s.key.replace("price_", "");
      prices[planId] = s.value;
    });

    res.json(prices);
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    res.json(DEFAULT_PRICES); // fallback seguro
  }
});

// GET /api/public/terms (sem autenticação)
router.get("/terms", async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: "terms_of_use" } });
    if (setting && setting.value) {
      return res.json({ terms: setting.value });
    }
    // Fallback message se não houver termos configurados
    return res.json({
      terms:
        "Os termos de uso ainda não foram configurados pelo administrador.",
    });
  } catch (error) {
    console.error("Erro ao buscar os termos:", error);
    res.status(500).json({ error: "Erro ao carregar os termos de uso." });
  }
});

export default router;
