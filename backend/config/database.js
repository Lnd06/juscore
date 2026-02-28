import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "juscore_ai",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Set to console.log to see SQL queries
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      timestamps: true,
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
    },
    timezone: "-03:00", // Horário de Brasília
    pool: {
      max: 30, // Máximo de conexões simultâneas
      min: 5, // Mínimo de conexões mantidas abertas
      acquire: 30000, // Tempo máximo (ms) para tentar conectar antes de dar erro
      idle: 10000, // Tempo (ms) que uma conexão pode ficar ociosa antes de ser fechada
    },
  },
);

export default sequelize;
