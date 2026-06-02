import fs from 'fs';
import path from 'path';

const plansDir = 'c:\\juri_AI\\v1.6.5_anty - Copia\\backend\\config\\plans';

// Tier 1 (Basic)
const tier1 = ['free.js', 'starter.js', 'student_basic.js', 'student_pro.js', 'lawyer_starter.js'];
// Tier 2 (Growth)
const tier2 = ['lawyer_growth.js', 'pro.js'];
// Tier 3 (Master)
const tier3 = ['office_master.js', 'enterprise.js'];

const files = fs.readdirSync(plansDir);
for (const file of files) {
  if (!file.endsWith('.js') || file === 'index.js') continue;
  
  const filePath = path.join(plansDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Clean up previous bad replacements
  content = content.replace(/meta-llama\/gemini-[a-zA-Z0-9.-]+/g, 'gemini-2.5-flash');

  // Remove existing models block
  content = content.replace(/models:\s*\{[\s\S]*?\},\n/g, '');

  let newModelsBlock = '';
  if (tier1.includes(file)) {
    newModelsBlock = `models: {
    default: "gemini-2.5-flash",
    reasoning: null,
    vision: "gemini-2.5-flash",
  },\n`;
  } else if (tier2.includes(file)) {
    newModelsBlock = `models: {
    default: "gemini-3.1-pro-preview",
    reasoning: "deep-research-preview-04-2026",
    vision: "gemini-3.1-pro-preview",
  },\n`;
  } else if (tier3.includes(file)) {
    newModelsBlock = `models: {
    default: "gemini-3.1-pro-preview",
    reasoning: "deep-research-max-preview-04-2026",
    vision: "gemini-3.1-pro-preview",
  },\n`;
  } else {
    // default safety
    newModelsBlock = `models: {
    default: "gemini-2.5-flash",
    reasoning: null,
    vision: "gemini-2.5-flash",
  },\n`;
  }

  // Insert before features: {
  content = content.replace(/features:\s*\{/g, newModelsBlock + '  features: {');
  
  // Add deepResearch boolean to features if not present
  if (!content.includes('deepResearch:')) {
    if (tier1.includes(file)) {
      content = content.replace(/features:\s*\{/g, 'features: {\n    deepResearch: false,');
    } else {
      content = content.replace(/features:\s*\{/g, 'features: {\n    deepResearch: true,');
    }
  } else {
    // If it is present, update it
    if (tier1.includes(file)) {
      content = content.replace(/deepResearch:\s*(true|false)/g, 'deepResearch: false');
    } else {
      content = content.replace(/deepResearch:\s*(true|false)/g, 'deepResearch: true');
    }
  }

  fs.writeFileSync(filePath, content);
  console.log(`Rewritten ${file}`);
}
