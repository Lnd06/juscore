import { Process, User } from "../models/index.js";
import { summarizeProcessMovement } from "./processSummarizer.js";

// Mapa em memória para armazenar o status de sincronização de cada usuário
// Estrutura: { [userId]: { status: 'idle'|'syncing'|'completed'|'error', progress: 0, total: 0, errorMsg: '' } }
const syncStatusMap = new Map();

/**
 * Retorna o status de sincronização de processos de um usuário.
 * @param {number} userId 
 * @returns {object}
 */
export function getSyncStatus(userId) {
  if (!syncStatusMap.has(userId)) {
    return { status: "idle", progress: 0, total: 0 };
  }
  return syncStatusMap.get(userId);
}

/**
 * Inicia a varredura e importação assíncrona da carteira de processos de um advogado pelo seu OAB.
 * Executa em background sem bloquear o fluxo principal.
 * 
 * @param {number} userId - ID do usuário advogado dono do acervo
 * @param {string} oab - Número da OAB
 */
export function queuePortfolioSync(userId, oab) {
  // Evitar duplicidade de tarefas em andamento
  const currentStatus = getSyncStatus(userId);
  if (currentStatus.status === "syncing") {
    console.log(`ℹ️ [QUEUE SERVICE] Sincronização já em andamento para o usuário ${userId}`);
    return;
  }

  // Atualizar status para sincronizando
  syncStatusMap.set(userId, { status: "syncing", progress: 0, total: 0 });

  // Disparar o processamento em background (assíncrono)
  runBackgroundSync(userId, oab).catch(err => {
    console.error(`❌ [QUEUE SERVICE] Falha crítica na sincronização de background para o usuário ${userId}:`, err);
    syncStatusMap.set(userId, { status: "error", progress: 0, total: 0, errorMsg: err.message });
  });
}

/**
 * Algoritmo de sincronização em background
 */
async function runBackgroundSync(userId, oab) {
  console.log(`📡 [QUEUE SERVICE] Iniciando mapeamento de carteira em background para usuário ${userId} (OAB: ${oab})...`);
  
  const cleanOab = oab.trim();
  const oabDigits = cleanOab.replace(/\D/g, "");
  const numSeed = parseInt(oabDigits || "123456");

  // Simular a descoberta de processos ativos via Crawler (mesma lógica determinística do ERP)
  const activeCount = (numSeed % 15) + 4; // Entre 4 e 18 processos
  
  syncStatusMap.set(userId, { status: "syncing", progress: 0, total: activeCount });

  const tribunais = ["TJSP", "TJRJ", "TJMG", "TRF-3", "TRF-2", "TJRS"];
  const fases = ["Conhecimento", "Execução", "Recurso"];
  const nomesAutores = ["Marcos da Silva", "Ana Beatriz Santos", "Ricardo Oliveira", "Clara Fernandes", "Julia Costa", "Pedro Albuquerque"];
  const nomesReus = ["Banco Itau S.A.", "Telefonica Brasil", "Enel Distribuicao", "Seguradora Alfa", "Comercio de Alimentos Ltda"];
  
  const rawMovements = [
    "Conclusos para despacho saneador. Aguardando apreciação do magistrado.",
    "Expedido mandado de citação e intimação do réu para apresentar contestação.",
    "Ato ordinatório praticado. Manifeste-se o autor sobre a certidão do Oficial de Justiça.",
    "Publicado acórdão. Negado provimento ao recurso de apelação por unanimidade.",
    "Proferida sentença de mérito. Julgado PARCIALMENTE PROCEDENTE o pedido do autor.",
    "Homologado acordo extrajudicial firmado entre as partes. Extinto o processo com resolução do mérito.",
    "Certificada a tempestividade do recurso apresentado. Intime-se a parte contrária para contrarrazões."
  ];

  for (let i = 0; i < activeCount; i++) {
    const seed = numSeed + i;
    
    // Gerar CNJ estruturado determinístico
    const check = (seed % 97) + 1;
    const checkStr = check.toString().padStart(2, "0");
    const numPart = (seed * 17) % 10000000;
    const numPartStr = numPart.toString().padStart(7, "0");
    const year = 2023 + (seed % 3);
    const segment = 8;
    const court = 26 - (seed % 5);
    const unit = (seed % 999).toString().padStart(4, "0");
    const formattedCNJ = `${numPartStr}-${checkStr}.${year}.${segment}.${court}.${unit}`;

    // Verificar se o processo já existe
    const exists = await Process.findOne({
      where: { userId, numero: formattedCNJ }
    });

    if (!exists) {
      const trib = tribunais[seed % tribunais.length];
      const fase = fases[seed % fases.length];
      const autor = nomesAutores[seed % nomesAutores.length];
      const reu = nomesReus[seed % nomesReus.length];
      const rawMove = rawMovements[seed % rawMovements.length];

      // 1. Criar o processo preliminar
      const newProcess = await Process.create({
        userId,
        numero: formattedCNJ,
        tribunal: trib,
        vara: `${(seed % 10) + 1}ª Vara Cível`,
        comarca: "Capital",
        fase: fase,
        status: "ativo",
        valorCausa: 25000 + (seed % 200) * 500,
        dataDistribuicao: `${year}-0${(seed % 9) + 1}-${(seed % 28) + 1}`,
        partes: { autor, reu },
        lastMovement: "Mapeamento inicial em andamento...",
        observacoes: "Processo descoberto via Varredura Automática de OAB."
      });

      // 2. Acionar a IA de forma segura para criar a análise do último movimento
      try {
        console.log(`🤖 [QUEUE SERVICE] Gerando resumo por IA para processo ${formattedCNJ}...`);
        const aiAnalysis = await summarizeProcessMovement(newProcess, rawMove);
        
        await newProcess.update({
          lastMovement: aiAnalysis.lastMovement,
          aiSummary: aiAnalysis.aiSummary,
          nextSteps: aiAnalysis.nextSteps
        });
      } catch (aiErr) {
        console.error(`⚠️ [QUEUE SERVICE] Falha ao resumir processo ${formattedCNJ} via IA:`, aiErr);
        // Salva com valor padrão para não quebrar a sincronização
        await newProcess.update({
          lastMovement: rawMove,
          aiSummary: "Processo importado. Resumo indisponível no momento.",
          nextSteps: "Verificar andamento processual no tribunal."
        });
      }
    } else {
      console.log(`ℹ️ [QUEUE SERVICE] Processo ${formattedCNJ} já existe na base. Pulando...`);
    }

    // Atualizar o progresso
    syncStatusMap.set(userId, {
      status: "syncing",
      progress: i + 1,
      total: activeCount
    });

    // Pausa suave (50ms) entre processamento de processos para evitar gargalos na CPU
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`✅ [QUEUE SERVICE] Sincronização concluída com sucesso para o usuário ${userId}. Total: ${activeCount}`);
  syncStatusMap.set(userId, { status: "completed", progress: activeCount, total: activeCount });
}
