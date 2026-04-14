tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        // Primary: "Confiança & Autoridade" (Azul Marinho) + "Limpo" (SaaS Moderno) -> Slate/Blue Navy
        primary: {
          50: "#f8fafc", // slate-50
          100: "#f1f5f9", // slate-100
          200: "#e2e8f0", // slate-200
          300: "#cbd5e1", // slate-300
          400: "#94a3b8", // slate-400
          500: "#64748b", // slate-500
          600: "#2563eb", // blue-600 (Ação elétrica do Conceito 3)
          700: "#1d4ed8", // blue-700
          800: "#1e40af", // blue-800
          900: "#1e3a8a", // blue-900 (Autoridade do Conceito 1)
          950: "#0f172a", // slate-950 (Fundo Limpo/Escuro)
        },
        // Secondary: "Limpo & Eficiente" -> Cinza Chumbo/Slate para estrutura
        juri: {
          50: "#f9fafb", // gray-50
          100: "#f3f4f6", // gray-100
          200: "#e5e7eb", // gray-200
          300: "#d1d5db", // gray-300
          400: "#9ca3af", // gray-400
          500: "#6b7280", // gray-500
          600: "#4b5563", // gray-600
          700: "#374151", // gray-700
          800: "#1f2937", // gray-800
          900: "#111827", // gray-900
        },
        // Accent: "Autoridade" -> Dourado/Bronze para destaques premium
        accent: {
          500: "#d97706", // amber-600 (Gold)
          600: "#b45309", // amber-700 (Bronze)
        },
      },
    },
  },
};
