import dotenv from "dotenv";
import { User, Client, Process, Fee } from "./models/index.js";
import sequelize from "./config/database.js";

dotenv.config();

const email = "ttklndttk@gmail.com";

async function populate() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`❌ User ${email} not found.`);
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.nome} (ID: ${user.id})`);

    // Ensure user is master/comum and has subscription
    await user.update({
      tipo: "master",
      subscriptionPlan: "master",
      status: "ativo",
    });

    // 1. Create Fake Clients
    const clientData = [
      {
        nome: "João da Silva",
        email: "joao@email.com",
        telefone: "(11) 98888-7777",
        cpf_cnpj: "123.456.789-00",
      },
      {
        nome: "Maria Oliveira",
        email: "maria@email.com",
        telefone: "(11) 97777-6666",
        cpf_cnpj: "234.567.890-11",
      },
      {
        nome: "Empresa ABC Ltda",
        email: "contato@abc.com",
        telefone: "(11) 3333-4444",
        cpf_cnpj: "12.345.678/0001-99",
      },
      {
        nome: "Carlos Santos",
        email: "carlos@email.com",
        telefone: "(21) 95555-4444",
        cpf_cnpj: "345.678.901-22",
      },
      {
        nome: "Ana Costa",
        email: "ana@email.com",
        telefone: "(31) 94444-3333",
        cpf_cnpj: "456.789.012-33",
      },
    ];

    const clients = [];
    for (const data of clientData) {
      const client = await Client.create({ ...data, userId: user.id });
      clients.push(client);
    }
    console.log(`✅ Created ${clients.length} clients.`);

    // 2. Create Fake Processes
    const processData = [
      {
        numero: "1000123-45.2023.8.26.0100",
        tribunal: "TJSP",
        vara: "1ª Vara Cível",
        status: "ativo",
        valorCausa: 50000.0,
      },
      {
        numero: "0000456-11.2022.5.02.0001",
        tribunal: "TRT2",
        vara: "10ª Vara do Trabalho",
        status: "ativo",
        valorCausa: 15000.0,
      },
      {
        numero: "5000789-88.2023.4.03.6100",
        tribunal: "JFSP",
        vara: "5ª Vara Federal",
        status: "suspenso",
        valorCausa: 120000.0,
      },
      {
        numero: "1010222-33.2023.8.26.0000",
        tribunal: "TJSP",
        vara: "2ª Vara de Família",
        status: "ativo",
        valorCausa: 0.0,
      },
      {
        numero: "0011333-44.2021.8.19.0001",
        tribunal: "TJRJ",
        vara: "3ª Vara Cível",
        status: "arquivado",
        valorCausa: 25000.0,
      },
      {
        numero: "1020444-55.2023.8.26.0100",
        tribunal: "TJSP",
        vara: "12ª Vara Cível",
        status: "ativo",
        valorCausa: 8500.0,
      },
      {
        numero: "5030555-66.2022.4.03.0000",
        tribunal: "TRF3",
        vara: "Gab. 1",
        status: "ativo",
        valorCausa: 450000.0,
      },
      {
        numero: "0000666-77.2023.5.15.0001",
        tribunal: "TRT15",
        vara: "1ª Vara do Trabalho",
        status: "ativo",
        valorCausa: 32000.0,
      },
    ];

    const processes = [];
    for (let i = 0; i < processData.length; i++) {
      const client = clients[i % clients.length];
      const process = await Process.create({
        ...processData[i],
        userId: user.id,
        clientId: client.id,
        partes: { autor: client.nome, reu: "Parte Contrária" },
      });
      processes.push(process);
    }
    console.log(`✅ Created ${processes.length} processes.`);

    // 3. Create Fake Fees (Billing)
    const feeDescriptions = [
      "Honorários Iniciais",
      "Consultoria Mensal",
      "Sucumbência",
      "Diligência",
      "Elaboração de Recurso",
    ];

    let feeCount = 0;
    for (const process of processes) {
      // 2-3 fees per process
      const numFees = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numFees; j++) {
        const status = ["pago", "pendente", "atrasado"][
          Math.floor(Math.random() * 3)
        ];
        const value = (Math.random() * 5000 + 500).toFixed(2);
        await Fee.create({
          userId: user.id,
          processId: process.id,
          clientId: process.clientId,
          descricao:
            feeDescriptions[Math.floor(Math.random() * feeDescriptions.length)],
          valorTotal: value,
          status: status,
          vencimento: new Date(
            Date.now() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0],
          dataPagamento:
            status === "pago" ? new Date().toISOString().split("T")[0] : null,
        });
        feeCount++;
      }
    }
    console.log(`✅ Created ${feeCount} fees.`);

    console.log("🚀 Population finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during population:", error);
    process.exit(1);
  }
}

populate();
