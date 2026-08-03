import React, { useState, useEffect } from 'react';
import { Button, Logo } from '../../components/ui';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Funcionalidades', path: '/funcionalidades' },
    { name: 'Calculadoras', path: '/calculadoras' },
    { name: 'Preços', path: '/precos' },
    { name: 'Sobre Nós', path: '/sobre' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 ${
      isScrolled ? 'py-4 bg-[#080B15]/85 backdrop-blur-xl border-b border-white/[0.06]' : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform">
             <Logo className="w-full h-full drop-shadow-md" />
          </div>
          <span className="text-2xl font-display font-black tracking-tighter text-white">JusCore AI</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              to={link.path}
              className="text-xs font-display font-bold text-gray-400 hover:text-accent transition-colors uppercase tracking-widest animate-in fade-in"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="text-xs font-display font-bold text-gray-300 border-accent/40 hover:border-accent hover:bg-accent/5 px-6 h-12 rounded-full"
            >
              Entrar ({user.name || user.email?.split('@')[0]})
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-xs font-display font-bold text-gray-300 border-white/10 hover:border-accent/50 hover:bg-white/5 px-6 h-12 rounded-full"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-accent to-yellow-500 hover:from-accent-dark hover:to-yellow-600 text-white rounded-full px-8 h-12 font-display font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-300 text-xs uppercase tracking-wider"
              >
                Começar Grátis
              </Button>
            </>
          )}
        </div>

        {/* Mobile Actions & Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          {user ? (
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="text-xs font-display font-bold text-gray-350 border-accent/40 hover:border-accent hover:bg-accent/5 px-4 h-9 rounded-full"
            >
              Entrar
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-xs font-display font-bold text-gray-350 border-white/10 hover:border-accent/50 hover:bg-white/5 px-4 h-9 rounded-full"
            >
              Entrar
            </Button>
          )}
          <button 
            className="p-1 text-white hover:text-accent transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#080B15] border-b border-white/[0.06] p-6 flex flex-col gap-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-display font-bold text-gray-200 hover:text-accent transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
