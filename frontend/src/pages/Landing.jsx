import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Mail, Phone, Instagram, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Modular Components
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import LeadMagnet from './landing/LeadMagnet';
import Features from './landing/Features';
import Pricing from './landing/Pricing';
import FAQ from './landing/FAQ';
import Footer from './landing/Footer';

const Landing = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  const [supportLinks, setSupportLinks] = useState({
    contact_email: 'contato@juscore.ai',
    contact_whatsapp: '5511999999999',
    contact_instagram: 'https://instagram.com/juscore',
    contact_tiktok: 'https://tiktok.com/@juscore',
    contact_linkedin: 'https://linkedin.com/company/juscore'
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

  // Fetch support links on page load
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await axios.get('/api/public/contact');
        if (res.data) setSupportLinks(prev => ({ ...prev, ...res.data }));
      } catch (error) {
        console.error('Failed to fetch contact links', error);
      }
    };
    fetchLinks();
  }, []);

  // Mouse tracking for Spotlight (Framer Motion smooth spring)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 60, damping: 20, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const location = useLocation();

  // Scroll to section based on URL path
  useEffect(() => {
    const path = location.pathname;
    let targetId = '';
    
    if (path === '/funcionalidades') {
      targetId = 'features';
    } else if (path === '/calculadoras') {
      targetId = 'calculator';
    } else if (path === '/precos') {
      targetId = 'pricing';
    }

    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else if (path === '/') {
      // If we are at the root, check for hash as fallback
      if (!location.hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [location.pathname]);

  const onCtaClick = () => navigate('/register');

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#080B15] text-white font-sans overflow-x-hidden relative"
    >
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 h-0.5 bg-gradient-to-r from-accent via-accent-light to-accent z-[100] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {/* Main Sections */}
      <Navbar />
      
      <Hero onCtaClick={onCtaClick} />
      <LeadMagnet />
      <Features />
      <Pricing onCtaClick={onCtaClick} />
      <FAQ onSupportClick={() => setIsSupportOpen(true)} />
      <Footer onCtaClick={onCtaClick} onSupportClick={() => setIsSupportOpen(true)} links={supportLinks} />

      {/* Support Popup Modal */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Overlay background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-950/80 backdrop-blur-md"
              onClick={() => setIsSupportOpen(false)}
            />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 0.98, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-white/80 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-100/50 dark:border-gray-800/50 rounded-[32px] p-8 md:p-10 shadow-2xl text-center overflow-hidden"
            >
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

                {/* TikTok */}
                <a
                  href={supportLinks.contact_tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 p-4 rounded-2xl border border-gray-500/10 bg-gray-500/5 hover:bg-gray-500/10 dark:bg-gray-500/5 dark:hover:bg-gray-500/10 hover:border-gray-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-200">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-gray-950 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white transition-colors">TikTok</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Assista aos nossos vídeos curtos</div>
                  </div>
                </a>
              </div>

              {/* Footer Disclaimer */}
              <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500 font-medium relative z-10">
                Nosso horário de atendimento é de Seg. a Sex. das 9h às 18h.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gold Spotlight Overlay - Moved to bottom to ensure it overlays sections, but below Navbar */}
      <motion.div 
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{
          background: useTransform(
            [smoothX, smoothY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(212, 175, 55, 0.12), transparent 45%)`
          )
        }}
      />
    </div>
  );
};

export default Landing;
