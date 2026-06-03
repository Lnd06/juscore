import express from "express";
import { auth } from "../middleware/auth.js";
import { User, Coupon, Setting } from "../models/index.js";
import { createCustomer, createSubscription } from "../services/asaas.js";

const router = express.Router();

/* =========================
   CRIAR COBRANÇA (Checkout)
========================= */
router.post("/create_payment", auth, async (req, res) => {
  try {
    const { planType, billingType, title, couponCode, cycle } = req.body; // billingType: 'PIX', 'BOLETO', 'CREDIT_CARD'
    const safeCycle = cycle || "MONTHLY";
    console.log(
      `💳 Iniciando Checkout Asaas: User ${req.user.id} | Plano: ${planType} | Ciclo: ${safeCycle}`,
    );

    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate Required Fields for Asaas
    if (!user.cpf || !user.telefone) {
      // Auto-fill from request if provided (e.g. if frontend sends it)
      if (req.body.cpf) user.cpf = req.body.cpf;
      if (req.body.mobilePhone) user.telefone = req.body.mobilePhone;

      if (!user.cpf || !user.telefone) {
        return res.status(400).json({
          error: "CPF / CNPJ e Telefone são obrigatórios. Atualize seu perfil.",
          missingFields: true,
        });
      }
      await user.save(); // Save if updated from request
    }

    // 1. Check Plan Visibility
    const visiblePlansSetting = await Setting.findOne({ where: { key: "visible_plans" } });
    if (visiblePlansSetting && visiblePlansSetting.value) {
      try {
        const visiblePlans = JSON.parse(visiblePlansSetting.value);
        if (Array.isArray(visiblePlans) && !visiblePlans.includes(planType)) {
          return res.status(400).json({ error: "Este plano não está disponível para contratação." });
        }
      } catch (e) {
        console.error("Erro ao validar visible_plans no checkout:", e);
      }
    }

    // 2. Determine Base Price Securely
    const DEFAULT_PRICES = {
      free: 0.0,
      student_basic: 19.9,
      student_pro: 29.9,
      student_master: 59.9,
      lawyer_starter: 127.0,
      lawyer_growth: 147.0,
      office_master: 497.0,
      enterprise: 0.0,
    };

    if (DEFAULT_PRICES[planType] === undefined) {
      return res.status(400).json({ error: "Plano inválido." });
    }

    // Fetch dynamic prices from DB
    const settingKeys = Object.keys(DEFAULT_PRICES).map((id) => `price_${id}`);
    const settings = await Setting.findAll({ where: { key: settingKeys } });

    let baseMonthlyPrice = DEFAULT_PRICES[planType];
    settings.forEach((s) => {
      if (s.key === `price_${planType}`) {
        baseMonthlyPrice = parseFloat(s.value);
      }
    });

    if (user.subscriptionPrice && user.subscriptionPrice > 0) {
      baseMonthlyPrice = parseFloat(user.subscriptionPrice);
    }

    // 2. Apply Cycle Multiplier and Discount
    let months = 1;
    let cycleDiscount = 0;

    if (safeCycle === "QUARTERLY") {
      months = 3;
      cycleDiscount = 0.03;
    } else if (safeCycle === "SEMIANNUALLY") {
      months = 6;
      cycleDiscount = 0.1;
    } else if (safeCycle === "YEARLY") {
      months = 12;
      cycleDiscount = 0.2;
    }

    let finalPrice = baseMonthlyPrice * months * (1 - cycleDiscount);

    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode, isActive: true },
      });
      // Simplified Logic - Should verify usage limit/target
      if (coupon) {
        // Verifica se o cupom está restrito a planos específicos
        if (coupon.allowedPlans && coupon.allowedPlans.length > 0) {
          if (!coupon.allowedPlans.includes(planType)) {
            return res.status(400).json({
              error: `O cupom ${couponCode} não é válido para este plano.`,
            });
          }
        }

        if (coupon.type === "PERCENTAGE") {
          finalPrice = finalPrice - finalPrice * (coupon.value / 100);
        } else {
          if (coupon.value >= finalPrice) {
            return res.status(400).json({
              error: `O cupom ${couponCode} só pode ser aplicado em planos com valor superior a R$ ${coupon.value.toFixed(2).replace(".", ",")}`,
            });
          }
          finalPrice = finalPrice - coupon.value;
        }
      } else {
        return res.status(400).json({ error: "Cupom inválido ou expirado." });
      }
    }

    if (finalPrice < 5) {
      return res.status(400).json({
        error:
          "O valor final após o desconto não pode ser menor que R$ 5,00 (Exigência do Banco Central para PIX).",
      });
    }

    // 2. Get or Create Customer in Asaas
    const customer = await createCustomer({
      nome: user.nome,
      email: user.email,
      cpf: user.cpf, // Assume user has this field or handled
      telefone: user.telefone,
    });

    // 3. Create Subscription
    const subscriptionData = {
      customer: customer.id,
      billingType: billingType || "UNDEFINED", // Liberando PIX, Crédito e Boleto
      value: finalPrice,
      nextDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // Vencimento para amanhã para primeiro pagamento
      cycle: safeCycle,
      description: `Assinatura JusCore AI - Plano ${planType}`,
      externalReference: `USER_${user.id}_PLAN_${planType}`,
      callback: {
        successUrl: "https://juscore.net/dashboard/billing",
        autoRedirect: true,
      },
    };

    const subscription = await createSubscription(subscriptionData);

    // Give Asaas a small delay to generate the first charge
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fetch the first generated payment to get the Boleto/Pix link
    const { default: asaasApi } = await import("../services/asaas.js");
    const paymentsRes = await asaasApi.get(
      `/payments?subscription=${subscription.id}`,
    );
    const firstPayment = paymentsRes.data?.data?.[0];

    res.json({
      paymentId: firstPayment ? firstPayment.id : subscription.id,
      invoiceUrl: firstPayment ? firstPayment.invoiceUrl : null,
      bankSlipUrl: firstPayment ? firstPayment.bankSlipUrl : null,
      pixQrCode: firstPayment ? firstPayment.pixQrCode : null,
    });
  } catch (error) {
    console.error(
      "Erro Checkout Asaas:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      error: "Erro ao processar pagamento",
    };
    res.status(status).json(errorData);
  }
});

