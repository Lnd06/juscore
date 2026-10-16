import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
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
