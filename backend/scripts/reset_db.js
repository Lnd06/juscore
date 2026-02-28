import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
  });

  const dbName = process.env.DB_NAME || "juscore_ai";

  try {
    console.log(`🗑️  Apagando banco de dados: ${dbName}...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);

    console.log(
      `✨  Criando banco de dados com collation correta (utf8mb4_unicode_ci)...`,
    );
    await connection.query(
      `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    );

    console.log("✅ Banco de dados resetado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao resetar banco:", error);
  } finally {
    await connection.end();
  }
}

resetDatabase();
