/* eslint-disable no-unused-vars */
import React, { useRef, useEffect, useState } from 'react';
import { 
  Paperclip, Send, StopCircle,
  Camera, Image as ImageIcon, X, ChevronDown,
  RefreshCw, Zap, Brain, Sparkles, Lock, User
} from 'lucide-react';

// ─── Model Tier Definitions ────────────────────────────────────────
const MODEL_TIERS = [
  { 
    id: 'company', 
    label: 'JusCore Flash', 
    labelShort: 'Flash',
    desc: 'Rápido e eficiente',
    icon: Zap,
    color: 'text-emerald-400',
    bgActive: 'bg-emerald-500/10 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    tier: 'free',
  },
  { 
    id: 'reasoning', 
    label: 'JusCore Pro', 
    labelShort: 'Pro',
    desc: 'Raciocínio profundo',
    icon: Brain,
    color: 'text-violet-400',
    bgActive: 'bg-violet-500/10 border-violet-500/30',
    dotColor: 'bg-violet-400',
    tier: 'paid',
  },
  { 
    id: 'deep-research', 
    label: 'Deep Research', 
    labelShort: 'Deep',
    desc: 'Pesquisa aprofundada',
    icon: Sparkles,
    color: 'text-amber-400',
    bgActive: 'bg-amber-500/10 border-amber-500/30',
    dotColor: 'bg-amber-400',
    tier: 'premium',
  },
];

const PLAN_ACCESS = {
  free:           { reasoning: false, deepResearch: false },
  starter:        { reasoning: false, deepResearch: false },
  student_basic:  { reasoning: true,  deepResearch: false },
  student_pro:    { reasoning: true,  deepResearch: false },
  student_master: { reasoning: true,  deepResearch: true  },
  pro:            { reasoning: true,  deepResearch: false },
  lawyer_starter: { reasoning: true,  deepResearch: false },
  lawyer_growth:  { reasoning: true,  deepResearch: true  },
  office_master:  { reasoning: true,  deepResearch: true  },
  enterprise:     { reasoning: true,  deepResearch: true  },
};

