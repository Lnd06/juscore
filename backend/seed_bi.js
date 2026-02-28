import sequelize from "./config/database.js";
import { User, UserUsage } from "./models/index.js";
import bcrypt from "bcryptjs";

async function seedBIData() {
  try {
    await sequelize.authenticate();
    console.log("Conectado ao DB para semear dados de BI...");

    // 1. Encontrar o usuário Master
    const masterEmail = "ttklndttk@gmail.com";
    let masterUser = await User.findOne({ where: { email: masterEmail } });

    if (!masterUser) {
      console.log("Usuário Master não encontrado! Criando...");
      const senhaHash = await bcrypt.hash("Admin123", 8);
      masterUser = await User.create({
        nome: "Sócio Administrador",
        apelido: "Admin",
        email: masterEmail,
        senha: senhaHash,
        tipo: "master",
        subscriptionPlan: "office_master",
      });
    } else {
      // Garantir que é Office Master para ver o BI
      masterUser.tipo = "master";
      masterUser.subscriptionPlan = "office_master";
      await masterUser.save();
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Array de membros da equipe fictícios
    const fakeMembers = [
      {
        nome: "Advogado João Silva",
        apelido: "João",
        email: "joao@escritoriomaster.com.br",
        tipo: "especial",
      },
      {
        nome: "Dra. Maria Souza",
        apelido: "Maria",
        email: "maria@escritoriomaster.com.br",
        tipo: "especial",
      },
      {
        nome: "Estagiário Pedro (Paralegal)",
        apelido: "Pedro",
        email: "pedro@escritoriomaster.com.br",
        tipo: "comum",
      },
    ];

    const teamIds = [masterUser.id];

    console.log("Criando sub-usuários fictícios...");
    for (const member of fakeMembers) {
      // Deleta se já existe para recriar limpo
      await User.destroy({ where: { email: member.email } });

      const senhaHash = await bcrypt.hash("Senha123", 8);
      const newUser = await User.create({
        ...member,
        senha: senhaHash,
        parentUserId: masterUser.id,
        subscriptionPlan: "free", // O plano do filho herda do pai visualmente no app
      });
      teamIds.push(newUser.id);
    }

    console.log("Gerando uso de IA aleatório (UserUsage)...");

    // Deleta os usages antigos hoje dessa equipe para evitar conflito
    await UserUsage.destroy({ where: { userId: teamIds, date: todayStr } });

    // Cria uso
    for (const userId of teamIds) {
      await UserUsage.create({
        userId,
        date: todayStr,
        dailyConversations: Math.floor(Math.random() * 40), // 0-40 mensagens
        dailyDocuments: Math.floor(Math.random() * 10), // 0-10 petições
        dailyVision: Math.floor(Math.random() * 5), // 0-5 páginas OCR
        dailyCalculations: Math.floor(Math.random() * 8), // 0-8 cálculos
      });
    }

    console.log("🏆 Semeado com sucesso! Vá conferir o painel BI Jurídico.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao semear dados:", error);
    process.exit(1);
  }
}

seedBIData();
