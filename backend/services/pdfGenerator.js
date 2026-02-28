import PDFDocument from "pdfkit";
import getPlanConfig from "../config/plans/index.js";
import PQueue from "p-queue";

// Fila de prioridade/concorrência global para PDFKit, protegendo a RAM do servidor
const pdfQueue = new PQueue({ concurrency: 5 });

/**
 * Gera PDF de documento limpo (apenas a última resposta da IA)
 * @param {string} content - Conteúdo do documento
 * @param {Object} user - Usuário que solicitou
 * @param {string} title - Título do documento
 * @returns {PDFDocument} Stream do PDF
 */
export function generateCleanDocumentPDF(content, user, title) {
  return pdfQueue.add(async () => {
    const plan = getPlanConfig(user?.tipo || "free");
    const hasWatermark = plan.features.watermark;

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 72, bottom: 72, left: 72, right: 72 }, // Margens de 1 polegada (padrão jurídico)
      info: {
        Title: title || "Documento Jurídico",
        Author: "JusCore AI",
        Creator: "JusCore AI v1.6.5",
      },
      bufferPages: true,
    });

    // Fonte Padrão (Times New Roman ou similar)
    const fontRegular = "Helvetica";
    const fontBold = "Helvetica-Bold";

    // Configuração da Marca D'água
    if (hasWatermark) {
      const drawWatermark = () => {
        doc
          .save()
          .translate(doc.page.width / 2, doc.page.height / 2)
          .rotate(-45)
          .fontSize(50)
          .fillColor("#E5E7EB")
          .fillOpacity(0.3)
          .text("PLANO GRÁTIS - JURI AI", -300, -25, {
            width: 600,
            align: "center",
          })
          .restore();
      };

      doc.on("pageAdded", drawWatermark);
      drawWatermark(); // Desenha na primeira página imediatamente
    }

    // Cabeçalho Discreto
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text("Documento gerado via JusCore AI", { align: "right" })
      .moveDown(2);

    // Título (se houver)
    if (title) {
      doc
        .fontSize(14)
        .fillColor("#000000")
        .font(fontBold)
        .text(title.toUpperCase(), { align: "center" })
        .moveDown(1.5);
    }

    // Conteúdo Principal
    // Remover markdown básico que possa atrapalhar a formatação, se necessário
    // Mas PDFKit não renderiza markdown nativamente, então vamos apenas colocar o texto
    // Idealmente, poderíamos ter um parser simples aqui, mas vamos focar no texto limpo.

    const safeContent = String(content || "");
    const cleanContent = safeContent
      .replace(/\[\d+\]/g, "") // Remove citações tipo [1]
      .replace(/\*\*/g, "") // Remove negrito markdown
      .replace(/\*/g, "") // Remove itálico markdown
      .replace(/^#+\s/gm, "") // Remove headers markdown (# Title)
      .trim();

    doc.fontSize(12).font(fontRegular).fillColor("#000000").text(cleanContent, {
      align: "justify",
      lineGap: 4,
      paragraphGap: 10,
    });

    // Espaço para assinatura
    doc.moveDown(4);

    if (doc.y > 650) doc.addPage(); // Se estiver muito no fim, nova página

    const signatureLineY = doc.y;
    doc
      .strokeColor("#000000")
      .lineWidth(1)
      .moveTo(100, signatureLineY)
      .lineTo(500, signatureLineY)
      .stroke();

    const assinaturaNome =
      user?.nome || user?.apelido || user?.email || "Assinatura";
    doc.fontSize(11).text(assinaturaNome, 100, signatureLineY + 10, {
      align: "center",
      width: 400,
    });

    // Rodapé com paginação
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor("#999999")
        .text(`Página ${i + 1} de ${pages.count}`, 72, doc.page.height - 50, {
          align: "center",
          width: doc.page.width - 144,
          lineBreak: false,
        });
    }

    doc.end();
    return doc;
  });
}

/**
 * Gera PDF de uma conversa
 * @param {Object} conversation - Conversa do banco de dados
 * @param {Object} user - Usuário que solicitou
 * @returns {PDFDocument} Stream do PDF
 */
