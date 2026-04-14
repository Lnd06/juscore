import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import CustomDocEditor from './CustomDocEditor';
import html2pdf from 'html2pdf.js';
import { Card, Button, Input } from '../../../components/ui';
import { 
  FileText, 
  Upload, 
  Briefcase, 
  MapPin, 
  Sparkles, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Building2,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../../context/AuthContext';

// Converte Markdown simples para HTML para exibição no Jodit
const markdownToHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3 style="text-align:center;font-weight:bold;margin:1.2em 0 0.6em;">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="text-align:center;font-weight:bold;margin:1.4em 0 0.7em;">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="text-align:center;font-weight:bold;margin:1.6em 0 0.8em;text-transform:uppercase;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:1em;">')
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

const DocumentGenerator = () => {
  const { user } = useAuth();
  const editorRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(false);
  // Não usamos state para o conteúdo do editor — base64 de imagens se perdem no re-render
  // Em vez disso, guardamos o HTML inicial em uma ref e injetamos via editorRef.current.value
  const initialHtmlRef = useRef('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [signatureLink, setSignatureLink] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    lawyerName: user?.nome || '',
    officeName: user?.organization?.name || '',
    oabNumber: user?.oab || '',
    address: '',
    date: new Date().toLocaleDateString('pt-BR'),
    prompt: '',
    processId: '',
    logo: ''
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

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const resp = await axios.get('/api/processes');
        setProcesses(resp.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchProcesses();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Logo máx. 2MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setFormData(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateSelect = (tpl) => {
    setFormData(prev => ({ ...prev, title: tpl.title, prompt: tpl.prompt }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.prompt) return;
    setLoading(true);
    setGeneratedDoc(false);
    setSignatureLink('');
    try {
      const resp = await axios.post('/api/documents/generate-ai', formData);
      const { success, rawContent } = resp.data;
      if (!success) throw new Error('Falha na geração');
      const html = '<p style="margin-bottom:1em;">' + markdownToHtml(rawContent) + '</p>';
      // Guardamos o HTML na ref e injetamos direto no editor (modo não-controlado)
      initialHtmlRef.current = html;
      // Injeta no editor assim que ele estiver montado
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
      // Pequeno delay para garantir que o iframe do Jodit já iniciou
      setTimeout(() => {
        if (editorRef.current) editorRef.current.value = initialHtmlRef.current;
      }, 150);
    }
  }, [generatedDoc]);

  // Lê conteúdo sempre direto do editor (não do state) — preserva imagens base64
  const getCurrentContent = useCallback(() => {
    return editorRef.current?.value ?? '';
  }, []);

  const handleDownloadProfessionalPDF = async () => {
    const content = getCurrentContent();
    if (!content) return;
    setIsGeneratingPdf(true);
    
    try {
      const wrapper = document.createElement('div');
      // Não damos margin/padding extra no div pai principal porque o html2pdf vai aplicar nas páginas isoladas
      wrapper.style.cssText = 'width:100%;font-family:Times New Roman,serif;color:#000;background:#fff;';

      wrapper.innerHTML = `
        <style>
          .doc h1,.doc h2,.doc h3 { text-align:center!important; font-weight:bold!important; margin:1.2em 0 0.6em; }
          .doc p { margin-bottom:0.8em; text-align:justify; line-height:1.6; }
          .doc img { max-width:100%!important; height:auto!important; display:block; margin:8px auto; }
          .doc table { width:100%; border-collapse:collapse; margin-bottom:1em; }
          .doc td,.doc th { border:1px solid #000; padding:6px 8px; }
        </style>
        <div class="doc" style="font-size:12pt;">
          ${content}
        </div>
      `;

      // Passamos o html2pdf() com configuração ABNT exata. 
      // margin: [top, right, bottom, left]
      await html2pdf().set({
        margin: [30, 20, 20, 30], // Margens ABNT fixas em CADA página que ele fatiar
        filename: `Juscore_${(formData.title || 'Documento').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // IMPORTANTÍSSIMO: impede que parágrafos inteiros, fotos ou tabelas sejam cortados no meio pela quebra de página
        pagebreak: { mode: 'css', avoid: ['.doc p', '.doc h1', '.doc h2', '.doc h3', '.doc img', 'table', '.doc > div'] }
      }).from(wrapper).toPdf().get('pdf').then(function(pdf) {
        // Intercepta o PDF cru para desenhar o número das páginas em todas elas manualmente!
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          // Adiciona a numeração no meio inferior de cada folha (x=105mm no padrão A4, y=285mm)
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
      try { await navigator.clipboard.writeText(url); } catch (_) {}
      alert('Link gerado e copiado!');
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar link de assinatura.');
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <div className="w-full xl:max-w-screen-2xl mx-auto pb-20 px-4 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          Gerador de Documentos IA
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
          Crie peças jurídicas profissionais em segundos com IA. Configure o papel timbrado, vincule um processo e exporte em PDF padrão CNJ/ABNT.
        </p>
      </div>

      {/* Grid: Formulário + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Formulário principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
            <form onSubmit={handleGenerate} className="space-y-6">

              {/* Branding */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Identificação & Timbrado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título do Documento</label>
                    <Input required placeholder="Ex: Petição Inicial, Contrato de Honorários..."
                      value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      className="bg-gray-50 dark:bg-gray-900/50" />
                  </div>

                  {/* Logo */}
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo do Escritório</label>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900",
                        logoPreview && "border-solid border-accent/40"
                      )}>
                        {logoPreview
                          ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                          : <Upload className="w-6 h-6 text-gray-300" />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input type="file" id="logo-upload" hidden accept="image/*" onChange={handleLogoUpload} />
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload').click()}>
                          Selecionar Logo
                        </Button>
                        {logoPreview && (
                          <button type="button" onClick={() => { setLogoPreview(null); setFormData(p => ({ ...p, logo: '' })); }}
                            className="text-xs text-red-500 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campos do advogado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:col-span-2">
                    {[
                      { label: 'Nome do Advogado(a)', key: 'lawyerName', placeholder: 'Nome completo' },
                      { label: 'Número da OAB', key: 'oabNumber', placeholder: 'UF000000' },
                      { label: 'Escritório / Banca', key: 'officeName', placeholder: 'Nome do escritório' },
                      { label: 'Data do Documento', key: 'date', placeholder: 'Local, data...' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                        <Input placeholder={placeholder} value={formData[key]}
                          onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                          className="bg-gray-50 dark:bg-gray-900/50" />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> Endereço Profissional
                      </label>
                      <Input placeholder="Rua, Número, Bairro, Cidade - UF" value={formData.address}
                        onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                        className="bg-gray-50 dark:bg-gray-900/50" />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-700" />

              {/* IA */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Inteligência Artificial & Contexto
                </h3>

                {/* Processo */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" /> Vincular Processo (Opcional)
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent transition-all"
                    value={formData.processId}
                    onChange={e => setFormData(p => ({ ...p, processId: e.target.value }))}>
                    <option value="">Nenhum processo vinculado</option>
                    {processes.map(p => (
                      <option key={p.id} value={p.id}>{p.numero} - {p.Client?.nome || 'Manual'}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    Ao vincular um processo, a IA terá acesso aos nomes das partes e histórico para maior precisão.
                  </p>
                </div>

                {/* Templates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estruturas Sugeridas</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {documentTemplates.map((tpl, i) => (
                      <button key={i} type="button" onClick={() => handleTemplateSelect(tpl)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition-all flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />{tpl.label}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instruções para a IA (Prompt)</label>
                  <textarea required
                    placeholder="Descreva o que deseja no documento. Ex: 'Escreva uma contestação por danos morais em face da empresa X...'"
                    className="w-full min-h-[140px] rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                    value={formData.prompt}
                    onChange={e => setFormData(p => ({ ...p, prompt: e.target.value }))} />
                </div>
              </div>

              <Button type="submit" disabled={loading}
                className="w-full h-14 text-lg font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform">
                {loading
                  ? <><div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin" /> Redigindo Documento...</>
                  : <><Sparkles className="w-6 h-6" /> Gerar Documento Profissional</>}
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-juri-900 to-juri-950 text-white border-none shadow-xl">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" /> Padrões Garantidos
            </h3>
            <ul className="space-y-3 text-sm text-juri-200">
              {[
                ['Margens ABNT', 'Superior/Esquerda: 3cm | Inferior/Direita: 2cm'],
                ['Timbrado Profissional', 'Logo, dados do advogado e assinatura automáticos'],
                ['Exportação Fiel', 'O PDF exporta exatamente o que você editou'],
                ['Formatação Rica', 'Negrito, itálico, tabelas e imagens no PDF'],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                  <span><strong>{t}</strong>: {d}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border-none shadow-lg">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" /> Aviso
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              O conteúdo gerado por IA deve ser revisado por um advogado habilitado antes do protocolo judicial.
            </p>
          </Card>

          {generatedDoc && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800 flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg text-white shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-700 dark:text-green-400">Documento Gerado!</p>
                <p className="text-xs text-green-600 dark:text-green-500">Role a tela para editar e baixar o PDF.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Editor de Documento (full width abaixo do grid) ─── */}
      {generatedDoc && (
        <Card id="editor-section" className="mt-10 w-full bg-white dark:bg-gray-800 border-2 border-accent/20 shadow-2xl animate-in slide-in-from-bottom fade-in duration-500 overflow-hidden">

          {/* Barra do editor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Editor de Documento
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Edite livremente — imagens, tabelas, formatação. O PDF exportará exatamente o que você ver.
              </p>
            </div>
            <Button onClick={handleDownloadProfessionalPDF} disabled={isGeneratingPdf}
              className="flex items-center gap-2 shrink-0">
              {isGeneratingPdf
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Gerando...</>
                : <><Download className="w-4 h-4" /> Baixar PDF Padrão CNJ</>}
            </Button>
          </div>

          {/* Editor de Documento — CustomDocEditor nativo (contentEditable) */}
          <CustomDocEditor ref={editorRef} />

          {/* Assinatura */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {signatureLink ? (
              <div className="p-4 bg-accent/10 rounded-xl border border-accent/20 flex flex-col gap-2">
                <span className="text-sm font-semibold text-accent">Link Público de Assinatura:</span>
                <div className="flex gap-2">
                  <Input value={signatureLink} readOnly className="font-mono text-xs bg-white dark:bg-gray-900" />
                  <Button onClick={() => navigator.clipboard.writeText(signatureLink)} variant="outline" className="shrink-0">
                    Copiar
                  </Button>
                </div>
                <span className="text-xs text-gray-400 italic">Envie pelo WhatsApp para a parte assinar digitalmente.</span>
              </div>
            ) : (
              <Button onClick={handleCreateSignatureLink} disabled={generatingLink}
                className="w-full py-5 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-black hover:to-gray-800 text-white">
                {generatingLink
                  ? <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
                  : <LinkIcon className="w-4 h-4" />}
                {generatingLink ? 'Gerando Link...' : 'Gerar Link Público para Assinatura do Cliente'}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DocumentGenerator;
