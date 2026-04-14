import { apiFetch } from "./api.js";

export let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export async function loadUser() {
  try {
    console.log("🔄 Tentando carregar usuário...");
    // We can use apiFetch here, which automatically adds the token
    const res = await apiFetch("/auth/me");

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Usuário carregado:", data.user.id);
      currentUser = data.user;
      updateUIForUser();
      return currentUser; // Return user to indicate success
    } else {
      console.warn("⚠️ Falha ao carregar usuário. Status:", res.status);
      if (res.status === 401 || res.status === 403) {
        console.warn("🔐 Token inválido ou expirado. Deslogando...");
        logout();
      }
      return null;
    }
  } catch (err) {
    console.error("❌ Erro de rede/servidor ao carregar usuário:", err);
    // Do NOT logout on network error, just show guest UI temporarily
    updateUIForGuest();
    return null;
  }
}

export function updateUIForUser() {
  console.log("🎨 [auth.js] updateUIForUser called. User:", currentUser);
  if (!currentUser) {
    console.error("❌ [auth.js] currentUser is null!");
    return;
  }

  const els = {
    loginPrompt: document.getElementById("loginPrompt"),
    userInfo: document.getElementById("userInfo"),
    logoutBtn: document.getElementById("logoutBtn"),
    userName: document.getElementById("userName"),
    userEmail: document.getElementById("userEmail"),
    avatarImg: document.getElementById("userAvatarImg"),
    avatarText: document.getElementById("userAvatarText"),
    welcomeText: document.getElementById("welcomeText"),
    adminLink: document.getElementById("adminLink"),
  };

  console.log("🔍 [auth.js] Elements found:", {
    loginPrompt: !!els.loginPrompt,
    userInfo: !!els.userInfo,
    logoutBtn: !!els.logoutBtn,
  });

  // Hide login prompt, show user info
  els.loginPrompt?.classList.add("hidden");
  els.userInfo?.classList.remove("hidden");
  els.logoutBtn?.classList.remove("hidden");

  // Update user info
  if (els.userName) els.userName.textContent = currentUser.apelido;
  if (els.userEmail) els.userEmail.textContent = currentUser.email;

  if (els.avatarImg && els.avatarText) {
    if (currentUser.foto) {
      els.avatarImg.src = currentUser.foto;
      els.avatarImg.classList.remove("hidden");
      els.avatarText.classList.add("hidden");
    } else {
      els.avatarImg.classList.add("hidden");
      els.avatarText.classList.remove("hidden");
      els.avatarText.textContent = (
        currentUser.apelido ||
        currentUser.nome ||
        "U"
      )
        .charAt(0)
        .toUpperCase();
    }
  }

  // Update welcome text
  if (els.welcomeText) {
    els.welcomeText.textContent = `Olá ${currentUser.apelido}! Como posso ajudar você hoje?`;
  } else {
    console.warn("⚠️ [auth.js] welcomeText element not found!");
  }

  // Show admin link if special
  if (currentUser.tipo === "especial" || currentUser.tipo === "admin") {
    els.adminLink?.classList.remove("hidden");
  }
}

export function updateUIForGuest() {
  document.getElementById("loginPrompt")?.classList.remove("hidden");
  document.getElementById("userInfo")?.classList.add("hidden");
  document.getElementById("logoutBtn")?.classList.add("hidden");
  document.getElementById("adminLink")?.classList.add("hidden");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  window.location.href = "/login";
}
