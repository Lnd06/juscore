import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        // Base: Premium Dark Authority
        juri: {
          950: "#0B0F19", // Preto Profundo (Base Principal)
          900: "#131B2E", // Azul Noturno Premium (Containers)
          800: "#1F2A45", // Azul Aço (Fundo Terciário)
          700: "#2C354F", // Cinza Aço (Bordas/Cards)
          600: "#374151",
          500: "#6B7280", // Texto Desativado
          400: "#9CA3AF", // Texto Secundário
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F3F4F6", // Texto Principal
          50: "#F9FAFB",
        },
        // Accent: Gold Lux (Protagonista)
        accent: {
          light: "#F2D272", // Gold Light
          DEFAULT: "var(--brand-primary, #D4AF37)", // Gold Lux (Principal)
          dark: "#C9A227", // Hover Gold
        },
        // Action: Tech Blue (Secundário/Ação)
        action: {
          light: "#2563EB", // Azul CTA
          DEFAULT: "var(--brand-accent, #1E3A8A)", // Agora configurável
          dark: "#1D4ED8", // Azul Hover
        },
        // Novas Cores White Label
        brand: {
          sidebar: "var(--brand-sidebar)",
          bg: "var(--brand-bg)",
          border: "var(--brand-border)",
          accent: "var(--brand-accent)",
        },
        // Mantendo compatibilidade com código legado
        primary: {
          DEFAULT: "var(--brand-primary, #D4AF37)", // Agora o primário é DOURADO
          50: "var(--brand-bg, #f8fafc)",
          100: "var(--brand-bg, #f1f5f9)",
          200: "var(--brand-border, #e2e8f0)",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "var(--brand-primary, #D4AF37)", // Ref para buttons antigos
          700: "var(--brand-primary, #D4AF37)",
          800: "#1e40af",
          900: "var(--brand-secondary, #0B0F19)", // Base escura
          950: "var(--brand-secondary, #0B0F19)",
        },
      },
    },
  },
  plugins: [typography],
};
