import React from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

const AdminLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:bg-none dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Master Admin</span>
            </div>
            
            <nav className="flex items-center gap-4">
               <a 
                href="/secret-admin-access-8822"
                className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
               >
                 Dashboard
               </a>
               <a 
                href="/secret-admin-access-8822/library"
                className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
               >
                 Biblioteca Jurídica
               </a>
               <a 
                href="/secret-admin-access-8822/finance"
                className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
               >
                 Financeiro
               </a>
               <a 
                href="/secret-admin-access-8822/feedbacks"
                className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
               >
                 Bugs/Feedbacks
               </a>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard" 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Voltar para Dashboard"
            >
              <Home className="w-5 h-5" />
            </a>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