/* =========================
   VERIFICAR STATUS DA ASSINATURA
========================= */
router.get("/status", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.subscriptionId) {
      return res.json({ active: false, nextDueDate: null });
    }

    const { default: asaasApi } = await import("../services/asaas.js");

    // Check if subscriptionId starts with 'sub_'
    if (user.subscriptionId.startsWith("sub_")) {
      const response = await asaasApi.get(
        `/subscriptions/${user.subscriptionId}`,
      );
      const sub = response.data;

      return res.json({
        active: sub.status === "ACTIVE",
        nextDueDate: sub.nextDueDate,
        cycle: sub.cycle,
      });
    } else {
      // It might be a single payment ID stored previously
      const response = await asaasApi.get(`/payments/${user.subscriptionId}`);
      const pay = response.data;

      return res.json({
        active: pay.status === "RECEIVED" || pay.status === "CONFIRMED",
        nextDueDate: pay.dueDate, // Single payments only have dueDate
        cycle: null,
      });
    }
  } catch (error) {
    console.error(
      "Erro ao checar status de assinatura no Asaas:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Erro ao carregar dados da assinatura" });
  }
});

/* =========================
   CANCELAR ASSINATURA
========================= */
router.post("/cancel_subscription", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (
      !user ||
      (!user.subscriptionId && user.subscriptionPlan === "free") ||
      user.subscriptionStatus === "cancelled" ||
      user.cancelAtPeriodEnd
    ) {
      return res.status(400).json({
        error: "Nenhuma assinatura ativa encontrada ou já cancelada.",
      });
    }

    if (!user.subscriptionId) {
      // Se for plano admin mas sem ID do asaas (excedeu licença manual ou erro)
      await user.update({
        subscriptionStatus: "cancelled",
        subscriptionPlan: "free",
        tipo: "free",
      });
      return res.json({
        success: true,
        message: "Assinatura cancelada com sucesso localmente.",
      });
    }

    const { default: asaasApi } = await import("../services/asaas.js");

    let statusToUpdate = "cancelled";
    let planToUpdate = "free";
    let tipoToUpdate = "free";

    if (user.subscriptionId.startsWith("sub_")) {
      // Cancelar no Asaas enviando requisição
      try {
        await asaasApi.delete(`/subscriptions/${user.subscriptionId}`);
      } catch (err) {
        console.warn(
          `Aviso ao cancelar assinatura ${user.subscriptionId} na Asaas: A assinatura não foi encontrada ou token não autorizado. Cancelando localmente.`,
          err.response?.status,
        );
      }

      // Mantém o usuário ativo localmente até o fim do ciclo já pago
      await user.update({
        cancelAtPeriodEnd: true,
      });
      return res.json({
        success: true,
        message:
          "Assinatura cancelada no Asaas. Você manterá o acesso premium até o final do ciclo já faturado.",
      });
    } else {
      // Caso tenhamos salvo id de cobrança única ao invés da assinatura
      console.warn("Assinatura sem prefixo sub_, cancelando localmente.");
    }

    // Fallback: Cancela imediatamente
    await user.update({
      subscriptionStatus: statusToUpdate,
      subscriptionPlan: planToUpdate,
      tipo: tipoToUpdate,
      cancelAtPeriodEnd: false,
      subscriptionId: null,
    });

    res.json({ success: true, message: "Assinatura cancelada com sucesso." });
  } catch (error) {
    console.error(
      "Erro ao cancelar assinatura:",
      error.response?.data || error.message,
    );
    res
      .status(500)
      .json({ error: "Erro ao cancelar assinatura. Contate o suporte." });
  }
});

