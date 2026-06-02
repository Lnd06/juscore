import sequelize from "../config/database.js";

console.log("🛠️ Injetando coluna 'oab' no banco de dados se não existir...");

async function patchDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco de dados bem-sucedida.");

    try {
      await sequelize.query("ALTER TABLE Users ADD COLUMN oab VARCHAR(255) NULL;");
      console.log("✅ Coluna 'oab' adicionada com sucesso na tabela Users.");
    } catch (e) {
      if (e.message.includes("Duplicate column name")) {
        console.log("ℹ️ A coluna 'oab' já existe na tabela Users.");
      } else {
        throw e;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Falha ao aplicar patch no banco de dados:", error);
    process.exit(1);
  }
}

patchDatabase();
