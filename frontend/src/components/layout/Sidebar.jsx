import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Home,
  User,
  Plus,
  Calculator,
  LayoutDashboard,
  X,
  ChevronLeft,
  Star,
  Users,
  BarChart3,
  Briefcase,
  CalendarDays,
  DollarSign,
  Scale,
  GraduationCap,
  ChevronDown,
  Sparkles,
  PenTool
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui';

const CubeIcon = ({ className }) => (
  <svg 
    viewBox="0 0 108 125" 
    fill="none" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M2.51465 32.7531L53.5146 64.2531M105.015 32.7531L105.515 90.2531L53.5146 122.253L1.51465 90.7531L2.51465 32.7531L54.0146 1.75305L105.015 32.7531ZM53.5146 64.2531V122.253M53.5146 64.2531L105.015 32.7531" 
      stroke="currentColor" 
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Sidebar = ({ isOpen, setIsOpen, mobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleNewChat = () => {
    navigate('/dashboard/chat', { state: { reset: Date.now() } });
    if (mobile) setIsOpen(false);
  };
  
  const plan = user?.subscriptionPlan || 'free';

  // Mapeamento de slug → nome exibido
  const PLAN_LABELS = {
    free: 'Plano Grátis',
    student_basic: 'Estudante Basic',
    student_pro: 'Estudante Pro',
    student_master: 'Estudante Pesquisador',
    lawyer_starter: 'Advogado Starter',
    lawyer_growth: 'Advogado Growth',
    office_master: 'Escritório Master',
    enterprise: 'Enterprise',
  };
  const planLabel = PLAN_LABELS[plan] || plan;

  const role = user?.cargo || '';
  const isOwner = !user?.parentUserId;
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  
  // Gestão de equipe apenas para Advogados ou Empresas com plano adequado (para donos)
  const isProfessional = role === 'Advogado(a)' || role === 'Empresa';
  
  // Níveis de Acesso Jurídico (Hierárquico) para Proprietários (Donos de plano)
  const ownerHasStarter = isProfessional && ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(plan);
  const ownerHasGrowth  = isProfessional && ['lawyer_growth', 'office_master', 'enterprise'].includes(plan);
  const ownerHasMaster  = isProfessional && ['office_master', 'enterprise'].includes(plan);

  // Níveis de Acesso Dinâmicos para Membros ou Proprietários
  let hasStarterAccess = isPrivileged;
  let hasGrowthAccess  = isPrivileged;
  let hasMasterAccess  = isPrivileged;

  if (isOwner) {
    hasStarterAccess = hasStarterAccess || ownerHasStarter;
    hasGrowthAccess  = hasGrowthAccess  || ownerHasGrowth;
    hasMasterAccess  = hasMasterAccess  || ownerHasMaster;
  } else {
    // Se for sub-conta de Equipe:
    // tipo === 'especial' (Advogado) ganha acesso Starter e Growth
    // tipo === 'admin' (Sócio) ganha acesso Starter, Growth e Master
    const isEspecialMember = user?.tipo === 'especial';
    const isAdminMember = user?.tipo === 'admin';
    
    hasStarterAccess = isEspecialMember || isAdminMember;
    hasGrowthAccess  = isEspecialMember || isAdminMember;
    hasMasterAccess  = isAdminMember;
  }

  // --- MENU ESTRUTURA ---

  // Principal
  const mainNav = [
    { icon: Home, label: 'Início', href: '/dashboard' },
    { icon: CubeIcon, label: 'Chat AI', href: '/dashboard/chat' },
  ];

  // Ferramentas (sempre visíveis para todos)
  const toolsNav = [
    { icon: Calculator, label: 'Calculadora', href: '/dashboard/calculator' }
  ];

  if (hasStarterAccess && !['student_pro', 'student_master'].includes(plan)) {
    toolsNav.push({ icon: GraduationCap, label: 'Área Acadêmica', href: '/dashboard/academic-hub' });
  }

  if (['student_pro', 'student_master'].includes(plan) || isPrivileged) {
    toolsNav.push(
      { icon: CubeIcon, label: 'Simulador OAB', href: '/dashboard/oab-simulator' },
      { icon: CubeIcon, label: 'Assistente TCC', href: '/dashboard/tcc-assistant' }
    );
    // Para estudantes Pro e Pesquisador, adicionamos também o Gerador de Documentos
    if (['student_pro', 'student_master'].includes(plan)) {
      toolsNav.push({ icon: FileText, label: 'Gerador Docs', href: '/dashboard/document-generator' });
    }
  }

  // ERP Jurídico (apenas para quem tem acesso profissional)
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
    erpNav.push({ icon: FileText, label: 'Assinaturas', href: '/dashboard/signatures' });
  }

  if (hasMasterAccess) {
    erpNav.push({ icon: DollarSign, label: 'Financeiro', href: '/dashboard/finance' });
    if (!user?.parentUserId) {
      erpNav.push({ icon: BarChart3, label: 'BI Jurídico', href: '/dashboard/bi' });
    }
    erpNav.push({ icon: Users, label: 'Gestão de Equipe', href: '/dashboard/team' });
  }



  const SidebarContent = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    
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
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-[13px] font-medium",
            isActive 
              ? "text-accent shadow-sm shadow-accent/5 font-semibold" 
              : "text-gray-500 dark:text-gray-400 hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-accent/10 border-l-2 border-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-[18px] h-[18px] min-w-[18px] z-10", isOpen ? "mr-0" : "mx-auto", isActive ? "text-accent" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-950 dark:group-hover:text-white")} />
              <span className={cn("whitespace-nowrap transition-all duration-150 z-10", !isOpen && !mobile && "opacity-0 w-0 overflow-hidden")}>
                {item.label}
              </span>
              {!isOpen && !mobile && (
                <div className="absolute left-14 z-50 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-max shadow-xl border border-gray-700">
                  {item.label}
                </div>
              )}
            </>
          )}
        </NavLink>
      ));
    };

    // Get user initials for avatar
    const getUserInitials = () => {
      const name = user?.name || user?.email || '?';
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };

    const SectionLabel = ({ children }) => (
      <h3 className={cn(
        "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] px-3 mb-1.5",
        !isOpen && !mobile && "opacity-0 h-0 overflow-hidden"
      )}>
        {children}
      </h3>
    );

    return (
      <div 
        onMouseMove={handleMouseMove}
        className="flex flex-col h-full bg-white dark:bg-[#0B0F19] relative overflow-hidden"
      >
        <div 
          className="pointer-events-none absolute -inset-px transition duration-300 opacity-100 z-0"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.03), transparent 40%)`
          }}
        />
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-[2.5rem] flex items-center justify-center">
              <Logo src={user?.organization?.logoUrl} bg="none" className="w-full h-full" />
            </div>
            <div className={cn("overflow-hidden transition-all duration-300", isOpen || mobile ? "w-auto opacity-100" : "w-0 opacity-0")}>
              <span className="font-bold text-lg whitespace-nowrap block ml-1 tracking-tight">
                {user?.organization?.name || "JusCore AI"}
              </span>
            </div>
          </div>
          {!mobile && (
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", !isOpen && "rotate-180")} />
            </button>
          )}
          {mobile && (
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* New Conversation Button */}
        <div className="px-3 pt-4 pb-2 relative z-10">
          <button
            onClick={handleNewChat}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-accent to-yellow-500 hover:from-accent-dark hover:to-yellow-600 text-white font-bold transition-all duration-300 shadow-md shadow-accent/15 hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:translate-y-0",
              isOpen || mobile ? "px-4 py-3 justify-start text-sm" : "p-3 justify-center"
            )}
          >
            <Sparkles className="w-[18px] h-[18px] min-w-[18px]" />
            <span className={cn("whitespace-nowrap transition-all duration-150", !isOpen && !mobile && "opacity-0 w-0 overflow-hidden")}>
              Nova Conversa
            </span>
            {!isOpen && !mobile && (
              <div className="absolute left-14 z-50 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-max shadow-xl border border-gray-700">
                Nova Conversa
              </div>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 py-2 px-3 space-y-5 overflow-y-auto custom-scrollbar relative z-10">
          
          {/* Principal */}
          <nav className="space-y-0.5">
            <SectionLabel>Principal</SectionLabel>
            {renderNavItems(mainNav)}
          </nav>

          {/* Ferramentas */}
          {toolsNav.length > 0 && (
            <nav className="space-y-0.5">
              <SectionLabel>Ferramentas</SectionLabel>
              {renderNavItems(toolsNav)}
            </nav>
          )}

          {/* ERP Jurídico Section (colapsável) */}
          {erpNav.length > 0 && (
            <div className="space-y-0.5">
               <div 
                  className={cn("flex items-center justify-between px-3 mb-1.5 cursor-pointer group rounded-lg py-1 hover:bg-white/5 transition-colors", !isOpen && !mobile && "justify-center")}
                  onClick={() => { if(isOpen || mobile) setErpOpen(!erpOpen); else setIsOpen(true); }}
               >
                  <h3 className={cn("text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] group-hover:text-accent transition-colors", !isOpen && !mobile && "opacity-0 w-0 h-0 overflow-hidden")}>
                    ERP Jurídico
                  </h3>
                   {(!isOpen && !mobile) ? (
                      <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-accent transition-colors" />
                   ) : (
                      <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 group-hover:text-accent transition-transform duration-300", erpOpen ? "rotate-180" : "")} />
                   )}
              </div>
              
              <AnimatePresence initial={false}>
                {erpOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {renderNavItems(erpNav)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Upgrade Banner (free users only) */}
          {plan === 'free' && (isOpen || mobile) && (
            <div className="mx-0">
              <NavLink
                to="/dashboard/subscription"
                onClick={() => mobile && setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-accent/10 to-yellow-500/10 border border-accent/20 text-accent hover:border-accent/40 transition-all duration-200 group"
              >
                <Star className="w-[18px] h-[18px] min-w-[18px] text-accent group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold">Planos Premium</div>
                  <div className="text-[10px] text-accent/60 font-medium">Desbloqueie tudo</div>
                </div>
              </NavLink>
            </div>
          )}
          {plan === 'free' && !isOpen && !mobile && (
            <NavLink
              to="/dashboard/subscription"
              className="flex justify-center px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-colors group relative"
            >
              <Star className="w-[18px] h-[18px] text-accent" />
              <div className="absolute left-14 z-50 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-max shadow-xl border border-gray-700">
                Planos Premium
              </div>
            </NavLink>
          )}



          {/* History Section */}
          <div className={cn("pt-3 border-t border-gray-100 dark:border-white/5", !isOpen && !mobile && "hidden")}>
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
                Histórico
              </h3>
              <button 
                onClick={handleNewChat}
                className="text-gray-400 hover:text-accent transition-colors p-0.5 rounded hover:bg-accent/10"
                title="Nova Conversa"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {user?.ultimasConversas?.length > 0 ? (
                user.ultimasConversas.map((chat) => (
                  <NavLink
                    key={chat.sessionId}
                    to={`/dashboard/chat?sessionId=${chat.sessionId}`}
                    onClick={() => mobile && setIsOpen(false)}
                    className={({ isActive }) => cn(
                      "block px-3 py-2 rounded-lg text-xs transition-all truncate border",
                      isActive 
                        ? "bg-accent/10 text-accent font-bold border-accent/20 shadow-sm" 
                        : "bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    )}
                    title={chat.titulo || 'Nova Conversa'}
                  >
                    {chat.titulo || 'Nova Conversa'}
                  </NavLink>
                ))
              ) : (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 px-3 italic">Nenhuma conversa recente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (mobile) {
    return (
      <>
        <div 
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity lg:hidden",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsOpen(false)}
        />
        <div className={cn(
          "fixed inset-y-0 left-0 w-72 z-50 transition-transform duration-300 lg:hidden shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent />
        </div>
      </>
    );
  }

  return (
    <motion.div 
      animate={{ width: isOpen ? 256 : 80 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden lg:block h-screen sticky top-0 border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#0B0F19] overflow-hidden"
    >
      <SidebarContent />
    </motion.div>
  );
};

export default Sidebar;
