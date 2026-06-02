import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui'; // Import Logo component
import { X, Mail, Phone, Instagram, MessageCircle } from 'lucide-react';
import axios from 'axios';

// Modular Components
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import LeadMagnet from './landing/LeadMagnet';
import Features from './landing/Features';
import Pricing from './landing/Pricing';
import Footer from './landing/Footer';

const Landing = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  const [supportLinks, setSupportLinks] = useState({
    contact_email: 'contato@juscore.ai',
    contact_whatsapp: '5511999999999',
    contact_instagram: 'https://instagram.com/juscore',
    contact_github: 'https://github.com/juscore'
  });

  // Scroll logic
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch support links on load/open
  useEffect(() => {
    if (isSupportOpen) {
      const fetchLinks = async () => {
        try {
          const res = await axios.get('/api/public/contact');
          if (res.data) setSupportLinks(prev => ({ ...prev, ...res.data }));
        } catch (error) {
          console.error('Failed to fetch contact links', error);
        }
      };
      fetchLinks();
    }
  }, [isSupportOpen]);

  // Mouse tracking for Spotlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const onCtaClick = () => navigate('/register');

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-sans overflow-x-hidden relative"
    >
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 h-0.5 bg-gradient-to-r from-accent via-accent-light to-accent z-[100] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {/* Main Sections */}
      <Navbar>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <Logo className="w-full h-full drop-shadow-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-accent to-[#F3E5AB] bg-clip-text text-transparent">
                JusCore AI v1.7
              </span>
            </Link>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors duration-200">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors duration-200">Pricing</a>
            </div>
            {/* CTA Button */}
            <div className="hidden md:block">
              <button
                onClick={onCtaClick}
                className="px-6 py-2 bg-accent text-white font-semibold rounded-full shadow-lg hover:bg-accent-dark transition-all duration-300 transform hover:-translate-y-1"
              >
                Get Started
              </button>
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-950 shadow-lg py-4">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Features</a>
              <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Pricing</a>
              <button
                onClick={onCtaClick}
                className="w-full mt-4 px-4 py-2 bg-accent text-white font-semibold rounded-full shadow-lg hover:bg-accent-dark transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </Navbar>
      
      <Hero onCtaClick={onCtaClick} />
      <LeadMagnet />
      <Features />
      <Pricing onCtaClick={onCtaClick} />
      <Footer onCtaClick={onCtaClick} onSupportClick={() => setIsSupportOpen(true)} />

      {/* Support Popup Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay background */}
          <div 
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsSupportOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white/80 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-100/50 dark:border-gray-800/50 rounded-[32px] p-8 md:p-10 shadow-2xl text-center overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Background blur effects inside modal */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse duration-1000" />

            {/* Close Button */}
            <button
              onClick={() => setIsSupportOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="relative z-10 mb-8">
              <div className="w-16 h-16 bg-accent/15 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
                <MessageCircle className="w-8 h-8 text-accent animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">
                Como podemos ajudar?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                Selecione um dos nossos canais oficiais de suporte para falar diretamente com a nossa equipe jurídica e técnica.
              </p>
            </div>

            {/* Links list */}
            <div className="relative z-10 space-y-4">
              {/* WhatsApp */}
              <a
                href={supportLinks.contact_whatsapp ? `https://wa.me/${supportLinks.contact_whatsapp.replace(/\D/g, '')}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-5 p-4 rounded-2xl border border-green-500/10 bg-green-500/5 hover:bg-green-500/10 dark:bg-green-500/5 dark:hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-105 transition-transform duration-200">
                  <Phone className="w-5 h-5 fill-current" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-gray-950 dark:text-white group-hover:text-green-500 transition-colors">WhatsApp</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Atendimento rápido em tempo real</div>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${supportLinks.contact_email}`}
                className="group flex items-center gap-5 p-4 rounded-2xl border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-gray-950 dark:text-white group-hover:text-blue-500 transition-colors">E-mail Oficial</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{supportLinks.contact_email}</div>
                </div>
              </a>

              {/* Instagram */}
              <a
                href={supportLinks.contact_instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-5 p-4 rounded-2xl border border-pink-500/10 bg-pink-500/5 hover:bg-pink-500/10 dark:bg-pink-500/5 dark:hover:bg-pink-500/10 hover:border-pink-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-violet-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform duration-200">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-gray-950 dark:text-white group-hover:text-pink-500 transition-colors">Instagram</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Novidades, dicas e conteúdos</div>
                </div>
              </a>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500 font-medium relative z-10">
              Nosso horário de atendimento é de Seg. a Sex. das 9h às 18h.
            </div>
          </div>
        </div>
      )}

      {/* Gold Spotlight Overlay - Moved to bottom to ensure it overlays sections, but below Navbar */}
      <div 
        className="pointer-events-none fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.15), transparent 45%)`
        }}
      />
    </div>
  );
};

export default Landing;
