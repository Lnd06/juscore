import sequelize from "../config/database.js";
import { User } from "../models/index.js";

async function forceSync() {
  try {
    await sequelize.authenticate();
    // Use raw query to avoid issues
    try {
      await sequelize.query(
        "ALTER TABLE Users ADD COLUMN cancelAtPeriodEnd BOOLEAN DEFAULT false;",
      );
      console.log("Col adicionada com query bruta.");
    } catch (e) {
      console.log("A coluna talvez já exista:", e.message);
    }
    await sequelize.sync({ alter: true });
    console.log("Banco sincronizado!");
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    process.exit(0);
  }
}
forceSync();
