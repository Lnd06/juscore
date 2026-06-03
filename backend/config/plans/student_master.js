const student_master = {
  name: "Estudante Master",
  description: "Pesquisa Acadêmica Profunda e TCC com Deep Research.",
  limits: {
    dailyReasoning: 20, // 20 perguntas/dia no modo raciocínio
    conversations: 9999,
    historyDays: 90,
    maxCharsInput: 15000,
    dailyCalculations: 9999,
    dailyDocuments: 15,
    dailyVision: 30,
    dailyDeepResearch: 5,
    maxSignatureDocs: 0,
    signatureDocExpiryDays: 0,
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
    oabMode: true,
    tccMode: true,
  },
};

export default student_master;
