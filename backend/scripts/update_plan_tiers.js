import fs from 'fs';
import path from 'path';

const plansDir = 'c:\\juri_AI\\v1.6.5_anty - Copia\\backend\\config\\plans';

function updatePlan(fileName, hasDeepResearch, defaultModel, reasoningModel) {
  const filePath = path.join(plansDir, fileName);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update models block
  content = content.replace(/models:\s*\{[\s\S]*?\},/, `models: {
    default: "${defaultModel}",
    reasoning: ${reasoningModel ? `"${reasoningModel}"` : "null"},
    vision: "gemini-2.5-flash",
  },`);

  // Update features block for deepResearch
  if (hasDeepResearch && !content.includes('deepResearch:')) {
    content = content.replace(/features:\s*\{/, `features: {\n    deepResearch: true,`);
  } else if (!hasDeepResearch && !content.includes('deepResearch:')) {
    content = content.replace(/features:\s*\{/, `features: {\n    deepResearch: false,`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${fileName}`);
}

updatePlan('free.js', false, 'gemini-2.5-flash', null);
updatePlan('starter.js', false, 'gemini-2.5-flash', null);
updatePlan('student_basic.js', false, 'gemini-2.5-flash', null);
updatePlan('lawyer_starter.js', false, 'gemini-2.5-flash', 'gemini-2.5-pro');

// Plans with Deep Research
updatePlan('student_pro.js', true, 'gemini-2.5-flash', 'models/deep-research-preview-04-2026'); // Updated to use deep-research per user request
updatePlan('lawyer_growth.js', true, 'gemini-2.5-pro', 'models/deep-research-preview-04-2026');
updatePlan('office_master.js', true, 'gemini-3.1-pro-preview', 'models/deep-research-preview-04-2026');
updatePlan('enterprise.js', true, 'gemini-3.1-pro-preview', 'models/deep-research-pro-preview-12-2025');

