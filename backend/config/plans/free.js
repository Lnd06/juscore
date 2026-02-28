const free = {
  name: "Grátis",
  description: "Para conhecer a plataforma.",
  limits: {
    conversations: 6, // 6 mensagens enviadas no chat
    historyDays: 1,
    maxCharsInput: 2000,
    dailyCalculations: 3,
    dailyDocuments: 2, // Petições diárias
  },
  models: {
    default: "meta-llama/llama-4-scout-17b-16e-instruct",
    reasoning: null,
    vision: "meta-llama/llama-4-scout-17b-16e-instruct",
  },
  features: {
    internetSearch: false,
    uploadFiles: false /* Sem IA de Visão */,
    exportPDF: true,
    watermark: true /* Regra: Petições com Marca d'água */,
  },
};

export default free;
