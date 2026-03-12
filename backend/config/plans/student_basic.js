const student_basic = {
  name: "Estudante Basic",
  description: "Foco em pesquisa acadêmica e resumos.",
  limits: {
    conversations: 9999, // Chat ilimitado
    historyDays: 7,
    maxCharsInput: 4000,
    dailyCalculations: 9999, // Ilimitado
    dailyDocuments: 5, // 5 Docs por dia
  },
  models: {
    default: "llama-3.1-8b-instant",
    reasoning: null,
    vision: "llama-3.2-90b-vision-preview",
  },
  features: {
    internetSearch: false,
    uploadFiles: false,
    exportPDF: true,
    watermark: false,
    teacherMode: true, // Ativa modo de professor
  },
};

export default student_basic;
