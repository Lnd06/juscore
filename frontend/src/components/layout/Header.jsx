/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, Crown, Bug, LogOut, HelpCircle, Info, ChevronDown, GraduationCap, BookOpen, Library, Briefcase, Shield, Building2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '../../pages/dashboard/FeedbackModal';

const Header = ({ onMenuClick, pageTitle = 'Dashboard' }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const getPlanIcon = (plan, sizeClass = "w-4 h-4") => {
    switch (plan) {
      case 'student_basic':
        return <GraduationCap className={sizeClass} />;
      case 'student_pro':
        return <BookOpen className={sizeClass} />;
      case 'student_master':
        return <Library className={sizeClass} />;
      case 'lawyer_starter':
        return <Briefcase className={sizeClass} />;
      case 'lawyer_growth':
        return <Shield className={sizeClass} />;
      case 'office_master':
      case 'master':
      case 'admin':
        return <Crown className={sizeClass} />;
      case 'enterprise':
        return <Building2 className={sizeClass} />;
      case 'free':
      case 'comum':
      default:
        return <Zap className={sizeClass} />;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const contactUrl = user?.organization?.supportWhatsapp 
    ? `https://wa.me/${user.organization.supportWhatsapp}` 
    : (user?.organization?.supportEmail ? `mailto:${user.organization.supportEmail}` : '/dashboard/contact');
  const isExternalContact = !!(user?.organization?.supportWhatsapp || user?.organization?.supportEmail);

  const handleContactClick = () => {
    setIsDropdownOpen(false);
    if (isExternalContact) {
      window.open(contactUrl, '_blank');
    } else {
      navigate(contactUrl);
    }
  };

  const handleAboutClick = () => {
    setIsDropdownOpen(false);
    navigate('/dashboard/about');
  };

  return (
    <header className="h-16 px-6 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden text-gray-500"
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
          {getPlanIcon(user?.subscriptionPlan, "w-4 h-4")}
          <span className="text-xs font-bold hidden sm:block tracking-wide">
            {planNames[user?.subscriptionPlan] || "Grátis"}
          </span>
        </button>

        {/* Clickable Profile Section with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-white/5 ml-2 hover:opacity-90 active:scale-[0.98] transition-all outline-none text-left"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                {user?.nome || user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[150px]">
                {user?.email || 'Membro'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-900 shadow-sm bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {user?.foto ? (
                 <img 
                   src={user.foto} 
                   alt={user.nome || user.name} 
                   className="w-full h-full object-cover"
                 />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-900">
                   <User className="w-5 h-5" />
                 </div>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white dark:bg-[#0E1321] border border-gray-100 dark:border-white/5 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right">
              {/* User details summary inside the dropdown */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {user?.nome || user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {user?.email || 'Membro'}
                </p>
                 <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold">
                  {getPlanIcon(user?.subscriptionPlan, "w-3 h-3")}
                  <span>{planNames[user?.subscriptionPlan] || "Grátis"}</span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/dashboard/profile');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                >
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Meu Perfil</span>
                </button>

                <button
                  onClick={handleContactClick}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Fale Conosco</span>
                </button>

                <button
                  onClick={handleAboutClick}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                >
                  <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Sobre Nós</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsFeedbackOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors text-left"
                >
                  <Bug className="w-4 h-4" />
                  <span>Reportar Bug / Ideia</span>
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5 my-1" />

              <div className="p-1.5">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-450 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </header>
  );
};

export default Header;
