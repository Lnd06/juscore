import fs from 'fs';
import path from 'path';

// 1. Update index.js
const indexFile = 'c:\\juri_AI\\v1.6.5_anty - Copia\\backend\\config\\plans\\index.js';
let idxContent = fs.readFileSync(indexFile, 'utf8');
if (!idxContent.includes('student_master')) {
    idxContent = idxContent.replace('import student_pro from "./student_pro.js";', 'import student_pro from "./student_pro.js";\nimport student_master from "./student_master.js";');
    idxContent = idxContent.replace('student_pro: student_pro,', 'student_pro: student_pro,\n  student_master: student_master,');
    fs.writeFileSync(indexFile, idxContent);
}

// 2. Update student_pro.js
const proFile = 'c:\\juri_AI\\v1.6.5_anty - Copia\\backend\\config\\plans\\student_pro.js';
let proContent = fs.readFileSync(proFile, 'utf8');
proContent = proContent.replace(/dailyDeepResearch:\s*10,?\r?\n\s*/g, '');
proContent = proContent.replace(/deepResearch:\s*true/g, 'deepResearch: false');
fs.writeFileSync(proFile, proContent);

// 3. Update Subscription.jsx
const subFile = 'c:\\juri_AI\\v1.6.5_anty - Copia\\frontend\\src\\pages\\dashboard\\Subscription.jsx';
let subContent = fs.readFileSync(subFile, 'utf8');

// Update prices
subContent = subContent.replace(/price:\s*127\.00,/, 'price: 197.00,');
subContent = subContent.replace(/price:\s*147\.00,/, 'price: 297.00,');
subContent = subContent.replace(/price:\s*497\.00,/, 'price: 597.00,');

// Insert student_master after student_pro
if (!subContent.includes('id: "student_master"')) {
    const studentProBlock = `id: "student_pro",
    name: "Estudante Pro",
    price: 34.00,
    period: "mês",
    description: "OAB, TCC e Estágio",
    features: [
      "Tudo do Estudante Basic",
      "Simuladores de peças OAB (IA)",
      "Assistente completo de TCC",
      "Central Acadêmica exclusiva",
      "IA com Visão (Análise de PDFs)",
      "12 documentos gerados"
    ],
    highlight: false,
    color: "gray",
  },`;
    
    const newMasterBlock = `{
    id: "student_master",
    name: "Estudante Pesquisador",
    price: 89.90,
    period: "mês",
    description: "Para TCCs, Artigos e Doutorado",
    features: [
      "Tudo do Estudante Pro",
      "DEEP RESEARCH (10/dia)",
      "Análises profundas na Web",
      "Resumo Inteligente de Livros",
      "30 documentos gerados",
    ],
    highlight: true,
    color: "accent",
    icon: <Star className="w-5 h-5 text-accent" />,
  },`;

    subContent = subContent.replace(/highlight:\s*true,\s*color:\s*"accent",\s*icon:\s*<Star className="w-5 h-5 text-accent" \/>,\s*\},/g, `highlight: false,\n    color: "gray",\n  },\n  ${newMasterBlock}`);
    fs.writeFileSync(subFile, subContent);
}

console.log("All done!");
