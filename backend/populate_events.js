import dotenv from "dotenv";
import { User, Process, Event } from "./models/index.js";
import sequelize from "./config/database.js";

dotenv.config();

const email = "ttklndttk@gmail.com";

async function populateEvents() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`❌ User ${email} not found.`);
      process.exit(1);
    }

    const processes = await Process.findAll({ where: { userId: user.id } });
    console.log(
      `👤 Found user: ${user.nome} (ID: ${user.id}) with ${processes.length} processes.`,
    );

    const eventTemplates = [
      {
        titulo: "Audiência de Instrução",
        tipo: "audiencia",
        observacoes: "Levar documentos originais e testemunhas.",
      },
      {
        titulo: "Prazo: Contestação",
        tipo: "prazo",
        observacoes: "Protocolar até as 23:59.",
      },
      {
        titulo: "Reunião com Cliente",
        tipo: "reuniao",
        observacoes: "Discussão sobre novos fatos da causa.",
      },
      {
        titulo: "Análise de Documentos",
        tipo: "tarefa",
        observacoes: "Revisar petição inicial.",
      },
      {
        titulo: "Audiência de Conciliação",
        tipo: "audiencia",
        observacoes: "Verificar possibilidade de acordo.",
      },
      {
        titulo: "Prazo: Réplica",
        tipo: "prazo",
        observacoes: "Focar na nulidade da citação.",
      },
      {
        titulo: "Despacho com Juiz",
        tipo: "reuniao",
        observacoes: "Pedir urgência na liminar.",
      },
      {
        titulo: "Pesquisa Jurisprudencial",
        tipo: "tarefa",
        observacoes: "Buscar precedentes no STJ.",
      },
    ];

    let eventCount = 0;
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const template =
        eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const process =
        processes.length > 0
          ? processes[Math.floor(Math.random() * processes.length)]
          : null;

      // Random date between -5 days and +15 days
      const daysOffset = Math.floor(Math.random() * 20) - 5;
      const hoursOffset = Math.floor(Math.random() * 10) + 8; // 8 AM to 6 PM
      const eventDate = new Date(now);
      eventDate.setDate(now.getDate() + daysOffset);
      eventDate.setHours(hoursOffset, 0, 0, 0);

      await Event.create({
        userId: user.id,
        processId: process ? process.id : null,
        titulo: process
          ? `${template.titulo} - Proc. ${process.numero.slice(-5)}`
          : template.titulo,
        tipo: template.tipo,
        dataHora: eventDate,
        lembrete: Math.random() > 0.5,
        concluido: daysOffset < 0,
        observacoes: template.observacoes,
      });
      eventCount++;
    }

    console.log(`✅ Created ${eventCount} events in the agenda.`);
    console.log("🚀 Population finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during population:", error);
    process.exit(1);
  }
}

populateEvents();
