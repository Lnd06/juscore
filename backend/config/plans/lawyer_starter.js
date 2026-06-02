const lawyer_starter = {
  name: "Advogado Starter",
  description: "Profissionais Solo com análise IA.",
  limits: {
    dailyDeepResearch: 10,
    dailyReasoning: 15, // 15 perguntas/dia no modo raciocínio
    conversations: 9999,
    historyDays: 60,
    maxCharsInput: 15000,
    dailyCalculations: 9999,
    dailyDocuments: 30,
    dailyVision: 50,
    maxSignatureDocs: 12,
    signatureDocExpiryDays: 15,
  },
  models: {
    default: "gemini-2.5-flash",
    reasoning: "gemini-2.5-pro",
    vision: "gemini-2.5-flash",
  },
  features: {
    deepResearch: false,
    internetSearch: true,
    uploadFiles: true,
    exportPDF: true,
    watermark: false,
    processAnalysis: true,
    usersCount: 1,
  },
};

export default lawyer_starter;
