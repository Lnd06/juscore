import React from 'react';

export function ToolBtn({ title, active, onClick, children, className = '' }) {
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
