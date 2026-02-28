import React, { useRef, useEffect } from 'react';
import { 
  Paperclip, Send, StopCircle, Building2, GraduationCap, Zap, 
  Camera, Image as ImageIcon, X, FileText, ChevronUp, ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../../components/ui';

const ChatInput = ({ 
  input, setInput, isLoading, isProcessingFile, selectedImage, setSelectedImage,
  selectedModel, setSelectedModel, isModelDropdownOpen, setIsModelDropdownOpen,
  isDocMode, setIsDocMode, isAttachMenuOpen, setIsAttachMenuOpen,
  isAttachMenuOpen: isAttachMenuOpenProp, 
  selectedProcess, setSelectedProcess, processes,
  onSend, onStop, onLaunchCamera, onLaunchFile,
  textareaRef, dropdownRef, attachMenuRef, fileInputRef, models,
  hasProcessAccess
}) => {

  const selectedModelData = models.find(m => m.id === selectedModel);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input, textareaRef]);

  return (
    <div className="absolute bottom-0 left-0 w-full z-20 px-4 pb-2 pt-10 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-6xl pointer-events-auto">
        
        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-4 relative inline-block animate-in zoom-in-50 duration-300">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-accent shadow-lg">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative flex flex-col gap-4">
           
           {/* Input Box Container */}
           <div className="relative group bg-white dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-[2rem] p-2 shadow-2xl dark:shadow-black/50 transition-all focus-within:ring-1 focus-within:ring-accent/50 focus-within:border-accent/50 flex items-end gap-2 text-gray-900 dark:text-gray-200">
              
              {/* Attach Button */}
              <div className="relative" ref={attachMenuRef}>
                <button 
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                
                {isAttachMenuOpen && (
                <div className="absolute bottom-full mb-2 left-0 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                    <button 
                        onClick={onLaunchCamera}
                        className="w-12 h-12 bg-gray-800/90 backdrop-blur rounded-full border border-gray-700 shadow-xl flex items-center justify-center text-accent hover:scale-110 transition-transform"
                        title="Câmera"
                    >
                        <Camera className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={onLaunchFile}
                        className="w-12 h-12 bg-gray-800/90 backdrop-blur rounded-full border border-gray-700 shadow-xl flex items-center justify-center text-accent hover:scale-110 transition-transform"
                        title="Galeria / PDF"
                    >
                        <ImageIcon className="w-6 h-6" />
                    </button>
                </div>
                )}
            </div>

            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                }
                }}
                placeholder={isDocMode ? "Analise ou gere um documento..." : "Digite sua mensagem..."}
                className="flex-1 bg-transparent border-none py-2.5 px-2 text-base text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-0 outline-none resize-none max-h-[200px]"
                rows={1}
            />

             {/* Right Actions: Model, Doc, Send */}
             <div className="flex items-center gap-1 pb-0.5">
                 

                {/* Select Process */}
                 {hasProcessAccess && (
                 <div className="hidden sm:block">
                    <select 
                      value={selectedProcess || ''}
                      onChange={(e) => setSelectedProcess(e.target.value)}
                      className="bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-black/40 hover:text-gray-800 dark:hover:text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium outline-none transition-all max-w-[150px] truncate"
                      title="Vincular a um processo"
                    >
                      <option value="">Sem vínculo</option>
                      {processes?.map(p => (
                        <option key={p.id} value={p.id}>Proc: {p.numero}</option>
                      ))}
                    </select>
                 </div>
                 )}

                 {/* Document Mode Toggle */}
                 <button 
                   onClick={() => setIsDocMode(!isDocMode)}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${isDocMode ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-black/40 hover:text-gray-800 dark:hover:text-gray-300'}`}
                   title="Modo Documento"
                 >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Doc</span>
                 </button>

                {/* Send/Stop Button */}
                {isLoading ? (
                <button
                    onClick={onStop}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 transition-all animate-pulse"
                >
                    <StopCircle className="w-5 h-5" />
                </button>
                ) : (
                <button
                    onClick={onSend}
                    disabled={!input.trim() && !selectedImage || isProcessingFile}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-gray-900 font-bold shadow-lg shadow-accent/10 hover:bg-accent-light disabled:opacity-30 disabled:shadow-none transition-all transform hover:scale-105 active:scale-95"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </button>
                )}
             </div>

              {isProcessingFile && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex items-center gap-2 px-3 py-1 bg-gray-800/80 rounded-full text-[10px] font-bold uppercase text-accent border border-accent/20 backdrop-blur-sm">
                   <RefreshCw className="w-3 h-3 animate-spin" /> Processando arquivo...
                </div>
              )}
           </div>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onLaunchFile} 
        className="hidden" 
        accept="image/*,application/pdf"
      />
    </div>
  );
};

export default ChatInput;
