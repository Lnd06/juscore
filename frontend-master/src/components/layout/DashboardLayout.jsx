/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ChevronRight, Menu } from 'lucide-react';
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

  const isChat = location.pathname.includes('/chat');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-juri-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Mobile Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} mobile />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} pageTitle={getPageTitle()} />
        <AnnouncementBanner />
        
        <main className={`flex-1 overflow-y-auto ${isChat ? 'p-0' : 'p-4 sm:p-6 lg:p-8'} scroll-smooth`}>
          <div className={`${isChat ? 'w-full h-full' : 'max-w-7xl mx-auto'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
