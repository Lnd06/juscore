const free = {
  name: "Grátis",
  description: "Para conhecer a plataforma.",
  limits: {
    dailyDeepResearch: 0,
    dailyReasoning: 0, // Sem acesso ao modo raciocínio
    conversations: 6,
    historyDays: 1,
    maxCharsInput: 2000,
    dailyCalculations: 3,
    dailyDocuments: 2,
    maxSignatureDocs: 0,
    signatureDocExpiryDays: 0,
  },
  models: {
    default: "gemini-2.5-flash",
    reasoning: null, // Sem raciocínio
    vision: "gemini-2.5-flash",
  },
  features: {
    deepResearch: false,
    internetSearch: false,
    uploadFiles: false,
    exportPDF: true,
    watermark: true,
  },
};

export default free;
