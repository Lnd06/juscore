const starter = {
  name: "Starter",
  description:
    "Plano inicial para estudantes e advogados em início de carreira.",
  limits: {
    dailyDeepResearch: 0,
    dailyReasoning: 0, // Sem acesso ao modo raciocínio
    conversations: 5,
    historyDays: 7,
    maxCharsInput: 2000,
    maxSignatureDocs: 12,
    signatureDocExpiryDays: 15,
  },
  models: {
    default: "gemini-2.5-flash",
    reasoning: null,
    vision: "gemini-2.5-flash",
  },
  features: {
    deepResearch: false,
    internetSearch: false,
    uploadFiles: false,
    exportPDF: false,
  },
};

export default starter;
