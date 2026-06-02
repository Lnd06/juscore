import { Process } from "../models/index.js";
import { summarizeProcessMovement } from "./processSummarizer.js";

/**
 * Executa a rotina de sincronização diária de todos os processos ativos cadastrados na JusCore AI.
 * Simula uma varredura automática noturna (Cron) nos tribunais correspondentes.
 */
export async function runDailySync() {
  console.log("⏱️ [CRON JOB] Iniciando sincronização noturna de processos ativos...");
  try {
    const activeProcesses = await Process.findAll({
      where: { status: "ativo" }
    });

    console.log(`⏱️ [CRON JOB] Localizados ${activeProcesses.length} processos ativos para varredura.`);

    const newMovementsPool = [
      "Juntada de Petição de Manifestação do Réu. Autos aguardando saneamento.",
      "Despacho proferido. Designada audiência de conciliação virtual para os próximos 30 dias.",
      "Publicação oficial efetuada. Prazo de 15 dias iniciado para interposição de recurso ordinário.",
      "Expedida guia de levantamento de honorários em favor do patrono do autor.",
      "Determinada a realização de perícia técnica contábil no prazo de 20 dias.",
      "Autos conclusos para julgamento final pelo juízo de primeiro grau."
    ];

    let updatedCount = 0;

    for (const proc of activeProcesses) {
      // 15% de chance de cada processo ativo receber um novo movimento judicial nesta noite
      const hasNewMovement = Math.random() < 0.15;
      
      if (hasNewMovement) {
        const rawMove = newMovementsPool[Math.floor(Math.random() * newMovementsPool.length)];
        
        console.log(`📡 [CRON JOB] Novo andamento detectado para o processo ${proc.numero} no tribunal ${proc.tribunal}!`);

        try {
          // Aciona a IA (Gemini) para processar e explicar a nova movimentação processual
          const aiAnalysis = await summarizeProcessMovement(proc, rawMove);

          await proc.update({
            lastMovement: aiAnalysis.lastMovement,
            aiSummary: aiAnalysis.aiSummary,
            nextSteps: aiAnalysis.nextSteps
          });
          
          updatedCount++;
        } catch (aiErr) {
          console.error(`⚠️ [CRON JOB] Falha ao analisar movimento por IA para o processo ${proc.numero}:`, aiErr);
          // Atualiza apenas o texto bruto se a IA falhar
          await proc.update({
            lastMovement: rawMove
          });
        }
      }
    }

    console.log(`⏱️ [CRON JOB] Varredura concluída. ${updatedCount} processos receberam novos andamentos e análises de IA hoje.`);
  } catch (error) {
    console.error("❌ [CRON JOB] Falha geral na execução do cron diário de processos:", error);
  }
}

/**
 * Inicializa o agendador automático (Cron) no servidor
 */
export function initSyncScheduler() {
  console.log("⏰ [CRON SCHEDULER] Inicializando agendador automático JusCore Sync...");
  
  // Executar a primeira varredura após 3 minutos de inicialização do servidor para não atrasar o boot
  setTimeout(() => {
    console.log("⏰ [CRON SCHEDULER] Executando varredura inicial programada pós-inicialização...");
    runDailySync();
  }, 180000);

  // Agendar execução a cada 24 horas (em milissegundos: 24 * 60 * 60 * 1000 = 86400000)
  setInterval(() => {
    runDailySync();
  }, 86400000);
}
