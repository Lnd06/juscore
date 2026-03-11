const office_master = {
  name: "Escritório Master",
  description: "Controle total da banca com suporte a equipe.",
  limits: {
    conversations: 9999,
    historyDays: 365,
    maxCharsInput: 40000,
    dailyCalculations: 9999,
    dailyDocuments: 9999,
    dailyVision: 9999,
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
    whatsappBot: true,
    whatsappNumbers: 2, // 2 Números
    usersCount: 5, // Equipe de 5
    dashboardBI: true, // BI Hub
  },
};

export default office_master;
