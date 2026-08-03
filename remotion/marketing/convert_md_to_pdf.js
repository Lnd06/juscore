import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const mdPath = 'e:/v1.6.5_anty - Copia/remotion/marketing/plano_de_posts.md';
const pdfPath = 'e:/v1.6.5_anty - Copia/remotion/marketing/plano_de_posts.pdf';

console.log('📖 Lendo arquivo Markdown...');
const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split(/\r?\n/);

console.log('🛠️ Inicializando PDFDocument...');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(pdfPath);
doc.pipe(writeStream);

// Helper to draw inline styled text with **bold** support
function drawStyledText(text, size = 10, defaultFont = 'Helvetica', color = '#222222') {
  doc.fillColor(color);
  doc.fontSize(size);
  const parts = text.split('**');
  for (let i = 0; i < parts.length; i++) {
    const isBold = i % 2 === 1;
    const font = isBold ? (defaultFont.includes('Bold') ? defaultFont : defaultFont + '-Bold') : defaultFont;
    doc.font(font);
    doc.text(parts[i], {
      continued: i < parts.length - 1
    });
  }
}

function drawH1(text) {
  doc.addPage(); // Add a page break for clean division if desired, or let it flow.
  // We can let the document flow, but H1 starts a new major section.
  doc.y += 15;
  doc.fillColor('#8F6B2E');
  doc.font('Helvetica-Bold').fontSize(20).text(text);
  doc.y += 10;
  // Draw a golden divider line under H1
  doc.strokeColor('#C7984A').lineWidth(1.5).moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
  doc.y += 15;
}

function drawH2(text) {
  doc.y += 12;
  doc.fillColor('#222222');
  doc.font('Helvetica-Bold').fontSize(14).text(text);
  doc.y += 6;
}

function drawH3(text) {
  doc.y += 10;
  doc.fillColor('#8F6B2E');
  doc.font('Helvetica-Bold').fontSize(11).text(text);
  doc.y += 5;
}

function drawH4(text) {
  doc.y += 8;
  doc.fillColor('#444444');
  doc.font('Helvetica-Bold').fontSize(9.5).text(text);
  doc.y += 4;
}

function drawDivider() {
  doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(doc.x, doc.y + 10).lineTo(doc.page.width - 50, doc.y + 10).stroke();
  doc.y += 20;
}

function drawBulletPoint(text) {
  const cleanText = text.substring(2).trim();
  const x = doc.x;
  
  // Draw bullet symbol in gold
  doc.fillColor('#C7984A').font('Helvetica-Bold').fontSize(10).text('• ', x + 10, doc.y, { continued: true });
  doc.x = x + 22;
  drawStyledText(cleanText, 9.5, 'Helvetica', '#222222');
  doc.x = x;
  doc.y += 4; // Space between list items
}

function drawTable(rows) {
  const startX = doc.x;
  const startY = doc.y + 5;
  doc.y = startY;
  
  const colWidths = [35, 75, 75, 310]; // Sum matches A4 width minus margins (495)
  const rowHeight = 22;
  
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    
    // Page break protection
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
    
    let currentX = startX;
    const isHeader = r === 0;
    
    // Draw background color
    doc.fillColor(isHeader ? '#F1F5F9' : (r % 2 === 0 ? '#F8FAFC' : '#FFFFFF'));
    doc.rect(currentX, doc.y, 495, rowHeight).fill();
    
    // Draw thin grid border
    doc.strokeColor('#E2E8F0').lineWidth(0.5);
    doc.rect(currentX, doc.y, 495, rowHeight).stroke();
    
    for (let c = 0; c < Math.min(row.length, colWidths.length); c++) {
      doc.fillColor('#334155');
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
      
      const cellText = row[c].replace(/\*\*/g, '').trim();
      
      doc.text(cellText, currentX + 6, doc.y + 6, {
        width: colWidths[c] - 12,
        height: rowHeight - 12,
        ellipsis: true
      });
      currentX += colWidths[c];
    }
    
    doc.y += rowHeight;
  }
  doc.y += 10;
}

