import React from 'react';
import { ToolBtn } from './ToolBtn';

export function DocEditorToolbar({ saveRange, restoreRange, exec, fmt, imgInputRef, insertImage }) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
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
  );
}
