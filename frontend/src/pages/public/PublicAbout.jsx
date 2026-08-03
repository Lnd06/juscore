import React, { useState, useEffect } from 'react';
import Navbar from '../landing/Navbar';
import About from '../dashboard/About';
import Footer from '../landing/Footer';
import axios from 'axios';

const PublicAbout = () => {
  const [supportLinks, setSupportLinks] = useState({
    contact_email: 'contato@juscore.ai',
    contact_whatsapp: '5511999999999',
    contact_instagram: 'https://instagram.com/juscore',
    contact_tiktok: 'https://tiktok.com/@juscore',
    contact_linkedin: 'https://linkedin.com/company/juscore'
  });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await axios.get('/api/public/contact');
        if (res.data) setSupportLinks(prev => ({ ...prev, ...res.data }));
      } catch (error) {
        console.error('Failed to fetch contact links', error);
      }
    };
    fetchLinks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 pt-32 pb-20">
        <About showCopyright={false} />
      </div>
      <Footer links={supportLinks} />
    </div>
  );
};

export default PublicAbout;
