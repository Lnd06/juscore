import fs from 'fs';

const subFile = 'c:\\juri_AI\\v1.6.5_anty - Copia\\frontend\\src\\pages\\dashboard\\Subscription.jsx';
let subContent = fs.readFileSync(subFile, 'utf8');

subContent = subContent.replace(
  /"Plataforma Solo \(1 Usuário\)",/g,
  '"Plataforma Solo (1 Usuário)",\n      "DEEP RESEARCH (10/dia)",'
);

subContent = subContent.replace(
  /"Até 2 Usuários inclusos \(Equipe\)",/g,
  '"Até 2 Usuários inclusos (Equipe)",\n      "DEEP RESEARCH (18/dia)",'
);

subContent = subContent.replace(
  /"Até 4 Usuários Inclusos",/g,
  '"Até 4 Usuários Inclusos",\n      "DEEP RESEARCH (30/dia)",'
);

fs.writeFileSync(subFile, subContent);
console.log("Subscription frontend features updated!");
