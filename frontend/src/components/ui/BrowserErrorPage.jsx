import React from 'react';

const BrowserErrorPage = () => {
  const host = window.location.host;

  return (
    <div style={{
      backgroundColor: '#f7f7f7',
      color: '#333',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 999999
    }}>
      <div style={{ maxWidth: '490px', width: '100%' }}>
        {/* Sad face icon */}
        <div style={{ marginBottom: '24px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="8" fill="#e0e0e0"/>
            <path d="M14 26C14 26 16.5 23 24 23C31.5 23 34 26 34 26" stroke="#757575" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="19" cy="18" r="2.5" fill="#757575"/>
            <circle cx="29" cy="18" r="2.5" fill="#757575"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: '1.4em',
          fontWeight: 500,
          color: '#202124',
          margin: '0 0 16px 0',
          lineHeight: '1.3'
        }}>
          Não é possível acessar esse site
        </h1>

        <p style={{
          fontSize: '0.9em',
          color: '#5f6368',
          margin: '0 0 24px 0',
          lineHeight: '1.6'
        }}>
          A conexão com <strong>{host}</strong> foi recusada.
        </p>

        <div style={{
          borderBottom: '1px solid #e8eaed',
          paddingBottom: '20px',
          marginBottom: '20px'
        }}>
          <p style={{
            fontSize: '0.9em',
            fontWeight: 500,
            color: '#3c4043',
            margin: '0 0 8px 0'
          }}>
            Tente o seguinte:
          </p>
          <ul style={{
            fontSize: '0.9em',
            color: '#5f6368',
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '1.8'
          }}>
            <li>Verificar a conexão</li>
            <li>Verificar o proxy e o firewall</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#1a73e8',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '0.85em',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#185abc'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#1a73e8'}
          >
            Recarregar
          </button>
          
          <span style={{
            fontSize: '0.8em',
            color: '#70757a',
            fontWeight: 'normal'
          }}>
            ERR_CONNECTION_REFUSED
          </span>
        </div>
      </div>
    </div>
  );
};

export default BrowserErrorPage;
