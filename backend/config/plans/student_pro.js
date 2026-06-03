const student_pro = {
  name: "Estudante Pro",
  description: "IA avançada com visão para TCC e OAB.",
  limits: {
    dailyDeepResearch: 1,
    dailyReasoning: 10, // 10 perguntas/dia no modo raciocínio
    conversations: 9999,
    historyDays: 30,
    maxCharsInput: 8000,
    dailyCalculations: 9999,
    dailyDocuments: 8,
    dailyVision: 15,
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

export default student_pro;
