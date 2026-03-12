const lawyer_growth = {
  name: "Advogado Growth",
  description: "Escritórios em expansão.",
  limits: {
    conversations: 9999,
    historyDays: 180,
    maxCharsInput: 30000,
    dailyCalculations: 9999,
    dailyDocuments: 9999, // Ilimitado
    dailyVision: 9999, // Ilimitado
  },
  models: {
    default: "llama-3.3-70b-versatile",
    reasoning: null,
    vision: "llama-3.2-90b-vision-preview",
  },
  features: {
    internetSearch: true,
    uploadFiles: true,
    exportPDF: true,
    watermark: false,
    processAnalysis: true,
    prioritySupport: true,
    whatsappBot: true, // Libera WhatsApp
    usersCount: 3, // Equipe de 3
  },
};

export default lawyer_growth;
