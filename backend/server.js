import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import cors from "cors";
import sequelize from "./config/database.js";
import {
  User,
  Conversation,
  Cache,
  Document,
  Setting,
} from "./models/index.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import exportRoutes from "./routes/export.js";
import calculatorRoutes from "./routes/calculator.js";
import publicRoutes from "./routes/public.js";
import asaasRoutes from "./routes/asaas.js";
import knowledgeRoutes from "./routes/knowledge.js";
import teamRoutes from "./routes/team.js";
import whatsappRoutes from "./routes/whatsapp.js";
import clientRoutes from "./routes/clients.js";
import processRoutes from "./routes/processes.js";
import eventRoutes from "./routes/events.js";
import feeRoutes from "./routes/fees.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import documentRoutes from "./routes/documents.js";
import feedbackRoutes from "./routes/feedback.js";
import announcementsRoutes from "./routes/announcements.js";
import { connectMongo, disconnectMongo } from "./config/mongodb.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set("trust proxy", 1);

import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false, // Permite que o popup se comunique com o opener (localhost:5173)
  }),
);
app.use(hpp()); // Protect against HTTP Parameter Pollution

// Rate Limiting - General (Aumentado para testes de dev)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Era 100, aumentado para 1000 em ambiente de testes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições, tente novamente mais tarde." },
});
app.use("/api/", limiter);

// Rate Limiting - Auth (Brute Force Protection - Aumentado para testes)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200, // Era 20, aumentado para 200 para não bloquear os testes
  message: { error: "Muitas tentativas de login, tente novamente em 1 hora." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/calculator", calculatorRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/payments", asaasRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/announcements", announcementsRoutes);

// Serve Frontend Dist folder
app.use(express.static(path.join(__dirname, "public")));

// Catch-all route to serve React app for non-API requests
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Erro:", err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

// Auto-cleanup duplicate indexes before sync (prevents "Too many keys" MySQL error)
const cleanDuplicateIndexes = async () => {
  try {
    const dbName = process.env.DB_NAME || "juscore_ai";
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      { replacements: [dbName] },
    );

    let totalDropped = 0;
    for (const { TABLE_NAME } of tables) {
      const [indexes] = await sequelize.query(
        `SHOW INDEX FROM \`${TABLE_NAME}\``,
      );
      // Group by column signature
      const byColumn = {};
      for (const idx of indexes) {
        if (idx.Key_name === "PRIMARY") continue;
        const col = idx.Column_name;
        if (!byColumn[col]) byColumn[col] = [];
        if (!byColumn[col].includes(idx.Key_name))
          byColumn[col].push(idx.Key_name);
      }
      // Drop duplicates (keep first, drop rest)
      for (const [col, names] of Object.entries(byColumn)) {
        if (names.length <= 1) continue;
        for (const name of names.slice(1)) {
          try {
            await sequelize.query(
              `ALTER TABLE \`${TABLE_NAME}\` DROP INDEX \`${name}\``,
            );
            totalDropped++;
          } catch {
            /* skip FK constraints */
          }
        }
      }
    }
    if (totalDropped > 0) {
      console.log(
        `🧹 Auto-cleanup: removidos ${totalDropped} índices duplicados`,
      );
    }
  } catch {
    /* silently skip if tables don't exist yet */
  }
};

// Database sync and server start
const startServer = async () => {
  try {
    // Retry logic for database connection
    let connected = false;
    while (!connected) {
      try {
        await sequelize.authenticate(); // Check connection first
        await cleanDuplicateIndexes(); // Always clean before sync
        await sequelize.sync({ alter: true });
        console.log("✅ MySQL conectado e sincronizado");
        connected = true;
      } catch (err) {
        console.error("❌ Falha na conexão com MySQL:", err.message);
        console.log("⏳ Tentando reconectar em 5 segundos...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Critical: Increase max_allowed_packet for large PDF content
    try {
      await sequelize.query("SET GLOBAL max_allowed_packet=67108864;"); // 64MB
      console.log("🔧 MySQL max_allowed_packet set to 64MB");
    } catch (dbErr) {
      console.warn(
        "⚠️ Failed to set max_allowed_packet. Uploads > 1MB may fail.",
        dbErr.message,
      );
    }

    // Connect to MongoDB Atlas (Biblioteca Jurídica) se estiver habilitado
    const librarySetting = await Setting.findOne({
      where: { key: "library_enabled" },
    });
    const isLibraryEnabled = librarySetting
      ? librarySetting.value === "true"
      : false;

    if (isLibraryEnabled) {
      console.log("📚 Biblioteca Jurídica habilitada no painel. Conectando...");
      await connectMongo();
    } else {
      console.log("📚 Biblioteca Jurídica desativada via Painel Master.");
    }

    // Start server after database connection
    app.listen(PORT, () => {
      console.log(`🚀 JusCore AI v1.7 rodando em http://localhost:${PORT}`);
      console.log(`📁 Frontend: http://localhost:${PORT}`);
      console.log(`🔐 Login: http://localhost:${PORT}/login`);
      console.log(`⚕️  Health Check: http://localhost:${PORT}/health`);
      console.log("⚖️  JusCore AI - Sistema Ativo\n");
    });
  } catch (err) {
    console.error("❌ Erro fatal ao iniciar servidor:", err.message);
    process.exit(1);
  }
};

startServer();
