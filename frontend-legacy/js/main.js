import {
  initTheme,
  toggleTheme,
  toggleSidebar,
  toggleZenMode,
  fetchGlobalAlert,
  abrirDocumentos,
  fecharDocumentos,
} from "./ui.js";
import {
  loadUser,
  updateUIForGuest,
  logout,
  currentUser,
  isLoggedIn,
  getCurrentUser,
} from "./auth.js";
import {
  sendQuick,
  sendMessage,
  handleKeyDown,
  autoResize,
  novaConversa,
  loadConversationHistory,
  showSkeletonHistory,
  loadConversation,
  initChat,
  stopGeneration,
} from "./chat.js";

// Global exports for HTML onclick handlers
// Since we are using modules, functions are not global by default.
// We need to attach them to window for the existing HTML `onclick` attributes to work without rewriting all HTML listeners.

// UI
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.toggleZenMode = toggleZenMode;
window.fecharDocumentos = fecharDocumentos;

// Auth
window.logout = logout;

// Chat
window.novaConversa = novaConversa;
window.sendQuick = sendQuick;
window.sendMessage = sendMessage;
window.stopGeneration = stopGeneration;
window.handleKeyDown = handleKeyDown;
window.autoResize = autoResize;
window.loadConversation = loadConversation;

// Callback for using a document, passed to ui.js
// We define it here and pass it to abrirDocumentos
window.abrirDocumentos = () => abrirDocumentos(callbackUsarDocumento);

function callbackUsarDocumento(id, titulo) {
  fecharDocumentos();
  const input = document.getElementById("messageInput");
  if (input) {
    input.value = `Quero usar o modelo "${titulo}". Pode me ajudar a preencher?`;
    input.focus();
  }
}

// Init Function
async function init() {
  console.log("🚀 [main.js] Initializing application...");
  initTheme();

  if (isLoggedIn()) {
    console.log("🔑 [main.js] User token found in localStorage.");
    try {
      const user = await loadUser();
      console.log("👤 [main.js] loadUser returned:", user);

      if (user) {
        console.log(
          "✅ [main.js] User loaded successfully. Loading history...",
        );
        showSkeletonHistory();
        loadConversationHistory();
      } else {
        console.warn(
          "⚠️ [main.js] User loaded but returned null (invalid token?).",
        );
        updateUIForGuest();
      }
    } catch (error) {
      console.error("❌ [main.js] Error during user loading:", error);
      updateUIForGuest();
    }
  } else {
    console.log("👻 [main.js] No token found. Initializing as guest.");
    updateUIForGuest();
  }

  fetchGlobalAlert();

  // Listen for chat messages to update history
  document.addEventListener("chat-message-sent", () => {
    if (getCurrentUser()) loadConversationHistory();
  });
}

// Run init
// Using DOMContentLoaded is safer
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
