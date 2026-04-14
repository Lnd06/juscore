import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input } from '../../../components/ui';
import SignatureCanvas from 'react-signature-canvas';
import { FileSignature, Link as LinkIcon, CheckCircle2, Clock, Trash2, ShieldCheck, Eye, DownloadCloud, PenTool, Type, Eraser } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Signatures = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signingRequestId, setSigningRequestId] = useState(null);
  
  // Lawyer Signature States
  const sigCanvas = useRef(null);
  const [signMode, setSignMode] = useState('draw'); // 'draw' | 'type'
  const [lawyerName, setLawyerName] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-signature-1');
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  const signatureFonts = [
    { id: 'font-signature-1', class: 'font-dancing', label: 'Clássica' },
    { id: 'font-signature-2', class: 'font-pacifico', label: 'Casual' },
    { id: 'font-signature-3', class: 'font-caveat', label: 'Elegante' },
  ];

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/signatures', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (err) {
      console.error('Erro ao buscar assinaturas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id) => {
    if(!window.confirm('Tem certeza que deseja cancelar esta solicitação de assinatura?')) return;
    
    try {
      await axios.delete(`/api/signatures/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();
    } catch (err) {
      alert('Erro ao cancelar.');
    }
  };

  const copyToClipboard = (docToken) => {
    // A baseUrl padrão é a origem atual do front
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/sign/${docToken}`;
    
    // Fallback manual temporário
    const dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.value = link;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    
    alert('Link público copiado! Envie para o seu cliente.');
  };

  const handleDownload = async (docToken) => {
    try {
      const response = await axios.get(`/api/signatures/public/${docToken}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrato_assinado.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Não foi possível baixar o PDF.");
    }
  };

  const handleOpenSignModal = (id) => {
    setSigningRequestId(id);
    setSignMode('draw');
    setLawyerName('');
    setIsCanvasEmpty(true);
    setSignModalOpen(true);
  };

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setIsCanvasEmpty(true);
  };

  const handleSaveLawyerSignature = async () => {
    if (signMode === 'draw' && isCanvasEmpty) {
      alert("Por favor, desenhe sua assinatura no quadro em branco.");
      return;
    }

    if (signMode === 'type' && !lawyerName.trim()) {
      alert("Por favor, digite seu nome para a assinatura.");
      return;
    }
    
    try {
      let signatureImage = null;

      if (signMode === 'draw') {
        signatureImage = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      } else if (signMode === 'type') {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let fontFamily = 'Dancing Script';
        if (selectedFont === 'font-signature-2') fontFamily = 'Pacifico';
        if (selectedFont === 'font-signature-3') fontFamily = 'Caveat';
        
        ctx.font = `32px "${fontFamily}", "Times New Roman", serif`;
        ctx.fillText(lawyerName, 200, 50);
        
        signatureImage = canvas.toDataURL('image/png');
      }

      await axios.post(`/api/signatures/${signingRequestId}/sign-lawyer`, { signatureImage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Assinatura salva com sucesso!');
      setSignModalOpen(false);
      fetchRequests(); // Recarrega a lista
    } catch (e) {
      alert("Erro ao salvar assinatura. Tente novamente.");
    }
  };

  const calculateExpiry = (createdAt) => {
    // Como simplificação os links deste MVP não expiram estritamente,
    // Mas informamos que o link é ativo
    return "Ativo";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold dark:text-white text-gray-900 flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent/20 rounded-lg">
            <FileSignature className="w-6 h-6 text-accent" />
          </div>
          Assinaturas e Aceites
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gerencie os documentos enviados para assinatura eletrônica por link público.
        </p>
      </div>

      <Card className="p-0 overflow-hidden bg-white dark:bg-gray-800 border-none shadow-xl">
        {loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <FileSignature className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma solicitação pendente</h3>
             <p className="text-gray-500 max-w-sm mx-auto">
               Gere um documento com a IA na aba de "Gerador de Docs" e clique em "Solicitar Assinatura" para enviar aos seus clientes.
             </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalhes da Assinatura</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      {req.status === 'ASSINADO' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ASSINADO
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium font-mono">
                          <Clock className="w-3.5 h-3.5" /> AGUARDANDO
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">{req.title}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">Validade: {calculateExpiry(req.createdAt)}</div>
                    </td>
                    <td className="p-4">
                      {req.status === 'ASSINADO' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600 dark:text-gray-300 font-mono flex items-center gap-1">
                             <ShieldCheck className="w-3 h-3 text-green-500" />
                             CPF: {req.signerCpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                          </span>
                          <span className="text-[10px] text-gray-400">
                             IP: {req.signerIp}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Pendente</span>
                      )}
                    </td>
                     <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {format(new Date(req.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'PENDENTE' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenSignModal(req.id)}
                              className="bg-accent/10 text-accent hover:bg-accent hover:text-white border-accent/20 font-semibold transition-colors"
                              title="Adicionar Minha Assinatura"
                            >
                              <PenTool className="w-4 h-4 mr-2" />
                              Assinar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyToClipboard(req.token)}
                              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                            >
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Copiar Link
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/sign/${req.token}`, '_blank')}
                          className="text-gray-500 hover:text-accent"
                          title="Visualizar Documento Público"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {req.status === 'ASSINADO' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(req.token)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Baixar Contrato em PDF"
                          >
                            <DownloadCloud className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(req.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Assinatura do Advogado */}
      <Modal 
        isOpen={signModalOpen} 
        onClose={() => setSignModalOpen(false)} 
        title="Minha Assinatura"
      >
        <div className="space-y-4 pt-2">
          
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setSignMode('draw')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                signMode === 'draw' 
                  ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Desenhar
            </button>
            <button
              onClick={() => setSignMode('type')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                signMode === 'type' 
                  ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Type className="w-4 h-4" />
              Digitar
            </button>
          </div>

          {signMode === 'draw' ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Desenhe sua rubrica no quadro abaixo para assinar este documento.</p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: 'w-full h-48 cursor-crosshair'
                  }}
                  onEnd={() => setIsCanvasEmpty(false)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Digite seu nome e escolha o estilo da assinatura.</p>
              <Input
                placeholder="Seu Nome Completo"
                value={lawyerName}
                onChange={(e) => setLawyerName(e.target.value)}
                autoComplete="off"
              />
              
              {lawyerName && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {signatureFonts.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font.id)}
                      className={`p-4 border rounded-lg flex items-center justify-center transition-all bg-white dark:bg-gray-800
                        ${selectedFont === font.id 
                          ? 'border-accent bg-accent/5 ring-1 ring-accent' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <span className={`text-xl text-gray-900 dark:text-white ${font.class}`}>
                        {lawyerName || 'Assinatura'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-6">
          {signMode === 'draw' ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearSignature}
              className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          ) : <div />}
          <Button
            type="button"
            onClick={handleSaveLawyerSignature}
            className="bg-accent hover:bg-accent/90 text-white"
          >
            Salvar Assinatura
          </Button>
        </div>
      </Modal>

    </div>
  );
};

export default Signatures;
