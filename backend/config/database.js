import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env.local (gerado pelo Neon CLI) e .env do backend
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const rawDatabaseUrl = process.env.DATABASE_URL;
let databaseUrl = rawDatabaseUrl;
if (rawDatabaseUrl) {
  try {
    const parsedUrl = new URL(rawDatabaseUrl);
    parsedUrl.searchParams.delete("channel_binding");
    parsedUrl.searchParams.delete("sslmode");
    databaseUrl = parsedUrl.toString();
  } catch {
    databaseUrl = rawDatabaseUrl;
  }
}

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      pool: {
        max: process.env.VERCEL ? 5 : 20,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(
      process.env.DB_NAME || "juscore_ai",
      process.env.DB_USER || "root",
      process.env.DB_PASS || "",
      {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        dialect: "mysql",
        logging: false, // Set to console.log to see SQL queries
        define: {
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          timestamps: true,
        },
        dialectOptions: {
          ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
          dateStrings: true,
          typeCast: true,
        },
        timezone: "-03:00", // Horário de Brasília
        pool: {
          max: process.env.VERCEL ? 10 : 30, // Máximo de conexões simultâneas
          min: process.env.VERCEL ? 0 : 5, // Em ambiente serverless/container efêmero, não reter conexões ociosas mínimas
          acquire: 30000, // Tempo máximo (ms) para tentar conectar antes de dar erro
          idle: 10000, // Tempo (ms) que uma conexão pode ficar ociosa antes de ser fechada
        },
      },
    );

export default sequelize;
