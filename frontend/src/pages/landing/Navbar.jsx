import React, { useState, useEffect } from 'react';
import { Button, Logo } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Funcionalidades', href: '#features' },
    { name: 'Calculadoras', href: '#calculator' },
    { name: 'Preços', href: '#pricing' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 ${
      isScrolled ? 'py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800' : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform">
             <Logo className="w-full h-full drop-shadow-md" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">JusCore AI</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href}
              className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent transition-colors uppercase tracking-widest"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-gray-700 dark:text-gray-300 px-6 h-12 hover:bg-white/5"
          >
            Entrar
          </Button>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-accent to-yellow-500 hover:from-accent-dark hover:to-yellow-600 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-300 text-sm"
          >
            Começar Grátis
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-gray-900 dark:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button 
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full h-14 rounded-2xl"
            >
              Entrar
            </Button>
            <Button 
              onClick={() => navigate('/register')}
              className="w-full h-14 bg-accent text-white rounded-2xl"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
