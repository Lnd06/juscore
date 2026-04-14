import React, {
  useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback
} from 'react';

function ToolBtn({ title, active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`h-8 px-2 rounded text-sm font-medium transition-all select-none
        ${active
          ? 'bg-blue-600 text-white shadow-inner'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
        } ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
const CustomDocEditor = forwardRef(function CustomDocEditor({ initialContent = '' }, ref) {
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

  // ── Expõe .value como API do editor ────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    get value() { return bodyRef.current?.innerHTML ?? ''; },
    set value(html) {
      if (bodyRef.current) {
        bodyRef.current.innerHTML = html;
        setSelImg(null);
        setImgRect(null);
      }
    }
  }));

  // ── Injeta conteúdo inicial UMA vez ────────────────────────────────────────
  useEffect(() => {
    if (bodyRef.current && initialContent) {
      bodyRef.current.innerHTML = initialContent;
    }
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

  // ── Handles: posições dos 8 pontos ao redor do rect ───────────────────────
  const handles = [
    { id: 'nw', cursor: 'nw-resize' },
    { id: 'n',  cursor: 'n-resize'  },
    { id: 'ne', cursor: 'ne-resize' },
    { id: 'e',  cursor: 'e-resize'  },
    { id: 'se', cursor: 'se-resize' },
    { id: 's',  cursor: 's-resize'  },
    { id: 'sw', cursor: 'sw-resize' },
    { id: 'w',  cursor: 'w-resize'  },
  ];

  const handleStyle = (id, r) => {
    const mid = { x: r.width / 2, y: r.height / 2 };
    const corners = {
      nw: [0,        0       ],
      n:  [mid.x,    0       ],
      ne: [r.width,  0       ],
      e:  [r.width,  mid.y   ],
      se: [r.width,  r.height],
      s:  [mid.x,    r.height],
      sw: [0,        r.height],
      w:  [0,        mid.y   ],
    };
    const [x, y] = corners[id];
    return { left: `${x - 7}px`, top: `${y - 7}px` };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full">

      {/* ── BARRA DE FERRAMENTAS ── */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800
                      border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">

        <select
          className="h-8 px-2 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
          defaultValue="Times New Roman"
          onMouseDown={saveRange}
          onChange={e => { restoreRange(); exec('fontName', e.target.value); }}
        >
          {['Times New Roman','Arial','Calibri','Georgia','Verdana','Courier New'].map(f => (
            <option key={f}>{f}</option>
          ))}
        </select>

        <select
          className="w-16 h-8 px-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
          defaultValue="3"
          onMouseDown={saveRange}
          onChange={e => { restoreRange(); exec('fontSize', e.target.value); }}
        >
          {[1,2,3,4,5,6,7].map((s,i) => (
            <option key={s} value={s}>{[8,10,12,14,18,24,36][i]}pt</option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" />

        <ToolBtn title="Negrito" active={fmt.bold}    onClick={() => exec('bold')}>          <strong>B</strong></ToolBtn>
        <ToolBtn title="Itálico"  active={fmt.italic}  onClick={() => exec('italic')}>         <em>I</em></ToolBtn>
        <ToolBtn title="Sublinhado" active={fmt.underline} onClick={() => exec('underline')}>  <span style={{textDecoration:'underline'}}>S</span></ToolBtn>
        <ToolBtn title="Tachado" active={fmt.strike}   onClick={() => exec('strikeThrough')}> <span style={{textDecoration:'line-through'}}>T</span></ToolBtn>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" />

        <ToolBtn title="Esquerda"   active={fmt.jLeft}   onClick={() => exec('justifyLeft')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2"/><rect x="3" y="10" width="12" height="2"/><rect x="3" y="15" width="16" height="2"/><rect x="3" y="20" width="9"  height="2"/></svg>
        </ToolBtn>
        <ToolBtn title="Centralizar" active={fmt.jCenter} onClick={() => exec('justifyCenter')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2"/><rect x="6" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="6" y="20" width="12" height="2"/></svg>
        </ToolBtn>
        <ToolBtn title="Direita"     active={fmt.jRight}  onClick={() => exec('justifyRight')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2"/><rect x="9" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="12" y="20" width="9" height="2"/></svg>
        </ToolBtn>
        <ToolBtn title="Justificar"  active={fmt.jFull}   onClick={() => exec('justifyFull')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2"/><rect x="3" y="10" width="18" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="3" y="20" width="18" height="2"/></svg>
        </ToolBtn>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" />

        <ToolBtn title="Lista" active={fmt.ul} onClick={() => exec('insertUnorderedList')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="7" r="2"/><circle cx="4" cy="14" r="2"/><circle cx="4" cy="21" r="2"/><rect x="8" y="6" width="13" height="2"/><rect x="8" y="13" width="13" height="2"/><rect x="8" y="20" width="13" height="2"/></svg>
        </ToolBtn>
        <ToolBtn title="Lista numerada" active={fmt.ol} onClick={() => exec('insertOrderedList')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M5 10H3M3 14h1.5a.5.5 0 0 1 0 1H3.5a.5.5 0 0 1 0 1H5"/></svg>
        </ToolBtn>
        <ToolBtn title="Aumentar recuo" onClick={() => exec('indent')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/><polyline points="9 6 13 9 9 12"/><line x1="3" y1="9" x2="3" y2="12"/></svg>
        </ToolBtn>
        <ToolBtn title="Diminuir recuo" onClick={() => exec('outdent')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/><polyline points="11 6 7 9 11 12"/><line x1="3" y1="9" x2="3" y2="12"/></svg>
        </ToolBtn>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" />

        <ToolBtn title="Inserir imagem" onClick={() => { saveRange(); imgInputRef.current?.click(); }}>
          🖼 Imagem
        </ToolBtn>
        <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={insertImage} />

        <ToolBtn title="Linha horizontal" onClick={() => exec('insertHorizontalRule')}>
          ─ Linha
        </ToolBtn>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5" />

        <ToolBtn title="Desfazer (Ctrl+Z)" onClick={() => exec('undo')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M3 13C5 7 11 4 17 6a9 9 0 0 1 4 12"/></svg>
        </ToolBtn>
        <ToolBtn title="Refazer (Ctrl+Y)" onClick={() => exec('redo')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M21 13C19 7 13 4 7 6a9 9 0 0 0-4 12"/></svg>
        </ToolBtn>

        <div className="flex items-center gap-1 ml-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Cor:</span>
          <input type="color" title="Cor do texto" defaultValue="#000000"
            className="w-7 h-7 cursor-pointer rounded border border-gray-200"
            onMouseDown={saveRange}
            onChange={e => { restoreRange(); exec('foreColor', e.target.value); }} />
        </div>
      </div>

      {/* ── ÁREA DE EDIÇÃO ── */}
      {/* containerRef envolve TUDO — absolute children são posicionados em relação a ele */}
      <div
        ref={containerRef}
        className="relative bg-gray-100 dark:bg-gray-900 py-8 px-4 flex justify-center overflow-auto"
        style={{ minHeight: '800px' }}
        onClick={handleEditorClick}
      >

        {/* ── OVERLAY: borda de seleção + alças de resize + botão de mover ── */}
        {selImg && imgRect && (
          <div
            style={{
              position:  'absolute',
              left:      imgRect.left   + 'px',
              top:       imgRect.top    + 'px',
              width:     imgRect.width  + 'px',
              height:    imgRect.height + 'px',
              outline:   '2px solid #3b82f6',
              zIndex:    40,
              pointerEvents: 'none',
            }}
          >
            {/* Alças de resize */}
            {handles.map(({ id, cursor }) => (
              <div
                key={id}
                onMouseDown={e => startResize(e, id)}
                style={{
                  position:        'absolute',
                  ...handleStyle(id, imgRect),
                  width:           '14px',
                  height:          '14px',
                  background:      '#3b82f6',
                  border:          '2px solid #fff',
                  borderRadius:    '3px',
                  boxShadow:       '0 0 4px rgba(0,0,0,0.5)',
                  cursor,
                  pointerEvents:   'all',
                  zIndex:          50,
                }}
              />
            ))}

            {/* Botão de mover — cruzinha central */}
            <div
              title="Arrastar para mover imagem"
              onMouseDown={startMove}
              style={{
                position:      'absolute',
                left:          `${imgRect.width  / 2 - 14}px`,
                top:           `${imgRect.height / 2 - 14}px`,
                width:         '28px',
                height:        '28px',
                background:    '#3b82f6',
                border:        '2px solid #fff',
                borderRadius:  '50%',
                boxShadow:     '0 2px 8px rgba(0,0,0,0.35)',
                cursor:        'move',
                pointerEvents: 'all',
                zIndex:        51,
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                color:         '#fff',
                fontSize:      '16px',
                userSelect:    'none',
              }}
            >
              ✥
            </div>
          </div>
        )}

        {/* ── FOLHA DE PAPEL ── */}
        <div
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onKeyDown={handleKeyDown}
          onKeyUp={updateFmt}
          onMouseUp={updateFmt}
          onFocus={updateFmt}
          style={{
            width:        '100%',
            maxWidth:     '860px',
            minHeight:    '297mm',
            background:   '#ffffff',
            color:        '#000000',
            fontFamily:   "'Times New Roman', Times, serif",
            fontSize:     '13pt',
            lineHeight:   '1.6',
            padding:      '25mm 20mm 20mm 30mm',
            outline:      'none',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.18)',
            borderRadius: '2px',
            overflowWrap: 'break-word',
            wordBreak:    'break-word',
          }}
        />
      </div>
    </div>
  );
});

export default CustomDocEditor;
