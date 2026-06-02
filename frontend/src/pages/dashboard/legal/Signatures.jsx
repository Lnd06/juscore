/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input } from '../../../components/ui';
import SignatureCanvas from 'react-signature-canvas';
import {
  FileSignature, Link as LinkIcon, CheckCircle2, Clock, Trash2, ShieldCheck,
  Eye, DownloadCloud, PenTool, Type, Eraser, Hash, Fingerprint, Mail,
  Phone, User, Copy, Check, Shield, XCircle, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Signatures = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [signingRequestId, setSigningRequestId] = useState(null);
  const [verifyData, setVerifyData] = useState(null);

  // Lawyer Signature States
  const sigCanvas = useRef(null);
  const [signMode, setSignMode] = useState('draw');
  const [lawyerName, setLawyerName] = useState('');
  const [selectedFont, setSelectedFont] = useState('Dancing Script');
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  const signatureFonts = [
    { family: 'Dancing Script', label: 'Clássica' },
    { family: 'Pacifico', label: 'Casual' },
    { family: 'Caveat', label: 'Elegante' },
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

  useEffect(() => { fetchRequests(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta solicitação?')) return;
    try {
      await axios.delete(`/api/signatures/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchRequests();
    } catch { alert('Erro ao cancelar.'); }
  };

  const copyToClipboard = (docToken, id) => {
    const link = `${window.location.origin}/sign/${docToken}`;
    const dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.value = link;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (docToken) => {
    try {
      const response = await axios.get(`/api/signatures/public/${docToken}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrato_assinado.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert("Não foi possível baixar o PDF."); }
  };

  const handleVerify = async (id) => {
    try {
      const response = await axios.get(`/api/signatures/${id}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerifyData(response.data);
      setVerifyModalOpen(true);
    } catch { alert("Erro ao verificar documento."); }
  };

  const handleOpenSignModal = (id) => {
    setSigningRequestId(id);
    setSignMode('draw');
    setLawyerName('');
    setIsCanvasEmpty(true);
    setSignModalOpen(true);
  };

  const handleClearSignature = () => { sigCanvas.current?.clear(); setIsCanvasEmpty(true); };

  const handleSaveLawyerSignature = async () => {
    if (signMode === 'draw' && isCanvasEmpty) { alert("Desenhe sua assinatura."); return; }
    if (signMode === 'type' && !lawyerName.trim()) { alert("Digite seu nome."); return; }

    try {
      let signatureImage = null;
      if (signMode === 'draw') {
        signatureImage = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 500; canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `36px "${selectedFont}", cursive`;
        ctx.fillText(lawyerName, 250, 60);
        signatureImage = canvas.toDataURL('image/png');
      }

      await axios.post(`/api/signatures/${signingRequestId}/sign-lawyer`, { signatureImage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Assinatura salva com sucesso!');
      setSignModalOpen(false);
      fetchRequests();
    } catch { alert("Erro ao salvar assinatura."); }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      ASSINADO: { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'ASSINADO' },
      PENDENTE: { icon: Clock, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'AGUARDANDO' },
      RECUSADO: { icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'RECUSADO' },
      EXPIRADO: { icon: Clock, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'EXPIRADO' },
    };
    const c = config[status] || config.PENDENTE;
    const Icon = c.icon;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono border ${c.color}`}>
        <Icon className="w-3.5 h-3.5" /> {c.label}
      </div>
    );
  };

  const formatDoc = (cpf) => {
    if (!cpf) return '—';
    if (cpf.length === 14) return cpf.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold dark:text-white text-gray-900 flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl">
            <FileSignature className="w-6 h-6 text-accent" />
          </div>
          Assinaturas Eletrônicas
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gerencie documentos com assinatura eletrônica criptografada e verificável.
        </p>
      </div>

      {/* Stats Row */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: requests.length, icon: FileSignature, color: 'text-blue-400 bg-blue-500/10' },
            { label: 'Assinados', value: requests.filter(r => r.status === 'ASSINADO').length, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
            { label: 'Pendentes', value: requests.filter(r => r.status === 'PENDENTE').length, icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
            { label: 'Verificados', value: requests.filter(r => r.signatureHash).length, icon: Shield, color: 'text-purple-400 bg-purple-500/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold dark:text-white text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="p-0 overflow-hidden bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/30 rounded-2xl flex items-center justify-center mb-4">
              <FileSignature className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhuma solicitação</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              Gere um documento na aba "Gerador de Docs" e clique em "Solicitar Assinatura" para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {requests.map(req => (
              <div key={req.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Status + Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={req.status} />
                      {req.verificationCode && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          #{req.verificationCode}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{req.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Criado em {format(new Date(req.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Center: Signer Info */}
                  <div className="flex-shrink-0">
                    {req.status === 'ASSINADO' ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <User className="w-3 h-3 text-emerald-500" /> {req.signerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> {formatDoc(req.signerCpf)}
                        </div>
                        {req.signerEmail && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Mail className="w-3 h-3 text-blue-400" /> {req.signerEmail}
                          </div>
                        )}
                        {req.signerPhone && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="w-3 h-3 text-blue-400" /> {req.signerPhone}
                          </div>
                        )}
                        {req.signatureHash && (
                          <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                            <Fingerprint className="w-3 h-3 text-purple-400" /> {req.signatureHash.slice(0, 16)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Aguardando signatário</span>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {req.status === 'PENDENTE' && (
                      <>
                        <Button size="sm" onClick={() => handleOpenSignModal(req.id)}
                          className="bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 font-semibold transition-all text-xs px-3"
                          title="Minha Assinatura">
                          <PenTool className="w-3.5 h-3.5 mr-1.5" /> Assinar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(req.token, req.id)}
                          className="border-gray-200 dark:border-gray-600 text-xs px-3" title="Copiar Link">
                          {copiedId === req.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/sign/${req.token}`, '_blank')}
                      className="text-gray-400 hover:text-accent" title="Visualizar">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    {req.status === 'ASSINADO' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleVerify(req.id)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" title="Verificar Integridade">
                          <Fingerprint className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(req.token)}
                          className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" title="Baixar PDF">
                          <DownloadCloud className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(req.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sign Modal (Premium Dark Layout) */}
      <Modal isOpen={signModalOpen} onClose={() => setSignModalOpen(false)} title="Assinatura Eletrônica">
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden mt-2">
          <div className="bg-accent p-4 text-slate-900 text-center">
            <h3 className="text-lg font-black uppercase tracking-wider">Advogado Responsável</h3>
            <p className="text-slate-900/80 text-[10px] font-bold">Autenticação de Documento Jurídico</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <div className="flex bg-slate-900 p-1 rounded-xl mb-3 border border-white/5">
                {[{m:'draw',icon:PenTool,l:'Desenhar'},{m:'type',icon:Type,l:'Digitar'}].map(({m,icon:I,l}) => (
                  <button key={m} onClick={() => setSignMode(m)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                      signMode === m ? 'bg-accent text-slate-900 shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}>
                    <I className="w-4 h-4" /> {l}
                  </button>
                ))}
              </div>

              <div className="border border-slate-700 rounded-xl bg-slate-900 p-2 relative overflow-hidden focus-within:ring-1 focus-within:ring-accent transition-all">
                {signMode === 'draw' ? (
                  <>
                    <div className="bg-white rounded-lg w-full h-40 cursor-crosshair">
                      <SignatureCanvas ref={sigCanvas} penColor="#0f172a"
                        canvasProps={{ className: 'w-full h-full rounded-lg' }}
                        onBegin={() => setIsCanvasEmpty(false)} />
                    </div>
                    <button type="button" onClick={handleClearSignature}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white shadow-md rounded-full p-2 border border-gray-200 transition-colors" title="Limpar Quadro">
                      <Eraser className="w-4 h-4" />
                    </button>
                    <div className="text-center text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-widest">
                      Assine no quadro acima
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <input 
                      placeholder="Seu Nome Completo" 
                      value={lawyerName} 
                      onChange={(e) => setLawyerName(e.target.value)} 
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    />
                    {lawyerName && (
                      <div className="flex gap-2">
                        {signatureFonts.map((f) => (
                          <button key={f.family} type="button" onClick={() => setSelectedFont(f.family)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              selectedFont === f.family ? 'bg-accent/20 text-accent-light border border-accent' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:border-slate-600'
                            }`}>
                            <div className="text-2xl text-white mb-1" style={{ fontFamily: `"${f.family}", cursive` }}>
                              {lawyerName.split(' ')[0]}
                            </div>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleSaveLawyerSignature} 
              className="w-full h-12 bg-accent hover:bg-accent-dark text-slate-900 font-bold rounded-xl text-base transition-all shadow-lg shadow-accent/20">
              <span className="flex items-center justify-center gap-2"><FileSignature className="w-5 h-5" /> Salvar Assinatura</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verify Modal */}
      <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title="Verificação de Integridade">
        {verifyData && (
          <div className="space-y-4 pt-2">
            <div className={`flex items-center gap-3 p-4 rounded-xl ${verifyData.isIntact ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {verifyData.isIntact ? (
                <><ShieldCheck className="w-6 h-6 text-emerald-400" /><div><p className="font-bold text-emerald-400">Documento Íntegro</p><p className="text-xs text-emerald-400/70">O conteúdo não foi alterado desde a criação.</p></div></>
              ) : (
                <><XCircle className="w-6 h-6 text-red-400" /><div><p className="font-bold text-red-400">Integridade Comprometida</p><p className="text-xs text-red-400/70">O conteúdo pode ter sido alterado.</p></div></>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Hash className="w-4 h-4 text-accent" />
                <span className="font-medium">Código:</span>
                <span className="font-mono text-accent">{verifyData.verificationCode}</span>
              </div>
              {verifyData.signerName && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Assinado por: <strong>{verifyData.signerName}</strong></span>
                </div>
              )}
              {verifyData.signerEmail && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{verifyData.signerEmail}</span>
                </div>
              )}
              {verifyData.documentHash && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-[10px] text-gray-400 mb-1">Document Hash (SHA-512)</p>
                  <p className="font-mono text-[10px] text-gray-500 break-all">{verifyData.documentHash}</p>
                </div>
              )}
              {verifyData.signatureHash && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-[10px] text-gray-400 mb-1">Signature Hash (SHA-512)</p>
                  <p className="font-mono text-[10px] text-gray-500 break-all">{verifyData.signatureHash}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Signatures;
