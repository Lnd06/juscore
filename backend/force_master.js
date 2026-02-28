import sequelize from "./config/database.js";

const forceMaster = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query(
      "UPDATE Users SET tipo = 'master' WHERE email = 'ttklndttk@gmail.com';",
    );
    console.log(
      "Usuário ttklndttk@gmail.com atualizado para 'master' com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
  } finally {
    process.exit();
  }
};

forceMaster();
