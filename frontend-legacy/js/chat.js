import { apiFetch } from "./api.js";
import { currentUser } from "./auth.js";
import { toggleSidebar } from "./ui.js";

let currentSession = Date.now().toString();
let isTyping = false;

// DOMPurify should be available globally via CDN in index.html
// If not, we should handle it gracefully or standardly
const sanitize = (html) => {
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(html);
  }
  console.warn(
    "DOMPurify not found, returning unsanitized HTML (SECURITY RISK)",
  );
  return html;
};

export function initChat() {
  // Bind events if needed, but mostly main.js does the initial binding
  // Maybe recover session if URL has param?
}

export function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
}

export function handleKeyDown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

export function sendQuick(text) {
  const input = document.getElementById("messageInput");
  if (input) input.value = text;
  sendMessage();
}

// Configure marked
// Check if marked is available
if (window.marked) {
  window.marked.setOptions({
    breaks: true, // enter = br
    gfm: true, // github flavored markdown
  });
}

function safeMarkdown(text) {
  if (!text) return "";
  if (window.marked) {
    // Sanitize INPUT to marked? No, marked output should be sanitized.
    // DOMPurify should sanitize the HTML output of marked.
    const rawHtml = window.marked.parse(text);
    return window.DOMPurify ? window.DOMPurify.sanitize(rawHtml) : rawHtml;
  }
  // Fallback if marked failed
  return text.replace(/\n/g, "<br>");
}

// Abort Controller for stopping generation
let abortController = null;
let isStopped = false;

export function stopGeneration() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  isStopped = true;

  // UI Updates
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const input = document.getElementById("messageInput");

  if (sendBtn) sendBtn.disabled = false;
  if (sendBtn) sendBtn.classList.remove("hidden");
  if (stopBtn) stopBtn.classList.add("hidden");

  isTyping = false;
  removeTyping(document.querySelector(".typing-indicator")?.id);

  // Add system message indicating stop
  addMessage("🛑 Geração interrompida pelo usuário.", "system");

  if (input) input.focus();
}

export async function sendMessage() {
  const input = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");

  const text = input.value.trim();

  if (!text || isTyping) return;

  // Reset Stop State
  isStopped = false;
  abortController = new AbortController();

  // Add user message
  addMessage(text, "user");
  input.value = "";
  input.style.height = "auto";

  // Show typing & Stop Button
  isTyping = true;
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.classList.add("hidden");
  }
  if (stopBtn) stopBtn.classList.remove("hidden");

  const typingId = showTyping();

  try {
    const res = await apiFetch("/chat", {
      method: "POST",
      signal: abortController.signal, // Attach signal
      body: JSON.stringify({
        mensagem: text,
        sessionId: currentSession,
      }),
    });

    removeTyping(typingId);

    if (res.ok) {
      const data = await res.json();
      if (!isStopped) {
        await typeMessage(data.resposta, "bot", data.fontes);
      }
    } else {
      if (!isStopped) addMessage("⚠️ Erro ao processar mensagem.", "bot");
    }
  } catch (err) {
    removeTyping(typingId);
    if (err.name === "AbortError") {
      console.log("Fetch aborted by user");
    } else {
      console.error(err);
      addMessage("⚠️ Erro de conexão.", "bot");
    }
  } finally {
    // Only reset if NOT stopped (stop function handles its own reset)
    // Actually, typeMessage is async, so we should wait or handle it there.
    // If we are here, it means fetch is done.
    // TypeMessage will handle the UI reset when it finishes.

    // If fetch failed or aborted, we need to reset here
    if (isStopped || !isTyping) {
      // Already handled
    }
  }
}

// New function for typing effect
async function typeMessage(fullText, sender, fontes) {
  const container = document.getElementById("chatContainer");
  const div = document.createElement("div");
  div.className = `flex ${sender === "user" ? "justify-end" : "justify-start"} message-bubble`;

  const time = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let fontesHtml = "";
  if (fontes && (fontes.planalto || fontes.dou > 0)) {
    fontesHtml = `
      <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <span class="font-medium">Fontes:</span> 
        ${fontes.planalto ? "Planalto " : ""}
        ${fontes.dou > 0 ? `DOU (${fontes.dou})` : ""}
      </div>
    `;
  }

  // Initial Shell
  div.innerHTML = `
    <div class="max-w-[90%] sm:max-w-[80%] ${
      sender === "user"
        ? "bg-primary-600 text-white"
        : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
    } p-4 rounded-2xl ${sender === "user" ? "rounded-br-sm" : "rounded-bl-sm"} shadow-sm">
      <div class="prose dark:prose-invert max-w-none text-sm leading-relaxed" id="msg-content-${Date.now()}"></div>
      ${fontesHtml}
      <div class="text-[10px] opacity-70 text-right mt-1">${time}</div>
    </div>
  `;

  container.appendChild(div);
  const contentDiv = div.querySelector(".prose");

  // Streaming Logic
  const chunkSize = 2; // chars per tick
  let currentText = "";

  // Split into chunks to simulate typing
  // We can't really split by char if we render markdown every time because '**' would be broken.
  // BUT marked handles incomplete markdown gracefully-ish.
  // Better feel: Split by words?
  const chars = fullText.split("");

  for (let i = 0; i < chars.length; i += chunkSize) {
    if (isStopped) {
      contentDiv.innerHTML += " [Interrompido]";
      break;
    }

    // Check if user navigated away or cancelled? Hard to do here.
    const chunk = chars.slice(i, i + chunkSize).join("");
    currentText += chunk;

    // Validate Markdown on every step? slightly heavy but ok for 1 message.
    contentDiv.innerHTML = safeMarkdown(currentText);

    // Auto scroll
    container.scrollTop = container.scrollHeight;

    // Variable delay for "human" feel
    await new Promise((r) => setTimeout(r, 10));
  }

  // Final render - Only if not stopped
  if (!isStopped) contentDiv.innerHTML = safeMarkdown(fullText);

  // Restore UI
  isTyping = false;
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.classList.remove("hidden");
  }
  if (stopBtn) stopBtn.classList.add("hidden");

  if (!isStopped) document.dispatchEvent(new CustomEvent("chat-message-sent"));
}

