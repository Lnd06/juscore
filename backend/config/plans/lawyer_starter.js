const lawyer_starter = {
  name: "Advogado Starter",
  description: "Profissionais Solo com análise IA.",
  limits: {
    conversations: 9999,
    historyDays: 60,
    maxCharsInput: 15000,
    dailyCalculations: 9999,
    dailyDocuments: 30, // 30 Petições
    dailyVision: 50,
  },
  models: {
    default: "meta-llama/llama-4-maverick-17b-128e-instruct",
    reasoning: null,
    vision: "meta-llama/llama-4-scout-17b-16e-instruct",
  },
  features: {
    internetSearch: true,
    uploadFiles: true,
    exportPDF: true,
    watermark: false,
    processAnalysis: true, // Ativa ferramenta de análise de processos
    usersCount: 1, // Individual
  },
};

export default lawyer_starter;
