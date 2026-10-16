import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDist = path.resolve(__dirname, "../frontend/dist");
const backendPublic = path.resolve(__dirname, "../backend/public");

if (!fs.existsSync(frontendDist)) {
  console.error("❌ Diretório frontend/dist não encontrado. Execute 'npm run build:client' primeiro.");
  process.exit(1);
}

if (fs.existsSync(backendPublic)) {
  fs.rmSync(backendPublic, { recursive: true, force: true });
}

fs.cpSync(frontendDist, backendPublic, { recursive: true });
console.log("✅ Frontend estático sincronizado com sucesso em backend/public!");
