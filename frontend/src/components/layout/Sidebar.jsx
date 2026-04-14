import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  FileText,
  Settings,
  Home,
  LogOut,
  User,
  ShieldAlert,
  Plus,
  HelpCircle,
  Calculator,
  LayoutDashboard,
  MessageSquarePlus,
  X,
  ChevronLeft,
  Star,
  Book,
  Users,
  Smartphone,
  BarChart3,
  Briefcase,
  CalendarDays,
  DollarSign,
  Scale,
  GraduationCap,
  Bug,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui';
import FeedbackModal from '../../pages/dashboard/FeedbackModal';

const Sidebar = ({ isOpen, setIsOpen, mobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const orgLogo = user?.organization?.logoUrl || '/logo.png';
  
  const handleNewChat = () => {
    navigate('/dashboard/chat', { state: { reset: Date.now() } });
  };
  
  const plan = user?.subscriptionPlan || 'free';
  const role = user?.cargo || '';
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  
  // Gestão de equipe apenas para Advogados ou Empresas com plano adequado
  const isProfessional = role === 'Advogado(a)' || role === 'Empresa';
  
  // Níveis de Acesso Jurídico (Hierárquico)
  const hasStarterAccess = isPrivileged || (isProfessional && ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(plan));
  const hasGrowthAccess  = isPrivileged || (isProfessional && ['lawyer_growth', 'office_master', 'enterprise'].includes(plan));
  const hasMasterAccess  = isPrivileged || (isProfessional && ['office_master', 'enterprise'].includes(plan));
  const hasStudentProAccess = isPrivileged || plan === 'student_pro';

  // --- MENU ESTRUTURA ---
  const mainNav = [
    { icon: Home, label: 'Início', href: '/dashboard' },
    { icon: MessageSquare, label: 'Chat AI', href: '/dashboard/chat' },
  ];

  const erpNav = [];
  
  if (hasGrowthAccess) {
    erpNav.push({ icon: LayoutDashboard, label: 'Dashboard ERP', href: '/dashboard/erp' });
  }

  if (hasStarterAccess) {
    erpNav.push({ icon: Users, label: 'Clientes CRM', href: '/dashboard/clients' });
    erpNav.push({ icon: Briefcase, label: 'Processos', href: '/dashboard/processes' });
  }

  if (hasGrowthAccess) {
    erpNav.push({ icon: CalendarDays, label: 'Agenda Prazos', href: '/dashboard/events' });
    erpNav.push({ icon: FileText, label: 'Gerador Docs', href: '/dashboard/document-generator' });
    erpNav.push({ icon: FileText, label: 'Assinaturas & Aceites', href: '/dashboard/signatures' });
  }

  if (hasMasterAccess) {
    erpNav.push({ icon: DollarSign, label: 'Financeiro', href: '/dashboard/finance' });
    erpNav.push({ icon: BarChart3, label: 'BI Jurídico', href: '/dashboard/bi' });
    erpNav.push({ icon: Users, label: 'Gestão de Equipe', href: '/dashboard/team' });
  }
  
  // Keep legacy fees route for free users if it was there before, otherwise strict master access.
  if(!hasMasterAccess && isPrivileged){ // fallback for tests
     erpNav.push({ icon: DollarSign, label: 'Taxas (Legacy)', href: '/dashboard/fees' });
  }

  const toolsNav = [
    { icon: Calculator, label: 'Calculadora', href: '/dashboard/calculator' }
  ];

  if (hasStarterAccess && plan !== 'student_pro') {
    toolsNav.push({ icon: GraduationCap, label: 'Área Acadêmica', href: '/dashboard/academic-hub' });
  }

  if (plan === 'student_pro' || isPrivileged) {
    toolsNav.push(
      { icon: Scale, label: 'Simulador OAB', href: '/dashboard/oab-simulator' },
      { icon: GraduationCap, label: 'Assistente TCC', href: '/dashboard/tcc-assistant' }
    );
  }

  const bottomNav = [];
  if (plan === 'free') bottomNav.push({ icon: Star, label: 'Planos Premium', href: '/dashboard/subscription' });
  bottomNav.push(
    { icon: User, label: 'Meu Perfil', href: '/dashboard/profile' },
    { 
      icon: HelpCircle, 
      label: 'Fale Conosco', 
      href: user?.organization?.supportWhatsapp 
        ? `https://wa.me/${user.organization.supportWhatsapp}` 
        : (user?.organization?.supportEmail ? `mailto:${user.organization.supportEmail}` : '/dashboard/contact'),
      external: !!(user?.organization?.supportWhatsapp || user?.organization?.supportEmail)
    }
  );


  const SidebarContent = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    
    // Auto-expand ERP group if we are inside an ERP route, else read from localStorage
    const isErpActive = erpNav.some(item => location.pathname.startsWith(item.href));
    const [erpOpen, setErpOpen] = useState(() => {
      if (isErpActive) return true;
      const savedState = localStorage.getItem('juscore_erp_sidebar_open');
      if (savedState !== null) return JSON.parse(savedState);
      return isOpen;
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
      localStorage.setItem('juscore_erp_sidebar_open', JSON.stringify(erpOpen));
    }, [erpOpen]);

    const handleMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const renderNavItems = (items) => {
      return items.map((item) => (
        <NavLink
          key={item.href}
          to={item.external ? '#' : item.href}
          onClick={(e) => {
            if (item.external) {
              e.preventDefault();
              window.open(item.href, '_blank');
            } else if (mobile) {
               setIsOpen(false);
            }
          }}
          end={item.href === '/dashboard' || item.href === '/dashboard/erp'}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-visible border-l-4",
            isActive 
              ? "bg-gradient-to-r from-accent/20 to-transparent bg-transparent border-accent text-gray-900 dark:text-white font-bold" 
              : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-accent/20 hover:to-transparent hover:text-accent dark:hover:text-accent hover:border-accent shadow-none hover:shadow-[inset_4px_0_0_0_#D4AF37]"
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>}
              <item.icon className={cn("w-5 h-5 min-w-[1.25rem] z-10", isOpen ? "mr-0" : "mx-auto", isActive ? "text-accent" : "")} />
              <span className={cn("whitespace-nowrap transition-all duration-200 z-10", !isOpen && !mobile && "opacity-0 w-0 overflow-hidden")}>
                {item.label}
              </span>
              {!isOpen && !mobile && (
                <div className="absolute left-14 z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-max shadow-xl border border-gray-700">
                  {item.label}
                </div>
              )}
            </>
          )}
        </NavLink>
      ));
    };

    return (
      <div 
        onMouseMove={handleMouseMove}
        className="flex flex-col h-full bg-white dark:bg-juri-950 bg-brand-sidebar border-r border-gray-200 dark:border-gray-800 transition-all duration-300 relative overflow-hidden"
      >
        <div 
          className="pointer-events-none absolute -inset-px transition duration-300 opacity-100 z-0"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.05), transparent 40%)`
          }}
        />
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 relative z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-[2.5rem] flex items-center justify-center">
              <Logo src={user?.organization?.logoUrl} bg="none" className="w-full h-full drop-shadow-lg" />
            </div>
            <div className={cn("overflow-hidden transition-all duration-300", isOpen || mobile ? "w-auto opacity-100" : "w-0 opacity-0")}>
              <span className="font-bold text-lg whitespace-nowrap block ml-2">
                {user?.organization?.name || "JusCore AI v1.7"}
              </span>
            </div>
          </div>
        {!mobile && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !isOpen && "rotate-180")} />
          </button>
        )}
        {mobile && (
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* Main Nav */}
        <nav className="space-y-1">
          {renderNavItems(mainNav)}
        </nav>

        {/* ERP Jurídico Section */}
        {erpNav.length > 0 && (
          <div className="space-y-1">
             <div 
                className={cn("flex items-center justify-between px-3 mb-2 cursor-pointer group", !isOpen && !mobile && "justify-center")}
                onClick={() => { if(isOpen || mobile) setErpOpen(!erpOpen); else setIsOpen(true); }}
             >
                <h3 className={cn("text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-accent transition-colors", !isOpen && !mobile && "opacity-0 w-0 h-0 overflow-hidden")}>
                  ERP Jurídico
                </h3>
                 {(!isOpen && !mobile) ? (
                    <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-accent" />
                 ) : (
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 group-hover:text-accent transition-transform", erpOpen ? "rotate-180" : "")} />
                 )}
            </div>
            
            <div className={cn("space-y-1 overflow-hidden transition-all duration-300", erpOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
              {renderNavItems(erpNav)}
            </div>
          </div>
        )}

        {/* Ferramentas Section */}
        {toolsNav.length > 0 && (
          <div className="space-y-1">
            <h3 className={cn("text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2", !isOpen && !mobile && "opacity-0 h-0 overflow-hidden")}>
              Ferramentas
            </h3>
            {renderNavItems(toolsNav)}
          </div>
        )}

        {/* Navigation Inferior (Perfil, etc) */}
        <div className="space-y-1">
           {renderNavItems(bottomNav)}
        </div>

        {/* History Section */}
        <div className={cn("pt-4 border-t border-gray-100 dark:border-gray-700", !isOpen && !mobile && "hidden")}>
          <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Histórico
          </h3>
          <button 
            onClick={handleNewChat}
            className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Nova Conversa"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
          <div className="space-y-1">
            {user?.ultimasConversas?.length > 0 ? (
              user.ultimasConversas.map((chat) => (
                <NavLink
                  key={chat.id}
                  to={`/dashboard/chat?sessionId=${chat.sessionId}`}
                  className={({ isActive }) => cn(
                    "block px-3 py-2 rounded-lg text-sm transition-all truncate mb-2 border",
                    isActive 
                      ? "bg-gray-100 dark:bg-juri-800 text-gray-900 dark:text-white font-bold border-gray-300 dark:border-juri-600 shadow-md" 
                      : "bg-gray-50 dark:bg-juri-900/60 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-juri-800/80 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-juri-700"
                  )}
                  title={chat.titulo || 'Nova Conversa'}
                >
                  {chat.titulo || 'Nova Conversa'}
                </NavLink>
              ))
            ) : (
              <p className="text-xs text-gray-400 px-3 italic">Nenhuma conversa recente</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
        {(isOpen || mobile) && user?.organization?.footerText && (
          <p className="text-[10px] text-gray-400 px-3 text-center truncate italic">
            {user.organization.footerText}
          </p>
        )}
        <button 
          onClick={() => setIsFeedbackOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
        >
          <Bug className={cn("w-5 h-5 min-w-[1.25rem] z-10", !isOpen && !mobile ? "mx-auto" : "")} />
          <span className={cn("whitespace-nowrap transition-all duration-200 z-10 font-medium", !isOpen && !mobile && "opacity-0 w-0 overflow-hidden")}>
            Reportar Bug / Ideia
          </span>
          {!isOpen && !mobile && (
            <div className="absolute left-14 z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-max shadow-xl border border-gray-700">
              Reportar Bug / Ideia
            </div>
          )}
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
        >
          <LogOut className={cn("w-5 h-5 min-w-[1.25rem]", !isOpen && "mx-auto")} />
          <span className={cn("whitespace-nowrap transition-all duration-200", !isOpen && !mobile && "opacity-0 w-0 overflow-hidden")}>
            Sair
          </span>
        </button>
      </div>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      </div>
    );
  };

  if (mobile) {
    return (
      <>
        <div 
          className={cn(
            "fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsOpen(false)}
        />
        <div className={cn(
          "fixed inset-y-0 left-0 w-64 z-50 transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent />
        </div>
      </>
    );
  }

  return (
    <div className={cn(
      "hidden lg:block h-screen sticky top-0 transition-all duration-300 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-juri-950 bg-brand-sidebar",
      isOpen ? "w-64" : "w-20"
    )}>
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
