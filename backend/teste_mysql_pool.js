import sequelize from "./config/database.js";
import { User } from "./models/index.js";

async function testeEstresseBanco() {
  console.log("🔥 INICIANDO TESTE DE ESTRESSE DO BANCO DE DADOS 🔥");
  console.log("=================================================");
  console.log("Conectando...");

  try {
    await sequelize.authenticate();
    console.log("✅ MySQL conectado.");
  } catch (e) {
    console.log(
      "❌ Falha crítica ao conectar no banco antes de começar:",
      e.message,
    );
    process.exit(1);
  }

  console.log("Disparando 1000 buscas simultâneas no banco de dados...");
  const promessas = [];

  // Dispara 1000 conexões de banco de dados EM PARALELO
  for (let i = 1; i <= 1000; i++) {
    promessas.push(
      User.findOne().then(() => {
        process.stdout.write("."); // Imprime um ponto para cada sucesso
      }),
    );
  }

  try {
    const inicio = Date.now();
    await Promise.all(promessas);
    const fim = Date.now();

    console.log(
      `\n\n✅ SUCESSO ABSOLUTO! 1000 consultas feitas em ${fim - inicio} milissegundos.`,
    );
    console.log("O Sequelize (Pool) enfileirou as conexões perfeitamente.");
    console.log(
      "Nenhuma requisição foi rejeitada com erro 'Too many connections'.",
    );
  } catch (erro) {
    console.error(
      "\n\n❌ ERRO DO BANCO: A padaria estourou o limite de cadeiras:",
      erro.message,
    );
  }

  process.exit(0);
}

testeEstresseBanco();
