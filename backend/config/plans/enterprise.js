const enterprise = {
  name: "Enterprise",
  description:
    "Para escritórios que demandam complexidade e raciocínio profundo.",
  limits: {
    dailyDeepResearch: 9999,
    dailyReasoning: 9999, // Ilimitado
    conversations: 9999,
    historyDays: 365,
    maxCharsInput: 32000,
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
    prioritySupport: true,
    dedicatedContext: true,
  },
};

export default enterprise;