const ChatInput = ({ 
  input, setInput, isLoading, isProcessingFile, selectedImage, setSelectedImage,
  selectedModel, setSelectedModel, isModelDropdownOpen, setIsModelDropdownOpen,
  isDocMode, setIsDocMode, isAttachMenuOpen, setIsAttachMenuOpen,
  selectedProcess, setSelectedProcess, processes,
  selectedClient, setSelectedClient, clients,
  onSend, onStop, onLaunchCamera, onLaunchFile,
  textareaRef, dropdownRef, attachMenuRef, fileInputRef, modelDropdownRef,
  hasProcessAccess, userPlan
}) => {

  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input, textareaRef]);

  const access = PLAN_ACCESS[userPlan] || PLAN_ACCESS.free;
  const currentModel = MODEL_TIERS.find(m => m.id === selectedModel) || MODEL_TIERS[0];
  const CurrentIcon = currentModel.icon;

  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
  };

  const isModelAvailable = (model) => {
    if (model.tier === 'free') return true;
    if (model.tier === 'paid') return access.reasoning;
    if (model.tier === 'premium') return access.deepResearch;
    return false;
  };

  const getPlaceholder = () => {
    if (selectedModel === 'reasoning') return "Modo Raciocínio — análise aprofundada...";
    if (selectedModel === 'deep-research') return "Deep Research — pesquisa detalhada...";
    return "Digite sua mensagem...";
  };

  return (
    <div className="absolute bottom-0 left-0 w-full z-20 px-3 sm:px-4 pb-2 sm:pb-2.5 pt-0 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-6xl pointer-events-auto">
        
        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-3 relative inline-block animate-in zoom-in-50 duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-accent shadow-lg">
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

        {/* Selected Client Preview */}
        {selectedClient && (() => {
          const clientData = clients.find(c => c.id === Number(selectedClient));
          return clientData ? (
            <div className="mb-3 ml-2 relative inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold shadow-sm animate-in zoom-in-50 duration-300">
              <User className="w-3.5 h-3.5" />
              <span>Cliente: {clientData.nome}</span>
              <button 
                onClick={() => setSelectedClient('')}
                className="text-emerald-400 hover:text-red-400 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : null;
        })()}

        {/* Input Box */}
        <div className="relative group bg-white dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 shadow-2xl dark:shadow-black/50 transition-all focus-within:ring-1 focus-within:ring-accent/50 focus-within:border-accent/50 flex items-end gap-1.5 sm:gap-2 text-gray-900 dark:text-gray-200">
           
           {/* Attach Button */}
           <div className="relative" ref={attachMenuRef}>
             <button 
               onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
               className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
             >
               <Paperclip className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
             </button>
             
             {isAttachMenuOpen && (
               <div className="absolute bottom-full mb-2 left-0 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 z-50">
                 {hasProcessAccess && (
                   <button 
                     onClick={() => {
                       setIsClientSelectOpen(!isClientSelectOpen);
                       setIsAttachMenuOpen(false);
                     }}
                     className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-800/90 backdrop-blur rounded-full border border-gray-700 shadow-xl flex items-center justify-center text-accent hover:scale-110 transition-transform"
                     title="Vincular Cliente"
                   >
                     <User className="w-5 h-5 sm:w-6 sm:h-6" />
                   </button>
                 )}
                 <button 
                   onClick={onLaunchCamera}
                   className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-800/90 backdrop-blur rounded-full border border-gray-700 shadow-xl flex items-center justify-center text-accent hover:scale-110 transition-transform"
                   title="Câmera"
                 >
                   <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                 </button>
                 <button 
                   onClick={onLaunchFile}
                   className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-800/90 backdrop-blur rounded-full border border-gray-700 shadow-xl flex items-center justify-center text-accent hover:scale-110 transition-transform"
                   title="Galeria / PDF"
                 >
                   <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                 </button>
               </div>
             )}

             {isClientSelectOpen && (
               <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-2xl p-2.5 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                 <div className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-600 tracking-widest px-1">
                   Selecionar Cliente
                 </div>
                 <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50 pr-1">
                   {clients.length === 0 ? (
                     <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-600 italic">
                       Nenhum cliente cadastrado
                     </div>
                   ) : (
                     clients.map(c => (
                       <button
                         key={c.id}
                         onClick={() => {
                           setSelectedClient(c.id);
                           setIsClientSelectOpen(false);
                         }}
                         className="w-full text-left py-2 px-2.5 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 transition-all font-semibold"
                       >
                         {c.nome}
                       </button>
                     ))
                   )}
                 </div>
               </div>
             )}
           </div>

           {/* Textarea */}
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
             placeholder={getPlaceholder()}
             className="flex-1 bg-transparent border-none py-2 sm:py-2.5 px-1 sm:px-2 text-sm sm:text-base text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-0 outline-none resize-none max-h-[200px] min-w-0 [&::-webkit-scrollbar]:hidden"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
             rows={1}
           />

           {/* Right Actions */}
           <div className="flex items-center gap-1 pb-0.5 flex-shrink-0">

             {/* Removed process select per user request */}

             {/* ─── Model Selector Dropdown (inside input bar) ─── */}
             <div className="relative" ref={modelDropdownRef}>
               <button
                 onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                 className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                   selectedModel === 'company' 
                     ? 'bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-black/40'
                     : selectedModel === 'reasoning'
                       ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                       : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                 }`}
               >
                 <CurrentIcon className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">{currentModel.labelShort}</span>
                 <ChevronDown className={`w-3 h-3 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
               </button>

               {/* Dropdown Menu */}
               {isModelDropdownOpen && (
                 <div className="absolute bottom-full mb-2 right-0 w-52 sm:w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl dark:shadow-black/50 p-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                   <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                     Modelo
                   </div>
                   {MODEL_TIERS.map((model) => {
                     const available = isModelAvailable(model);
                     const isSelected = model.id === selectedModel;
                     const ModelIcon = model.icon;
                     
                     return (
                       <button
                         key={model.id}
                         onClick={() => available && handleSelectModel(model.id)}
                         disabled={!available}
                         className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                           isSelected 
                             ? `${model.bgActive} border` 
                             : available 
                               ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent' 
                               : 'opacity-40 cursor-not-allowed border border-transparent'
                         }`}
                       >
                         <ModelIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? model.color : 'text-gray-400 dark:text-gray-500'}`} />
                         <div className="flex-1 min-w-0">
                           <div className={`text-xs font-semibold leading-tight ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                             {model.label}
                           </div>
                           <div className="text-[10px] text-gray-400 dark:text-gray-600 leading-tight">
                             {model.desc}
                           </div>
                         </div>
                         {!available && (
                           <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                         )}
                         {isSelected && (
                           <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${model.dotColor}`} />
                         )}
                       </button>
                     );
                   })}
                 </div>
               )}
             </div>

             {/* Send/Stop Button */}
             {isLoading ? (
               <button
                 onClick={onStop}
                 className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 transition-all animate-pulse flex-shrink-0"
               >
                 <StopCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
               </button>
             ) : (
               <button
                 onClick={onSend}
                 disabled={!input.trim() && !selectedImage || isProcessingFile}
                 className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-accent text-gray-900 font-bold shadow-lg shadow-accent/10 hover:bg-accent-light disabled:opacity-30 disabled:shadow-none transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
               >
                 <Send className="w-4.5 h-4.5 sm:w-5 sm:h-5 ml-0.5" />
               </button>
             )}
           </div>

           {/* Processing File Indicator */}
           {isProcessingFile && (
             <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex items-center gap-2 px-3 py-1 bg-gray-800/80 rounded-full text-[10px] font-bold uppercase text-accent border border-accent/20 backdrop-blur-sm">
               <RefreshCw className="w-3 h-3 animate-spin" /> Processando arquivo...
             </div>
           )}
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
