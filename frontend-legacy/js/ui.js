import { apiFetch } from "./api.js";

// Theme Functions
export function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (saved === "dark" || !saved) {
    document.documentElement.classList.add("dark");
  }
  updateThemeUI();
}

export function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeUI();
}

function updateThemeUI() {
  const isDark = document.documentElement.classList.contains("dark");
  const text = document.getElementById("themeText");
  const icon = document.getElementById("themeIcon");

  if (text) text.textContent = isDark ? "Modo Claro" : "Modo Escuro";
  if (icon) {
    icon.innerHTML = isDark
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
  }
}

// Sidebar Functions
export function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (sidebar) sidebar.classList.toggle("-translate-x-full");
  if (overlay) overlay.classList.toggle("hidden");
}

export function toggleZenMode() {
  const sidebar = document.getElementById("sidebar");
  const mainArea = document.getElementById("mainArea");
  const icon = document.getElementById("zenIcon");

  if (!sidebar || !mainArea || !icon) return;

  // No desktop (lg), a sidebar é controlada por lg:translate-x-0
  const isVisible = sidebar.classList.contains("lg:translate-x-0");

  if (isVisible) {
    // Esconder
    sidebar.classList.remove("lg:translate-x-0");
    mainArea.classList.remove("lg:ml-80");
    icon.innerHTML =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H4v4m0 12h4v-4m12 4h-4v-4M16 4h4v4" />';
  } else {
    // Mostrar
    sidebar.classList.add("lg:translate-x-0");
    mainArea.classList.add("lg:ml-80");
    icon.innerHTML =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />';
  }
}

// Global Alert
export async function fetchGlobalAlert() {
  try {
    // Assuming public endpoint or handled by apiFetch safely
    const res = await apiFetch("/admin/settings/global-alert");
    const data = await res.json();
    if (data && data.message) {
      const banner = document.getElementById("globalAlert");
      const text = document.getElementById("alertText");
      if (banner && text) {
        text.textContent = data.message;
        banner.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.error("Erro ao carregar alerta global:", err);
  }
}

// Documents Modal
export async function abrirDocumentos(callbackUsarDocumento) {
  const modal = document.getElementById("docModal");
  const list = document.getElementById("docList");

  if (modal) modal.classList.remove("hidden");
  if (list)
    list.innerHTML = '<p class="text-center text-gray-500">Carregando...</p>';

  try {
    const res = await apiFetch("/documents");
    const docs = await res.json();

    if (docs.length === 0) {
      if (list)
        list.innerHTML =
          '<p class="text-center text-gray-500">Nenhum documento disponível</p>';
      return;
    }

    if (list) {
      list.innerHTML = ""; // Clear loading
      docs.forEach((d) => {
        const div = document.createElement("div");
        div.className =
          "p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer";
        div.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-900 dark:text-white">${d.titulo}</h4>
                            <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">${d.categoria} • ${d.variaveis?.length || 0} campos personalizáveis</p>
                        </div>
                    </div>
                `;
        div.onclick = () => {
          if (callbackUsarDocumento) callbackUsarDocumento(d.id, d.titulo);
        };
        list.appendChild(div);
      });
    }
  } catch (err) {
    if (list)
      list.innerHTML =
        '<p class="text-center text-red-500">Erro ao carregar documentos</p>';
    console.error(err);
  }
}

export function fecharDocumentos() {
  document.getElementById("docModal")?.classList.add("hidden");
}

/* =========================
   TOAST NOTIFICATIONS
========================= */
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  // Icons based on type
  const icons = {
    success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  };

  const colors = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };

  const toast = document.createElement("div");
  toast.className = `max-w-xs w-full shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 translate-x-full opacity-0 ${colors[type] || colors.info}`;

  toast.innerHTML = `
    <div class="p-4 flex items-start gap-3">
      <div class="flex-shrink-0">
        ${icons[type] || icons.info}
      </div>
      <div class="flex-1 text-sm font-medium">
        ${message}
      </div>
      <div class="flex-shrink-0 flex">
        <button class="rounded-lg p-1 hover:bg-white/20 transition-colors focus:outline-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  `;

  // Close button logic
  toast.querySelector("button").onclick = () => removeToast(toast);

  container.appendChild(toast);

  // Animate Entrance
  requestAnimationFrame(() => {
    toast.classList.remove("translate-x-full", "opacity-0");
    toast.classList.add("translate-x-0", "opacity-100");
  });

  // Auto Dismiss
  setTimeout(() => removeToast(toast), 4000);
}

function removeToast(el) {
  el.classList.add("translate-x-full", "opacity-0");
  setTimeout(() => {
    el.remove();
  }, 300);
}
