import { workerData, parentPort } from "worker_threads";
import pdf from "pdf-parse";

// Worker Thread to parse PDF without blocking the main event loop
async function processPdf() {
  try {
    const { buffer } = workerData;
    // Buffer passed via workerData becomes a Uint8Array, we convert it back
    const pdfBuffer = Buffer.from(buffer);

    // Parse the PDF
    const data = await pdf(pdfBuffer);

    // Send result back to main thread
    parentPort.postMessage({ success: true, text: data.text });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
}

processPdf();
