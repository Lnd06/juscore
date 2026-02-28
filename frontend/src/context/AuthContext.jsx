import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext, useAuth } from './AuthContextState';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Poll localStorage for google_auth_result set by backend callback page
  // (postMessage fails when window.opener is null after cross-origin redirects)
  const startGooglePoll = useRef(null);

  const handleGoogleAuthResult = useCallback((payload) => {
    if (payload.token && payload.user) {
      localStorage.setItem('token', payload.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
      setUser({ ...payload.user, token: payload.token });
      navigate('/dashboard');
    } else if (payload.error) {
      alert(payload.error || 'Falha na autenticação com Google.');
    }
  }, [navigate]);

  // Expose a function for Login/Register components to start polling
  // after opening the Google popup
  useEffect(() => {
    const onStorageEvent = (e) => {
      if (e.key === 'google_auth_result' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          localStorage.removeItem('google_auth_result');
          handleGoogleAuthResult(payload);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorageEvent);
    return () => window.removeEventListener('storage', onStorageEvent);
  }, [handleGoogleAuthResult]);

  useEffect(() => {
    if (user?.organization) {
      // Branding Colors
      console.log("🎨 [Branding] Aplicando cores:", user.organization.name);
      document.documentElement.style.setProperty('--brand-primary', user.organization.primaryColor);
      document.documentElement.style.setProperty('--brand-secondary', user.organization.secondaryColor);
      document.documentElement.style.setProperty('--brand-sidebar', user.organization.sidebarColor || '');
      document.documentElement.style.setProperty('--brand-accent', user.organization.accentColor || '');
      document.documentElement.style.setProperty('--brand-bg', user.organization.backgroundColor || '');
      document.documentElement.style.setProperty('--brand-border', user.organization.borderColor || '');
      
      // Favicon
      if (user.organization.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = user.organization.faviconUrl;
      }

      // Title
      document.title = user.organization.name || 'JusCore AI';
    } else {
      // Default Branding
      document.documentElement.style.setProperty('--brand-primary', '#D4AF37'); // Default Gold
      document.documentElement.style.setProperty('--brand-secondary', '#0f172a'); // Default Dark
      document.documentElement.style.setProperty('--brand-sidebar', '');
      document.documentElement.style.setProperty('--brand-accent', '');
      document.documentElement.style.setProperty('--brand-bg', '');
      document.documentElement.style.setProperty('--brand-border', '');
      
      let link = document.querySelector("link[rel~='icon']");
      if (link) link.href = '/favicon.ico'; // Default favicon
      
      document.title = 'JusCore AI';
    }
  }, [user]);

  // Use a ref so the listener always has the latest navigate/loginWithToken
  // without needing to re-register on every render (fixes stale closure bug)
  const handleGoogleMessageRef = useRef(null);

  useEffect(() => {
    handleGoogleMessageRef.current = (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log("📥 [AuthContext] Mensagem Google recebida:", event.data);
        const { token, user: userData } = event.data;
        // Save token + user immediately
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser({ ...userData, token });
        // Navigate to dashboard
        navigate('/dashboard');
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        console.error("❌ [AuthContext] Erro na autenticação Google:", event.data.error);
        alert(event.data.error || 'Falha na autenticação com Google.');
      }
    };
  }); // No dependency array — always keeps latest navigate reference

  useEffect(() => {
    // 1. Initial Auth Check
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }

    // 2. Stable listener that delegates to the ref (never goes stale)
    const stableListener = (event) => {
      if (handleGoogleMessageRef.current) {
        handleGoogleMessageRef.current(event);
      }
    };

    // 3. Atualizar usuário discretamente ao focar na janela (após pagamento PIX, por exemplo)
    const handleWindowFocus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get('/api/auth/me')
          .then(res => {
            // Atualizando silenciosamente para refletir novo plano/cargos sem piscar a tela
            setUser({ ...res.data.user, token });
          })
          .catch(() => { /* ignora erro de background */ });
      }
    };

    window.addEventListener('message', stableListener);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('message', stableListener);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []); // Only registers once — but handler is always fresh via ref

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      const token = localStorage.getItem('token');
      setUser({ ...res.data.user, token });
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, senha: password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({ ...userData, token });
    return res.data;
  };

  const register = async (data) => {
    const res = await axios.post('/api/auth/register', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const loginWithToken = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({ ...userData, token });
  };

  const tokenValue = localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, token: tokenValue, login, register, logout, loginWithToken, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth };
