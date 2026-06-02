/* eslint-disable no-unused-vars */
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";

// Use CDN for the worker to avoid dynamic import errors in production
GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

export const convertPdfToImage = async (file, plan = "free") => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;

    const planLimits = {
      free: 1,
      student_basic: 1,
      student_pro: 3,
      lawyer_starter: 5,
      lawyer_growth: 10,
      office_master: 15,
      enterprise: 20,
    };

    const maxPages = planLimits[plan] || 1;
    const numPagesToProcess = Math.min(pdf.numPages, maxPages);

    const pages = [];
    let maxPageWidth = 0;
    let maxPageHeight = 0;

    // Diminui um pouco a resolução base se tiver muitas páginas pra caber na memória do Canvas
    const scale =
      numPagesToProcess > 5 ? 0.7 : numPagesToProcess > 2 ? 1.0 : 1.5;

    for (let i = 1; i <= numPagesToProcess; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      pages.push({ page, viewport });

      if (viewport.width > maxPageWidth) maxPageWidth = viewport.width;
      if (viewport.height > maxPageHeight) maxPageHeight = viewport.height;
    }

    // Grid layout: Limita colunas pra não achatar, empilha o resto
    const cols = Math.min(
      numPagesToProcess,
      Math.ceil(Math.sqrt(numPagesToProcess)),
    );
    const rows = Math.ceil(numPagesToProcess / cols);

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = cols * maxPageWidth;
    finalCanvas.height = rows * maxPageHeight;
    const finalContext = finalCanvas.getContext("2d");

    if (!finalContext) {
      throw new Error(
        "Seu navegador recusou a renderização do PDF pois a imagem seria excepcionalmente grande.",
      );
    }

    // Fundo branco
    finalContext.fillStyle = "white";
    finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    for (let i = 0; i < pages.length; i++) {
      const { page, viewport } = pages[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const offsetX = col * maxPageWidth;
      const offsetY = row * maxPageHeight;

      // Renderiza na tela temporária
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      const tempContext = tempCanvas.getContext("2d");

      await page.render({ canvasContext: tempContext, viewport: viewport })
        .promise;

      finalContext.drawImage(tempCanvas, offsetX, offsetY);
    }

    if (pdf.numPages > maxPages) {
      //
    }

    // Limite de qualidade drástico se imagem for gigante
    const quality = numPagesToProcess > 5 ? 0.5 : 0.75;
    return finalCanvas.toDataURL("image/jpeg", quality);
  } catch (error) {
    throw new Error(
      "Erro ao compilar imagem das páginas. O arquivo possui formato corrompido ou excede o limite do sistema.",
    );
  }
};
