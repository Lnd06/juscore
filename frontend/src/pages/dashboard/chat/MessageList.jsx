import React, { useRef, useEffect } from 'react';
import { User, Trash2, Download, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageList = ({ messages, bottomRef, setExpandedImage, isLoading }) => {
  useEffect(() => {
    // 
  }, [messages]);

  const handleDownloadPDF = (content) => {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4"
    });

    // ABNT Margins: 3cm top/left, 2cm bottom/right
    const marginTop = 30;
    const marginLeft = 30;
    const marginRight = 20;
    const marginBottom = 20;
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - marginLeft - marginRight;
    
    let yPosition = marginTop;

    // Helper to check page break
    const checkPageBreak = (height = 10) => {
      if (yPosition + height > pageHeight - marginBottom) {
        doc.addPage();
        yPosition = marginTop;
      }
    };

    // Split content by lines first to extract title
    const lines = content.split('\n');
    let title = "DOCUMENTO JURÍDICO";
    let startIndex = 0;

    // Try to find a title in the first 5 lines
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const rawLine = lines[i].trim();
        const line = rawLine.replace(/\*\*/g, '').replace(/^#+\s*/, '');
        
        // Verifica se é um Greeting/Saudação (ex: "Antonio,", "Olá", "Prezado")
        const isGreeting = rawLine.endsWith(',') || rawLine.toLowerCase().startsWith('olá') || rawLine.toLowerCase().startsWith('aqui está') || rawLine.toLowerCase().startsWith('segue');
        
        if (line.length > 0 && line.length < 100 && !isGreeting) {
            title = line.toUpperCase();
            startIndex = i + 1; // Skip this line in body
            break;
        }
    }

    // --- Header (Legal Document Style) ---
    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    // Centered Title
    doc.text(title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // --- Content ---
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0);

    // Process remaining lines
    const bodyLines = lines.slice(startIndex);

    bodyLines.forEach(line => {
      // 1.5 Line Spacing for size 12 is approx 6mm to 8mm. Let's strictly use spacing.
      const lineHeight = 7; 

      // Handle Headers
      if (line.startsWith('#')) {
        checkPageBreak(15);
        doc.setFont("times", "bold");
        
        let headerText = line.replace(/^#+\s*/, '').toUpperCase();
        
        if (line.startsWith('# ')) {
            doc.setFontSize(14);
            yPosition += 5; // Extra space before Main Header
            doc.text(headerText, pageWidth / 2, yPosition, { align: 'center' });
        } else {
            doc.setFontSize(12); // Subtitles are size 12 bold in ABNT (sometimes 14, stick to 12 bold for sub)
            doc.text(headerText, marginLeft, yPosition);
        }
        
        yPosition += 10; // Space after header
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        return;
      }

      // Handle Bold text (**text**) - simplified removal
      const cleanLine = line.replace(/\*\*/g, '');

      // Handle Lists
      let textToPrint = cleanLine;
      let xOffset = marginLeft;

      if (cleanLine.trim().startsWith('* ') || cleanLine.trim().startsWith('- ')) {
        textToPrint = '• ' + cleanLine.trim().substring(2);
        xOffset += 5; // Indent list
      } else if (cleanLine.trim().match(/^\d+\./)) {
        xOffset += 5; // Indent numbered list
      }

      // Skip empty lines but add a small spacing (paragraph break)
      if (!cleanLine.trim()) {
          checkPageBreak(lineHeight);
          yPosition += lineHeight;
          return;
      }

      checkPageBreak(lineHeight);

      // Justify text
      // Note: jsPDF text with maxWidth wraps, but align: 'justify' is correctly supported in recent versions for print.
      // If justify fails, it falls back to left.
      
      const splitText = doc.splitTextToSize(textToPrint, maxLineWidth - (xOffset - marginLeft));
      
      // We print line by line to handle pagination correctly if a paragraph is huge
      splitText.forEach(splitLine => {
         checkPageBreak(lineHeight);
         doc.text(splitLine, xOffset, yPosition, { align: "justify", maxWidth: maxLineWidth - (xOffset - marginLeft) });
         yPosition += lineHeight;
      });
    });

    // Add footer with Page Number (ABNT: Top Right or Bottom Right, legal usually bottom)
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, pageHeight - 10, { align: "right" });
    }

    doc.save(`documento-juridico-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-8 pb-3 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
            <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center animate-bounce-slow">
              <svg viewBox="0 0 108 125" fill="none" className="w-10 h-10 text-accent/40" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M2.51465 32.7531L53.5146 64.2531M105.015 32.7531L105.515 90.2531L53.5146 122.253L1.51465 90.7531L2.51465 32.7531L54.0146 1.75305L105.015 32.7531ZM53.5146 64.2531V122.253M53.5146 64.2531L105.015 32.7531" 
                  stroke="currentColor" 
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Como posso ajudar hoje?</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Envie um documento para análise, tire dúvidas jurídicas ou realize cálculos complexos.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            // Helper to extract text and image
            const getText = (content) => {
                if (typeof content === 'string') return content;
                if (Array.isArray(content)) return content.find(c => c.type === 'text')?.text || '';
                return '';
            };
            const getImage = (msg) => {
                if (msg.image) return msg.image;
                if (Array.isArray(msg.content)) return msg.content.find(c => c.type === 'image_url')?.image_url?.url;
                return null;
            };

            const textContent = getText(msg.content);
            const imageSrc = getImage(msg);

            return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-accent text-white' 
                  : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <svg viewBox="0 0 108 125" fill="none" className="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      d="M2.51465 32.7531L53.5146 64.2531M105.015 32.7531L105.515 90.2531L53.5146 122.253L1.51465 90.7531L2.51465 32.7531L54.0146 1.75305L105.015 32.7531ZM53.5146 64.2531V122.253M53.5146 64.2531L105.015 32.7531" 
                      stroke="currentColor" 
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              <div className={`flex flex-col space-y-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`relative group/bubble p-5 rounded-[28px] text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-accent text-white shadow-xl shadow-accent/20 rounded-tr-none selection:bg-white/30' 
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                }`}>
                  
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:leading-relaxed prose-strong:text-accent prose-a:text-accent hover:prose-a:underline">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {textContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{textContent}</div>
                  )}

                  {msg.role === 'assistant' && (msg.model === 'document' || msg.mode === 'document') && (
                      <div 
                        className="mt-4 p-3 bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-3 cursor-pointer group/file hover:bg-black/10 dark:hover:bg-black/40 transition-colors"
                        onClick={() => handleDownloadPDF(textContent)}
                      >
                         <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover/file:bg-accent group-hover/file:text-white transition-colors">
                            <FileText className="w-4 h-4 text-accent group-hover/file:text-white" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">
                              {textContent.split('\n')[0].replace(/[*#]/g, '').trim() || "Documento Jurídico"}.pdf
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">Pronto para download</div>
                         </div>
                         <div className="p-1.5 rounded-lg text-gray-400 group-hover/file:text-gray-900 dark:group-hover/file:text-white transition-colors">
                            <ArrowRight className="w-4 h-4" />
                         </div>
                      </div>
                  )}

                  {imageSrc && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/20">
                      <img 
                        src={imageSrc} 
                        alt="Anexo" 
                        className="max-h-[300px] w-auto cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setExpandedImage(imageSrc)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )})
        )}

        {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className={`flex gap-4 group`}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <svg viewBox="0 0 108 125" fill="none" className="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M2.51465 32.7531L53.5146 64.2531M105.015 32.7531L105.515 90.2531L53.5146 122.253L1.51465 90.7531L2.51465 32.7531L54.0146 1.75305L105.015 32.7531ZM53.5146 64.2531V122.253M53.5146 64.2531L105.015 32.7531" 
                    stroke="currentColor" 
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex flex-col space-y-2 max-w-[85%]">
                <div className="relative group/bubble p-5 rounded-[28px] text-sm leading-relaxed bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm flex items-center gap-3 h-[60px] min-w-[100px]">
                   <div className="animate-spin w-5 h-5 flex items-center justify-center text-accent shrink-0">
                     <svg viewBox="0 0 108 125" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                       <path 
                         d="M2.51465 32.7531L53.5146 64.2531M105.015 32.7531L105.515 90.2531L53.5146 122.253L1.51465 90.7531L2.51465 32.7531L54.0146 1.75305L105.015 32.7531ZM53.5146 64.2531V122.253M53.5146 64.2531L105.015 32.7531" 
                         stroke="currentColor" 
                         strokeWidth="6"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       />
                     </svg>
                   </div>
                   <div className="flex gap-1 items-center">
                     <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                   </div>
                </div>
              </div>
            </motion.div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};

export default MessageList;
