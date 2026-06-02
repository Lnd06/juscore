import getPlanConfig from "../config/plans/index.js";
import { User } from "../models/index.js";

/**
 * Resolve o modelo de IA e valida os limites do plano do usuário.
 * 
 * @param {object} req - Objeto de requisição do Express (contendo req.user).
 * @param {string} requestedModel - O modelo solicitado na requisição (req.body.model).
 * @returns {Promise<{model: string, userPlan: object, planSlug: string, isReasoningRequest: boolean}>}
 */
export async function resolverModeloEPlano(req, requestedModel) {
  // Prioriza subscriptionPlan (importante para funcionários)
  let planSlug =
    req.user.subscriptionPlan && req.user.subscriptionPlan !== "free"
      ? req.user.subscriptionPlan
      : req.user.tipo || "free";

  if (req.user.parentUserId) {
    const parentUser = await User.findByPk(req.user.parentUserId);
    if (parentUser) {
      planSlug = parentUser.subscriptionPlan || "free";
    }
  }

  const userPlan = getPlanConfig(planSlug);

  // Padrão do plano
  let selectedModel = userPlan.models.default;
  let isReasoningRequest = false;

  if (requestedModel === "student") {
    selectedModel = userPlan.models.vision; // Modelo de visão para estudantes/imagens
  } else if (requestedModel === "economy") {
    selectedModel = "gemini-2.5-flash"; // Sobrescrita econômica rápida
  } else if (requestedModel === "reasoning" && userPlan.models.reasoning) {
    // Verificar limite diário de raciocínio
    const dailyReasoningLimit = userPlan.limits?.dailyReasoning || 0;

    if (dailyReasoningLimit > 0) {
      const currentUsage = req.user.dailyReasoningUsed || 0;
      const lastResetDate = req.user.dailyReasoningResetDate ? new Date(req.user.dailyReasoningResetDate) : null;
      const today = new Date().toISOString().slice(0, 10);

      let effectiveUsage = currentUsage;
      if (!lastResetDate || lastResetDate.toISOString().slice(0, 10) !== today) {
        // Resetar contador para o novo dia
        effectiveUsage = 0;
      }

      if (effectiveUsage >= dailyReasoningLimit) {
        console.log(`⚠️ [REASONING] Limite diário atingido (${effectiveUsage}/${dailyReasoningLimit}). Usando modelo básico.`);
        selectedModel = userPlan.models.default;
      } else {
        selectedModel = userPlan.models.reasoning;
        isReasoningRequest = true;
        console.log(`🧠 MODO RACIOCÍNIO ATIVADO: ${selectedModel} (${effectiveUsage + 1}/${dailyReasoningLimit})`);

        // Incrementar o contador no banco
        await User.update({
          dailyReasoningUsed: effectiveUsage + 1,
          dailyReasoningResetDate: today,
        }, { where: { id: req.user.id } });
      }
    } else {
      console.log(`⚠️ [REASONING] Plano "${userPlan.name}" não tem acesso ao modo raciocínio. Usando modelo básico.`);
      selectedModel = userPlan.models.default;
    }
  } else if (requestedModel === "deep-research") {
    // Escritório Master e superiores utilizam gemini-2.5-pro. Outros usam flash.
    const isHighTierPlan = ["office_master", "escritorio", "enterprise"].includes(planSlug);

    if (isHighTierPlan) {
      selectedModel = "gemini-2.5-pro";
      console.log(`🚀 [DEEP RESEARCH] Plano Premium (${planSlug}). Usando modelo avançado: ${selectedModel} com busca em tempo real.`);
    } else {
      selectedModel = "gemini-2.5-flash";
      console.log(`🚀 [DEEP RESEARCH] Plano Padrão (${planSlug}). Usando modelo rápido: ${selectedModel} com busca em tempo real.`);
    }
  } else if (requestedModel === "document") {
    selectedModel = userPlan.models.default;
  } else {
    selectedModel = userPlan.models.default;
  }

  return {
    model: selectedModel,
    userPlan,
    planSlug,
    isReasoningRequest
  };
}
