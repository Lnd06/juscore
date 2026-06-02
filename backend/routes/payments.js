import express from "express";
import { auth } from "../middleware/auth.js";
import { User } from "../models/index.js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const router = express.Router();

// Initialize Mercado Pago
// NOTE: Use your ACCESS_TOKEN from Mercado Pago Developers
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "TEST-ACCESS-TOKEN",
});

/* =========================
   CRIAR PREFERÊNCIA (Checkout)
========================= */
router.post("/create_preference", auth, async (req, res) => {
  try {
    const { title, price, quantity = 1 } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: title || "JusCore AI Subscription",
            quantity: Number(quantity),
            unit_price: Number(price),
            currency_id: "BRL",
          },
        ],
        payer: {
          name: user.nome,
          email: user.email,
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/dashboard?status=success`,
          failure: `${process.env.FRONTEND_URL}/dashboard?status=failure`,
          pending: `${process.env.FRONTEND_URL}/dashboard?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        metadata: {
          user_id: user.id,
          plan_type: req.body.planType || "student_basic",
        },
      },
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error("Erro ao criar preferência MP:", error);
    res.status(500).json({ error: "Erro ao gerar pagamento" });
  }
});

/* =========================
   WEBHOOK (Notificações)
========================= */
router.post("/webhook", async (req, res) => {
  const { action, data, type } = req.body;

  // Mercado Pago sends a notification for payment upadtes
  if (
    action === "payment.created" ||
    action === "payment.updated" ||
    type === "payment"
  ) {
    try {
      const paymentId = data?.id || req.body.data.id;
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      if (payment.status === "approved") {
        const userId = payment.metadata.user_id;
        const planType = payment.metadata.plan_type;

        console.log(
          `💰 Pagamento Aprovado! User: ${userId}, Plano: ${planType}`,
        );

        // Update User Subscription
        if (userId) {
          await User.update(
            {
              subscriptionStatus: "active",
              subscriptionPlan: planType,
              subscriptionId: paymentId, // Or actual sub ID if using subscriptions API
            },
            { where: { id: userId } },
          );
        }
      }
    } catch (error) {
      console.error("Erro no Webhook MP:", error);
    }
  }

  res.sendStatus(200); // Always return 200 to acknowledge
});

export default router;
