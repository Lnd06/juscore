import dotenv from "dotenv";
import { User, Organization, Conversation } from "./models/index.js";
import sequelize from "./config/database.js";
import bcrypt from "bcryptjs";

dotenv.config();

const PLAN_IDS = [
  "free",
  "student_basic",
  "student_pro",
  "lawyer_starter",
  "lawyer_growth",
  "office_master",
];
const USER_TYPES = ["comum", "especial", "admin"];
const SENTIMENTS = ["Neutro", "Urgente", "Risco", "Dúvida"];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao banco de dados.");

    // 1. Criar Organizações
    const orgs = [];
    const orgNames = [
      "Silva & Associados",
      "Advocacia Digital",
      "Melo Advogados",
      "JusCore Partner",
      "Guerra & Oliveira",
    ];
    for (const name of orgNames) {
      const slug = name
        .toLowerCase()
        .replace(/ & /g, "-")
        .replace(/ /g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const [org] = await Organization.findOrCreate({
        where: { slug },
        defaults: {
          name,
          slug,
          primaryColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          secondaryColor: "#0f172a",
          active: true,
        },
      });
      orgs.push(org);
    }
    console.log(`🏢 ${orgs.length} Organizações verificadas/criadas.`);

    // 2. Criar 50 Usuários
    const password = await bcrypt.hash("123456", 8);
    let usersCreated = 0;

    for (let i = 1; i <= 50; i++) {
      const email = `usuario.teste${i}@juscore.ai`;
      const existingUser = await User.findOne({ where: { email } });

      if (!existingUser) {
        const plan = PLAN_IDS[i % PLAN_IDS.length];
        const type = USER_TYPES[i % USER_TYPES.length];
        const org =
          i % 5 === 0 ? orgs[Math.floor(Math.random() * orgs.length)] : null;

        const user = await User.create({
          nome: `Usuário de Teste ${i}`,
          email,
          senha: "NoHashNeededBecauseHookButWeUsingPreHashedForSafetyMaybeNot", // hook hashes it
          apelido: `Teste${i}`,
          tipo: type,
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          organizationId: org ? org.id : null,
          termosAceitos: true,
        });
        // Fix password manually because of hook double hashing if we are not careful,
        // but the hook in model uses 'user.senha' if changed.
        // Let's just pass raw "123456" and let hooks work.
        user.senha = "123456";
        await user.save();

        usersCreated++;

        // 3. Criar conversas para este usuário
        const numConversas = Math.floor(Math.random() * 6) + 3; // 3 a 8 conversas
        for (let j = 0; j < numConversas; j++) {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Últimos 7 dias

          await Conversation.create({
            userId: user.id,
            sessionId: `seed-${user.id}-${j}-${Date.now()}`,
            titulo: `Consulta Jurídica ${j + 1}`,
            topic: "Geral",
            sentiment:
              SENTIMENTS[Math.floor(Math.random() * SENTIMENTS.length)],
            flagged: Math.random() < 0.1, // 10% chance de ser flagged
            mensagens: [
              {
                role: "user",
                content: "Olá, tenho uma dúvida sobre um processo.",
              },
              { role: "assistant", content: "Como posso ajudar você hoje?" },
            ],
            createdAt: date,
            updatedAt: date,
          });
        }
      }
    }

    console.log(
      `👤 ${usersCreated} novos usuários criados com suas conversas.`,
    );
    console.log("🚀 Seeding finalizado com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro durante o seeding:", error);
    process.exit(1);
  }
}

seed();
