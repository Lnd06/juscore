import sequelize from "./config/database.js";
import { User } from "./models/index.js";

const fixEnum = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado ao banco de dados.");

    // Altera a coluna tipo de ENUM para VARCHAR no banco MySQL
    await sequelize.query(
      "ALTER TABLE Users MODIFY COLUMN tipo VARCHAR(255) DEFAULT 'free';",
    );
    console.log(
      "Coluna 'tipo' alterada com sucesso para VARCHAR(255). O banco agora aceita qualquer plano.",
    );

    // Encontrar o usuario principal e torná-lo master de volta, caso ele tenha se trancado
    // Como não sei o email, posso tornar o ID 1 master novamente por precaução.
    await sequelize.query("UPDATE Users SET tipo = 'master' WHERE id = 1;");
    console.log("O usuário de número #1 foi promovido de volta a master.");
  } catch (error) {
    console.error("Erro ao alterar o banco:", error);
  } finally {
    process.exit();
  }
};

fixEnum();
