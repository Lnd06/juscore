import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/index.js";
import * as googleService from "../services/googleCalendar.js";
import { auth } from "../midleware/auth.js";

const router = express.Router();

router.get("/google/url", (req, res) => {
  dotenv.config();
  console.log(
    "🔑 Google Client ID carregado:",
    process.env.GOOGLE_CLIENT_ID ? "SIM" : "NÃO",
  );

  const url = googleService.getAuthUrl();
  if (!url) {
    return res.status(400).json({
      error:
        "Configuração do Google ausente. Por favor, coloque seu CLIENT_ID e SECRET no arquivo .env e reinicie o servidor se necessário.",
    });
  }
  res.json({ url });
});

// Google OAuth2 Callback
router.get("/google/callback", async (req, res) => {
  dotenv.config();
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const tokens = await googleService.getTokens(code);
    const profile = await googleService.getUserInfo(tokens);

    // Find or create user
    let user = await User.findOne({ where: { googleId: profile.id } });

    if (!user) {
      user = await User.findOne({ where: { email: profile.email } });
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.googleTokens = JSON.stringify(tokens);
        await user.save();
      } else {
        // Create new user via Google
        user = await User.create({
          nome: profile.name,
          email: profile.email,
          apelido: profile.given_name || profile.name,
          googleId: profile.id,
          googleTokens: JSON.stringify(tokens),
          tipo: "comum",
          cargo: "Advogado(a)",
          finalidade: "Gestão Jurídica",
          termosAceitos: true,
          dataAceiteTermos: new Date(),
          senha: Math.random().toString(36).slice(-10) + "A1!",
        });
      }
    } else {
      user.googleTokens = JSON.stringify(tokens);
      await user.save();
    }

    // Generate JWT
    const authToken = jwt.sign(
      { id: user.id, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      apelido: user.apelido,
      tipo: user.tipo,
      cargo: user.cargo,
      subscriptionPlan: user.subscriptionPlan,
      googleId: user.googleId,
    };

    // ✅ A URL do Frontend original
    const frontendUrl = process.env.FRONTEND_URL || "https://juscore.net";

    // Removemos qualquer sufixo "/" indesejado
    const baseUrl = frontendUrl.endsWith("/")
      ? frontendUrl.slice(0, -1)
      : frontendUrl;

    const userParam = encodeURIComponent(JSON.stringify(userData));
    return res.redirect(
      `${baseUrl}/auth/google/callback?token=${authToken}&user=${userParam}`,
    );
  } catch (error) {
    console.error("Error in Google Callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "https://juscore.net";
    const baseUrl = frontendUrl.endsWith("/")
      ? frontendUrl.slice(0, -1)
      : frontendUrl;
    return res.redirect(`${baseUrl}/auth/google/callback?error=auth_failed`);
  }
});

// Desconectar Google (apagar googleId e tokens do usuário)
router.post("/google/disconnect", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    user.googleId = null;
    user.googleTokens = null;
    await user.save();
    res.json({ message: "Google desconectado com sucesso." });
  } catch (error) {
    console.error("Erro ao desconectar Google:", error);
    res.status(500).json({ error: "Erro ao desconectar Google" });
  }
});

export default router;
