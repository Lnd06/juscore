const lawyer_growth = {
  name: "Advogado Growth",
  description: "Escritórios em expansão.",
  limits: {
    dailyDeepResearch: 18,
    dailyReasoning: 40, // 40 perguntas/dia no modo raciocínio
    conversations: 9999,
    historyDays: 180,
    maxCharsInput: 30000,
    dailyCalculations: 9999,
    dailyDocuments: 9999,
    dailyVision: 9999,
    maxSignatureDocs: 20,
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
    doubleSignatures: true,
    usersCount: 3,
  },
};

export default lawyer_growth;
