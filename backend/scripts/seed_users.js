import { User } from "../models/index.js";
import sequelize from "../config/database.js";

const seedUsers = async () => {
  try {
    console.log("🌱 Iniciando o seed de usuários...");

    // Conectar ao banco
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida.");

    const users = [];
    const tipos = ["comum", "especial", "admin"];

    for (let i = 1; i <= 50; i++) {
      const tipoRandom = tipos[Math.floor(Math.random() * tipos.length)];
      users.push({
        nome: `Usuário Teste ${i}`,
        email: `user${i}_${Date.now()}@teste.com`,
        senha: "Senha123", // Será hasheada pelo hook
        apelido: `user${i}`,
        tipo: tipoRandom,
        termosAceitos: true,
        dataAceiteTermos: new Date(),
      });
    }

    // individualHooks: true é crucial para o beforeCreate rodar e hashear a senha
    await User.bulkCreate(users, { individualHooks: true });

    console.log(`✅ ${users.length} usuários criados com sucesso!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar usuários:", error);
    process.exit(1);
  }
};

seedUsers();
