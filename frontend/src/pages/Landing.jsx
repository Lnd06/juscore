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
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setIsSupportOpen(false)}
            />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-lg bg-[#0B0F19] border border-white/[0.08] rounded-2xl p-8 md:p-10 shadow-2xl text-center overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsSupportOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="relative z-10 mb-8">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
                  <MessageCircle className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-display font-bold text-white tracking-tight">
                  Canais de Atendimento
                </h3>
                <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Selecione um dos nossos canais oficiais para falar diretamente com a nossa equipe jurídica e técnica.
                </p>
              </div>

              {/* Links list */}
              <div className="relative z-10 space-y-3">
                {/* WhatsApp */}
                <a
                  href={supportLinks.contact_whatsapp ? `https://wa.me/${supportLinks.contact_whatsapp.replace(/\D/g, '')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/30 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-accent/10 text-accent border border-accent/20 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white group-hover:text-accent transition-colors">WhatsApp</div>
                    <div className="text-xs text-gray-400">Atendimento rápido em tempo real</div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${supportLinks.contact_email}`}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/30 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-white/[0.04] text-gray-300 border border-white/[0.08] rounded-lg flex items-center justify-center shrink-0 group-hover:text-accent group-hover:border-accent/20 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white group-hover:text-accent transition-colors">E-mail Oficial</div>
                    <div className="text-xs text-gray-400">{supportLinks.contact_email}</div>
                  </div>
                </a>

                {/* Instagram */}
                <a
                  href={supportLinks.contact_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/30 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-white/[0.04] text-gray-300 border border-white/[0.08] rounded-lg flex items-center justify-center shrink-0 group-hover:text-accent group-hover:border-accent/20 transition-colors">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Instagram</div>
                    <div className="text-xs text-gray-400">Atualizações e conteúdos</div>
                  </div>
                </a>

                {/* TikTok */}
                <a
                  href={supportLinks.contact_tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/30 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-white/[0.04] text-gray-300 border border-white/[0.08] rounded-lg flex items-center justify-center shrink-0 group-hover:text-accent group-hover:border-accent/20 transition-colors">
                    <svg
                      className="w-4 h-4"
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
                    <div className="text-sm font-semibold text-white group-hover:text-accent transition-colors">TikTok</div>
                    <div className="text-xs text-gray-400">Demonstrações práticas</div>
                  </div>
                </a>
              </div>

              {/* Footer Disclaimer */}
              <div className="mt-8 pt-4 border-t border-white/[0.06] text-center text-xs text-gray-500 relative z-10">
                Horário de atendimento: Seg. a Sex., das 9h às 18h.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subtle Ambient Spotlight */}
      <motion.div 
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{
          background: useTransform(
            [smoothX, smoothY],
            ([x, y]) => `radial-gradient(500px circle at ${x}px ${y}px, rgba(212, 175, 55, 0.045), transparent 50%)`
          )
        }}
      />
    </div>
  );
};

export default Landing;
