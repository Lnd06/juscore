import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserRouter } from 'react-router-dom'

import ErrorBoundary from './components/ErrorBoundary'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Atualiza e recarrega automaticamente sem pedir confirmação
    updateSW(true)
  },
  onOfflineReady() {
    // App pronto para uso offline
  },
  onRegistered(r) {
    // Verifica por atualizações a cada 60 segundos quando online
    r && setInterval(() => {
      if (navigator.onLine) {
        r.update()
      }
    }, 60 * 1000)
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
