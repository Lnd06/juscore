import dotenv from "dotenv";
import { User, Process } from "./models/index.js";

dotenv.config();

console.log("🚀 Iniciando teste de OAB interno...");

async function testOabLogic() {
  const oab = "SP123456";
  const cleanOab = oab.trim();
  
  // 1. Procurar advogado na base de dados local
  const lawyer = await User.findOne({
    where: { oab: cleanOab },
    attributes: ["id", "nome", "oab"]
  });

  console.log("Advogado Localizado no Banco:", lawyer ? lawyer.nome : "Nenhum (usando crawler simulado)");

  const oabDigits = cleanOab.replace(/\D/g, "");
  const numSeed = parseInt(oabDigits || "123456");
  const activeCount = (numSeed % 23) + 5;
  const totalCount = Math.round(activeCount * 1.35);

  console.log("--- Métricas Geradas ---");
  console.log("Active Count:", activeCount);
  console.log("Total Count:", totalCount);

  // Gerar processos determinísticos com base no OAB
  const tribunais = ["TJSP", "TJRJ", "TJMG", "TRF-3", "TRF-2", "TJRS"];
  const fases = ["Conhecimento", "Execução", "Recurso"];
  const nomesAutores = ["Marcos da Silva", "Ana Beatriz Santos", "Ricardo Oliveira", "Clara Fernandes", "Julia Costa", "Pedro Albuquerque"];
  const nomesReus = ["Banco Itau S.A.", "Telefonica Brasil", "Enel Distribuicao", "Seguradora Alfa", "Comercio de Alimentos Ltda"];
  
  const simulatedProcesses = [];
  const loopLimit = Math.min(activeCount, 3);
  for (let i = 0; i < loopLimit; i++) {
    const seed = numSeed + i;
    const check = (seed % 97) + 1;
    const checkStr = check.toString().padStart(2, "0");
    const numPart = (seed * 17) % 10000000;
    const numPartStr = numPart.toString().padStart(7, "0");
    const year = 2023 + (seed % 3);
    const segment = 8;
    const court = 26 - (seed % 5);
    const unit = (seed % 999).toString().padStart(4, "0");
    const formattedNumber = `${numPartStr}-${checkStr}.${year}.${segment}.${court}.${unit}`;
    
    const trib = tribunais[seed % tribunais.length];
    const fase = fases[seed % fases.length];
    const autor = nomesAutores[seed % nomesAutores.length];
    const reu = nomesReus[seed % nomesReus.length];
    
    simulatedProcesses.push({
      numero: formattedNumber,
      tribunal: trib,
      vara: `${(seed % 10) + 1}ª Vara Cível`,
      comarca: "Capital",
      fase: fase,
      status: "ativo",
      dataDistribuicao: `${year}-0${(seed % 9) + 1}-${(seed % 28) + 1}`,
      partes: { autor, reu }
    });
  }

  console.log("--- Amostra de Processos Simulados ---");
  console.log(simulatedProcesses);
  console.log("\n✅ Teste de Lógica concluído com SUCESSO!");
  process.exit(0);
}

testOabLogic().catch(e => {
  console.error("Erro no teste:", e);
  process.exit(1);
});
