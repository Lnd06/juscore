const office_master = {
  name: "Escritório Master",
  description: "Controle total da banca com suporte a equipe.",
  limits: {
    dailyDeepResearch: 30,
    dailyReasoning: 80, // 80 perguntas/dia no modo raciocínio
    conversations: 9999,
    historyDays: 365,
    maxCharsInput: 40000,
    dailyCalculations: 9999,
    dailyDocuments: 9999,
    dailyVision: 9999,
    maxSignatureDocs: 40,
    signatureDocExpiryDays: 30,
  },
  models: {
    default: "gemini-2.5-flash",
    reasoning: "gemini-2.5-pro",
    vision: "gemini-2.5-flash",
  },
  features: {
    deepResearch: true,
    internetSearch: true,
    uploadFiles: true,
    exportPDF: true,
    watermark: false,
    processAnalysis: true,
    prioritySupport: true,
    processAuditing: true,
    teamHistory: true,
    usersCount: 5,
    dashboardBI: true,
  },
};

export default office_master;
