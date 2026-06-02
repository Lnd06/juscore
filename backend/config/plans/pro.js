const pro = {
  name: "Advogado Pro",
  description:
    "Para advogados que precisam de agilidade e precisão no dia a dia.",
  limits: {
    dailyReasoning: 5, // 5 perguntas/dia no modo raciocínio
    conversations: 50,
    historyDays: 30,
    maxCharsInput: 10000,
    maxSignatureDocs: 20,
    signatureDocExpiryDays: 30,
  },
  models: {
    default: "gemini-2.5-flash",
    reasoning: "gemini-2.5-pro",
    vision: "gemini-2.5-flash",
  },
  features: {
    internetSearch: true,
    uploadFiles: true,
    exportPDF: true,
  },
};

export default pro;
