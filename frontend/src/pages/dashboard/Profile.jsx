import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, Modal } from '../../components/ui';
import { User, Mail, Save, Lock, Crop, X, Check, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import Cropper from 'react-easy-crop';

// Utility to create the cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

// --- VALIDATORS ---
const isValidCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let add = 0, rev = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  return true;
};

const isValidCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0, pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};
// ------------------

const Profile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    apelido: user?.apelido || '',
    cpf: user?.cpf || '',
    telefone: user?.telefone || '',
    cargo: user?.cargo || '',
    currentPassword: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Image Upload States
  const [selectedImage, setSelectedImage] = useState(null); // File object or URL
  const [previewUrl, setPreviewUrl] = useState(null); // Validated preview URL
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // Cancel Subscription States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingSub, setCancelingSub] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setIsCropping(true);
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const cancelImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setIsCropping(false);
  };

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      setPreviewUrl(croppedImage);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
    }
  };

  const saveImage = async () => {
    if (!previewUrl) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/auth/profile', { image: previewUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      setPreviewUrl(null);
      setSelectedImage(null);
      setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao salvar foto.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate Document
    if (formData.cpf) {
      const doc = formData.cpf.replace(/\D/g, '');
      if (doc.length === 11 && !isValidCPF(doc)) {
        setMessage({ type: 'error', text: 'O CPF informado é inválido.' });
        setLoading(false);
        return;
      } else if (doc.length === 14 && !isValidCNPJ(doc)) {
        setMessage({ type: 'error', text: 'O CNPJ informado é inválido.' });
        setLoading(false);
        return;
      } else if (doc.length !== 11 && doc.length !== 14) {
        setMessage({ type: 'error', text: 'O documento deve ter 11 (CPF) ou 14 (CNPJ) números.' });
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setUser(res.data.user); 
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar. Verifique sua senha atual.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelingSub(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/payments/cancel_subscription', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: res.data.message || 'Sua assinatura foi cancelada.' });
      setShowCancelModal(false);
      
      // Update local user state
      if (res.data.message && res.data.message.includes("final do ciclo")) {
         setUser({
            ...user,
            cancelAtPeriodEnd: true
         });
      } else {
         setUser({
            ...user,
            subscriptionStatus: 'canceled',
            subscriptionPlan: 'free',
            tipo: 'free',
            cancelAtPeriodEnd: false
         });
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Erro ao cancelar assinatura. Tente novamente mais tarde.';
      setMessage({ type: 'error', text: errorMsg });
      setShowCancelModal(false);
    } finally {
      setCancelingSub(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>

      <Card className="p-6 relative">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-bold border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : user?.foto ? (
                  <img src={user.foto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.nome?.charAt(0).toUpperCase()
                )}
              </div>
              
              {!previewUrl && !isCropping && (
                <label className="cursor-pointer text-xs text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-2 py-1 rounded hover:bg-primary-100 transition-colors">
                  Alterar Foto
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}

              {previewUrl && (
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={saveImage}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                  >
                    <Check className="w-3 h-3" /> Salvar
                  </button>
                  <button 
                    type="button"
                    onClick={cancelImage}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" /> Cancelar
                  </button>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.nome}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user?.tipo || 'Usuário'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
            />
            <Input
              label="Apelido / Tratamento"
              name="apelido"
              placeholder="Como quer ser chamado"
              value={formData.apelido}
              onChange={handleChange}
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              className="opacity-70 cursor-not-allowed"
            />
             <Input
              label="CPF / CNPJ (Apenas Números)"
              name="cpf"
              placeholder="Digite apenas os números"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
              maxLength={14}
            />
             <Input
              label="WhatsApp / Celular"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={handleChange}
            />
            <div className="w-full">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Cargo / Ocupação
              </label>
              <div className="relative">
                <select
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none transition-all duration-200 border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 px-4 py-3 appearance-none"
                >
                  <option value="" disabled>Selecione sua ocupação</option>
                  <option value="Advogado">Advogado</option>
                  <option value="Estudante de Direito">Estudante de Direito</option>
                  <option value="Juiz">Juiz</option>
                  <option value="Promotor">Promotor</option>
                  <option value="Defensor Público">Defensor Público</option>
                  <option value="Bacharel em Direito">Bacharel em Direito</option>
                  <option value="Servidor Público">Servidor Público</option>
                  <option value="Outro">Outro</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Alterar Senha
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Nova Senha"
                name="newPassword"
                type="password"
                placeholder="Deixe em branco para manter"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" icon={Save} isLoading={loading}>
              Salvar Alterações
            </Button>
          </div>
        </form>

        {user?.subscriptionPlan !== 'free' && user?.subscriptionStatus !== 'cancelled' && user?.subscriptionStatus !== 'canceled' && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
              Assinatura Premium
            </h3>
            {user?.cancelAtPeriodEnd ? (
               <div className="bg-amber-50 dark:bg-amber-900/30 p-4 border border-amber-200 dark:border-amber-700/50 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
                 Sua assinatura está programada para ser cancelada ao final do ciclo de faturamento atual. Você manterá acesso a todos os recursos premium até lá. Nenhum novo cartão ou boleto será gerado.
               </div>
            ) : (
               <>
                 <p className="text-sm text-gray-500 mb-4">
                   Ao cancelar sua assinatura, você deixará de ser cobrado nos próximos meses. Seu acesso será mantido até o final do período que já foi pago.
                 </p>
                 <Button 
                   type="button" 
                   variant="outline" 
                   className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                   onClick={() => setShowCancelModal(true)}
                 >
                   Cancelar Assinatura
                 </Button>
               </>
            )}
          </div>
        )}

        {/* Cancel Subscription Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => !cancelingSub && setShowCancelModal(false)}
          title="Cancelar Assinatura"
        >
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
              Tem certeza que deseja cancelar?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Você não será mais cobrado. O acesso aos recursos do seu plano atual será mantido apenas até o fim do ciclo já faturado. Tem certeza?
            </p>
            <div className="flex gap-3 mt-6 w-full pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelingSub}
              >
                Manter Assinatura
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancelSubscription}
                isLoading={cancelingSub}
              >
                Sim, quero cancelar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Image Cropper Modal */}
        {isCropping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Crop className="w-5 h-5" /> Ajustar Foto
                </h3>
                <button onClick={cancelImage} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="relative h-64 bg-gray-900">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={true}
                />
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <ZoomOut className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                  />
                  <ZoomIn className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex gap-3 justify-end">
                   <Button variant="outline" onClick={cancelImage}>
                     Cancelar
                   </Button>
                   <Button onClick={handleCropConfirm}>
                     Aplicar Corte
                   </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Profile;

// End of component
