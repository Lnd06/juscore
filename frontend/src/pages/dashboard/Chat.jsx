import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Building2, GraduationCap, Zap, MoreVertical, FileText, Download, Trash2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import axios from 'axios';

// Hooks & Context
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';

// Modular Components
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import CameraManager from './chat/CameraManager';

// Services
import { convertPdfToImage } from './chat/PdfService';

const Chat = () => {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading, isWaitingResponse, stopGeneration, clearHistory, loadConversation, setMessages, addMessage } = useChat();
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedModel, setSelectedModel] = useState('company');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [facingMode, setFacingMode] = useState('environment');
  const [isDocMode, setIsDocMode] = useState(false);
  
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const attachMenuRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('sessionId');
  const [localSessionId, setLocalSessionId] = useState(sessionIdParam);

  const models = [
    { id: 'company', label: 'Empresa', icon: Building2, desc: 'Maior precisão (Jurídico)' },
    { id: 'student', label: 'Estudante', icon: GraduationCap, desc: 'Visão + Texto' },
    { id: 'economy', label: 'Econômico', icon: Zap, desc: 'Respostas rápidas' },
  ];

  // Sync state with URL param
  useEffect(() => {
    setLocalSessionId(sessionIdParam || null);
    
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      setInput(promptParam);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('prompt');
      setSearchParams(newParams, { replace: true });
    }
  }, [sessionIdParam, searchParams, setSearchParams]);

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsModelDropdownOpen(false);
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) setIsAttachMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load conversation
  useEffect(() => {
    if (localSessionId) loadConversation(localSessionId);
    else setMessages([]);
  }, [localSessionId, loadConversation, setMessages]);

  // Load processes for the dropdown
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const res = await axios.get('/api/processes');
        setProcesses(res.data || []);
      } catch (err) {
      }
    };
    fetchProcesses();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLaunchFile = (e) => {
    if (e.target.files) {
      const file = e.target.files[0];
      if (file) {
        if (file.type === 'application/pdf') {
          setIsProcessingFile(true);
          const currentPlan = user?.subscriptionPlan || 'free';
          convertPdfToImage(file, currentPlan)
            .then(img => setSelectedImage(img))
            .catch(err => {
              if (err.response?.data?.message) {
                // Capturar mensagem amigável do backend (ex: limite de uso)
                addMessage("system", err.response.data.message);
              } else {
                addMessage(
                  "system",
                  "Erro ao processar o PDF. Verifique o arquivo ou tente novamente."
                );
              }
            })
            .finally(() => setIsProcessingFile(false));
        } else {
          const reader = new FileReader();
          reader.onloadend = () => setSelectedImage(reader.result);
          reader.readAsDataURL(file);
        }
      }
    } else {
      fileInputRef.current.click();
    }
    setIsAttachMenuOpen(false);
  };

  const handleLaunchCamera = async () => {
    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } }
        });
        setFacingMode('environment');
      } catch (e) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setFacingMode('user');
      }

      setStream(mediaStream);
      setShowCamera(true);
      setIsAttachMenuOpen(false);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch (err) {
      alert("Não foi possível acessar a câmera: " + err.message);
    }
  };

  const handleSwitchCamera = async () => {
    if (videoDevices.length < 2) return;
    
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    
    if (stream) stream.getTracks().forEach(track => track.stop());
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacingMode } }
      });
      setStream(mediaStream);
      setFacingMode(newFacingMode);
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
      } catch (fallbackErr) {
        alert("Erro ao trocar de câmera");
      }
    }
  };

  const handleStopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setShowCamera(false);
  };

  const handleCapture = () => {
    const video = document.querySelector('video');
    const canvas = document.createElement('canvas');
    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      setSelectedImage(canvas.toDataURL('image/jpeg', 0.8));
      handleStopCamera();
    }
  };

  const handleExportTXT = () => {
    const text = messages.map(m => {
        const content = Array.isArray(m.content) 
            ? m.content.find(c => c.type === 'text')?.text || '' 
            : m.content || '';
        return `${m.role === 'user' ? 'Você' : 'JusCore AI'}: ${content}`;
    }).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    setIsMenuOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    
    doc.setFontSize(16);
    doc.text("Histórico de Conversa - JusCore AI", 10, y);
    y += 10;
    
    doc.setFontSize(12);
    messages.forEach(m => {
      const sender = m.role === 'user' ? 'Você' : 'JusCore AI';
      const content = Array.isArray(m.content) 
          ? m.content.find(c => c.type === 'text')?.text || '' 
          : m.content || '';
      
      const lines = doc.splitTextToSize(`${sender}: ${content}`, 180);
      
      if (y + lines.length * 7 > 280) {
        doc.addPage();
        y = 10;
      }
      
      doc.text(lines, 10, y);
      y += lines.length * 7 + 5;
    });

    doc.save(`chat-history-${new Date().toISOString().slice(0,10)}.pdf`);
    setIsMenuOpen(false);
  };

  const handleSend = async () => {
    if ((input.trim() || selectedImage) && !isLoading && !isProcessingFile) {
      const effectiveModel = isDocMode ? 'document' : selectedModel;
      const textToSend = input;
      const imageToSend = selectedImage;
      
      setInput('');
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Se não temos um sessionId local, enviamos null para o backend gerar um novo
      const effectiveSessionId = localSessionId || null;
      
      const newSessionId = await sendMessage(textToSend, imageToSend, effectiveModel, effectiveSessionId, selectedProcess);
      
      // Sempre atualizar a URL se for uma nova sessão
      if (newSessionId && newSessionId !== localSessionId) {
        setLocalSessionId(newSessionId);
        setSearchParams({ sessionId: newSessionId }, { replace: true });
      }
    }
  };

  const plan = user?.subscriptionPlan || 'free';
  const role = user?.cargo || '';
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const isProfessional = role === 'Advogado(a)' || role === 'Empresa';
  const hasProcessAccess = isPrivileged || (isProfessional && ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(plan));

  return (
    <div className="relative flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Right Actions */}
      <div className="absolute top-6 right-6 z-10" ref={menuRef}>
        <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
        >
            <MoreVertical className="w-5 h-5" />
        </button>
        {isMenuOpen && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-50 duration-200">
                <button 
                onClick={handleExportTXT}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300 transition-all"
                >
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold">Exportar TXT</span>
                </button>
                <button 
                onClick={handleExportPDF}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300 transition-all"
                >
                    <Download className="w-4 h-4" />
                    <span className="text-xs font-bold">Exportar PDF</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                <button 
                onClick={() => { clearHistory(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Limpar Chat</span>
                </button>
            </div>
        )}
      </div>

      {/* Messages */}
      <MessageList 
        messages={messages} 
        bottomRef={bottomRef} 
        setExpandedImage={setExpandedImage} 
        isLoading={isWaitingResponse}
      />

      {/* Input */}
      <ChatInput 
        input={input} setInput={setInput}
        isLoading={isLoading} isProcessingFile={isProcessingFile}
        selectedImage={selectedImage} setSelectedImage={setSelectedImage}
        selectedModel={selectedModel} setSelectedModel={setSelectedModel}
        isModelDropdownOpen={isModelDropdownOpen} setIsModelDropdownOpen={setIsModelDropdownOpen}
        isDocMode={isDocMode} setIsDocMode={setIsDocMode}
        isAttachMenuOpen={isAttachMenuOpen} setIsAttachMenuOpen={setIsAttachMenuOpen}
        isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}
        selectedProcess={selectedProcess} setSelectedProcess={setSelectedProcess}
        processes={processes}
        onSend={handleSend} onStop={stopGeneration} onClear={clearHistory}
        onLaunchCamera={handleLaunchCamera} onLaunchFile={handleLaunchFile}
        textareaRef={textareaRef} dropdownRef={dropdownRef} menuRef={menuRef} 
        attachMenuRef={attachMenuRef} fileInputRef={fileInputRef}
        models={models}
        messages={messages}
        hasProcessAccess={hasProcessAccess}
      />

      {/* Camera Modal */}
      <CameraManager 
        showCamera={showCamera} 
        stream={stream} 
        onStop={handleStopCamera} 
        onCapture={handleCapture}
        onSwitch={handleSwitchCamera}
        videoDevices={videoDevices}
      />

      {/* Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-5xl w-full">
            <button className="absolute -top-12 right-0 text-white hover:text-accent transition-colors">
              <X className="w-8 h-8" />
            </button>
            <img 
              src={expandedImage} 
              alt="Fullscreen" 
              className="w-full h-auto rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
