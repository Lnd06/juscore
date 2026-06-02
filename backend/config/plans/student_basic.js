const student_basic = {
  name: "Estudante Basic",
  description: "Foco em pesquisa acadêmica e resumos.",
  limits: {
    dailyDeepResearch: 0,
    dailyReasoning: 3, // 3 perguntas/dia no modo raciocínio
    conversations: 9999,
    historyDays: 7,
    maxCharsInput: 4000,
    dailyCalculations: 9999,
    dailyDocuments: 5,
    maxSignatureDocs: 0,
    signatureDocExpiryDays: 0,
  },
  models: {
    default: "gemini-2.5-flash",
    reasoning: "gemini-2.5-pro",
    vision: "gemini-2.5-flash",
  },
  features: {
    deepResearch: false,
    internetSearch: false,
    uploadFiles: false,
    exportPDF: true,
    watermark: false,
    teacherMode: true,
  },
};

export default student_basic;
