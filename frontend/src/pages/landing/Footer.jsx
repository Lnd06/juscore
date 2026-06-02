/* eslint-disable no-unused-vars */
import React from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from './Animations';
import { Logo } from '../../components/ui/Logo';

const Footer = ({ onCtaClick, onSupportClick }) => {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 flex items-center justify-center">
                 <Logo className="w-full h-full drop-shadow-md" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">JusCore AI</span>
            </div>
            <p className="text-gray-400 max-w-sm leading-relaxed mb-8">
              Transformando a advocacia e os estudos de Direito através da inteligência artificial de última geração. Produtividade, aprendizado e precisão jurídica.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-accent uppercase tracking-widest text-xs">Produto</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Calculadoras</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-accent uppercase tracking-widest text-xs">Empresa</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li><Link to="/terms" className="hover:text-white transition-colors">Termos de Uso e Privacidade</Link></li>
              <li>
                <button 
                  onClick={(e) => { e.preventDefault(); onSupportClick?.(); }}
                  className="hover:text-white transition-colors text-left font-medium"
                >
                  Suporte
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500 font-medium">
          <p>© 2026 JusCore AI. Todos os direitos reservados.</p>
          <div className="flex gap-8">
             <a href="#" className="hover:text-white">LinkedIn</a>
             <a href="#" className="hover:text-white">Instagram</a>
             <a href="#" className="hover:text-white">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
