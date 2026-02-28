/**
 * MySQL Index Cleanup Script
 *
 * Fixes: "Too many keys specified; max 64 keys allowed"
 *
 * This error happens when Sequelize's sync({ alter: true }) creates duplicate
 * indexes over multiple runs. This script finds and drops all non-essential
 * duplicate indexes from every table in the database.
 *
 * Usage: node backend/scripts/cleanup_indexes.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

import sequelize from "../config/database.js";

async function cleanupIndexes() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao MySQL");

    const dbName = process.env.DB_NAME || "juscore_ai";

    // Get all tables
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      { replacements: [dbName] },
    );

    console.log(`\n📋 Encontradas ${tables.length} tabelas\n`);

    let totalDropped = 0;

    for (const { TABLE_NAME } of tables) {
      // Get all indexes for this table
      const [indexes] = await sequelize.query(
        `SHOW INDEX FROM \`${TABLE_NAME}\``,
      );

      if (indexes.length === 0) continue;

      // Group indexes by name
      const indexMap = {};
      for (const idx of indexes) {
        if (!indexMap[idx.Key_name]) {
          indexMap[idx.Key_name] = {
            name: idx.Key_name,
            columns: [],
            unique: !idx.Non_unique,
          };
        }
        indexMap[idx.Key_name].columns.push(idx.Column_name);
      }

      // Find duplicates: multiple indexes covering the same column(s)
      // Group by column signature
      const columnSignatures = {};
      for (const [name, info] of Object.entries(indexMap)) {
        if (name === "PRIMARY") continue; // Never touch PRIMARY key

        const sig = info.columns.sort().join(",");
        if (!columnSignatures[sig]) {
          columnSignatures[sig] = [];
        }
        columnSignatures[sig].push({ name, ...info });
      }

      // For each group of duplicates, keep the first one and drop the rest
      for (const [sig, group] of Object.entries(columnSignatures)) {
        if (group.length <= 1) continue; // No duplicates

        // Prefer keeping the 'unique' one, or the shortest-named one
        group.sort((a, b) => {
          if (a.unique && !b.unique) return -1;
          if (!a.unique && b.unique) return 1;
          return a.name.length - b.name.length;
        });

        const keep = group[0];
        const toDrop = group.slice(1);

        for (const idx of toDrop) {
          try {
            await sequelize.query(
              `ALTER TABLE \`${TABLE_NAME}\` DROP INDEX \`${idx.name}\``,
            );
            console.log(
              `  🗑️  ${TABLE_NAME}: Dropped duplicate index "${idx.name}" (cols: ${sig}) — kept "${keep.name}"`,
            );
            totalDropped++;
          } catch (err) {
            console.warn(
              `  ⚠️  ${TABLE_NAME}: Failed to drop "${idx.name}": ${err.message}`,
            );
          }
        }
      }

      // Also check for total index count and warn
      const remainingIndexes =
        Object.keys(indexMap).length - (columnSignatures ? 0 : 0);
      if (remainingIndexes > 50) {
        console.warn(
          `  ⚠️  ${TABLE_NAME} still has ${remainingIndexes} indexes (MySQL max is 64)`,
        );
      }
    }

    console.log(
      `\n✅ Limpeza concluída! ${totalDropped} índices duplicados removidos.`,
    );

    if (totalDropped > 0) {
      console.log("\n🔄 Agora reinicie o servidor: npm start");
    } else {
      console.log(
        "\nNenhum índice duplicado encontrado. O problema pode ser outra coisa.",
      );
      console.log("Vamos listar as contagens de índices por tabela:\n");

      for (const { TABLE_NAME } of tables) {
        const [indexes] = await sequelize.query(
          `SHOW INDEX FROM \`${TABLE_NAME}\``,
        );
        const indexNames = [...new Set(indexes.map((i) => i.Key_name))];
        console.log(`  ${TABLE_NAME}: ${indexNames.length} índices`);
        if (indexNames.length > 10) {
          console.log(`    Índices: ${indexNames.join(", ")}`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

cleanupIndexes();
