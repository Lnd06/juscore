import sequelize from "../config/database.js";

console.log("🛠️ Injetando colunas 'lastMovement', 'aiSummary' e 'nextSteps' no banco de dados...");

async function patchDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco de dados bem-sucedida.");

    const columns = [
      { name: "lastMovement", type: "TEXT" },
      { name: "aiSummary", type: "TEXT" },
      { name: "nextSteps", type: "TEXT" }
    ];

    for (const col of columns) {
      try {
        await sequelize.query(`ALTER TABLE Processes ADD COLUMN ${col.name} ${col.type} NULL;`);
        console.log(`✅ Coluna '${col.name}' adicionada com sucesso na tabela Processes.`);
      } catch (e) {
        if (e.message.includes("Duplicate column name")) {
          console.log(`ℹ️ A coluna '${col.name}' já existe na tabela Processes.`);
        } else {
          console.error(`❌ Erro ao adicionar coluna ${col.name}:`, e.message);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Falha ao aplicar patch no banco de dados:", error);
    process.exit(1);
  }
}

patchDatabase();