export function addMessage(text, sender, fontes = null) {
  // Fallback for instant messages (user or errors)
  const container = document.getElementById("chatContainer");
  const div = document.createElement("div");
  div.className = `flex ${sender === "user" ? "justify-end" : "justify-start"} message-bubble`;

  const time = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let contentHTML = safeMarkdown(text);

  div.innerHTML = `
    <div class="max-w-[90%] sm:max-w-[80%] ${
      sender === "user"
        ? "bg-primary-600 text-white"
        : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
    } p-4 rounded-2xl ${sender === "user" ? "rounded-br-sm" : "rounded-bl-sm"} shadow-sm">
      <div class="prose dark:prose-invert max-w-none text-sm leading-relaxed">${contentHTML}</div>
      <div class="text-[10px] opacity-70 text-right mt-1">${time}</div>
    </div>
  `;

  const welcome = container.querySelector(".text-center");
  if (welcome && sender === "user") welcome.remove();

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById("chatContainer");
  const id = "typing-" + Date.now();
  const div = document.createElement("div");
  div.id = id;
  div.className = "flex justify-start message-bubble";
  div.innerHTML = `
    <div class="bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div class="text-[10px] text-gray-400 mb-1 font-medium animate-pulse">JusCore AI está analisando as leis...</div>
      <div class="flex gap-1">
        <span class="w-1.5 h-1.5 bg-primary-400 rounded-full typing-dot"></span>
        <span class="w-1.5 h-1.5 bg-primary-400 rounded-full typing-dot"></span>
        <span class="w-1.5 h-1.5 bg-primary-400 rounded-full typing-dot"></span>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

export function novaConversa() {
  currentSession = Date.now().toString();
  const container = document.getElementById("chatContainer");
  if (container) {
    container.innerHTML = `
        <div class="flex justify-center py-8">
          <div class="text-center max-w-2xl">
            <div class="w-20 h-20 bg-gradient-to-br from-primary-600 to-juri-600 rounded-2xl flex items-center justify-center text-white text-4xl mx-auto mb-4 shadow-lg">
              ⚖️
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nova Conversa</h3>
            <p class="text-gray-600 dark:text-gray-400">Como posso ajudar você?</p>
          </div>
        </div>
      `;
  }
  if (window.innerWidth < 1024) toggleSidebar();
}

// History Functions
export async function loadConversationHistory() {
  // If not logged in, fetch might fail or return 401, handle gracefully
  // But auth state is in auth.js.
  // We can check local storage or try/catch.
  if (!localStorage.getItem("token")) return;

  try {
    const res = await apiFetch("/user/conversations");

    if (res.ok) {
      const data = await res.json();
      renderHistory(data);
    }
  } catch (err) {
    console.error("Erro ao carregar histórico:", err);
  }
}

function renderHistory(conversas) {
  const container = document.getElementById("historicoLista");
  if (!container) return;

  if (!conversas || conversas.length === 0) {
    container.innerHTML =
      '<p class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Nenhuma conversa ainda</p>';
    return;
  }

  container.innerHTML = conversas
    .map(
      (c) => `
    <button data-session-id="${c.sessionId}" class="history-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors truncate">
      <p class="font-medium truncate">${c.titulo}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${c.preview}</p>
    </button>
  `,
    )
    .join("");

  // Add event listeners to buttons (since we are not using global onclick="loadConversation")
  container.querySelectorAll(".history-btn").forEach((btn) => {
    btn.onclick = () => loadConversation(btn.dataset.sessionId);
  });
}

export function showSkeletonHistory() {
  const container = document.getElementById("historicoLista");
  if (!container) return;
  container.innerHTML = Array(3)
    .fill(0)
    .map(
      () => `
        <div class="px-4 py-2 space-y-2">
            <div class="h-4 w-3/4 skeleton-box rounded"></div>
            <div class="h-3 w-1/2 skeleton-box rounded opacity-50"></div>
        </div>
    `,
    )
    .join("");
}

export async function loadConversation(sessionId) {
  if (!localStorage.getItem("token")) return;

  try {
    const res = await apiFetch(`/chat/${sessionId}`);

    if (res.ok) {
      const data = await res.json();
      currentSession = sessionId;

      // Clear and rebuild chat
      const container = document.getElementById("chatContainer");
      container.innerHTML = "";

      data.mensagens.forEach((m) => {
        addMessage(m.content, m.role);
      });

      if (window.innerWidth < 1024) toggleSidebar();
    }
  } catch (err) {
    console.error("Erro ao carregar conversa:", err);
  }
}