export function generateConversationPDF(conversation, user) {
  return pdfQueue.add(async () => {
    const plan = getPlanConfig(user?.tipo || "free");
    const hasWatermark = plan.features.watermark;

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: conversation.titulo || "Consulta Jurídica",
        Author: "JusCore AI",
        Subject: "Relatório de Consulta Jurídica",
        Creator: "JusCore AI v1.6.5",
      },
    });

    if (hasWatermark) {
      const drawWatermark = () => {
        doc
          .save()
          .translate(doc.page.width / 2, doc.page.height / 2)
          .rotate(-45)
          .fontSize(50)
          .fillColor("#E5E7EB")
          .fillOpacity(0.3)
          .text("PLANO GRÁTIS - JURI AI", -300, -25, {
            width: 600,
            align: "center",
          })
          .restore();
      };
      doc.on("pageAdded", drawWatermark);
      drawWatermark();
    }

    // Cores do brand
    const primaryColor = "#3B82F6";
    const textColor = "#1F2937";
    const grayColor = "#6B7280";

    // Cabeçalho
    doc
      .fontSize(24)
      .fillColor(primaryColor)
      .text("JusCore AI", { align: "center" })
      .fontSize(10)
      .fillColor(grayColor)
      .text("Assistente Jurídico Inteligente", { align: "center" })
      .moveDown(2);

    // Título da conversa
    doc
      .fontSize(16)
      .fillColor(textColor)
      .text(conversation.titulo || "Consulta Jurídica", { align: "left" })
      .moveDown(0.5);

    // Metadados
    const dataFormatada = new Date(conversation.createdAt).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    doc
      .fontSize(10)
      .fillColor(grayColor)
      .text(`Usuário: ${user.nome || user.email}`)
      .text(`Data: ${dataFormatada}`)
      .text(`ID da Sessão: ${conversation.sessionId}`)
      .moveDown(1.5);

    // Linha divisória
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(1);

    // Mensagens
    const messages = conversation.mensagens || [];

    messages.forEach((msg, index) => {
      // Verifica se precisa de nova página
      if (doc.y > 700) {
        doc.addPage();
      }

      const isUser = msg.role === "user";
      const isAssistant = msg.role === "assistant";

      if (isUser || isAssistant) {
        // Label (Você: ou JusCore AI:)
        doc
          .fontSize(12)
          .fillColor(isUser ? primaryColor : "#10B981")
          .font("Helvetica-Bold")
          .text(isUser ? "Você:" : "JusCore AI:", { continued: false })
          .moveDown(0.3);

        // Conteúdo da mensagem
        // Conteúdo da mensagem
        let textContent = msg.content;

        // Handle array content (Vision/Multimodal)
        if (Array.isArray(msg.content)) {
          const textPart = msg.content.find((c) => c.type === "text");
          textContent = textPart ? textPart.text : "";

          if (msg.content.some((c) => c.type === "image_url")) {
            textContent += "\n\n[📎 Imagem enviada pelo usuário]";
          }
        }

        doc
          .fontSize(11)
          .fillColor(textColor)
          .font("Helvetica")
          .text(textContent, {
            align: "left",
            lineGap: 4,
          })
          .moveDown(1.5);
      }
    });

    // Rodapé simples na última página
    doc
      .fontSize(8)
      .fillColor(grayColor)
      .text(
        `Gerado por JusCore AI em ${new Date().toLocaleDateString("pt-BR")}`,
        50,
        doc.page.height - 30,
        {
          align: "center",
          width: doc.page.width - 100,
          lineBreak: false,
        },
      );

    doc.end();
    return doc;
  });
}

/**
 * Gera PDF Profissional ABNT (Sem Marca D'água)
 * @param {string} content - Conteúdo do documento
 * @param {Object} options - { title, lawyerName, officeName, address, logo, user }
 * @returns {PDFDocument} Stream do PDF
 */
