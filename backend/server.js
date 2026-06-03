import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Validador de Configuração de Segurança Inicial (Proteção criptográfica em boot)
const validateSecurityConfig = () => {
  const warnings = [];
  if (!process.env.JWT_SECRET) {
    warnings.push("[JWT] JWT_SECRET nao esta configurada no .env! Gerando uma assinatura temporaria segura para este processo...");
    process.env.JWT_SECRET = "temp_jwt_signing_key_secure_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  } else if (
    process.env.JWT_SECRET.length < 16 || 
    process.env.JWT_SECRET === "your_jwt_secret_here" || 
    process.env.JWT_SECRET === "supersecretkey" ||
    process.env.JWT_SECRET === "secret"
  ) {
    warnings.push("[JWT] A chave JWT_SECRET configurada no .env eh muito fraca ou utiliza valores padrao conhecidos! Substitua-a por uma string criptografica complexa em producao.");
  }
  if (warnings.length > 0) {
    console.warn("\n[SECURITY GUARD] Alertas de Segurança Detectados no Boot:");
    warnings.forEach(warn => console.warn(warn));
    console.warn("----------------------------------------------------------\n");
  } else {
    console.log("\n[SECURITY GUARD] Assinaturas criptograficas e variaveis criticas validadas com sucesso.\n");
  }
};
validateSecurityConfig();


import express from "express";
import cors from "cors";
import sequelize from "./config/database.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import exportRoutes from "./routes/export.js";
import calculatorRoutes from "./routes/calculator.js";
import publicRoutes from "./routes/public.js";
import asaasRoutes from "./routes/asaas.js";
import knowledgeRoutes from "./routes/knowledge.js";
import teamRoutes from "./routes/team.js";
import clientRoutes from "./routes/clients.js";
import processRoutes from "./routes/processes.js";
import eventRoutes from "./routes/events.js";
import feeRoutes from "./routes/fees.js";
import financeRoutes from "./routes/finance.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import documentRoutes from "./routes/documents.js";
import feedbackRoutes from "./routes/feedback.js";
import announcementsRoutes from "./routes/announcements.js";
import signaturesRoutes from "./routes/signatures.js";
import { initSyncScheduler } from "./services/syncCron.js";
import { inicializarPinecone } from "./services/pineconeService.js";
// MongoDB removido — Biblioteca Jurídica agora é 100% baseada em arquivos locais (backend/livros/)

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
    contentSecurityPolicy: false, // Desabilitado para permitir blobs/workers do PDF.js no frontend
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

// Configuração Restritiva e Segura de CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  "http://administratorlocalwebhost.meu-dominiio:5174",
  "http://administratorlocalwebhost.meu-dominiio",
  "https://juscore.net",
  "https://www.juscore.net",
  "https://master.juscore.net",
  "http://juscore.net",
  "http://www.juscore.net",
  "http://master.juscore.net",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origem (ex: chamadas internas do servidor ou ferramentas locais)
      if (!origin) return callback(null, true);
      const isAllowed = 
        allowedOrigins.indexOf(origin) !== -1 || 
        origin.startsWith("http://localhost:") ||
        origin.startsWith("https://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith("juscore.net") ||
        /187\.77\.226\.73/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Origin not allowed by security rules."), false);
    },
    credentials: true,
  })
);

