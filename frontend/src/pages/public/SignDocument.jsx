import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Input } from '../../components/ui';
import { FileSignature, ShieldCheck, UserCheck, AlertCircle, Building2, CheckCircle2, DownloadCloud, Eraser, PenTool, Type } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignDocument() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [docData, setDocData] = useState(null);
  const [error, setError] = useState('');
  
  const [cpf, setCpf] = useState('');
  const [signerName, setSignerName] = useState('');

  // Signature states
  const sigCanvas = useRef(null);
  const [signMode, setSignMode] = useState('draw'); // 'draw' | 'type'
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`/api/signatures/public/${token}`);
        setDocData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Documento não encontrado ou link expirado.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [token]);

  const handleSign = async (e) => {
    e.preventDefault();
    
    // Basic CPF validation check
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      alert("Por favor, informe um CPF válido com 11 dígitos.");
      return;
    }

    if (signMode === 'draw' && isCanvasEmpty) {
      alert("Por favor, desenhe sua rubrica no quadro para validar sua assinatura.");
      return;
    }

    let signatureImage = null;

    if (signMode === 'draw') {
      signatureImage = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    } else if (signMode === 'type' && signerName) {
      // Create a temporary canvas to draw the typed name as an image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.font = 'italic 36px "Times New Roman", serif'; // fallback cursive 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(signerName, 200, 50);
      signatureImage = canvas.toDataURL('image/png');
    }

    setSigning(true);
    try {
      await axios.post(`/api/signatures/public/${token}/sign`, { cpf, signerName, signatureImage });
      
      // Update local state to reflect successful signature instantly
      setDocData(prev => ({ ...prev, status: 'ASSINADO', signerCpf: cleanCpf, signedAt: new Date() }));
      
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar assinatura. Tente novamente.');
    } finally {
      setSigning(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsCanvasEmpty(true);
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/signatures/public/${token}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documento_assinado.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Não foi possível baixar o PDF.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-juri-950 flex flex-col items-center justify-center p-6">
        <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Buscando documento seguro...</p>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-juri-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h1>
        <p className="text-gray-500 max-w-md">{error}</p>
      </div>
    );
  }

  const isSigned = docData.status === 'ASSINADO';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-juri-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Jurídico */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-[#b8952b] shadow-lg mb-2">
             <FileSignature className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Portal de Aceite Eletrônico
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Por favor, leia atentamente os termos do documento abaixo antes de prosseguir com sua assinatura digital.
          </p>
        </div>

        {isSigned && (
           <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border-2 border-green-500 text-center space-y-3 shadow-lg shadow-green-500/10 mb-6 animate-in slide-in-from-top fade-in duration-500">
             <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
               <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
             </div>
             <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Documento Assinado Eletronicamente</h2>
             <p className="text-sm text-green-700 dark:text-green-400 max-w-xl mx-auto">
               Sua assinatura eletrônica foi firmada com sucesso. Seu aceite foi registrado em nossos servidores via verificação de hardware de rede (IP).
             </p>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal - O Documento */}
          <div className="lg:col-span-2">
             <Card className="p-8 md:p-12 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
               
               {/* Cabeçalho do Documento */}
               <div className="border-b-2 border-gray-100 dark:border-gray-800 pb-6 mb-8 flex flex-col items-center justify-center text-center">
                 <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-4" />
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest leading-tight">
                   {docData.title}
                 </h2>
                 <p className="text-sm text-gray-500 mt-2 flex items-center gap-2 justify-center">
                   <UserCheck className="w-4 h-4" />
                   Advogado(a) Solicitante: <strong className="text-gray-900 dark:text-gray-300">{docData.User?.nome} (OAB: {docData.User?.oab})</strong>
                 </p>
               </div>

               {/* Corpo do Documento */}
               <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-justify font-serif leading-relaxed text-gray-800 dark:text-gray-300">
                  {docData.content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 indent-8">{paragraph}</p>
                  ))}
               </div>

             </Card>
          </div>

          {/* Coluna Lateral - Assinatura */}
          <div className="lg:col-span-1">
             <Card className="p-6 bg-white dark:bg-gray-900 shadow-xl border-t-4 border-t-accent sticky top-8">
               
               {!isSigned ? (
                 <form onSubmit={handleSign} className="space-y-6">
                   <div className="space-y-2">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assinatura Digital</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       Para validar legalmente este documento, digite seu Cadastro de Pessoa Física (CPF) abaixo. Seu IP será registrado no ato da assinatura como prova de materialidade.
                     </p>
                   </div>

                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">CPF do Assinante</label>
                     <Input 
                       required
                       placeholder="000.000.000-00"
                       value={cpf}
                       onChange={(e) => {
                         // Mascara simples de CPF no frontend
                         let v = e.target.value.replace(/\D/g, "");
                         if (v.length > 11) v = v.substring(0, 11);
                         v = v.replace(/(\d{3})(\d)/, "$1.$2");
                         v = v.replace(/(\d{3})(\d)/, "$1.$2");
                         v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                         setCpf(v);
                       }}
                       className="font-mono text-center text-lg tracking-widest"
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nome Completo</label>
                     <Input 
                       required
                       placeholder="Seu nome completo"
                       value={signerName}
                       onChange={(e) => setSignerName(e.target.value)}
                       className="text-lg w-full"
                     />
                   </div>

                   {/* Abas e Área de Assinatura */}
                   <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setSignMode('draw')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${signMode === 'draw' ? 'bg-white dark:bg-gray-700 shadow-sm text-accent' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                          <PenTool className="w-4 h-4" /> Desenhar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignMode('type')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${signMode === 'type' ? 'bg-white dark:bg-gray-700 shadow-sm text-accent' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                          <Type className="w-4 h-4" /> Digitar Padrão
                        </button>
                      </div>

                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-2 overflow-hidden relative">
                        {signMode === 'draw' ? (
                          <>
                            <div className="bg-white dark:bg-gray-900 rounded-lg w-full h-32 cursor-crosshair">
                              <SignatureCanvas 
                                ref={sigCanvas} 
                                penColor="black"
                                canvasProps={{className: 'signature-canvas w-full h-full rounded-lg'}} 
                                onBegin={() => setIsCanvasEmpty(false)}
                              />
                            </div>
                            <button type="button" onClick={clearSignature} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white/80 rounded-full p-1 border shadow-sm">
                              <Eraser className="w-4 h-4" />
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-2">Use o mouse ou dedo para rubricar no quadro acima.</p>
                          </>
                        ) : (
                          <div className="bg-white dark:bg-gray-900 rounded-lg w-full h-32 flex items-center justify-center p-4">
                            <span 
                              className="text-3xl text-gray-800 dark:text-gray-200 select-none opacity-80" 
                              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {signerName || 'Seu Nome'}
                            </span>
                          </div>
                        )}
                      </div>
                   </div>

                   <Button 
                     type="submit" 
                     className="w-full text-lg h-14 bg-gradient-to-r from-accent to-[#b8952b] hover:opacity-90 transition-opacity text-white"
                     disabled={signing || cpf.length < 14 || signerName.length < 5}
                   >
                     {signing ? 'Registrando...' : 'Declarar Aceite e Assinar'}
                   </Button>

                   <div className="flex items-start gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                     <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                     <p className="text-[10px] text-gray-400 font-medium">
                       Com validade jurídica equivalente à assinatura de próprio punho. Respaldo via Medida Provisória nº 2.200-2/2001. A integridade do documento está assegurada.
                     </p>
                   </div>
                 </form>
               ) : (
                 <div className="text-center space-y-4 py-4">
                   <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                     <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aceite Registrado</h3>
                   <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                     <p>Obrigado. Você já assinou este documento legalmente.</p>
                     
                     <Button 
                       onClick={handleDownload}
                       variant="outline" 
                       className="w-full mt-6 py-6 border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 group"
                     >
                        <DownloadCloud className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> 
                        Baixar Documento Assinado (PDF)
                     </Button>

                     <p className="text-xs font-mono mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                       Vínculo Autorizado pelo advogado. Você já pode fechar esta página.
                     </p>
                   </div>
                 </div>
               )}

             </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

