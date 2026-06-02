import PDFDocument from "pdfkit";
import getPlanConfig from "../config/plans/index.js";
import PQueue from "p-queue";
import fs from "fs";
import path from "path";

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
      clientSignatureImage,
      clientSignerName,
      clientSignerCpf,
      lawyerSignatureImage,
    } = options;

    // Margens ABNT: Superior 3cm, Esquerda 3cm, Direita 2cm, Inferior 2cm
    const marginT = 85;
    const marginL = 85;
    const marginR = 57;
    const marginB = 57;
    const pageW = 595.28; // A4 width in pt
    const pageH = 841.89; // A4 height in pt
    const contentWidth = pageW - marginL - marginR;

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: marginT, bottom: marginB, left: marginL, right: marginR },
      info: {
        Title: title || "Documento Jurídico",
        Author: lawyerName || "JusCore AI",
        Creator: "JusCore AI v1.7",
      },
      bufferPages: true,
      autoFirstPage: true,
    });

    // ── Logo (papel timbrado) ──
    if (logo) {
      try {
        let imageBuffer;
        if (logo.startsWith("data:")) {
          imageBuffer = Buffer.from(logo.split(",")[1], "base64");
        } else {
          const cleanPath = logo.startsWith("/") ? logo.substring(1) : logo;
          imageBuffer = fs.readFileSync(path.resolve(cleanPath));
        }
        doc.image(imageBuffer, marginL, marginT - 40, { height: 36 });
      } catch (e) {
        console.warn("Logo rendering failed:", e.message);
      }
    }

    // Posiciona o cursor na margem superior real
    doc.y = marginT;

    // ── Parser de HTML → blocos semânticos ──
    // Transforma o HTML do editor em blocos {type, text} que o PDFKit renderiza nativamente
    const rawHtml = String(content || "");

    // Função auxiliar para extrair blocos do HTML
    const parseHtmlToBlocks = (html) => {
      const blocks = [];

      // Normaliza whitespace e quebras
      let normalized = html
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

      // Divide por tags <p> — cada <p>...</p> vira um bloco
      // Também trata <br> como quebra de linha dentro do bloco
      const paragraphs = normalized.split(/<\/p>/gi);

      for (const raw of paragraphs) {
        // Remove a tag <p ...> de abertura
        let text = raw.replace(/<p[^>]*>/gi, "");

        // Converte <br> em newline
        text = text.replace(/<br\s*\/?>/gi, "\n");

        // Detecta se o bloco contém apenas um <strong> (título de seção)
        const strongOnlyMatch = text.match(/^\s*<strong>(.+?)<\/strong>\s*$/i);

        // Remove todas as tags HTML restantes, preservando o texto
        const cleanText = text.replace(/<[^>]+>/g, "").trim();

        if (!cleanText) continue; // Pula blocos vazios

        if (strongOnlyMatch) {
          // Bloco que é APENAS negrito = título de seção jurídica
          const heading = strongOnlyMatch[1].replace(/<[^>]+>/g, "").trim();
          if (heading) {
            blocks.push({ type: "heading", text: heading });
          }
        } else {
          // Bloco de parágrafo normal
          // Detecta segmentos bold dentro do texto para renderização mista
          const segments = [];
          let remaining = text;
          const boldRegex = /<strong>(.*?)<\/strong>/gi;
          let lastIndex = 0;
          let match;

          // Reset regex
          boldRegex.lastIndex = 0;

          while ((match = boldRegex.exec(remaining)) !== null) {
            // Texto antes do bold
            if (match.index > lastIndex) {
              const before = remaining.substring(lastIndex, match.index).replace(/<[^>]+>/g, "");
              if (before) segments.push({ bold: false, text: before });
            }
            // Texto bold
            const boldText = match[1].replace(/<[^>]+>/g, "");
            if (boldText) segments.push({ bold: true, text: boldText });
            lastIndex = match.index + match[0].length;
          }

          // Texto restante após o último bold
          if (lastIndex < remaining.length) {
            const after = remaining.substring(lastIndex).replace(/<[^>]+>/g, "");
            if (after.trim()) segments.push({ bold: false, text: after });
          }

          if (segments.length > 0) {
            blocks.push({ type: "paragraph", segments });
          } else if (cleanText) {
            blocks.push({ type: "paragraph", segments: [{ bold: false, text: cleanText }] });
          }
        }
      }

      // Fallback: se o HTML não tinha <p> tags, trata como texto plano
      if (blocks.length === 0 && rawHtml.trim()) {
        const fallback = rawHtml
          .replace(/<[^>]+>/g, "")
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .trim();
        if (fallback) {
          blocks.push({ type: "paragraph", segments: [{ bold: false, text: fallback }] });
        }
      }

      return blocks;
    };

    const blocks = parseHtmlToBlocks(rawHtml);

    // Limpa placeholders genéricos da IA
    const cleanBlockText = (text) => {
      return text
        .replace(/\[Local e Data\]/gi, "")
        .replace(/\[Assinatura do Advogado\]/gi, "")
        .replace(/\[Nome do Advogado\]/gi, "")
        .replace(/OAB n[º°]? \[N[úu]mero da OAB\]/gi, "")
        .replace(/\[Assinatura do Cliente\]/gi, "")
        .replace(/\[Nome do Cliente\]/gi, "")
        .replace(/\[CPF do Cliente\]/gi, "")
        .replace(/____________________________________/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "");
    };

    // ── Renderiza blocos no PDF ──
    const usableHeight = pageH - marginB;

    for (const block of blocks) {
      if (block.type === "heading") {
        const headingText = cleanBlockText(block.text);
        if (!headingText.trim()) continue;

        // Verifica espaço (heading + ao menos 2 linhas de texto)
        if (doc.y + 40 > usableHeight) doc.addPage();

        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor("#000000")
          .text(headingText.toUpperCase(), {
            align: "center",
            lineGap: 4,
          })
          .moveDown(0.8);

      } else if (block.type === "paragraph") {
        // Renderiza segmentos com suporte a negrito inline
        const fullText = block.segments.map(s => cleanBlockText(s.text)).join("").trim();
        if (!fullText) continue;

        // Verifica se cabe pelo menos 1 linha
        if (doc.y + 20 > usableHeight) doc.addPage();

        // Se o parágrafo tem mistura de bold/normal, renderiza segmento por segmento
        const hasMixedFormatting = block.segments.length > 1 && block.segments.some(s => s.bold);

        if (hasMixedFormatting) {
          for (let i = 0; i < block.segments.length; i++) {
            const seg = block.segments[i];
            const segText = cleanBlockText(seg.text);
            if (!segText) continue;

            const isLast = i === block.segments.length - 1;
            doc
              .font(seg.bold ? "Helvetica-Bold" : "Helvetica")
              .fontSize(12)
              .fillColor("#000000")
              .text(segText, {
                continued: !isLast,
                align: "justify",
                lineGap: 6,
              });
          }
          doc.moveDown(0.6);
        } else {
          // Parágrafo simples (todo bold ou todo normal)
          const isBold = block.segments[0]?.bold;
          doc
            .font(isBold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(12)
            .fillColor("#000000")
            .text(fullText, {
              align: "justify",
              lineGap: 6,
              paragraphGap: 4,
            })
            .moveDown(0.6);
        }
      }
    }

    // ── Blocos de Assinatura ──
    const sigBlocks = [];

    if (clientSignerName || clientSignatureImage) {
      sigBlocks.push({
        name: clientSignerName || "Cliente",
        doc: clientSignerCpf ? `CPF: ${clientSignerCpf}` : null,
        image: clientSignatureImage,
      });
    }

    if (lawyerSignatureImage || sigBlocks.length === 0) {
      sigBlocks.push({
        name: lawyerName || user?.nome || "Advogado Responsável",
        doc: oabNumber ? `OAB: ${oabNumber}` : null,
        image: lawyerSignatureImage,
      });
    }

    // Calcula espaço necessário para assinaturas
    const hasImages = sigBlocks.some(b => b.image);
    const sigHeight = hasImages ? 120 : 80;

    // Só adiciona página se realmente não couber
    if (doc.y + sigHeight + 20 > usableHeight) {
      doc.addPage();
    } else {
      doc.moveDown(2);
    }

    const startY = doc.y;

    const drawBlock = (block, xOffset, blockWidth) => {
      let currentY = startY;

      if (block.image) {
        try {
          let sigBuffer;
          if (block.image.startsWith("data:")) {
            sigBuffer = Buffer.from(block.image.split(",")[1], "base64");
          } else {
            const cleanPathSig = block.image.startsWith("/")
              ? block.image.substring(1)
              : block.image;
            sigBuffer = fs.readFileSync(path.resolve(cleanPathSig));
          }
          const imgW = Math.min(150, blockWidth - 40);
          doc.image(sigBuffer, xOffset + (blockWidth - imgW) / 2, currentY, {
            height: 50,
          });
          currentY += 55;
        } catch (e) {
          console.warn("Signature rendering failed:", e.message);
          currentY += 10;
        }
      } else {
        currentY += 10;
      }

      // Linha de assinatura
      const lineY = currentY + 5;
      const lineMargin = 15;
      doc
        .strokeColor("#000000")
        .lineWidth(0.6)
        .moveTo(xOffset + lineMargin, lineY)
        .lineTo(xOffset + blockWidth - lineMargin, lineY)
        .stroke();

      // Nome
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000")
        .text(block.name, xOffset, lineY + 6, {
          align: "center",
          width: blockWidth,
        });

      // Documento (OAB / CPF)
      if (block.doc) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#333333")
          .text(block.doc, xOffset, doc.y + 1, {
            align: "center",
            width: blockWidth,
          });
      }
    };

    if (sigBlocks.length === 1) {
      // Centraliza um único bloco
      const blockW = Math.min(contentWidth * 0.6, 280);
      const xOffset = marginL + (contentWidth - blockW) / 2;
      drawBlock(sigBlocks[0], xOffset, blockW);
    } else if (sigBlocks.length === 2) {
      const gap = 30;
      const blockW = (contentWidth - gap) / 2;
      drawBlock(sigBlocks[0], marginL, blockW);
      drawBlock(sigBlocks[1], marginL + blockW + gap, blockW);
    }

    // ── Rodapé com paginação ──
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text(
          `Página ${i + 1} de ${pages.count}`,
          marginL,
          pageH - 35,
          {
            align: "center",
            width: contentWidth,
            lineBreak: false,
          },
        );
    }

    doc.end();
    return doc;
  });
}
