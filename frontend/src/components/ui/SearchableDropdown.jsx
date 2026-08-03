import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchableDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  variant = 'accent',
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option => {
    const label = typeof option === 'string' ? option : option.label || option.id;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const getLabel = (val) => {
    if (!val) return placeholder;
    const found = options.find(opt => {
      if (typeof opt === 'string') return opt === val;
      return opt.id === val || opt.label === val;
    });
    if (!found) return val;
    return typeof found === 'string' ? found : found.label || found.id;
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  // Modern styles depending on the variant (accent = gold, action = blue)
  const activeColorClass = variant === 'accent' 
    ? 'text-accent border-accent/40 focus:ring-accent/20 focus:border-accent/40 bg-accent/5' 
    : 'text-action-light border-action-light/40 focus:ring-action-light/20 focus:border-action-light/50 bg-action-light/5';

  const hoverItemClass = variant === 'accent'
    ? 'hover:bg-accent/10 hover:text-accent dark:hover:text-accent-light'
    : 'hover:bg-action-light/10 hover:text-action-light dark:hover:text-action-light';

  const selectedItemClass = variant === 'accent'
    ? 'bg-accent/5 text-accent font-semibold'
    : 'bg-action-light/5 text-action-light font-semibold';

  const accentColor = variant === 'accent' ? 'text-accent' : 'text-action-light';
  
  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-9 text-left shadow-sm",
          isOpen && activeColorClass,
          className
        )}
      >
        <span className={cn("truncate", !value && "text-gray-400 dark:text-gray-505")}>
          {getLabel(value)}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-gray-450 shrink-0 transition-transform duration-200 ml-2", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-72 flex flex-col backdrop-blur-md bg-white/95 dark:bg-juri-950/95">
          {/* Search box */}
          <div className="p-2 border-b border-gray-150 dark:border-juri-850 flex items-center gap-2 bg-gray-50/50 dark:bg-juri-950/50">
            <Search className="w-3.5 h-3.5 text-gray-450 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none text-xs text-gray-900 dark:text-gray-100 placeholder-gray-450 focus:outline-none h-6 py-0 px-0"
              autoFocus
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-650 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="overflow-y-auto py-1 max-h-56 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-450 dark:text-gray-500">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const optId = typeof opt === 'string' ? opt : opt.id;
                const optLabel = typeof opt === 'string' ? opt : opt.label || opt.id;
                const optDesc = typeof opt === 'string' ? null : opt.desc;
                const isSelected = value === optId;

                return (
                  <button
                    key={optId}
                    type="button"
                    onClick={() => handleSelect(optId)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors",
                      hoverItemClass,
                      isSelected ? selectedItemClass : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{optLabel}</span>
                      {optDesc && (
                        <span className={cn("text-[9px] truncate mt-0.5", isSelected ? "text-opacity-80" : "text-gray-405 dark:text-gray-500")}>
                          {optDesc}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className={cn("w-3.5 h-3.5 shrink-0 ml-2", accentColor)} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
