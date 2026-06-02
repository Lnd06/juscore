/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import CustomDocEditor from './CustomDocEditor';
import html2pdf from 'html2pdf.js';
import { Card, Button, Input } from '../../../components/ui';
import { 
  FileText, 
  Sparkles, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Wand2,
  Crown,
  Copy,
  Check,
  ExternalLink,
  FileSignature,
  User,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

// Converte Markdown simples para HTML limpo compatível com regras ABNT
const markdownToHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
};

const documentTemplates = [
  {
    label: 'Petição Inicial',
    title: 'Petição Inicial',
    prompt: 'Atue como um advogado sênior e redija uma petição inicial estruturada com: 1. Endereçamento e Qualificação das partes; 2. Dos Fatos (narrativa clara e cronológica); 3. Do Direito (fundamentação legal e jurisprudencial aplicável); 4. Dos Pedidos (elencando os requerimentos de forma clara). Detalhe [INSERIR O TEMA DA AÇÃO AQUI]'
  },
  {
    label: 'Contestação',
    title: 'Contestação',
    prompt: 'Atue como um advogado sênior e redija uma contestação estruturada com: 1. Endereçamento; 2. Da Tempestividade; 3. Preliminares (se houver); 4. Da Verdade dos Fatos; 5. Do Mérito (rebatendo cada ponto da inicial); 6. Dos Pedidos. A defesa se baseia em [INSERIR A TESE DE DEFESA AQUI]'
  },
  {
    label: 'Procuração',
    title: 'Procuração Ad Judicia',
    prompt: 'Gere um modelo de procuração com a cláusula "Ad Judicia et Extra", contendo: 1. Qualificação do Outorgante; 2. Qualificação do Outorgado; 3. Poderes amplos para o foro em geral, e os específicos para confessar, transigir, desistir, receber citações, dar quitação, firmar acordos e levantar alvarás. Especifique se houver finalidade específica: [INSERIR A FINALIDADE SE HOUVER]'
  },
  {
    label: 'Honorários',
    title: 'Contrato de Honorários Advocatícios',
    prompt: 'Gere um contrato de prestação de serviços advocatícios contendo as cláusulas: 1. Qualificação das partes; 2. Objeto do contrato; 3. Dos Honorários (valor, forma de pagamento e honorários de sucumbência); 4. Das Despesas Processuais; 5. Das Obrigações das partes; 6. Rescisão e Foro de eleição. O objeto principal é: [INSERIR OBJETO DO CONTRATO]'
  },
  {
    label: 'Apelação',
    title: 'Recurso de Apelação',
    prompt: 'Escreva um Recurso de Apelação contendo: 1. Folha de interposição para o juízo a quo (tempestividade, cabimento e preparo); 2. Razões do Recurso para o juízo ad quem (Egrégio Tribunal); 3. Breve síntese da demanda; 4. Da reforma da sentença judicial e Fundamentação Jurisprudencial; 5. Dos Pedidos de provimento. O recurso se baseia em: [INSERIR MOTIVO DA APELAÇÃO]'
  }
];

const getPlanSignatureLimits = (planSlug) => {
  if (!planSlug || planSlug === 'free' || planSlug.startsWith('student_')) {
    return { maxDocs: 0, expiryDays: 0 };
  }

  const isOfficeOrEnterprise = ['office_master', 'enterprise'].includes(planSlug);
  const isProOrMaster = ['pro', 'lawyer_growth'].includes(planSlug);

  if (isOfficeOrEnterprise) {
    return { maxDocs: 40, expiryDays: 30 };
  }
  if (isProOrMaster) {
    return { maxDocs: 20, expiryDays: 30 };
  }
  return { maxDocs: 12, expiryDays: 15 };
};

