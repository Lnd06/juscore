import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure worker
GlobalWorkerOptions.workerSrc = pdfWorker;

export const convertPdfToImage = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;

    return canvas.toDataURL("image/jpeg", 0.8);
  } catch (error) {
    console.error("Error converting PDF:", error);
    throw new Error("Erro ao processar PDF. Tente enviar uma imagem.");
  }
};
