import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Button } from '../../components/ui';
import {
  FileSignature, ShieldCheck, UserCheck, AlertCircle, Building2,
  CheckCircle2, DownloadCloud, Eraser, PenTool, Type, Lock,
  Mail, Phone, User, Hash, Fingerprint, Shield, ArrowRight
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignDocument() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [docData, setDocData] = useState(null);
  const [error, setError] = useState('');
  
  // Fluxo de passos: 1 = Dados, 2 = Assinatura
  const [step, setStep] = useState(1); 
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const [cpf, setCpf] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [docType, setDocType] = useState('cpf'); // 'cpf' | 'cnpj'

  // Signature states
  const sigCanvas = useRef(null);
  const [signMode, setSignMode] = useState('draw');
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [selectedFont, setSelectedFont] = useState('Dancing Script');

  // Result states
  const [signResult, setSignResult] = useState(null);

  const signatureFonts = [
    { family: 'Dancing Script', label: 'Clássica' },
    { family: 'Pacifico', label: 'Casual' },
    { family: 'Caveat', label: 'Elegante' },
  ];

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

  const formatCpfCnpj = (value) => {
    let v = value.replace(/\D/g, "");
    if (docType === 'cnpj') {
      if (v.length > 14) v = v.substring(0, 14);
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      if (v.length > 11) v = v.substring(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return v;
  };

  const formatPhone = (value) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 6) v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    return v;
  };

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const validarCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    return true;
  };

  const isFormValid = () => {
    const isDocValid = docType === 'cpf' ? validarCPF(cpf) : validarCNPJ(cpf);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail);
    const validPhone = signerPhone.replace(/\D/g, '').length >= 10;
    return signerName.length >= 5 && isDocValid && validEmail && validPhone;
  };

  const handleSign = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      const isDocValid = docType === 'cpf' ? validarCPF(cpf) : validarCNPJ(cpf);
      if (!isDocValid) alert(`O ${docType.toUpperCase()} informado é inválido. Por favor, verifique.`);
      else alert('Por favor, preencha todos os campos corretamente para avançar.');
      return;
    }

    if (signMode === 'draw' && isCanvasEmpty) {
      alert("Por favor, desenhe sua rubrica no quadro em branco.");
      return;
    }

    let signatureImage = null;
    if (signMode === 'draw') {
      signatureImage = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    } else if (signMode === 'type' && signerName) {
      const canvas = document.createElement('canvas');
      canvas.width = 500; canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.font = `40px "${selectedFont}", cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(signerName, 250, 60);
      signatureImage = canvas.toDataURL('image/png');
    }

    setSigning(true);
    try {
      const res = await axios.post(`/api/signatures/public/${token}/sign`, {
        cpf, signerName, signerEmail, signerPhone, signatureImage,
      });
      setSignResult(res.data);
      setDocData(prev => ({ ...prev, status: 'ASSINADO', signedAt: new Date() }));
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar assinatura.');
    } finally {
      setSigning(false);
    }
  };

  const clearSignature = () => { sigCanvas.current?.clear(); setIsCanvasEmpty(true); };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/signatures/public/${token}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documento_assinado.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert("Não foi possível baixar o PDF."); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6">
      <div className="relative">
        <div className="animate-spin w-16 h-16 border-4 border-accent/20 border-t-amber-500 rounded-full" />
        <Lock className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-gray-400 font-medium mt-6 animate-pulse">Carregando ambiente seguro...</p>
    </div>
  );

  if (error || !docData) return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
      <p className="text-gray-400 max-w-md">{error}</p>
    </div>
  );

  const isSigned = docData.status === 'ASSINADO';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200 font-sans">
      
      {/* Header Fixo Escuro JusCore */}
      <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center shadow-sm">
              <FileSignature className="w-5 h-5 text-accent-light" />
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight tracking-wide">Portal de Assinatura</h1>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-gray-400">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-accent-light" /> Ambiente Seguro</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" /> Validade Legal</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Banner de Sucesso */}
        {isSigned && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 animate-in slide-in-from-top fade-in duration-500">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-emerald-300 mb-1">Documento Assinado com Sucesso</h2>
              <p className="text-sm text-emerald-400/80 mb-4">
                Sua assinatura eletrônica possui validade jurídica. Os dados foram registrados com prova de materialidade.
              </p>
              
              <Button onClick={handleDownload} className="w-full sm:w-auto bg-accent hover:bg-accent-dark text-slate-900 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 mb-4">
                <DownloadCloud className="w-5 h-5" /> Baixar Documento Certificado (PDF)
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coluna do Documento (Visualizador) */}
          <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
            <div className="bg-slate-800 rounded-2xl shadow-xl shadow-black/20 border border-white/5 overflow-hidden">
              <div className="bg-slate-800/80 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">{docData.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5" /> Advogado: {docData.User?.nome} {docData.User?.oab ? `(OAB ${docData.User?.oab})` : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Área de rolagem do documento */}
              <div className="p-8 md:p-12 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* O texto HTML renderizado de forma limpa e legível, com cores invertidas para tema escuro */}
                <div 
                  className="prose prose-sm sm:prose-base prose-invert max-w-none font-serif text-justify text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: docData.content }}
                />
              </div>
            </div>
          </div>

          {/* Coluna da Assinatura (Formulário) */}
          {!isSigned && (
            <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 lg:sticky lg:top-24">
              <Card className="bg-slate-800 shadow-2xl shadow-black/40 border border-white/5 p-0 overflow-hidden rounded-2xl">
                <div className="bg-accent p-6 text-slate-900 text-center">
                  <h3 className="text-xl font-black mb-1 uppercase tracking-wider">Assinatura Digital</h3>
                  <p className="text-slate-900/80 text-xs font-bold">
                    Preencha seus dados para validade jurídica
                  </p>
                </div>

                <form onSubmit={handleSign} className="p-6 space-y-6">
                  
                  {/* Etapa 1: Dados Pessoais */}
                  {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right fade-in">
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2"><User className="w-4 h-4 text-accent-light"/> Nome Completo</label>
                        <input required placeholder="Seu nome completo" value={signerName} onChange={(e) => setSignerName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:bg-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Hash className="w-4 h-4 text-accent-light"/> Documento</label>
                          <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-lg">
                            {['cpf', 'cnpj'].map(t => (
                              <button key={t} type="button" onClick={() => { setDocType(t); setCpf(''); }}
                                className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${docType === t ? 'bg-accent text-slate-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input required placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'} value={cpf}
                          onChange={(e) => setCpf(formatCpfCnpj(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:bg-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono tracking-wide" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2"><Mail className="w-4 h-4 text-accent-light"/> E-mail</label>
                        <input required type="email" placeholder="seu@email.com" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:bg-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2"><Phone className="w-4 h-4 text-accent-light"/> WhatsApp / Celular</label>
                        <input required placeholder="(00) 00000-0000" value={signerPhone} onChange={(e) => setSignerPhone(formatPhone(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:bg-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono" />
                      </div>

                      <Button type="button" onClick={() => { if (isFormValid()) setStep(2); else alert('Por favor, preencha todos os campos corretamente para avançar.'); }}
                        className="w-full h-14 text-base bg-accent hover:bg-accent-dark text-slate-900 font-bold rounded-xl mt-4 shadow-lg shadow-accent/20 group">
                        Avançar para Assinatura <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  )}

                  {/* Etapa 2: Assinatura */}
                  {step === 2 && (
                    <div className="space-y-5 animate-in slide-in-from-right fade-in">
                      
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="font-medium">Nome:</span> <span className="font-bold text-white truncate ml-2">{signerName}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="font-medium uppercase">{docType}:</span> <span className="font-mono text-white">{cpf}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="font-medium">E-mail:</span> <span className="text-white truncate ml-2">{signerEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Telefone:</span> <span className="font-mono text-white">{signerPhone}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex bg-slate-900 p-1 rounded-xl mb-3 border border-white/5">
                          <button type="button" onClick={() => setSignMode('draw')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${signMode === 'draw' ? 'bg-accent text-slate-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                            <PenTool className="w-4 h-4" /> Desenhar
                          </button>
                          <button type="button" onClick={() => setSignMode('type')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${signMode === 'type' ? 'bg-accent text-slate-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                            <Type className="w-4 h-4" /> Digitar
                          </button>
                        </div>

                        <div className="border border-slate-700 rounded-xl bg-slate-900 p-2 relative overflow-hidden focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                          {signMode === 'draw' ? (
                            <>
                              {/* Mantemos o fundo do canvas branco para facilitar o desenho com caneta preta */}
                              <div className="bg-white rounded-lg w-full h-40 cursor-crosshair">
                                <SignatureCanvas ref={sigCanvas} penColor="#0f172a"
                                  canvasProps={{className: 'w-full h-full rounded-lg'}}
                                  onBegin={() => setIsCanvasEmpty(false)} />
                              </div>
                              <button type="button" onClick={clearSignature}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white shadow-md rounded-full p-2 border border-gray-200 transition-colors tooltip" title="Limpar Quadro">
                                <Eraser className="w-4 h-4" />
                              </button>
                              <div className="text-center text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-widest">
                                Assine no quadro acima
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-white rounded-lg border border-slate-700 w-full h-28 flex items-center justify-center p-4">
                                <span className="text-4xl text-slate-900" style={{ fontFamily: `"${selectedFont}", cursive` }}>
                                  {signerName}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {signatureFonts.map((f) => (
                                  <button key={f.family} type="button" onClick={() => setSelectedFont(f.family)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedFont === f.family ? 'bg-accent/20 text-accent-light border border-accent' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:border-slate-600'}`}>
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button type="button" onClick={() => setStep(1)} className="flex-1 h-14 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm">
                          Voltar
                        </Button>
                        <Button type="submit" disabled={signing}
                          className="flex-[2] h-14 bg-accent hover:bg-accent-dark text-slate-900 font-bold rounded-xl text-base transition-all shadow-lg shadow-accent/20">
                          {signing ? (
                            <span className="flex items-center justify-center gap-2"><div className="animate-spin w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full" /> Assinando...</span>
                          ) : (
                            <span className="flex items-center justify-center gap-2"><FileSignature className="w-5 h-5" /> Assinar Termo</span>
                          )}
                        </Button>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-white/5 mt-4">
                        <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                        <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">
                          Ao assinar, você concorda com os termos deste documento. Validade jurídica garantida pela MP nº 2.200-2/2001. Dados protegidos por criptografia de ponta a ponta.
                        </p>
                      </div>

                    </div>
                  )}
                </form>
              </Card>
            </div>
          )}

        </div>
      </main>
      
      {/* Footer minimalista */}
      <footer className="py-6 text-center text-xs text-gray-600">
        <p>&copy; {new Date().getFullYear()} Plataforma Jurídica. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
