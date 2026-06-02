/* eslint-disable no-unused-vars */
import React, {
  useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback
} from 'react';
import { DocEditorToolbar } from './components/DocEditorToolbar';
import { DocEditorImageOverlay } from './components/DocEditorImageOverlay';

// ─── Componente principal ──────────────────────────────────────────────────────
const CustomDocEditor = forwardRef(function CustomDocEditor({ initialContent = '', onPageCountChange }, ref) {
  const bodyRef      = useRef(null);  // a folha contentEditable
  const containerRef = useRef(null);  // o fundo cinza que envolve a folha
  const imgInputRef  = useRef(null);
  const savedRange   = useRef(null);

  // imagem selecionada + rect relativo ao containerRef
  const [selImg,   setSelImg]   = useState(null);
  const [imgRect,  setImgRect]  = useState(null);
  // estado de resize
  const [resizing, setResizing] = useState(null);
  // estado de drag-to-move
  const [moving, setMoving]     = useState(null); // { img, ghostEl, startX, startY }
  // estado dos botões de formatação
  const [fmt, setFmt] = useState({});

  // ── Contagem de páginas A4 e quebras de folha ────────────────────────────────
  const [mm297px, setMm297px] = useState(1122);
  const [pageCount, setPageCount] = useState(1);
  const observerRef = useRef(null);

  const updatePageCount = useCallback(() => {
    if (!bodyRef.current) return;

    // Pausa o observer para evitar loop infinito durante modificações manuais do DOM
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Mede 297mm em pixels de forma exata para a tela atual
    const temp = document.createElement('div');
    temp.style.height = '297mm';
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    document.body.appendChild(temp);
    const pxVal = temp.offsetHeight || 1122;
    document.body.removeChild(temp);
    setMm297px(pxVal);

    // 1. Remove temporariamente todos os espaçadores existentes para obter as posições reais dos blocos
    const existingSpacers = bodyRef.current.querySelectorAll('.page-break-spacer');
    existingSpacers.forEach(el => el.remove());

    // 2. Calcula as posições dos filhos reais para identificar onde quebrar a folha nas normas ABNT
    const children = Array.from(bodyRef.current.children);
    const bottomMargin = Math.round(20 * (pxVal / 297)); // Margem inferior de 20mm
    const topMargin = Math.round(30 * (pxVal / 297));    // Margem superior de 30mm
    const gapHeight = 24; // Espaço cinza físico entre as páginas de 24px
    const usablePageHeight = pxVal - topMargin - bottomMargin - Math.round(8 * (pxVal / 297)); // Subtrai margem de segurança de 8mm para concordância de 100% com o PDF

    let currentPage = 1;
    let currentPageStartHeight = topMargin; // A primeira página começa com 30mm de preenchimento superior

    children.forEach(child => {
      if (child.classList.contains('page-break-spacer')) return;

      const childHeight = child.offsetHeight;
      const childTop = child.offsetTop;

      // Calcula a base do elemento relativa ao início do conteúdo útil da página atual
      const relativeBottom = childTop + childHeight - currentPageStartHeight;

      // Se o elemento transbordar o espaço útil da página corrente, empurra-o para a próxima folha
      if (relativeBottom > usablePageHeight) {
        const spacer = document.createElement('div');
        spacer.className = 'page-break-spacer select-none';
        spacer.setAttribute('contenteditable', 'false');
        spacer.style.height = `${bottomMargin + gapHeight + topMargin}px`;
        spacer.style.margin = '0';
        spacer.style.padding = '0';
        spacer.style.position = 'relative';
        spacer.style.display = 'block';
        spacer.style.width = '100%';

        // O espaçador visual replica a folha de papel:
        // - Topo: Margem inferior branca de 20mm da folha anterior
        // - Meio: Divisória de página de 24px cinza com rótulo
        // - Fundo: Margem superior branca de 30mm da próxima folha
        spacer.innerHTML = `
          <div style="height: ${bottomMargin}px; background: #ffffff; width: 100%;"></div>
          <div class="bg-gray-100 dark:bg-gray-900 border-y-4 border-gray-200 dark:border-gray-950 flex items-center justify-between" style="height: ${gapHeight}px; width: 100%;">
            <span class="text-[8px] font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase px-6">
              FIM DA PÁG ${currentPage} (MARGEM 2CM)
            </span>
            <div style="flex: 1; border-t: 1px dashed #d1d5db; margin: 0 10px; opacity: 0.6;"></div>
            <span class="text-[8px] font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase px-6">
              INÍCIO DA PÁG ${currentPage + 1} (MARGEM 3CM)
            </span>
          </div>
          <div style="height: ${topMargin}px; background: #ffffff; width: 100%;"></div>
        `;

        bodyRef.current.insertBefore(spacer, child);
        currentPage++;
        currentPageStartHeight = child.offsetTop; // Atualiza a referência de início do conteúdo para o elemento deslocado
      }
    });

    const pages = currentPage;
    setPageCount(pages);
    if (onPageCountChange) {
      onPageCountChange(pages);
    }

    // Reativa o MutationObserver com as configurações necessárias
    if (observerRef.current && bodyRef.current) {
      observerRef.current.observe(bodyRef.current, { childList: true, subtree: true, characterData: true });
    }
  }, [onPageCountChange]);

  // ── Expõe .value limpo como API do editor (sem resíduos de espaçadores do layout) ──
  useImperativeHandle(ref, () => ({
    get value() { 
      if (!bodyRef.current) return '';
      const clone = bodyRef.current.cloneNode(true);
      clone.querySelectorAll('.page-break-spacer').forEach(el => el.remove());
      return clone.innerHTML;
    },
    set value(html) {
      if (bodyRef.current) {
        bodyRef.current.innerHTML = html;
        setSelImg(null);
        setImgRect(null);
        setTimeout(updatePageCount, 50);
      }
    }
  }));

  // ── Injeta conteúdo inicial UMA vez e configura MutationObserver ────────────
  useEffect(() => {
    if (bodyRef.current && initialContent) {
      bodyRef.current.innerHTML = initialContent;
    }

    if (!bodyRef.current) return;
    const observer = new MutationObserver(updatePageCount);
    observerRef.current = observer;
    observer.observe(bodyRef.current, { childList: true, subtree: true, characterData: true });

    updatePageCount();

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Calcula o rect da imagem relativo ao containerRef ──────────────────────
  const updateImgRect = useCallback((img) => {
    if (!img || !containerRef.current) return;
    const ir = img.getBoundingClientRect();
    const cr = containerRef.current.getBoundingClientRect();
    setImgRect({
      left:   ir.left - cr.left + containerRef.current.scrollLeft,
      top:    ir.top  - cr.top  + containerRef.current.scrollTop,
      width:  ir.width,
      height: ir.height,
    });
  }, []);

  // Re-calcula ao rolar ou redimensionar janela
  useEffect(() => {
    if (!selImg) { setImgRect(null); return; }
    const handler = () => updateImgRect(selImg);
    handler();
    window.addEventListener('resize', handler);
    containerRef.current?.addEventListener('scroll', handler);
    const cont = containerRef.current;
    return () => {
      window.removeEventListener('resize', handler);
      cont?.removeEventListener('scroll', handler);
    };
  }, [selImg, updateImgRect]);

  // ── Helpers de execução de formatting ──────────────────────────────────────
  const exec = useCallback((cmd, val = null) => {
    bodyRef.current?.focus();
    document.execCommand(cmd, false, val);
  }, []);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const updateFmt = () => {
    try {
      setFmt({
        bold:         document.queryCommandState('bold'),
        italic:       document.queryCommandState('italic'),
        underline:    document.queryCommandState('underline'),
        strike:       document.queryCommandState('strikeThrough'),
        jLeft:        document.queryCommandState('justifyLeft'),
        jCenter:      document.queryCommandState('justifyCenter'),
        jRight:       document.queryCommandState('justifyRight'),
        jFull:        document.queryCommandState('justifyFull'),
        ul:           document.queryCommandState('insertUnorderedList'),
        ol:           document.queryCommandState('insertOrderedList'),
      });
    } catch (_) {}
  };

  // ── TAB → 4 espaços ────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      exec('insertText', '    ');
    }
    if (e.key === 'Escape') { setSelImg(null); }
  };

  // ── Upload de imagem ───────────────────────────────────────────────────────
  const insertImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      bodyRef.current?.focus();
      restoreRange();
      const img = document.createElement('img');
      img.src = reader.result;
      img.style.cssText = 'max-width:100%;height:auto;cursor:pointer;display:block;margin:8px 0;';
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.collapse(false);
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        bodyRef.current.appendChild(img);
      }
      setSelImg(img);
      setTimeout(() => updateImgRect(img), 30);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Clique no editor: seleciona imagem ou deseleciona ─────────────────────
  const handleEditorClick = (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      setSelImg(e.target);
      setTimeout(() => updateImgRect(e.target), 0);
    } else {
      setSelImg(null);
    }
  };

  // ══ RESIZE por alças ═══════════════════════════════════════════════════════
  const startResize = useCallback((e, handle) => {
    if (!selImg) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = selImg.getBoundingClientRect();
    setResizing({
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      aspect: rect.width / rect.height,
    });
  }, [selImg]);

  useEffect(() => {
    if (!resizing || !selImg) return;
    const { handle, startX, startY, startW, startH, aspect } = resizing;
    const onMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let w = startW, h = startH;
      const isCorner = handle.length === 2;
      if (handle.includes('e')) w = Math.max(40, startW + dx);
      if (handle.includes('w')) w = Math.max(40, startW - dx);
      if (handle.includes('s')) h = Math.max(30, startH + dy);
      if (handle.includes('n')) h = Math.max(30, startH - dy);
      if (isCorner) h = w / aspect;
      selImg.style.width  = `${Math.round(w)}px`;
      selImg.style.height = `${Math.round(h)}px`;
      updateImgRect(selImg);
    };
    const onUp = () => setResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, selImg, updateImgRect]);

  // ══ MOVER imagem (arrastar) ════════════════════════════════════════════════
  const startMove = useCallback((e) => {
    if (!selImg) return;
    e.preventDefault();
    e.stopPropagation();

    // Clona a imagem como ghost semi-transparente que segue o cursor
    const ghost = selImg.cloneNode(true);
    ghost.style.cssText = `
      position:fixed; pointer-events:none; opacity:0.5; z-index:9999;
      width:${selImg.offsetWidth}px; height:${selImg.offsetHeight}px;
      left:${e.clientX - selImg.offsetWidth/2}px;
      top:${e.clientY  - selImg.offsetHeight/2}px;
    `;
    document.body.appendChild(ghost);
    setMoving({ img: selImg, ghost });
  }, [selImg]);

  useEffect(() => {
    if (!moving) return;
    const { img, ghost } = moving;

    const onMove = (e) => {
      ghost.style.left = `${e.clientX - img.offsetWidth  / 2}px`;
      ghost.style.top  = `${e.clientY - img.offsetHeight / 2}px`;
    };

    const onUp = (e) => {
      document.body.removeChild(ghost);
      // Remove imagem da posição original
      const parent = img.parentNode;
      if (parent) parent.removeChild(img);

      // Usa caretRangeFromPoint para encontrar onde soltar
      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
        }
      }

      if (range && bodyRef.current?.contains(range.startContainer)) {
        range.collapse(true);
        range.insertNode(img);
        range.setStartAfter(img);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        bodyRef.current?.appendChild(img);
      }

      setMoving(null);
      setSelImg(img);
      setTimeout(() => updateImgRect(img), 30);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [moving, updateImgRect]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full">
      <style>{`
        /* Estilos e responsividade física da folha de papel */
        .folha-papel {
          width: 100% !important;
          max-width: 210mm !important;
          min-height: 50vh !important;
          padding: 16px !important; /* Preenchimento confortável em celulares */
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt !important;
          line-height: 1.5 !important;
          outline: none !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
          border-radius: 6px !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          position: relative !important;
        }

        @media (min-width: 768px) {
          .folha-papel {
            min-height: 297mm !important; /* Folha A4 física em desktops */
            padding: 30mm 20mm 20mm 30mm !important; /* Margens ABNT físicas reais */
            box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
            border-radius: 2px !important;
          }
        }

        /* Normas ABNT aplicadas ao editor */
        .folha-papel p {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt !important;
          line-height: 1.5 !important;
          text-align: justify !important;
          text-indent: 1.25cm !important; /* Recuo padrão de parágrafo ABNT */
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          padding: 0 !important;
        }
        .folha-papel h1 {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          text-align: center !important;
          line-height: 1.5 !important;
          margin-top: 1.5em !important;
          margin-bottom: 0.8em !important;
        }
        .folha-papel h2 {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt !important;
          font-weight: bold !important;
          text-align: left !important;
          line-height: 1.5 !important;
          margin-top: 1.5em !important;
          margin-bottom: 0.8em !important;
        }
        .folha-papel h3 {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt !important;
          font-weight: bold !important;
          font-style: italic !important;
          text-align: left !important;
          line-height: 1.5 !important;
          margin-top: 1.5em !important;
          margin-bottom: 0.8em !important;
        }
      `}</style>

      <DocEditorToolbar 
        saveRange={saveRange}
        restoreRange={restoreRange}
        exec={exec}
        fmt={fmt}
        imgInputRef={imgInputRef}
        insertImage={insertImage}
      />

      {/* ── ÁREA DE EDIÇÃO ── */}
      {/* containerRef envolve TUDO — absolute children são posicionados em relação a ele */}
      <div
        ref={containerRef}
        className="relative bg-gray-100 dark:bg-gray-900 py-8 px-4 flex justify-center overflow-auto"
        style={{ minHeight: '800px' }}
        onClick={handleEditorClick}
      >

        <DocEditorImageOverlay 
          selImg={selImg}
          imgRect={imgRect}
          startResize={startResize}
          startMove={startMove}
        />

        {/* Wrapper relativo para alinhar as guias de quebra exatamente com a folha */}
        <div className="relative w-full max-w-[210mm] flex flex-col items-center select-text">
          
          {/* ── FOLHA DE PAPEL ── */}
          <div
            ref={bodyRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            className="folha-papel"
            onKeyDown={handleKeyDown}
            onKeyUp={updateFmt}
            onMouseUp={updateFmt}
            onFocus={updateFmt}
            style={{
              width:        '100%',
              maxWidth:     '210mm',
              background:   '#ffffff',
              color:        '#000000',
              fontFamily:   "'Times New Roman', Times, serif",
              fontSize:     '12pt', // ABNT exato
              lineHeight:   '1.5',  // ABNT exato
              outline:      'none',
              overflowWrap: 'break-word',
              wordBreak:    'break-word',
              position:     'relative',
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default CustomDocEditor;
