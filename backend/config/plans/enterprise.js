const enterprise = {
  name: "Escritório Master",
  description:
    "Para escritórios que demandam complexidade e raciocínio profundo.",
  limits: {
    conversations: 9999, // Ilimitado
    historyDays: 365,
    maxCharsInput: 32000, // Máximo permitido pelo modelo
    dailyCalculations: 9999,
    dailyDocuments: 9999,
    dailyVision: 9999,
  },
  models: {
    default: "kimi-k2-0905",
    reasoning: "deepseek-r1-distill-llama-70b", // Modelo de Raciocínio (Novo/Premium)
    vision: "meta-llama/llama-4-scout-17b-16e-instruct",
  },
  features: {
    internetSearch: true,
    uploadFiles: true,
    exportPDF: true,
    prioritySupport: true,
    dedicatedContext: true, // Contexto maior de RAG
  },
};

export default enterprise;
