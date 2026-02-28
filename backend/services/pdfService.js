import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import PQueue from "p-queue";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fila de prioridade/concorrência para evitar overload de RAM. Processará no máximo 2 PDFs por vez.
const pdfQueue = new PQueue({ concurrency: 2 });

export const parsePdfAsync = (buffer) => {
  return pdfQueue.add(
    () =>
      new Promise((resolve, reject) => {
        // Create new Worker passing the buffer
        const workerPath = path.join(__dirname, "pdfWorker.js");
        const worker = new Worker(workerPath, {
          workerData: { buffer },
        });

        worker.on("message", (result) => {
          if (result.success) {
            resolve(result.text);
          } else {
            reject(new Error(result.error));
          }
        });

        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      }),
  );
};
