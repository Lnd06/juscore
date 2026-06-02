import React from 'react';

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

export function DocEditorImageOverlay({ selImg, imgRect, startResize, startMove }) {
  if (!selImg || !imgRect) return null;

  return (
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
  );
}
