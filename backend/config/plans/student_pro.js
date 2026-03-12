const student_pro = {
  name: "Estudante Pro",
  description: "IA avançada com visão para TCC e OAB.",
  limits: {
    conversations: 9999, // Ilimitado
    historyDays: 30,
    maxCharsInput: 8000,
    dailyCalculations: 9999,
    dailyDocuments: 12,
    dailyVision: 22, // Limite imagens (Visão)
  },
  models: {
    default: "llama-3.1-8b-instant",
    reasoning: null,
    vision: "llama-3.2-90b-vision-preview",
  },
  features: {
    internetSearch: true,
    uploadFiles: true, // Libera leitura de Docs
    exportPDF: true,
    watermark: false,
    oabMode: true, // Ativa simulador OAB
    tccMode: true, // Ativa assistente TCC
  },
};

export default student_pro;
