import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Menu, X, ShieldAlert, Book, DollarSign, Bug, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

const AdminLayout = () => {
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/master-panel", label: "Dashboard", icon: LayoutDashboard },
    { to: "/master-panel/library", label: "Biblioteca Jurídica", icon: Book },
    { to: "/master-panel/finance", label: "Financeiro", icon: DollarSign },
    { to: "/master-panel/feedbacks", label: "Bugs/Feedbacks", icon: Bug },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20">
                M
              </div>
              <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white hidden sm:block">
                Master Admin
              </span>
            </div>
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link 
                    key={link.to}
                    to={link.to}
                    className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                      isActive 
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                        : "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/40 rounded-xl transition-all"
              title="Voltar para Dashboard"
            >
              <Home className="w-5 h-5" />
            </Link>
            
            <div className="hidden md:block">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 rounded-xl md:hidden transition-all"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 max-w-sm bg-white dark:bg-gray-800 h-full shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300 ml-auto z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <span className="font-black text-gray-900 dark:text-white">Master Admin</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  const LinkIcon = link.icon;
                  return (
                    <Link 
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${
                        isActive 
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Link 
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <Home className="w-4 h-4" />
                Painel Principal
              </Link>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
