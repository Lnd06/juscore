import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, AlertTriangle, Info, CheckCircle, Megaphone } from 'lucide-react';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get('/api/announcements/active', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const activeAvisos = res.data;

        // Filter out those the user already dismissed
        const dismissedJSON = localStorage.getItem('dismissed_announcements');
        const dismissedIds = dismissedJSON ? JSON.parse(dismissedJSON) : [];

        const unreadAvisos = activeAvisos.filter(ann => !dismissedIds.includes(ann.id));
        setAnnouncements(unreadAvisos);

      } catch (error) {
        console.error('Erro ao buscar avisos:', error);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleDismiss = (id) => {
    // Hide from screen
    setAnnouncements(prev => prev.filter(ann => ann.id !== id));

    // Save to localStorage so it doesn't show again
    const dismissedJSON = localStorage.getItem('dismissed_announcements');
    const dismissedIds = dismissedJSON ? JSON.parse(dismissedJSON) : [];
    
    if (!dismissedIds.includes(id)) {
      dismissedIds.push(id);
      localStorage.setItem('dismissed_announcements', JSON.stringify(dismissedIds));
    }
  };

  if (announcements.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {announcements.map((ann) => {
        let bgColor = "bg-blue-50 dark:bg-blue-900/20";
        let borderColor = "border-blue-200 dark:border-blue-800/50";
        let textColor = "text-blue-800 dark:text-blue-200";
        let Icon = Info;

        if (ann.type === 'success') {
          bgColor = "bg-green-50 dark:bg-green-900/20";
          borderColor = "border-green-200 dark:border-green-800/50";
          textColor = "text-green-800 dark:text-green-200";
          Icon = CheckCircle;
        } else if (ann.type === 'warning') {
          bgColor = "bg-yellow-50 dark:bg-yellow-900/20";
          borderColor = "border-yellow-200 dark:border-yellow-800/50";
          textColor = "text-yellow-800 dark:text-yellow-200";
          Icon = AlertTriangle;
        } else if (ann.type === 'error') {
          bgColor = "bg-red-50 dark:bg-red-900/20";
          borderColor = "border-red-200 dark:border-red-800/50";
          textColor = "text-red-800 dark:text-red-200";
          Icon = AlertTriangle;
        }

        return (
          <div 
            key={ann.id} 
            className={`relative flex items-start sm:items-center gap-3 w-full p-4 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 ${bgColor} ${borderColor} ${textColor}`}
          >
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 text-sm font-medium pr-6 leading-relaxed">
              {ann.message}
            </div>

            <button 
              onClick={() => handleDismiss(ann.id)}
              className={`absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/10`}
              aria-label="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
