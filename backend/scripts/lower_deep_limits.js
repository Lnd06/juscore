import fs from 'fs';
import path from 'path';

const plansDir = 'c:\\juri_AI\\v1.6.5_anty - Copia\\backend\\config\\plans';

function updateLimit(fileName, newLimit) {
  const filePath = path.join(plansDir, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/dailyDeepResearch:\s*\d+/, `dailyDeepResearch: ${newLimit}`);
  fs.writeFileSync(filePath, content);
}

// Update backend limits
updateLimit('student_master.js', 5);
updateLimit('lawyer_starter.js', 10);
updateLimit('lawyer_growth.js', 18);
updateLimit('office_master.js', 30);

// Update frontend description for student_master
const subFile = 'c:\\juri_AI\\v1.6.5_anty - Copia\\frontend\\src\\pages\\dashboard\\Subscription.jsx';
let subContent = fs.readFileSync(subFile, 'utf8');
subContent = subContent.replace(/DEEP RESEARCH \(10\/dia\)/, 'DEEP RESEARCH (5/dia)');
fs.writeFileSync(subFile, subContent);

console.log("Limits reduced successfully.");
