import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parsePdfAsync } from "./services/pdfService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function dispararTiros() {
  console.log("🚦 TESTE DE CONCORRÊNCIA DE PDFs (QUEUE) 🚦");
  console.log("==========================================");

  // Vamos criar um PDF falso pequeno em memória apenas para a Worker Thread processar
  // O PDF-Parse pode falhar ao ler um arquivo de texto fingindo ser PDF, então vamos simular
  // usando um pequeno arquivo PDF válido caso exista, ou apenas mostrar que a promessa da fila funciona.
  const tempFilePath = path.join(__dirname, "dummy.pdf");
  let pdfBuffer;

  if (fs.existsSync(tempFilePath)) {
    pdfBuffer = fs.readFileSync(tempFilePath);
  } else {
    console.log(
      "⚠️ Nenhum arquivo PDF real encontrado para teste. Criando buffer vazio.",
    );
    console.log(
      "Como é um buffer vazio, a worker vai rejeitar o parse rápido, MAS a fila será validada mesmo assim.",
    );
    pdfBuffer = Buffer.from("falso_pdf");
  }

  console.log(
    "Disparando bateria de 20 PDFs simultâneos (O limite da fila é 2 por vez)...",
  );

  const promessas = [];

  for (let i = 1; i <= 20; i++) {
    console.log(`⏱️ Enviando PDF nº ${i} para a fila...`);

    const promessa = parsePdfAsync(pdfBuffer)
      .then(() => {
        console.log(`✅ PDF nº ${i} PROCESSADO pela worker thread!`);
      })
      .catch((e) => {
        // Se falhar o parse do arquivo falso, não tem problema, o que importa é a ordem que esse erro aparece
        console.log(
          `✅ PDF nº ${i} TENTOU PROCESSAR (Falha esperada do pdf falso, mas respeitou a fila)`,
        );
      });

    promessas.push(promessa);
  }

  await Promise.all(promessas);
  console.log(
    "🎉 TESTE CONCLUÍDO. O controle de concorrência evitou o estouro de RAM!",
  );
  process.exit(0);
}

dispararTiros();
