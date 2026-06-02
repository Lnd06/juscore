import { User, Client, Process } from "../models/index.js";

const getPlanLimits = (subscriptionPlan, tipo) => {
  // admin or office (unlimited)
  if (
    tipo === "admin" ||
    subscriptionPlan === "enterprise" ||
    subscriptionPlan === "office_master"
  ) {
    return { maxClients: Infinity, maxProcesses: Infinity };
  }

  // lawyer growth
  if (subscriptionPlan === "lawyer_growth") {
    return { maxClients: 300, maxProcesses: 300 };
  }

  // lawyer starter (especiais/pagantes básicos)
  if (subscriptionPlan === "lawyer_starter" || tipo === "especial") {
    return { maxClients: 50, maxProcesses: 50 };
  }

  // free or comum (default low limits)
  return { maxClients: 3, maxProcesses: 2 };
};

export const checkPlanLimits = async (req, res, next) => {
  try {
    const targetUserId = req.user.parentUserId || req.user.id;
    const user = await User.findByPk(targetUserId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const limits = getPlanLimits(user.subscriptionPlan, user.tipo);

    // If unlimited, pass through immediately
    if (limits.maxClients === Infinity && limits.maxProcesses === Infinity) {
      return next();
    }

    // Determine what resource the user is trying to create by checking the route base path
    const path = req.baseUrl; // e.g., '/api/clients' or '/api/processes'

    if (path.includes("/clients") && req.method === "POST") {
      const clientCount = await Client.count({ where: { userId: targetUserId } });
      if (clientCount >= limits.maxClients) {
        return res.status(403).json({
          error: `Limite de clientes atingido para o seu plano (${limits.maxClients}). Faça upgrade para adicionar mais.`,
          upgradeRequired: true,
        });
      }
    }

    if (path.includes("/processes") && req.method === "POST") {
      const processCount = await Process.count({ where: { userId: targetUserId } });
      if (processCount >= limits.maxProcesses) {
        return res.status(403).json({
          error: `Limite de processos atingido para o seu plano (${limits.maxProcesses}). Faça upgrade para adicionar mais.`,
          upgradeRequired: true,
        });
      }
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de limites:", error);
    res
      .status(500)
      .json({ error: "Erro interno ao verificar limites do plano." });
  }
};
