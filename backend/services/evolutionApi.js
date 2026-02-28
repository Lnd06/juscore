import axios from "axios";

// The base URL of the Evolution API server
const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY =
  process.env.EVOLUTION_API_KEY || "your_evolution_api_global_apikey";

// Axel instance with pre-configured headers
const apiClient = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    "Content-Type": "application/json",
    apikey: EVOLUTION_API_KEY,
  },
});

/**
 * Creates a new WhatsApp instance in Evolution API
 * @param {string} instanceName The unique name of the instance
 */
export const createInstance = async (instanceName) => {
  try {
    const response = await apiClient.post("/instance/create", {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      reject_call: false,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error creating Evolution API instance:",
      error.response?.data || error.message,
    );
    throw new Error("Falha ao criar instância no Evolution API");
  }
};

/**
 * Connects (or gets the QR code) for an existing instance
 * @param {string} instanceName
 */
export const connectInstance = async (instanceName) => {
  try {
    const response = await apiClient.get(`/instance/connect/${instanceName}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error connecting Evolution API instance:",
      error.response?.data || error.message,
    );
    throw new Error("Falha ao conectar instância no Evolution API");
  }
};

/**
 * Fetches the current connection state of an instance
 * @param {string} instanceName
 */
export const checkConnectionState = async (instanceName) => {
  try {
    const response = await apiClient.get(
      `/instance/connectionState/${instanceName}`,
    );
    return response.data;
  } catch (error) {
    // Se der 404, a instância pode ter sido apagada lá fora
    if (error.response && error.response.status === 404) {
      return { instance: { state: "disconnected" } };
    }
    console.error(
      "Error checking Evolution API instance state:",
      error.response?.data || error.message,
    );
    throw new Error("Falha ao checar status da instância no Evolution API");
  }
};

/**
 * Logs out and deletes an instance from Evolution API
 * @param {string} instanceName
 */
export const deleteInstance = async (instanceName) => {
  try {
    const response = await apiClient.delete(`/instance/delete/${instanceName}`);
    return response.data;
  } catch (error) {
    // 404 significa que já não existe, o que é um sucesso para nós
    if (error.response && error.response.status === 404) return true;
    console.error(
      "Error deleting Evolution API instance:",
      error.response?.data || error.message,
    );
    throw new Error("Falha ao deletar instância no Evolution API");
  }
};

/**
 * Sets the webhook URL for the instance so it can send us messages
 * @param {string} instanceName
 * @param {string} webhookUrl
 */
export const setWebhook = async (instanceName, webhookUrl) => {
  try {
    const response = await apiClient.post(`/webhook/set/${instanceName}`, {
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ["MESSAGES_UPSERT"],
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error setting webhook:",
      error.response?.data || error.message,
    );
    throw new Error("Falha ao configurar webhook");
  }
};

/**
 * Sends a text message through the instance
 * @param {string} instanceName
 * @param {string} number Remote Whatsapp number
 * @param {string} text Message content
 */
export const sendTextMessage = async (instanceName, number, text) => {
  try {
    const response = await apiClient.post(`/message/sendText/${instanceName}`, {
      number,
      options: {
        delay: 1200,
        presence: "composing",
      },
      textMessage: {
        text,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response?.data || error.message,
    );
    throw new Error("Falha ao enviar mensagem pelo WhatsApp");
  }
};
