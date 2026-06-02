import sequelize from "./config/database.js";
import { User, UserUsage } from "./models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";

async function seedBIData() {
  try {
    await sequelize.authenticate();
    console.log("Conectado ao DB para semear dados de BI...");

    // 1. Garantir que os usuários Masters principais existam
    const masterEmails = ["ttklndttk@gmail.com", "dd9429302@gmail.com"];
    
    for (const email of masterEmails) {
      let masterUser = await User.findOne({ where: { email } });
      if (!masterUser) {
        console.log(`Usuário Master (${email}) não encontrado! Criando...`);
        const senhaHash = await bcrypt.hash("Admin123", 8);
        await User.create({
          nome: email === "dd9429302@gmail.com" ? "Daniel Duarte Guimaraes" : "Sócio Administrador",
          apelido: email === "dd9429302@gmail.com" ? "Daniel" : "Admin",
          email,
          senha: senhaHash,
          tipo: "master",
          subscriptionPlan: "office_master",
        });
      } else {
        masterUser.tipo = "master";
        masterUser.subscriptionPlan = "office_master";
        await masterUser.save();
      }
    }

    // 2. Buscar todos os donos elegíveis ao BI
    const eligibleOwners = await User.findAll({
      where: {
        [Op.or]: [
          { email: masterEmails },
          { subscriptionPlan: ["office_master", "lawyer_growth", "enterprise"] },
          { tipo: ["master", "admin"] }
        ]
      }
    });

    console.log(`Encontrados ${eligibleOwners.length} usuários qualificados para receber dados de BI.`);

    const todayStr = new Date().toISOString().split("T")[0];

    for (const owner of eligibleOwners) {
      console.log(`\nProcessando BI para: ${owner.nome} (${owner.email}) [ID: ${owner.id}]`);
      
      // Garantir que planos que tenham acesso visual ao dashboard estejam definidos
      if (owner.subscriptionPlan !== "lawyer_growth" && owner.subscriptionPlan !== "enterprise") {
        owner.subscriptionPlan = "office_master";
      }
      if (owner.tipo !== "master" && owner.tipo !== "admin") {
        owner.tipo = "master";
      }
      await owner.save();

      // Array de membros da equipe fictícios (usando ID do dono para garantir emails únicos)
      const fakeMembers = [
        {
          nome: "Advogado João Silva",
          apelido: "João",
          email: `joao_${owner.id}@escritoriomaster.com.br`,
          tipo: "especial",
        },
        {
          nome: "Dra. Maria Souza",
          apelido: "Maria",
          email: `maria_${owner.id}@escritoriomaster.com.br`,
          tipo: "especial",
        },
        {
          nome: "Estagiário Pedro (Paralegal)",
          apelido: "Pedro",
          email: `pedro_${owner.id}@escritoriomaster.com.br`,
          tipo: "comum",
        },
      ];

      const teamIds = [owner.id];

      console.log(`Criando sub-usuários fictícios para o dono ${owner.id}...`);
      for (const member of fakeMembers) {
        // Deleta se já existe para recriar limpo
        await User.destroy({ where: { email: member.email } });

        const senhaHash = await bcrypt.hash("Senha123", 8);
        const newUser = await User.create({
          ...member,
          senha: senhaHash,
          parentUserId: owner.id,
          subscriptionPlan: "free",
        });
        teamIds.push(newUser.id);
      }

      console.log(`Gerando uso de IA para a equipe do dono ${owner.id}...`);

      // Deleta os usages antigos dessa equipe para evitar conflitos de chave única no userId
      await UserUsage.destroy({ where: { userId: teamIds } });

      // Cria usos de IA aleatórios maiores que zero
      for (const userId of teamIds) {
        await UserUsage.create({
          userId,
          date: todayStr,
          dailyConversations: Math.floor(Math.random() * 40) + 12, // 12-52 mensagens
          dailyDocuments: Math.floor(Math.random() * 10) + 4, // 4-14 petições
          dailyVision: Math.floor(Math.random() * 5) + 2, // 2-7 páginas
          dailyCalculations: Math.floor(Math.random() * 8) + 2, // 2-10 cálculos
        });
      }
    }

    console.log("\n🏆 Semeado com sucesso para TODOS os usuários qualificados! Vá conferir o painel BI Jurídico.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao semear dados:", error);
    process.exit(1);
  }
}

seedBIData();