// Limites de payload seguros para evitar ataques de exaustão de memória (DoS)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
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
app.use("/api/clients", clientRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/signatures", signaturesRoutes);

// Serve o frontend construído no próprio backend (para ambiente local ou quando Nginx não for usado)
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Resposta para React Router - Todas as rotas não-API enviam para o index.html
app.get("*", (req, res, next) => {
  if (req.url.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
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
        `Auto-cleanup: removidos ${totalDropped} indices duplicados`,
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

        // Ensure signerName column exists (safety patch for Sequelize alter:true bypass issues)
        try {
          await sequelize.query(
            "ALTER TABLE SignatureRequests ADD COLUMN signerName VARCHAR(255) NULL;",
          );
          console.log("Schema Patch: signerName column injected.");
        } catch (colErr) {
          // Ignores error if column already exists
        }

        try {
          await sequelize.query(
            "ALTER TABLE SignatureRequests ADD COLUMN signatureImage LONGTEXT NULL;",
          );
          console.log("Schema Patch: signatureImage column injected.");
        } catch (colErr) {
          // Ignores error if column already exists
        }

        try {
          await sequelize.query(
            "ALTER TABLE SignatureRequests ADD COLUMN lawyerSignatureImage LONGTEXT NULL;",
          );
          console.log("Schema Patch: lawyerSignatureImage column injected.");
        } catch (colErr) {
          // Ignores error if column already exists
        }

        try {
          await sequelize.query(
            "ALTER TABLE Users ADD COLUMN oab VARCHAR(255) NULL;",
          );
          console.log("Schema Patch: oab column injected in Users table.");
        } catch (colErr) {
          // Ignores error if column already exists
        }

        // Schema Patch for UserUsages dailyDeepResearch column
        try {
          await sequelize.query(
            "ALTER TABLE UserUsages ADD COLUMN dailyDeepResearch INT DEFAULT 0;",
          );
          console.log("Schema Patch: dailyDeepResearch column injected in UserUsages table.");
        } catch (colErr) {
          // Ignores error if column already exists
        }

        // Signature v2 patches (crypto + identity fields)
        const sigV2Cols = [
          "signerEmail VARCHAR(255) NULL",
          "signerPhone VARCHAR(50) NULL",
          "signerUserAgent TEXT NULL",
          "documentHash VARCHAR(128) NULL",
          "signatureHash VARCHAR(128) NULL",
          "verificationCode VARCHAR(16) NULL",
        ];
        for (const col of sigV2Cols) {
          try {
            await sequelize.query(`ALTER TABLE SignatureRequests ADD COLUMN ${col};`);
            console.log(`Schema Patch: ${col.split(" ")[0]} injected.`);
          } catch { /* column already exists */ }
        }

        await sequelize.sync();
        console.log("MySQL conectado e sincronizado");

        // Auto-seed visible_plans if not exists
        try {
          const Setting = (await import("./models/Setting.js")).default;
          const exists = await Setting.findOne({ where: { key: "visible_plans" } });
          if (!exists) {
            await Setting.create({
              key: "visible_plans",
              value: JSON.stringify(["free", "student_basic", "student_pro", "student_master", "enterprise"])
            });
            console.log("Database Seed: visible_plans default seeded.");
          }
        } catch (seedErr) {
          console.error("Failed to seed visible_plans:", seedErr.message);
        }

        connected = true;
      } catch (err) {
        console.error("Falha na conexao com MySQL:", err.message);
        console.log("Tentando reconectar em 5 segundos...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Critical: Increase max_allowed_packet for large PDF content
    try {
      await sequelize.query("SET GLOBAL max_allowed_packet=67108864;"); // 64MB
      console.log("MySQL max_allowed_packet set to 64MB");
    } catch (dbErr) {
      console.warn(
        "Failed to set max_allowed_packet. Uploads > 1MB may fail.",
        dbErr.message,
      );
    }

    // Biblioteca Jurídica agora opera via sistema de arquivos local (backend/livros/)
    console.log("Biblioteca Jurídica operando via File System (backend/livros/).");

    // Inicializar o banco de dados vetorial Pinecone
    try {
      await inicializarPinecone();
    } catch (pineconeErr) {
      console.error("❌ Falha ao conectar/inicializar o Pinecone no arranque:", pineconeErr.message);
    }

    // Start server after database connection
    app.listen(PORT, () => {
      console.log(`JusCore AI v1.7 rodando em http://localhost:${PORT}`);
      console.log(`Frontend: http://localhost:${PORT}`);
      console.log(`Login: http://localhost:${PORT}/login`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log("JusCore AI - Sistema Ativo\n");
      
      // Inicializar agendador automático de sincronização de processos
      initSyncScheduler();
    });
  } catch (err) {
    console.error("Erro fatal ao iniciar servidor:", err.message);
    process.exit(1);
  }
};

startServer();
