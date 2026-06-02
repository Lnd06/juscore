import React from 'react';
import { CATEGORIAS, BADGE_COLORS } from './LibraryConstants';

const LibraryStats = ({ books }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {CATEGORIAS.filter(c => c.id !== 'TODAS').map(cat => (
        <div key={cat.id} className={`rounded-xl border p-3 ${BADGE_COLORS[cat.id]} border-current/20`}>
          <div className="font-bold text-sm">{cat.label}</div>
          <div className="text-xs opacity-70 mt-0.5">{cat.desc}</div>
          <div className="font-bold text-lg mt-1">{books.filter(b => b.categoria === cat.id).length}</div>
        </div>
      ))}
    </div>
  );
};

export default LibraryStats;
