import React, { useState, useEffect } from 'react';
import { ArrowLeft, Scale, Shield, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Terms = () => {
  const navigate = useNavigate();
  const [termsContent, setTermsContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await axios.get('/api/public/terms');
        setTermsContent(res.data.terms);
      } catch (error) {
        setTermsContent("Erro ao carregar os termos atualizados.");
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8 sm:p-12 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Scale size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Termos de Uso e Políticas de Privacidade</h1>
                    <p className="text-gray-500 dark:text-gray-400">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Bem-vindo ao JusCore AI. Ao acessar e utilizar nossa plataforma, você concorda expressamente com os termos e condições descritos abaixo.
              Por favor, leia atentamente antes de prosseguir com o uso dos nossos serviços.
            </p>
          </div>
          
          <div className="p-8 sm:p-12 space-y-12">
            {loading ? (
               <div className="flex justify-center py-12">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
               </div>
            ) : (
               <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                 {termsContent}
               </div>
            )}
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-8 sm:p-12 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-left">
            <div>
              <p className="text-gray-900 dark:text-white font-medium mb-1">
                  Tem dúvidas ou encontrou um problema?
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Entre em contato conosco através do nosso e-mail ou canais de suporte no dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