function drawQuote(quoteLines) {
  let text = quoteLines.join('\n');
  let title = 'NOTA';
  let borderColor = '#3B82F6'; // Blue
  let bgColor = '#EFF6FF';
  
  if (text.includes('[!IMPORTANT]')) {
    title = 'IMPORTANTE';
    borderColor = '#D97706'; // Orange/Gold
    bgColor = '#FEF3C7';
    text = text.replace(/\[!IMPORTANT\]/g, '').trim();
  } else if (text.includes('[!NOTE]')) {
    title = 'NOTA';
    borderColor = '#3B82F6';
    bgColor = '#EFF6FF';
    text = text.replace(/\[!NOTE\]/g, '').trim();
  } else if (text.includes('[!TIP]')) {
    title = 'DICA';
    borderColor = '#10B981'; // Green
    bgColor = '#ECFDF5';
    text = text.replace(/\[!TIP\]/g, '').trim();
  }
  
  // Clean leading '>' symbols
  text = text.replace(/^>\s*/gm, '').trim();
  
  const x = doc.x;
  const y = doc.y + 5;
  
  // Measure height of text block
  doc.font('Helvetica').fontSize(9);
  const textHeight = doc.heightOfString(text, { width: 465 });
  const blockHeight = textHeight + 22;
  
  if (y + blockHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
  
  const curY = doc.y + 5;
  
  // Draw background and left border
  doc.fillColor(bgColor).rect(x, curY, 495, blockHeight).fill();
  doc.fillColor(borderColor).rect(x, curY, 4, blockHeight).fill();
  
  // Draw title
  doc.fillColor(borderColor).font('Helvetica-Bold').fontSize(8).text(title, x + 15, curY + 6);
  
  // Draw the body text with styled bold support
  doc.x = x + 15;
  doc.y = curY + 16;
  drawStyledText(text, 9, 'Helvetica', '#1E293B');
  
  doc.x = x;
  doc.y = curY + blockHeight + 10;
}

function drawCodeBlock(codeLines) {
  const text = codeLines.join('\n').trim();
  const x = doc.x;
  const y = doc.y + 5;
  
  doc.font('Courier').fontSize(7.5);
  const textHeight = doc.heightOfString(text, { width: 465 });
  const blockHeight = textHeight + 14;
  
  if (y + blockHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
  
  const curY = doc.y + 5;
  
  // Draw background and light borders
  doc.fillColor('#F8FAFC').rect(x, curY, 495, blockHeight).fill();
  doc.strokeColor('#E2E8F0').lineWidth(0.5);
  doc.rect(x, curY, 495, blockHeight).stroke();
  
  // Draw code text
  doc.fillColor('#334155');
  doc.text(text, x + 12, curY + 7, { width: 470, lineGap: 2 });
  
  doc.y = curY + blockHeight + 10;
}

// State variables for line-by-line parsing
let inCodeBlock = false;
let codeLines = [];
let inTable = false;
let tableRows = [];
let inQuote = false;
let quoteLines = [];

// Skip first addPage on document creation by writing first page details
doc.fillColor('#8F6B2E').font('Helvetica-Bold').fontSize(22).text('Plano de Roteiro de Posts', 50, 100);
doc.fillColor('#475569').font('Helvetica').fontSize(12).text('JusCore AI — Cronograma e Copies (30 Dias)', 50, 130);
doc.strokeColor('#C7984A').lineWidth(2).moveTo(50, 145).lineTo(doc.page.width - 50, 145).stroke();
doc.y = 170;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // --- CODE BLOCK CHECK ---
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      drawCodeBlock(codeLines);
      inCodeBlock = false;
      codeLines = [];
    } else {
      inCodeBlock = true;
    }
    continue;
  }
  
  if (inCodeBlock) {
    codeLines.push(line);
    continue;
  }
  
  // --- TABLE CHECK ---
  if (line.startsWith('|')) {
    // Skip separator lines like | :---: |
    if (line.includes('---')) {
      inTable = true;
      continue;
    }
    const cols = line.split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
    tableRows.push(cols);
    inTable = true;
    continue;
  }
  
  if (inTable && !line.startsWith('|')) {
    drawTable(tableRows);
    inTable = false;
    tableRows = [];
  }
  
  // --- BLOCKQUOTE CHECK ---
  if (line.startsWith('>')) {
    quoteLines.push(line);
    inQuote = true;
    continue;
  }
  
  if (inQuote && !line.startsWith('>')) {
    drawQuote(quoteLines);
    inQuote = false;
    quoteLines = [];
  }
  
  // --- REGULAR MARKDOWN PARSING ---
  if (line.startsWith('# ')) {
    drawH1(line.substring(2).trim());
  } else if (line.startsWith('## ')) {
    drawH2(line.substring(3).trim());
  } else if (line.startsWith('### ')) {
    drawH3(line.substring(4).trim());
  } else if (line.startsWith('#### ')) {
    drawH4(line.substring(5).trim());
  } else if (line.startsWith('---')) {
    drawDivider();
  } else if (line.startsWith('* ') || line.startsWith('- ')) {
    drawBulletPoint(line);
  } else if (line.trim().length > 0) {
    drawStyledText(line, 9.5, 'Helvetica', '#334155');
    doc.y += 8; // spacing between lines/paragraphs
  }
}

// Flush any trailing state
if (inTable && tableRows.length > 0) drawTable(tableRows);
if (inQuote && quoteLines.length > 0) drawQuote(quoteLines);
if (inCodeBlock && codeLines.length > 0) drawCodeBlock(codeLines);

// --- AFTER-BUFFER FOR PAGE NUMBERS & HEADER/FOOTER ---
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  
  // Draw footer
  doc.fillColor('#94A3B8').font('Helvetica').fontSize(7.5);
  doc.text(`JusCore AI • Plano de Roteiro de Posts (30 Dias)`, 50, doc.page.height - 40, {
    align: 'left',
    width: doc.page.width - 250
  });
  
  doc.text(`Página ${i + 1} de ${range.count}`, doc.page.width - 200, doc.page.height - 40, {
    align: 'right',
    width: 150
  });
  
  // Draw header for pages after the cover page
  if (i > 0) {
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8);
    doc.text('JUSCORE AI — SOCIAL MEDIA ROADMAP', 50, 30, {
      align: 'left',
      width: doc.page.width - 100
    });
    // Thin horizontal line under header
    doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(50, 40).lineTo(doc.page.width - 50, 40).stroke();
  }
}

doc.end();
console.log('🎉 PDF gerado com sucesso em: plano_de_posts.pdf');
