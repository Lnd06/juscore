const pro = {
  name: "Advogado Pro",
  description:
    "Para advogados que precisam de agilidade e precisão no dia a dia.",
  limits: {
    conversations: 50,
    historyDays: 30,
    maxCharsInput: 10000,
  },
  models: {
    default: "meta-llama/llama-4-maverick-17b-128e-instruct",
    reasoning: null,
    vision: "meta-llama/llama-4-scout-17b-16e-instruct",
  },
  features: {
    internetSearch: true, // Busca DOU/Jurisprudência
    uploadFiles: true,
    exportPDF: true,
  },
};

export default pro;
