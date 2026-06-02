import React, { useState } from "react";
import { Check, Star, Zap, Briefcase, Shield, AlertTriangle, Tag, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContextState";
import usePricing from "../../hooks/usePricing";

// Configuração dos Planos
// Configuração dos Planos (Sincronizado com Landing Page)
const PLANS = [
  {
    id: "student_basic",
    name: "Estudante Basic",
    price: 17.90,
    period: "mês",
    description: "Foco em pesquisa acadêmica",
    features: [
      "5 documentos por dia",
      "IA acadêmica avançada",
      "Resumos dinâmicos de matéria",
      "IA ensina como professor",
      "Sem marca d'água"
    ],
    highlight: false,
    color: "gray",
  },
  {
    id: "student_pro",
    name: "Estudante Pro",
    price: 34.00,
    period: "mês",
    description: "OAB, TCC e Estágio",
    features: [
      "Tudo do Estudante Basic",
      "Simuladores de peças OAB (IA)",
      "Assistente completo de TCC",
      "Central Acadêmica exclusiva",
      "IA com Visão (Análise de PDFs)",
      "12 documentos gerados"
    ],
    highlight: true,
    color: "accent",
    icon: <Star className="w-5 h-5 text-accent" />,
  },
  {
    id: "student_master",
    name: "Estudante Pesquisador",
    price: 89.90,
    period: "mês",
    description: "TCCs, Artigos e Doutorado",
    features: [
      "Tudo do Estudante Pro",
      "Deep Research (5/dia)",
      "Análises profundas na Web",
      "Resumo Inteligente de Livros",
      "30 documentos gerados",
      "IA com Raciocínio Avançado"
    ],
    highlight: false,
    color: "purple",
  },
  {
    id: "lawyer_starter",
    name: "Advogado Starter",
    price: 127.00,
    period: "mês",
    description: "Profissional Solo - Gestão Jurídica I.A.",
    features: [
      "Plataforma Solo (1 Usuário)",
      "Gestão de Clientes Avançada",
      "Controle de Processos e Fichas",
      "Análise de Processos por IA",
      "Área Acadêmica Liberada",
      "Cálculos Jurídicos Ilimitados",
    ],
    highlight: false,
    color: "blue",
  },
  {
    id: "lawyer_growth",
    name: "Advogado Growth",
    price: 147.00,
    period: "mês",
    description: "Produtividade Máxima para sua Equipe",
    features: [
      "Até 2 Usuários inclusos (Equipe)",
      "Gerenciador de Documentos por IA",
      "Assinador Duplo de Contratos (PDF)",
      "Dashboard ERP + BI Jurídico",
      "Agenda Completa de Prazos/Eventos",
      "Todas funções do Advogado Starter",
    ],
    highlight: true,
    color: "gold",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
  },
  {
    id: "office_master",
    name: "Escritório Master",
    price: 497.00,
    period: "mês",
    description: "Controle Operacional e Estratégico total",
    features: [
      "Até 4 Usuários Inclusos",
      "Módulo Financeiro (Honorários/Despesas)",
      "Análise de Acervo e Auditoria de Processos por IA",
      "Gestão Completa de Permissões/Perfis",
      "Todos os recursos do Advogado Growth",
      "Histórico de Uso da IA da Equipe",
    ],
    highlight: false,
    color: "purple",
  },
   {
    id: "enterprise",
    name: "Enterprise",
    price: 0, // Sob Consulta
    displayPrice: "Sob Consulta",
    period: "",
    description: "Grandes departamentos e órgãos",
    features: [
      "Usuários Ilimitados",
      "Gestor de Conta Dedicado",
      "Personalização Whitelabel",
      "Treinamento Online",
    ],
    highlight: false,
    color: "black",
    customAction: true // Flag for Contact Us instead of Buy
  },
];

const Subscription = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const { prices, planTexts, visiblePlans, loading: pricesLoading, formatPrice } = usePricing();
  const role = user?.cargo || '';
  const isStudent = role.toLowerCase().includes('estudante') || role.toLowerCase().includes('bacharel');
  const isFreePlan = !user?.subscriptionPlan || user?.subscriptionPlan === 'free' || user?.tipo === 'free';

  const filteredPlans = PLANS
    .filter(plan => {
      if (visiblePlans && !visiblePlans.includes(plan.id)) {
        return false;
      }
      return true;
    })
    .map(plan => {
      const custom = planTexts[plan.id];
      if (!custom || Object.keys(custom).length === 0) return plan;
      return {
        ...plan,
        name: custom.name || plan.name,
        description: custom.description || plan.description,
        features: custom.features ? custom.features.split('\n').filter(Boolean) : plan.features,
      };
    });

  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Checkout States
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null); // { type: 'success'|'error', msg: '', discount: number, typeD: 'PERCENTAGE'|'FIXED', finalPrice: number }
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  React.useEffect(() => {
    if (user?.subscriptionStatus === 'active' && user?.subscriptionId) {
      const fetchSubDetails = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("/api/payments/status", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.active && res.data.nextDueDate) {
            setSubscriptionDetails(res.data);
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes da assinatura:", error);
        }
      };
      fetchSubDetails();
    }
  }, [user]);

  const navigate = useNavigate();

  const getCycleDetails = (months, basePrice) => {
    let discount = 0;
    let cycleName = 'MONTHLY';
    if (months === 3) { discount = 0.03; cycleName = 'QUARTERLY'; }
    if (months === 6) { discount = 0.10; cycleName = 'SEMIANNUALLY'; }
    if (months === 12) { discount = 0.20; cycleName = 'YEARLY'; }
    
    const totalPrice = (basePrice * months) * (1 - discount);
    return { totalPrice, discount, cycleName };
  };

  const handleSelectPlan = (plan) => {
    // 1. Check for custom user price first (Priority)
    // 2. Otherwise use live dynamic price from DB (Prices Hook)
    // 3. Fallback to hardcoded plan price
    let dynamicPrice = plan.price;
    
    if (user?.subscriptionPrice && user.subscriptionPrice > 0) {
      dynamicPrice = user.subscriptionPrice;
    } else if (plan.id !== 'enterprise') {
      dynamicPrice = parseFloat(prices[plan.id] || plan.price);
    }

    setSelectedCycle(1);
    setSelectedPlan({ ...plan, price: dynamicPrice });
    setCouponCode("");
    setCouponStatus(null);
    setShowCheckoutModal(true);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setValidatingCoupon(true);
    setCouponStatus(null);

    // Mocking validation logic for UI demonstration
    // Em Produção, bateríamos no backend: axios.post('/api/payments/verify_coupon', { code: couponCode, planId: selectedPlan.id })
    // Aqui farei uma validação genérica (como OAB20 para 20% OFF) para adiantar o fluxo visual
    try {
      const token = localStorage.getItem("token");
      const code = couponCode.toUpperCase().trim();
      
      const response = await axios.post('/api/payments/verify_coupon', { 
        code: code, 
        planId: selectedPlan.id 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      const discountValue = data.value;
      const typeD = data.type; // 'PERCENTAGE' or 'FIXED'
      const currentTotalPrice = getCycleDetails(selectedCycle, selectedPlan.price).totalPrice;

      let finalP = currentTotalPrice;
      if (typeD === "PERCENTAGE") {
        finalP = finalP - (finalP * (discountValue / 100));
      } else {
        finalP = Math.max(0, finalP - discountValue);
      }

      setCouponStatus({ 
        type: 'success', 
        msg: data.message,
        discount: discountValue,
        typeD: typeD,
        finalPrice: finalP
      });
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      const errorMsg = error.response?.data?.error || "Erro ao validar cupom.";
      setCouponStatus({ type: 'error', msg: errorMsg });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setLoading('checkout');
    try {
      const token = localStorage.getItem("token");
      const { totalPrice, cycleName } = getCycleDetails(selectedCycle, selectedPlan.price);

      const payload = {
          title: `Assinatura JusCore - ${selectedPlan.name} (${selectedCycle > 1 ? selectedCycle + ' Meses' : '1 Mês'})`,
          price: couponStatus?.type === 'success' ? couponStatus.finalPrice : totalPrice,
          planType: selectedPlan.id,
          billingType: "UNDEFINED",
          cycle: cycleName
      };
      
      if (couponStatus?.type === 'success') {
          payload.couponCode = couponCode.toUpperCase();
      }

      const response = await axios.post(
        "/api/payments/create_payment",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.invoiceUrl) {
        window.open(response.data.invoiceUrl, '_blank');
        alert("Pagamento aberto em nova guia!\nQuando pago, retorne para a outra tela.");
        setShowCheckoutModal(false);
      } else {
        alert("Erro: Link de pagamento não gerado.");
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      setShowCheckoutModal(false);
      if (error.response?.data?.missingFields) {
        setShowProfileModal(true);
      } else {
        const errorMsg = error.response?.data?.errors?.[0]?.description || 
                         error.response?.data?.error || 
                         "Erro ao processar pagamento. Tente novamente.";
        alert(errorMsg);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-gray-900 dark:text-gray-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto text-center mb-16">
        {subscriptionDetails && subscriptionDetails.nextDueDate && (
          <div className="mb-8 inline-flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-6 py-3 rounded-full font-medium shadow-lg shadow-green-500/5">
            <Check className="w-5 h-5" />
            Seu plano atual está ativo e a próxima renovação/expiração é em: <strong className="text-green-400">{new Date(new Date(subscriptionDetails.nextDueDate).getTime() + (new Date().getTimezoneOffset() * 60000)).toLocaleDateString("pt-BR")}</strong>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent-light to-accent-DEFAULT bg-clip-text text-transparent">
          Escolha seu Nível de Poder
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Desbloqueie todo o potencial da IA Jurídica com planos desenhados para cada etapa da sua jornada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col h-full rounded-2xl p-8 transition-all duration-300 border-2 ${
              plan.highlight
                ? "bg-brand-bg dark:bg-brand-border/10 border-accent shadow-[0_0_30px_rgba(212,175,55,0.15)] transform md:scale-105 z-10"
                : "bg-brand-bg dark:bg-brand-bg border-brand-border hover:border-accent hover:-translate-y-2"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap z-20">
                Mais Popular
              </div>
            )}

            <div className="mb-6">
              <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? "text-accent-light" : "text-white"}`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1">
                {plan.id !== 'enterprise' && <span className="text-sm text-gray-400 dark:text-gray-500">R$</span>}
                <span className="text-4xl font-extrabold text-white">
                    {user?.subscriptionPrice && user.subscriptionPrice > 0 && plan.id !== 'enterprise'
                      ? user.subscriptionPrice.toFixed(2).replace('.', ',')
                      : (plan.displayPrice || formatPrice(plan.id))}
                </span>
                {plan.period && <span className="text-sm text-gray-400 dark:text-gray-500">/{plan.period}</span>}
              </div>
              <p className="text-gray-400 dark:text-gray-500 mt-3 text-sm min-h-[40px]">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? "text-accent-DEFAULT" : "text-juri-500"}`} />
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => plan.customAction 
                ? window.open('https://wa.me/5511999999999?text=Olá,%20tenho%20interesse%20no%20Plano%20Enterprise%20do%20JusCore%20AI', '_blank') 
                : handleSelectPlan(plan)
              }
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all mt-auto ${
                plan.highlight
                  ? "bg-accent text-juri-950 hover:bg-white hover:text-accent shadow-lg shadow-accent/25"
                  : "bg-juri-800 text-white hover:bg-juri-700 border border-juri-700 hover:border-juri-600"
              }`}
            >
              {plan.customAction ? "Fale Conosco" : "Começar Agora"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center border-t border-brand-border dark:border-brand-border/50 pt-12">
        <h3 className="text-2xl font-bold mb-8 text-white">Dúvidas Frequentes</h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          <div>
            <h4 className="font-bold text-accent-light mb-2">Posso cancelar quando quiser?</h4>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Sim, sem fidelidade. Você pode cancelar sua assinatura a qualquer momento direto pelo painel.</p>
          </div>
          <div>
            <h4 className="font-bold text-accent-light mb-2">A IA tem acesso a leis atualizadas?</h4>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              O JusCore AI monitora fontes públicas (DOU e Planalto). Embora busquemos precisão em tempo real, 
              <strong> recomendamos sempre conferir a publicação oficial no Diário Oficial da União</strong> para prazos processuais críticos.
            </p>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        title="Quase lá! 🚀"
      >
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Preencha seus dados de faturamento
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Para gerarmos a sua cobrança e emitirmos a nota fiscal da sua assinatura, precisamos que você informe o seu <strong>CPF ou CNPJ</strong> e <strong>Telefone</strong> no seu perfil.
          </p>
          <div className="flex gap-3 mt-6 w-full pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowProfileModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="w-full bg-accent hover:bg-accent-dark text-white"
              onClick={() => navigate("/dashboard/profile")}
            >
              Completar Perfil
            </Button>
          </div>
        </div>
      </Modal>

      {/* Checkout/Cupom Modal */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => !loading && setShowCheckoutModal(false)}
        title="Resumo do Pedido"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {/* Cycle Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[1, 3, 6, 12].map(months => {
                const details = getCycleDetails(months, selectedPlan.price);
                const isSelected = selectedCycle === months;
                return (
                  <button
                    key={months}
                    onClick={() => { setSelectedCycle(months); setCouponStatus(null); setCouponCode(""); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected ? 'border-accent bg-accent/10' : 'border-gray-200 dark:border-gray-700 hover:border-accent/50'
                    }`}
                  >
                    <span className={`font-bold ${isSelected ? 'text-accent' : 'text-gray-700 dark:text-gray-300'}`}>
                      {months === 1 ? 'Mensal' : months === 3 ? 'Trimestral' : months === 6 ? 'Semestral' : 'Anual'}
                    </span>
                    {months > 1 && (
                      <span className="text-xs text-green-600 dark:text-green-500 font-medium">-{details.discount * 100}% off</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                 <h4 className="font-bold text-lg text-gray-900 dark:text-white">Plano {selectedPlan.name}</h4>
                 <p className="text-sm text-gray-500">Acesso Premium ({selectedCycle > 1 ? selectedCycle + ' Meses' : 'Mensal'})</p>
              </div>
              <div className="text-right">
                 <span className="text-sm text-gray-500 line-through block">
                    {couponStatus?.type === 'success' ? `R$ ${getCycleDetails(selectedCycle, selectedPlan.price).totalPrice.toFixed(2).replace('.', ',')}` : ''}
                 </span>
                 <span className="text-2xl font-black text-accent-dark dark:text-accent">
                    R$ {couponStatus?.type === 'success' 
                        ? couponStatus.finalPrice.toFixed(2).replace('.', ',') 
                        : getCycleDetails(selectedCycle, selectedPlan.price).totalPrice.toFixed(2).replace('.', ',')}
                 </span>
                 {selectedCycle > 1 && (
                    <span className="text-xs text-green-600 dark:text-green-500 block mt-1 font-medium">
                      Equivale a R$ {(couponStatus?.type === 'success' 
                        ? couponStatus.finalPrice / selectedCycle 
                        : getCycleDetails(selectedCycle, selectedPlan.price).totalPrice / selectedCycle).toFixed(2).replace('.', ',')}/mês
                    </span>
                 )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Possui um Cupom de Desconto?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Digite o código"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-accent uppercase"
                    disabled={validatingCoupon || loading}
                  />
                </div>
                <Button 
                  onClick={validateCoupon} 
                  disabled={!couponCode.trim() || validatingCoupon || loading}
                  className="whitespace-nowrap bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {validatingCoupon ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Aplicar'}
                </Button>
              </div>
              
              {couponStatus && (
                <p className={`text-sm mt-2 flex items-center gap-1 ${couponStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {couponStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {couponStatus.msg}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button 
                onClick={handleSubscribe} 
                isLoading={loading === 'checkout'}
                className="w-full bg-accent hover:bg-accent-dark py-4 text-base"
                size="lg"
              >
                Gerar Pagamento Seguro
              </Button>
              <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Transação processada com segurança via Asaas
              </p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Subscription;
