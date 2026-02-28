import sequelize from "../config/database.js";
import { User, Conversation } from "../models/index.js";
import bcrypt from "bcryptjs";

const USERS_TO_CREATE = [
  {
    nome: "Administrador Supremo",
    email: "admin@juscore.com",
    senha: "admin",
    apelido: "Admin",
    tipo: "admin",
    cargo: "Sócio Sênior",
    finalidade: "Gestão do Sistema",
    termosAceitos: true,
    dataAceiteTermos: new Date(),
  },
  {
    nome: "Doutora Cláudia (Especial)",
    email: "claudia@juscore.com",
    senha: "123",
    apelido: "Dra. Cláudia",
    tipo: "especial",
    cargo: "Advogado",
    finalidade: "Redação de Peças, Pesquisa Jurisprudencial",
    termosAceitos: true,
    dataAceiteTermos: new Date(),
  },
  {
    nome: "João Estudante",
    email: "joao@gmail.com",
    senha: "123",
    apelido: "João",
    tipo: "comum",
    cargo: "Estudante de Direito",
    finalidade: "Estudo e Aprendizado",
    termosAceitos: true,
    dataAceiteTermos: new Date(),
  },
  {
    nome: "Maria Advogada",
    email: "maria@adv.com",
    senha: "123",
    apelido: "Dra. Maria",
    tipo: "comum",
    cargo: "Advogado",
    finalidade: "Análise de Contratos",
    termosAceitos: true,
    dataAceiteTermos: new Date(),
  },
  {
    nome: "Roberto Paralegal",
    email: "beto@lawfirm.com",
    senha: "123",
    apelido: "Beto",
    tipo: "comum",
    cargo: "Assistente Jurídico",
    finalidade: "Resumo de Documentos",
    termosAceitos: true,
    dataAceiteTermos: new Date(),
  },
  {
    nome: "Ana Juíza (Especial)",
    email: "ana@jus.br",
    senha: "123",
    apelido: "Dra. Ana",
    tipo: "especial",
    cargo: "Outro",
    finalidade: "Consulta de Legislação",
    termosAceitos: true,
    dataAceiteTermos: new Date(),
  },
];

const TOPICS = [
  "Civil",
  "Trabalhista",
  "Penal",
  "Constitucional",
  "Tributário",
  "Previdenciário",
];
const SENTIMENTS = [
  "Neutro",
  "Dúvida Simples",
  "Urgente",
  "Frustrado",
  "Agradecido",
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function seed() {
  try {
    console.log("🌱 Iniciando Seed do Banco de Dados...");
    try {
      await sequelize.authenticate();
      console.log("✅ Conexão estabelecida.");
    } catch (e) {
      console.error("❌ Falha na conexão:", e);
      process.exit(1);
    }

    // Sync database (creates tables if not exist)
    await sequelize.sync();

    // Create Users
    console.log("👥 Criando usuários...");
    const createdUsers = [];

    for (const u of USERS_TO_CREATE) {
      const exists = await User.findOne({ where: { email: u.email } });
      if (!exists) {
        const newUser = await User.create(u);
        createdUsers.push(newUser);
        console.log(`   + Usuário criado: ${u.nome} (${u.tipo})`);
      } else {
        createdUsers.push(exists);
        console.log(`   . Usuário já existe: ${u.nome}`);
      }
    }

    const allUsers = await User.findAll();

    // Create Dummy Conversations
    console.log("💬 Gerando conversas fictícias...");
    const conversations = [];
    const now = new Date();
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(now.getDate() - 21);

    for (let i = 0; i < 50; i++) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      const date = getRandomDate(threeWeeksAgo, now);
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const sentiment =
        SENTIMENTS[Math.floor(Math.random() * SENTIMENTS.length)];
      const flagged = Math.random() < 0.05;

      await Conversation.create({
        userId: user.id,
        sessionId: `sess_${Date.now()}_${i}`,
        titulo: `Dúvida sobre ${topic} - ${i}`,
        mensagens: [
          { role: "user", content: `Tenho uma dúvida sobre ${topic}.` },
          {
            role: "assistant",
            content: `Entendo, posso ajudar com ${topic}. O que você precisa saber?`,
          },
        ],
        topic: topic,
        sentiment: sentiment,
        createdAt: date,
        updatedAt: date,
        flagged: false,
        flagReason: null,
      });
    }

    console.log(`✅ ${50} conversas geradas.`);
    console.log("🚀 Seed concluído com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro no seed:", err);
    process.exit(1);
  }
}

seed();