/* =========================
   VERIFICAR CUPOM
========================= */
router.post("/verify_coupon", auth, async (req, res) => {
  try {
    const { code, planId } = req.body;
    if (!code)
      return res.status(400).json({ error: "Código do cupom é obrigatório." });

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) {
      return res.status(404).json({ error: "Cupom inválido ou expirado." });
    }

    // Check expiration
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ error: "Cupom expirado." });
    }

    // Check usage limit
    if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
      return res
        .status(400)
        .json({ error: "Este cupom atingiu o limite de uso." });
    }

    // Check plan restriction
    if (planId && coupon.allowedPlans && Array.isArray(coupon.allowedPlans)) {
      if (!coupon.allowedPlans.includes(planId)) {
        return res
          .status(400)
          .json({ error: `Este cupom não é válido para o plano selecionado.` });
      }
    }

    res.json({
      success: true,
      type: coupon.type,
      value: coupon.value,
      message: `Cupom aplicado! Desconto de ${coupon.type === "PERCENTAGE" ? coupon.value + "%" : "R$ " + coupon.value.toFixed(2).replace(".", ",")}`,
    });
  } catch (error) {
    console.error("Erro ao verificar cupom:", error);
    res.status(500).json({ error: "Erro ao validar cupom." });
  }
});

/* =========================
   WEBHOOK (Notificações)
========================= */
router.post("/webhook", async (req, res) => {
  const { event, payment } = req.body;

  // Verify Asaas IP/Token here for security
  const asaasToken = req.headers["asaas-access-token"];

  if (
    process.env.ASAAS_WEBHOOK_TOKEN &&
    asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN
  ) {
    console.warn("⚠️ Tentativa de Webhook inválida. Token recusado.");
    return res.status(401).json({ error: "Unauthorized / Invalid Token" });
  }

  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    try {
      if (!payment || !payment.externalReference) {
        console.warn("⚠️ Asaas Webhook: Pagamento sem externalReference.");
        return res.json({ received: true });
      }

      // Extract User ID from externalReference "USER_123_PLAN_lawyer_growth"
      const match = payment.externalReference.match(/^USER_(.+)_PLAN_(.+)$/);

      if (!match) {
        console.warn(
          `⚠️ Asaas Webhook: Formato de externalReference inválido: ${payment.externalReference}`,
        );
        return res.json({ received: true });
      }

      const userId = match[1];
      const planType = match[2]; // Isso garante capturar "lawyer_growth" por inteiro

      console.log(
        `💰 Asaas: Pagamento Aprovado! User: ${userId} | Plano: ${planType}`,
      );

      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          let novoTipo = user.tipo;

          // Prevent downgrading admins when changing plans
          if (novoTipo !== "admin") {
            if (["lawyer_starter", "lawyer_growth"].includes(planType)) {
              novoTipo = "especial";
            } else if (["office_master", "enterprise"].includes(planType)) {
              novoTipo = "admin";
            } else {
              novoTipo = "comum";
            }
          }

          await user.update({
            subscriptionStatus: "active",
            subscriptionPlan: planType,
            subscriptionId: payment.subscription || payment.id,
            tipo: novoTipo,
            cancelAtPeriodEnd: false, // Ensure we clear the cancellation flag on new payment
          });
        }
      }
    } catch (err) {
      console.error("Erro Webhook Asaas:", err);
    }
  }

  res.json({ received: true });
});

export default router;
