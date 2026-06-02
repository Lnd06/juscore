import fs from 'fs';
import path from 'path';

const plansDir = 'c:\\juri_AI\\v1.6.5_anty - Copia\\backend\\config\\plans';

function addLimitToPlan(fileName, limitValue) {
  const filePath = path.join(plansDir, fileName);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('dailyDeepResearch:')) {
    content = content.replace(/limits:\s*\{/, `limits: {\n    dailyDeepResearch: ${limitValue},`);
  } else {
    content = content.replace(/dailyDeepResearch:\s*\d+/, `dailyDeepResearch: ${limitValue}`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${fileName} with dailyDeepResearch: ${limitValue}`);
}

addLimitToPlan('free.js', 0);
addLimitToPlan('starter.js', 0);
addLimitToPlan('student_basic.js', 0);
addLimitToPlan('student_pro.js', 10);
addLimitToPlan('lawyer_starter.js', 15);
addLimitToPlan('lawyer_growth.js', 30);
addLimitToPlan('office_master.js', 60);
addLimitToPlan('enterprise.js', 9999);
