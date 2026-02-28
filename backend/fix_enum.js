import sequelize from "./config/database.js";
import { QueryTypes } from "sequelize";

async function forceAlterEnum() {
  try {
    await sequelize.authenticate();
    console.log("Conectado ao DB...");

    // Altera a coluna de ENUM restrito para VARCHAR livre para acomodar novos planos
    await sequelize.query(
      `ALTER TABLE Users MODIFY COLUMN subscriptionPlan VARCHAR(255) DEFAULT 'free';`,
      { type: QueryTypes.RAW },
    );

    console.log(
      "Coluna 'subscriptionPlan' de Users convertida para STRING com sucesso.",
    );
    process.exit(0);
  } catch (error) {
    console.error("Erro ao alterar tipo da coluna:", error);
    process.exit(1);
  }
}

forceAlterEnum();
