import sequelize from "../config/database.js";

async function testConnection() {
  try {
    console.log("🔍 Tentando conectar ao banco de dados Hostinger...");
    console.log(
      `Configuração: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`,
    );

    await sequelize.authenticate();
    console.log("✅ Conexão estabelecida com sucesso!");

    const tables = await sequelize.query("SHOW TABLES");
    console.log(
      "📋 Tabelas encontradas:",
      tables[0].map((t) => Object.values(t)[0]),
    );
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco de dados:");
    console.error(error.message);
  } finally {
    process.exit();
  }
}

testConnection();