export function generateProfessionalPDF(content, options) {
  return pdfQueue.add(async () => {
    const {
      title,
      lawyerName,
      officeName,
      address,
      logo,
      date,
      oabNumber,
      user,
    } = options;

    // Margens ABNT (Padrão Acadêmico/Jurídico): Superior: 3cm, Esquerda: 3cm, Direita: 2cm, Inferior: 2cm
    // 1 cm ~= 28.34 pt
    const marginT = 85; // 3cm
    const marginL = 85; // 3cm
    const marginR = 57; // 2cm
    const marginB = 57; // 2cm

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: marginT, bottom: marginB, left: marginL, right: marginR },
      info: {
        Title: title || "Documento Jurídico Profissional",
        Author: lawyerName || "JusCore AI",
        Creator: "JusCore AI v1.6.5",
      },
      bufferPages: true,
      autoFirstPage: true,
    });

    // SEM MARCA D'ÁGUA para profissionais

    // Cabeçalho Profissional
    let headerY = marginT - 40; // Espaço acima da margem principal

    // Logo (Lado Esquerdo Superior ou Centro)
    // O logotipo
    if (logo) {
      try {
        const imageBuffer = logo.startsWith("data:")
          ? Buffer.from(logo.split(",")[1], "base64")
          : logo;

        doc.image(imageBuffer, marginL, headerY - 20, { height: 40 });
      } catch (e) {
        console.warn("Logo rendering failed:", e.message);
      }
    }

    // Info do Escritório (Lado Direito Superior)
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#1F2937")
      .text(officeName || "", marginL, headerY, { align: "right" });

    let subText = "";
    if (lawyerName) subText += `Advogado(a): ${lawyerName}\n`;
    if (oabNumber) subText += `OAB: ${oabNumber}\n`;
    if (address) subText += `${address}`;

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6B7280")
      .text(subText, { align: "right" });

    // Linha divisória após cabeçalho
    doc
      .moveDown(1)
      .strokeColor("#E5E7EB")
      .lineWidth(0.5)
      .moveTo(marginL, doc.y)
      .lineTo(595 - marginR, doc.y)
      .stroke()
      .moveDown(2);

    // Cidade e Data (Lado Direito Abaixo da Linha)
    if (date) {
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#000000")
        .text(date, { align: "right" })
        .moveDown(1);
    }

    // Título do Documento
    if (title) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(title.toUpperCase(), { align: "center" })
        .moveDown(2);
    }

    // Conteúdo com Normas ABNT
    // Texto Justificado, Fonte 12, Espaçamento Entre Linhas 1.5
    const cleanContent = String(content || "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .trim();

    doc.fontSize(12).font("Helvetica").fillColor("#000000").text(cleanContent, {
      align: "justify",
      lineGap: 6, // Espaçamento aproximado de 1.5
      paragraphGap: 12,
    });

    // Assinatura (garantindo que se o espaço for curto haja quebra de página but not too aggressive)
    const requiredSpaceForSig = 65;
    if (
      doc.y + requiredSpaceForSig >
      doc.page.height - doc.page.margins.bottom
    ) {
      doc.addPage();
    } else {
      // give a little space above signature line
      doc.y += 30;
    }

    const currentY = doc.y;
    doc
      .strokeColor("#000000")
      .lineWidth(0.8)
      .moveTo(marginL + 50, currentY)
      .lineTo(595 - marginR - 50, currentY)
      .stroke();

    const finalSignName = lawyerName || user?.nome || "Assinatura";
    doc.fontSize(11).text(finalSignName, marginL, currentY + 10, {
      align: "center",
      width: 595 - marginL - marginR,
    });

    if (oabNumber) {
      doc.fontSize(10).text(`OAB: ${oabNumber}`, marginL, currentY + 25, {
        align: "center",
        width: 595 - marginL - marginR,
      });
    }

    // Rodapé com Paginação
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text(
          `Documento gerado por JusCore AI - Página ${i + 1} de ${pages.count}`,
          marginL,
          841 - 40,
          {
            align: "center",
            width: 595 - marginL - marginR,
            lineBreak: false,
          },
        );
    }

    doc.end();
    return doc;
  });
}
