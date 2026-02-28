import axios from "axios";

const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://www.asaas.com/api/v3"
    : "https://sandbox.asaas.com/api/v3";

console.log("🔌 Conectando ao Asaas em:", ASAAS_API_URL);
console.log(
  "🔑 Key (início):",
  process.env.ASAAS_API_KEY
    ? process.env.ASAAS_API_KEY.substring(0, 10) + "..."
    : "NÃO CONFIGURADA",
);

const asaasApi = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    access_token: process.env.ASAAS_API_KEY,
    "Content-Type": "application/json",
  },
});

export const createCustomer = async (userData) => {
  try {
    // Check if customer exists by email
    const { data: existingCustomers } = await asaasApi.get(
      `/customers?email=${userData.email}`,
    );

    if (existingCustomers.data && existingCustomers.data.length > 0) {
      // Update existing customer (PUT /customers/:id)
      const existingCustomer = existingCustomers.data[0];
      try {
        await asaasApi.put(`/customers/${existingCustomer.id}`, {
          name: userData.nome,
          cpfCnpj: (userData.cpf || userData.cnpj || "").replace(/\D/g, ""),
          mobilePhone: (userData.telefone || "").replace(/\D/g, ""),
          notificationDisabled: false, // Force re-enable notifications for existing customers
        });
      } catch (err) {
        console.warn(
          "⚠️ Falha ao atualizar cliente Asaas (CPF/Tel pode ser inválido):",
          err.response?.data || err.message,
        );
      }
      return existingCustomer;
    }

    // Create new customer
    const { data: newCustomer } = await asaasApi.post("/customers", {
      name: userData.nome,
      email: userData.email,
      cpfCnpj: (userData.cpf || userData.cnpj || "").replace(/\D/g, ""),
      mobilePhone: (userData.telefone || "").replace(/\D/g, ""),
      notificationDisabled: false, // Enable WhatsApp/SMS
    });
    return newCustomer;
  } catch (error) {
    console.error(
      "Erro ao criar cliente Asaas:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const createPayment = async (paymentData) => {
  try {
    const response = await asaasApi.post("/payments", paymentData);
    return response.data;
  } catch (error) {
    console.error("❌ Erro Asaas (createPayment):", error.message);
    if (error.response) {
      console.error(
        "📦 Detalhes do Erro:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    throw error;
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const response = await asaasApi.post("/subscriptions", subscriptionData);
    return response.data;
  } catch (error) {
    console.error("❌ Erro Asaas (createSubscription):", error.message);
    if (error.response) {
      console.error(
        "📦 Detalhes do Erro:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    throw error;
  }
};

export default asaasApi;
