import fs from 'fs';
const f = 'c:\\juri_AI\\v1.6.5_anty - Copia\\frontend\\src\\pages\\admin\\AdminDashboard.jsx';
let c = fs.readFileSync(f, 'utf-8');

const target = '<option value="student_pro">Estudante Pro</option>';
const replacement = '<option value="student_pro">Estudante Pro</option>\r\n                  <option value="student_master">Estudante Pesquisador</option>';

// Replace only occurrences that are NOT already followed by student_master
const lines = c.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  if (lines[i].includes('student_pro') && lines[i].includes('<option') && lines[i].includes('Estudante Pro')) {
    // Check if next line already has student_master
    if (i + 1 < lines.length && !lines[i + 1].includes('student_master')) {
      const indent = lines[i].match(/^(\s*)/)[1];
      newLines.push(indent + '<option value="student_master">Estudante Pesquisador</option>\r');
    }
  }
}

fs.writeFileSync(f, newLines.join('\n'));
console.log('Done - student_master added to all select dropdowns');
