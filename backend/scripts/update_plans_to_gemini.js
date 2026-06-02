import fs from 'fs';
import path from 'path';

const plansDir = 'c:\\juri_AI\\v1.6.5_anty - Copia\\backend\\config\\plans';

function replaceInFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      let newContent = content
        .replace(/llama-3\.3-70b-versatile/g, 'gemini-2.5-flash')
        .replace(/llama-3\.1-8b-instant/g, 'gemini-2.5-flash')
        .replace(/llama-[a-zA-Z0-9.-]+/g, 'gemini-2.5-flash');
        
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated ${file}`);
      }
    }
  }
}

replaceInFiles(plansDir);
