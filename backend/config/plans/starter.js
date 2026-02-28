const starter = {
  name: "Starter",
  description:
    "Plano inicial para estudantes e advogados em início de carreira.",
  limits: {
    conversations: 5, // Limite de conversas simultâneas ou diárias (exemplo)
    historyDays: 7, // Dias de histórico
    maxCharsInput: 2000,
  },
  models: {
    default: "meta-llama/llama-4-maverick-17b-128e-instruct",
    reasoning: null,
    vision: "meta-llama/llama-4-scout-17b-16e-instruct",
  },
  features: {
    internetSearch: false,
    uploadFiles: false,
    exportPDF: false,
  },
};

export default starter;
