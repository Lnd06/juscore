/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AnnouncementBanner from '../ui/AnnouncementBanner';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Map routes to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Início';
    if (path.includes('/chat')) return 'Chat';
    if (path.includes('/calculator')) return 'Calculadora';
    if (path.includes('/documents')) return 'Documentos';
    if (path.includes('/profile')) return 'Meu Perfil';
    if (path.includes('/contact')) return 'Fale Conosco';
    if (path.includes('/subscription')) return 'Assinatura';
    if (path.includes('/admin')) return 'Admin Panel';
    return 'Dashboard';
  };

  const isFullWidthPage = location.pathname.includes('/chat') || location.pathname.includes('/oab-simulator') || location.pathname.includes('/tcc-assistant');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-juri-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Mobile Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} mobile />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} pageTitle={getPageTitle()} />
        <AnnouncementBanner />
        
        <main className={`flex-1 ${isFullWidthPage ? 'p-0 sm:p-2 lg:p-3 overflow-hidden flex flex-col h-full min-h-0' : 'p-4 sm:p-6 lg:p-8 overflow-y-auto'} scroll-smooth`}>
          <div className={`${isFullWidthPage ? 'w-full max-w-full h-full flex flex-col min-h-0' : 'max-w-7xl mx-auto'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
