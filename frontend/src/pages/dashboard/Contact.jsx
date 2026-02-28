import React, { useEffect, useState } from 'react';
import { Mail, Instagram, Github, Phone } from 'lucide-react';
import { Card } from '../../components/ui';
import axios from 'axios';

const Contact = () => {
  const [links, setLinks] = useState({
    contact_email: 'contato@juscore.ai',
    contact_whatsapp: '5511999999999',
    contact_instagram: 'https://instagram.com/juscore',
    contact_github: 'https://github.com/juscore'
  });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await axios.get('/api/public/contact');
        if (res.data) setLinks(prev => ({ ...prev, ...res.data }));
      } catch (error) {
        console.error('Failed to fetch contact links', error);
      }
    };
    fetchLinks();
  }, []);

  const contactItems = [
    { 
      icon: Mail, 
      label: 'E-mail', 
      value: links.contact_email, 
      href: `mailto:${links.contact_email}`,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    },
    { 
      icon: Phone, 
      label: 'WhatsApp', 
      value: 'Fale Conosco', 
      href: links.contact_whatsapp ? `https://wa.me/${links.contact_whatsapp.replace(/\D/g, '')}` : '#',
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    },
    { 
      icon: Instagram, 
      label: 'Instagram', 
      value: 'Visite-nos', 
      href: links.contact_instagram,
      color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
    },
    { 
      icon: Github, 
      label: 'GitHub', 
      value: 'Visite-nos', 
      href: links.contact_github,
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fale Conosco</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Precisa de ajuda ou quer dar um feedback? Entre em contato por um dos canais abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactItems.map((item, index) => (
          <a 
            key={index}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                  {item.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.value || 'Não disponível'}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      <Card className="p-8 mt-8 text-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-800 border-none">
        <h3 className="text-xl font-bold text-primary-900 dark:text-white mb-2">Dúvidas Frequentes?</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Acesse nossa central de ajuda ou converse diretamente com a IA para suporte técnico básico.
        </p>
        <button 
            onClick={() => window.location.href='/dashboard/chat'}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium"
        >
          Ir para o Chat
        </button>
      </Card>

      <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-8">
        <a href="/terms" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors">
          Termos de Uso e Política de Privacidade
        </a>
        <p className="text-sm text-gray-500 mt-2">
          &copy; 2026 JusCore AI. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Contact;