const DocumentGenerator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const clientDropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(false);
  const initialHtmlRef = useRef('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [signatureLink, setSignatureLink] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);

  const planSlug = user?.subscriptionPlan || user?.tipo || 'free';
  const limits = getPlanSignatureLimits(planSlug);

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);

  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const hasProcessAccess = isPrivileged || ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(planSlug);

  // Fechar dropdown de clientes ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setIsClientSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar lista de clientes do CRM
  useEffect(() => {
    if (hasProcessAccess) {
      const fetchClients = async () => {
        try {
          const res = await axios.get('/api/clients');
          setClients(res.data || []);
        } catch (err) {
          console.error("Erro ao buscar clientes:", err);
        }
      };
      fetchClients();
    }
  }, [hasProcessAccess]);

  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    lawyerName: user?.nome || '',
    officeName: user?.organization?.name || '',
    oabNumber: user?.oab || '',
    date: new Date().toLocaleDateString('pt-BR'),
  });

  // CSS global injetado 1x para suprimir cabeçalhos do navegador ao imprimir
  useEffect(() => {
    const styleTag = document.getElementById('juscore-print-css');
    if (!styleTag) {
      const s = document.createElement('style');
      s.id = 'juscore-print-css';
      s.innerHTML = `@media print { @page { margin: 0; } header, footer, nav { display: none !important; } }`;
      document.head.appendChild(s);
    }
  }, []);

  const handleTemplateSelect = (tpl, idx) => {
    setSelectedTemplate(idx);
    setFormData(prev => ({ ...prev, title: tpl.title, prompt: tpl.prompt }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.prompt) return;
    setLoading(true);
    setGeneratedDoc(false);
    setSignatureLink('');
    try {
      const resp = await axios.post('/api/documents/generate-ai', {
        ...formData,
        clientId: selectedClient || undefined
      });
      const { success, rawContent } = resp.data;
      if (!success) throw new Error('Falha na geração');
      const html = '<p>' + markdownToHtml(rawContent) + '</p>';
      initialHtmlRef.current = html;
      if (editorRef.current) {
        editorRef.current.value = html;
      }
      setGeneratedDoc(true);
      setTimeout(() => document.getElementById('editor-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar documento. Verifique seu limite diário e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Quando o editor montar após gerado, injeta o conteúdo inicial
  useEffect(() => {
    if (generatedDoc && editorRef.current && initialHtmlRef.current) {
      setTimeout(() => {
        if (editorRef.current) editorRef.current.value = initialHtmlRef.current;
      }, 150);
    }
  }, [generatedDoc]);

  const getCurrentContent = useCallback(() => {
    return editorRef.current?.value ?? '';
  }, []);

  const handleDownloadProfessionalPDF = async () => {
    const content = getCurrentContent();
    if (!content) return;
    setIsGeneratingPdf(true);
    
    try {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:100%;font-family:Times New Roman,serif;color:#000;background:#fff;';

      wrapper.innerHTML = `
        <style>
          .doc {
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
            color: #000 !important;
          }
          .doc p {
            text-align: justify !important;
            text-indent: 1.25cm !important; /* Recuo ABNT padrão */
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            line-height: 1.5 !important;
          }
          .doc h1 {
            text-align: center !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
            margin-top: 1.5em !important;
            margin-bottom: 0.8em !important;
          }
          .doc h2 {
            text-align: left !important;
            font-weight: bold !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
            margin-top: 1.5em !important;
            margin-bottom: 0.8em !important;
          }
          .doc h3 {
            text-align: left !important;
            font-weight: bold !important;
            font-style: italic !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
            margin-top: 1.5em !important;
            margin-bottom: 0.8em !important;
          }
          .doc img { max-width:100%!important; height:auto!important; display:block; margin:8px auto; }
          .doc table { width:100%; border-collapse:collapse; margin-bottom:1em; }
          .doc td,.doc th { border:1px solid #000; padding:6px 8px; }
        </style>
        <div class="doc">
          ${content}
        </div>
      `;

      await html2pdf().set({
        margin: [30, 30, 20, 20],
        filename: `Juscore_${(formData.title || 'Documento').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css', avoid: ['.doc p', '.doc h1', '.doc h2', '.doc h3', '.doc img', 'table', '.doc > div'] }
      }).from(wrapper).toPdf().get('pdf').then(function(pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text('Página ' + i + ' de ' + totalPages, 105, 287, { align: 'center' });
        }
      }).save();
      
    } catch (err) {
      console.error(err);
      alert('Erro ao processar PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCreateSignatureLink = async () => {
    const content = getCurrentContent();
    if (!content) return;
    setGeneratingLink(true);
    try {
      const resp = await axios.post('/api/signatures', {
        title: formData.title || 'Documento Gerado',
        content
      });
      const url = `${window.location.origin}/sign/${resp.data.token}`;
      setSignatureLink(url);
      setLimitInfo({
        expiryDays: resp.data.expiryDays || limits.expiryDays,
        expiresAt: resp.data.expiresAt,
        maxDocs: resp.data.maxDocs || limits.maxDocs,
        activeCount: resp.data.activeCount
      });
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {}
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Erro ao gerar link de assinatura.';
      alert(msg);
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <div className="w-full xl:max-w-screen-xl mx-auto pb-20 px-4 md:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl mb-4">
          <Sparkles className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Gerador de Documentos IA
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">
          Descreva o documento que precisa e a IA redigirá uma peça jurídica profissional para você editar e exportar.
        </p>
      </div>

      {/* Card único com textarea */}
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 md:p-8 bg-white dark:bg-gray-800 border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
          <form onSubmit={handleGenerate} className="space-y-5">

            {/* Templates como chips */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Modelos Rápidos
              </label>
              <div className="flex flex-wrap gap-2">
                {documentTemplates.map((tpl, i) => (
                  <button key={i} type="button" onClick={() => handleTemplateSelect(tpl, i)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5
                      ${selectedTemplate === i
                        ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent'
                      }`}>
                    <FileText className="w-3.5 h-3.5" />{tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vincular Cliente Section */}
            {hasProcessAccess && (
              <div className="relative" ref={clientDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Vincular Cliente do CRM (Opcional)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsClientSelectOpen(!isClientSelectOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all duration-200"
                  >
                    <User className="w-4 h-4 text-accent" />
                    {selectedClient ? 'Alterar Cliente' : 'Selecionar Cliente'}
                  </button>

                  {selectedClient && (() => {
                    const clientData = clients.find(c => c.id === Number(selectedClient));
                    return clientData ? (
                      <div className="relative inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold shadow-sm animate-in zoom-in-50 duration-300">
                        <User className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>Cliente: {clientData.nome}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedClient('')}
                          className="text-emerald-500 dark:text-emerald-400 hover:text-red-500 transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : null;
                  })()}
                </div>

                {isClientSelectOpen && (
                  <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-600 tracking-widest px-1">
                      Seus Clientes CRM
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50 pr-1">
                      {clients.length === 0 ? (
                        <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-600 italic">
                          Nenhum cliente cadastrado
                        </div>
                      ) : (
                        clients.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClient(c.id);
                              setIsClientSelectOpen(false);
                            }}
                            className={`w-full text-left py-2 px-2.5 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 transition-all font-semibold ${
                              selectedClient === c.id ? 'bg-accent/10 text-accent border border-accent/20' : 'border border-transparent'
                            }`}
                          >
                            {c.nome}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Textarea principal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Descreva o documento
              </label>
              <textarea required
                placeholder="Ex: Redija uma petição inicial de ação de danos morais contra a empresa XYZ, fundamentada no CDC arts. 14 e 18, por cobrança indevida de R$ 5.000,00..."
                className="w-full min-h-[200px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none text-sm leading-relaxed"
                value={formData.prompt}
                onChange={e => {
                  setFormData(p => ({ ...p, prompt: e.target.value }));
                  if (selectedTemplate !== null) setSelectedTemplate(null);
                }} />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                Quanto mais detalhes você fornecer, melhor será o resultado. Inclua nomes, valores, artigos de lei, etc.
              </p>
            </div>

            {/* Botão de gerar */}
            <Button type="submit" disabled={loading}
              className="w-full h-14 text-lg font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-transform rounded-xl">
              {loading
                ? <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redigindo com IA...</>
                : <><Wand2 className="w-6 h-6" /> Gerar Documento</>}
            </Button>
          </form>
        </Card>

        {/* Aviso compacto */}
        {!generatedDoc && (
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 max-w-3xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              O conteúdo gerado por IA deve ser revisado por um advogado habilitado antes do protocolo judicial. 
              O documento será exportado em PDF com margens ABNT (3cm/2cm).
            </p>
          </div>
        )}

        {/* Sucesso badge */}
        {generatedDoc && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800 flex items-center gap-3 max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="p-2 bg-green-500 rounded-lg text-white shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-700 dark:text-green-400">Documento Gerado com Sucesso!</p>
              <p className="text-xs text-green-600 dark:text-green-500">Edite abaixo e exporte em PDF quando estiver pronto.</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Editor de Documento (full width abaixo) ─── */}
      {generatedDoc && (
        <Card id="editor-section" className="mt-10 w-full bg-white dark:bg-gray-800 border-2 border-accent/20 shadow-2xl animate-in slide-in-from-bottom fade-in duration-500 overflow-hidden">

          {/* Barra do editor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Editor de Documento
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Edite livremente — imagens, tabelas, formatação. O PDF exportará exatamente o que você ver.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="px-3.5 py-2 rounded-xl bg-accent/10 border border-accent/20 text-xs font-black text-accent tracking-wider uppercase">
                Total: {pageCount} {pageCount === 1 ? 'Folha A4' : 'Folhas A4'}
              </span>
              <Button onClick={handleDownloadProfessionalPDF} disabled={isGeneratingPdf}
                className="flex items-center gap-2">
                {isGeneratingPdf
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Gerando...</>
                  : <><Download className="w-4 h-4" /> Baixar PDF Padrão CNJ</>}
              </Button>
            </div>
          </div>

          {/* Editor de Documento — CustomDocEditor nativo (contentEditable) */}
          <CustomDocEditor ref={editorRef} onPageCountChange={setPageCount} />

          {/* Assinatura */}
          {signatureLink ? (
            <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-950/10">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-emerald-500 rounded-2xl text-white shrink-0 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-400">
                    Enviado com Sucesso para a Área de Assinaturas!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500/80 mt-1">
                    O documento foi salvo com segurança em seu painel. O link público de assinatura eletrônica está pronto e copiado para a sua área de transferência.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-wider">
                    Link Público de Assinatura:
                  </span>
                  <div className="flex gap-2">
                    <Input value={signatureLink} readOnly className="font-mono text-xs bg-gray-50 dark:bg-gray-950 border-emerald-100 dark:border-emerald-900/50" />
                    <Button onClick={() => {
                      navigator.clipboard.writeText(signatureLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }} variant="outline" className="shrink-0 border-emerald-200 hover:border-emerald-300 dark:border-emerald-800/80 text-xs gap-1.5 flex items-center justify-center">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 text-xs text-gray-500 dark:text-gray-400 gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Disponível por {limitInfo?.expiryDays || limits.expiryDays} dias
                    {limitInfo?.expiresAt && ` (até ${new Date(limitInfo.expiresAt).toLocaleDateString('pt-BR')})`}
                  </span>
                  {limitInfo && (
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Capacidade utilizada: {limitInfo.activeCount}/{limitInfo.maxDocs} documentos
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button onClick={() => navigate('/dashboard/signatures')}
                  className="flex-1 py-3 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Ir para Área de Assinaturas
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-accent" /> Área de Assinatura Eletrônica
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Seu plano permite salvar até <strong className="text-accent">{limits.maxDocs} documentos</strong> na área de assinaturas. Cada documento fica armazenado por <strong className="text-accent">{limits.expiryDays} dias</strong>.
                  </p>
                </div>
                {limits.maxDocs === 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg">
                    Upgrade Necessário
                  </span>
                )}
              </div>

              {limits.maxDocs === 0 ? (
                <Button onClick={() => navigate('/dashboard/subscription')}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4" /> Fazer Upgrade para Ativar Assinatura Eletrônica
                </Button>
              ) : (
                <Button onClick={handleCreateSignatureLink} disabled={generatingLink}
                  className="w-full py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-black rounded-xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2">
                  {generatingLink ? (
                    <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
                  ) : (
                    <FileSignature className="w-4 h-4" />
                  )}
                  {generatingLink ? 'Enviando Documento...' : 'Enviar para Área de Assinaturas'}
                </Button>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DocumentGenerator;
