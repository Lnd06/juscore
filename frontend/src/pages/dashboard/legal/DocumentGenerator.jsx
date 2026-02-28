import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input } from '../../../components/ui';
import { 
  FileText, 
  Upload, 
  Briefcase, 
  User, 
  MapPin, 
  Sparkles, 
  Download, 
  Eye,
  AlertCircle,
  CheckCircle2,
  Building2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../../context/AuthContext';

const DocumentGenerator = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    lawyerName: user?.nome || '',
    officeName: user?.organization?.name || '',
    oabNumber: user?.oab || '',
    address: '',
    date: new Date().toLocaleDateString('pt-BR'),
    prompt: '',
    processId: '',
    logo: '' // base64
  });

  const [generatedDoc, setGeneratedDoc] = useState(null);

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
      label: 'Contrato de Honorários',
      title: 'Contrato de Honorários Advocatícios',
      prompt: 'Gere um contrato de prestação de serviços advocatícios contendo as cláusulas: 1. Qualificação das partes; 2. Objeto do contrato; 3. Dos Honorários (valor, forma de pagamento e honorários de sucumbência); 4. Das Despesas Processuais; 5. Das Obrigações das partes; 6. Rescisão e Foro de eleição. O objeto principal é: [INSERIR OBJETO DO CONTRATO]'
    },
    {
      label: 'Recurso de Apelação',
      title: 'Recurso de Apelação',
      prompt: 'Escreva um Recurso de Apelação contendo: 1. Folha de interposição para o juízo a quo (tempestividade, cabimento e preparo); 2. Razões do Recurso para o juízo ad quem (Egrégio Tribunal); 3. Breve síntese da demanda; 4. Da reforma da sentença judicial e Fundamentação Jurisprudencial; 5. Dos Pedidos de provimento. O recurso se baseia em: [INSERIR MOTIVO DA APELAÇÃO]'
    }
  ];

  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      prompt: template.prompt
    }));
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      const response = await axios.get('/api/processes');
      setProcesses(response.data);
    } catch (err) {
      console.error('Erro ao buscar processos:', err);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A logo deve ter no máximo 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.prompt) return;

    setLoading(true);
    setGeneratedDoc(null);
    
    try {
      const response = await axios.post('/api/documents/generate-ai', formData);

      const { pdf, filename, success } = response.data;
      
      if (!success || !pdf) {
        throw new Error('Falha na geração do PDF');
      }

      // Converte Base64 para Blob
      const byteCharacters = atob(pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Criar URL e disparar download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);
      
      setGeneratedDoc(true);
    } catch (err) {
      console.error('Erro ao gerar documento:', err);
      alert('Erro ao gerar documento. Verifique seu limite diário e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          Gerador de Documentos IA
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
          Crie peças jurídicas profissionais em segundos. Configure seu papel timbrado, 
          vincule um processo para dar contexto à IA e gere documentos prontos seguindo as normas ABNT.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Branding Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Identificação e Branding
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título do Documento</label>
                    <Input 
                      required
                      placeholder="Ex: Petição Inicial, Contrato de Honorários..." 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="bg-gray-50 dark:bg-gray-900/50"
                    />
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo do Escritório</label>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900",
                        logoPreview && "border-solid border-accent/30"
                      )}>
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                         <input 
                          type="file" 
                          id="logo-upload" 
                          hidden 
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('logo-upload').click()}
                        >
                          Selecionar Logo
                        </Button>
                        {logoPreview && (
                          <button 
                            type="button"
                            onClick={() => {setLogoPreview(null); setFormData({...formData, logo: ''})}}
                            className="text-xs text-red-500 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Advogado(a)</label>
                       <Input 
                         placeholder="Nome completo" 
                         value={formData.lawyerName}
                         onChange={e => setFormData({...formData, lawyerName: e.target.value})}
                         className="bg-gray-50 dark:bg-gray-900/50"
                       />
                     </div>
                     <div className="sm:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número da OAB</label>
                       <Input 
                         placeholder="UF000000" 
                         value={formData.oabNumber}
                         onChange={e => setFormData({...formData, oabNumber: e.target.value})}
                         className="bg-gray-50 dark:bg-gray-900/50"
                       />
                     </div>
                     <div className="sm:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Escritório</label>
                       <Input 
                         placeholder="Nome da banca" 
                         value={formData.officeName}
                         onChange={e => setFormData({...formData, officeName: e.target.value})}
                         className="bg-gray-50 dark:bg-gray-900/50"
                       />
                     </div>
                     <div className="sm:col-span-2">
                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">Data do Documento</label>
                       <Input 
                         placeholder="Local, data..." 
                         value={formData.date}
                         onChange={e => setFormData({...formData, date: e.target.value})}
                         className="bg-gray-50 dark:bg-gray-900/50"
                       />
                     </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Endereço Profissional
                    </label>
                    <Input 
                      placeholder="Rua, Número, Bairro, Cidade - UF" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="bg-gray-50 dark:bg-gray-900/50"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-700" />

              {/* AI Generation Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Inteligência Artificial & Contexto
                </h3>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" /> Vincular Processo (Opcional)
                  </label>
                  <select 
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent transition-all"
                    value={formData.processId}
                    onChange={e => setFormData({...formData, processId: e.target.value})}
                  >
                    <option value="">Nenhum processo vinculado</option>
                    {processes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.numero} - {p.Client?.nome || 'Manual'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    Ao vincular um processo, a IA terá acesso aos nomes das partes, tribunal e histórico para maior precisão.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estruturas Sugeridas</label>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {documentTemplates.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTemplateSelect(tpl)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition-all flex items-center gap-1.5"
                      >
                         <FileText className="w-3 h-3" />
                         {tpl.label}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instruções para a IA (O prompt)</label>
                  <textarea 
                    required
                    placeholder="Descreva o que deseja no documento. Ex: 'Escreva uma contestação por danos morais em face da empresa X, alegando que o cliente nunca contratou o serviço...'" 
                    className="w-full min-h-[150px] rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                    value={formData.prompt}
                    onChange={e => setFormData({...formData, prompt: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 text-lg font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin"></div>
                    Redigindo Documento...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Gerar Documento Profissional
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-juri-900 to-juri-950 text-white border-none shadow-xl">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Padrões Garantidos
            </h3>
            <ul className="space-y-4 text-sm text-juri-200">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <span><strong>Margens Normatizadas</strong>: ABNT (Sup/Esq: 3cm, Inf/Dir: 2cm).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <span><strong>Limpo & Profissional</strong>: Sem marcas d'água ou banners publicitários.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <span><strong>Linguagem Técnica</strong>: Vocabulário jurídico sênior e preciso.</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border-none shadow-lg">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Aviso Importante
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              O conteúdo gerado por IA deve ser revisado por um advogado habilitado. 
              Embora a IA use context de alta precisão, o profissional é o único responsável 
              pelo protocolo e veracidade das informações apresentadas em juízo.
            </p>
          </Card>
          
          {generatedDoc && (
             <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800 flex items-center gap-3 animate-bounce">
                <div className="p-2 bg-green-500 rounded-lg text-white">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">Sucesso!</p>
                  <p className="text-xs text-green-600 dark:text-green-500">O download iniciou automaticamente.</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;
