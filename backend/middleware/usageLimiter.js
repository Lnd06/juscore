import { UserUsage, User } from "../models/index.js";
import getPlanConfig from "../config/plans/index.js";

/**
 * Middleware para checar e incrementar limites diários do usuário baseados no plano.
 * @param {string} resourceType 'conversations' | 'calculations' | 'documents' | 'vision'
 */
export const usageLimiter = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      // Adquirir o plano do usuário diretamente do BD em tempo real (pois o token JWT pode estar velho)
      const user = await User.findByPk(req.user.id);

      // Priorizar subscriptionPlan se estiver ativo, senão usar tipo
      let userType = user?.tipo || req.user.tipo || "free";
      if (
        user?.subscriptionPlan &&
        user?.subscriptionPlan !== "free" &&
        user?.subscriptionStatus === "active"
      ) {
        userType = user.subscriptionPlan;
      } else if (user?.subscriptionPlan && user?.subscriptionPlan !== "free") {
        // Se tem um plano mas está inativo, talvez seja um erro de sync ou teste,
        // mas vamos ser conservadores. No entanto, se o usuário é Master, geralmente ele quer ser Master.
        // Para evitar bloqueios injustos em teste:
        userType = user.subscriptionPlan;
      }

      const planConfig = getPlanConfig(userType);

      // Bloquear usuários do plano gratuito se a conta tiver mais de 3 dias de criação
      const isPrivileged = user?.tipo === "admin" || user?.tipo === "master" || req.user?.tipo === "admin" || req.user?.tipo === "master";
      if ((userType === "free" || userType === "comum") && !isPrivileged && user?.createdAt) {
        const createdAtTime = new Date(user.createdAt).getTime();
        const currentTime = new Date().getTime();
        const diffMs = currentTime - createdAtTime;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays > 3) {
          console.log(`🚫 Período de testes de 3 dias do plano gratuito expirou para o usuário ${user.id} (Criado em: ${user.createdAt})`);
          return res.status(403).json({
            error: "Período de Teste Expirou",
            message: "Sua conta gratuita completou 3 dias e o período de testes expirou. Por favor, assine um plano premium para continuar utilizando o JusCore AI!",
            trialExpired: true,
            upgradeRequired: true,
          });
        }
      }

      // O limite configurado para o recurso (ex: planConfig.limits.dailyDocuments)
      let limit;
      switch (resourceType) {
        case "conversations":
          limit = planConfig.limits.conversations;
          break;
        case "calculations":
          limit = planConfig.limits.dailyCalculations;
          break;
        case "documents":
          limit = planConfig.limits.dailyDocuments;
          break;
        case "vision":
          limit = planConfig.limits.dailyVision;
          break;
        default:
          limit = 9999;
      }

      // (Não daremos early return se limit >= 9999 para que o uso continue sendo computado dinamicamente para o BI!)

      // Buscar (ou criar) o registro de uso diário do usuário
      let [usage] = await UserUsage.findOrCreate({
        where: { userId: req.user.id },
        defaults: { userId: req.user.id },
      });

      // Verifica e reseta a data/limite caso estejamos em um dia novo
      await usage.checkAndReset();

      // Checar se o uso atual atingiu o limite do plano
      let currentUsage = 0;
      switch (resourceType) {
        case "conversations":
          currentUsage = usage.dailyConversations;
          break;
        case "calculations":
          currentUsage = usage.dailyCalculations;
          break;
        case "documents":
          currentUsage = usage.dailyDocuments;
          break;
        case "vision":
          currentUsage = usage.dailyVision;
          break;
      }

      if (limit < 9999 && currentUsage >= limit) {
        // Traduzindo a mensagem para exibição no Frontend:
        let resourceNameTranslated = resourceType;
        if (resourceType === "conversations") {
          resourceNameTranslated = "mensagens diárias";
        } else if (resourceType === "documents") {
          resourceNameTranslated = "documentos";
        } else if (resourceType === "calculations") {
          resourceNameTranslated = "cálculos";
        } else if (resourceType === "vision") {
          resourceNameTranslated = "análises visuais";
        }

        console.log(
          `🚫 Limite atingido: ${resourceType} (${resourceNameTranslated}) para o plano ${planConfig.name}`,
        );

        let errorMessage = `Você atingiu o limite de ${limit} ${resourceNameTranslated} para o plano ${planConfig.name}. Faça um upgrade para continuar!`;
        if ((userType === "free" || userType === "comum") && resourceType === "conversations") {
          errorMessage = "Você atingiu o limite de 6 mensagens diárias do plano gratuito. Faça upgrade para continuar conversando sem limites!";
        }

        return res.status(403).json({
          error: "Limite Diário Atingido",
          message: errorMessage,
          planName: planConfig.name,
          upgradeRequired: true,
        });
      }

      // Incrementa o uso para a próxima requisição (se não der erro no sistema)
      // Como boas práticas, pode incrementar aqui ou no controller. Ao colocar aqui assumimos sucesso do controller
      switch (resourceType) {
        case "conversations":
          usage.dailyConversations += 1;
          break;
        case "calculations":
          usage.dailyCalculations += 1;
          break;
        case "documents":
          usage.dailyDocuments += 1;
          break;
        case "vision":
          usage.dailyVision += 1;
          break;
      }

      await usage.save();

      // Armazenar info no req para controllers acessarem se precisar
      req.remainingQuota = limit >= 9999 ? 9999 : limit - (currentUsage + 1);
      req.planConfig = planConfig;

      next();
    } catch (error) {
      console.error("❌ Erro no Usage Limiter:", error);
      res.status(500).json({ error: "Erro interno ao checar limites de uso." });
    }
  };
};
