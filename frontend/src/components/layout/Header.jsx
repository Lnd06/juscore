/* eslint-disable no-unused-vars */
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick, pageTitle = 'Dashboard' }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const planNames = {
    free: "Grátis",
    student_basic: "Estudante Basic",
    student_pro: "Estudante Pro",
    student_master: "Estudante Pesquisador",
    lawyer_starter: "Advogado Starter",
    lawyer_growth: "Advogado Growth",
    office_master: "Escritório Master",
    enterprise: "Enterprise",
    comum: "Grátis",
    especial: "Premium",
    admin: "Admin",
    master: "Master"
  };

  return (
    <header className="h-16 px-6 bg-white/80 dark:bg-juri-950/80 backdrop-blur-md border-b border-gray-200 dark:border-juri-800 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden text-gray-500"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-gray-800 dark:text-white hidden sm:block">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 hover:bg-accent/20 text-accent hover:text-accent-dark transition-all border border-accent/20"
          title="Ver Planos e Assinaturas"
        >
          <Crown className="w-4 h-4" />
          <span className="text-xs font-bold hidden sm:block tracking-wide">
            {planNames[user?.subscriptionPlan] || "Grátis"}
          </span>
        </button>



        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.nome || 'Usuário'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.email || 'Membro'}</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-900 shadow-sm bg-gray-100 dark:bg-gray-800">
            {user?.foto ? (
               <img 
                 src={user.foto} 
                 alt={user.nome} 
                 className="w-full h-full object-cover"
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-900">
                 <User className="w-5 h-5" />
               </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
