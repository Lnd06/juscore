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
    default: "llama-3.1-8b-instant",
    reasoning: null,
    vision: "llama-3.2-90b-vision-preview",
  },
  features: {
    internetSearch: false,
    uploadFiles: false /* Sem IA de Visão */,
    exportPDF: true,
    watermark: true /* Regra: Petições com Marca d'água */,
  },
};

export default free;
