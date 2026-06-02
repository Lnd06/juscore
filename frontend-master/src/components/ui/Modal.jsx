import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

export const Modal = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={cn(
          "relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 transform transition-all scale-100",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
