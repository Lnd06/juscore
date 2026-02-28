/**
 * Aggressive MySQL Index Cleanup - Pass 2
 *
 * Drops ALL non-PRIMARY, non-foreign-key indexes from settings and users tables,
 * then lets Sequelize recreate only the ones it needs.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import sequelize from "../config/database.js";

async function aggressiveCleanup() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao MySQL\n");

    const tablesToClean = [
      "settings",
      "users",
      "conversations",
      "documents",
      "caches",
      "knowledge_bases",
    ];

    for (const table of tablesToClean) {
      try {
        const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${table}\``);
        const indexNames = [...new Set(indexes.map((i) => i.Key_name))];
        console.log(`📋 ${table}: ${indexNames.length} índices encontrados`);

        let dropped = 0;
        for (const name of indexNames) {
          if (name === "PRIMARY") continue;

          try {
            await sequelize.query(
              `ALTER TABLE \`${table}\` DROP INDEX \`${name}\``,
            );
            dropped++;
          } catch (err) {
            // Skip if it's a FK constraint
            if (err.message.includes("foreign key")) {
              console.log(`  ⏩ Mantido (FK): ${name}`);
            } else {
              console.warn(`  ⚠️  Erro ao dropar ${name}: ${err.message}`);
            }
          }
        }
        console.log(`  🗑️  Removidos: ${dropped} índices\n`);
      } catch (err) {
        if (err.message.includes("doesn't exist")) {
          console.log(`  ⏩ Tabela ${table} não existe, pulando.\n`);
        } else {
          console.warn(`  ⚠️  Erro na tabela ${table}: ${err.message}\n`);
        }
      }
    }

    console.log("✅ Limpeza agressiva concluída!");
    console.log(
      "🔄 Reinicie o servidor para que o Sequelize recrie os índices necessários.",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

aggressiveCleanup();
