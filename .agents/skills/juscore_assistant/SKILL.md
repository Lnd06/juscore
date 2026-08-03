---
name: juscore-assistant
description: Auxilia no desenvolvimento e manutenção do ecossistema JusCore.net (Legal-Tech SaaS). Contém o histórico completo de arquitetura, decisões técnicas, regras de design editorial premium, integração Pinecone RAG, editor A4 e simulador OAB.
---

# JusCore Assistant Skill

Este guia serve como memória técnica e de design para agentes de IA trabalhando no repositório **JusCore** (`v1.6.5_anty`). Ele assegura a fidelidade do layout editorial premium, a arquitetura split-screen e as integrações de backend/Pinecone.

---

## 🛠️ Stack Tecnológica

* **Frontend**: React, React Router (`App.jsx`), Tailwind CSS.
* **Backend**: Node.js/Express (API de Assinaturas, chat e integração de LLMs).
* **Banco Vetorial & RAG**: Pinecone Serverless (AWS), com embeddings gerados por `gemini-embedding-001` (3072 dimensões).
* **Vídeo Promocional**: Remotion v4 (React 19 + TypeScript + Tailwind CSS v4).
* **Exportações**: `html2pdf.js` para PDF ABNT.

---

## 🎨 Diretrizes de Design & UI/UX (Editorial Premium)

O JusCore migrou de um modelo genérico de "glassmorphism com neons" para uma estética **Editorial Escura** e minimalista. Siga sempre estas regras visuais ao mexer no frontend:

### 1. Paleta de Cores e Estilo Visual
* **Modo Escuro Obrigatório**: A aplicação é **estritamente Dark Mode**. O modo claro foi removido. O `ThemeContext.jsx` está fixado em `'dark'`.
* **Cores Principais**: Tons de cinza escuro, branco e detalhes sutis em dourado luxo (`#D4AF37`).
* **Bordas**: Use bordas finas com opacidade baixa (`border-white/[0.06]`) e cantos arredondados por hierarquia (`rounded-lg` a `rounded-2xl`). Evite `rounded-3xl` e `rounded-full` excessivos.
* **Ícones**: Substitua ícones Lucide genéricos (como `Gavel` ou `GraduationCap`) pelo logo institucional customizado **`Vector 5.svg`**, colorido via CSS filter para manter o tom dourado ou azul respectivo.

### 2. Layout Split-Screen (Workspace Bilateral)
* A tela de [Chat.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/dashboard/Chat.jsx) divide-se em 50/50 no desktop:
  * **Esquerda**: Chat com linhas editoriais (sem balões coloridos estilo WhatsApp) e a caixa de digitação redonda [ChatInput.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/dashboard/chat/ChatInput.jsx).
  * **Direita**: Editor físico A4 ([CustomDocEditor](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/components/layout/CustomDocEditor.jsx)) que renderiza folhas com margens ABNT (3cm esquerda/superior, 2cm direita/inferior) e fonte Times New Roman.
* O chat deve conter botões dourados de ação rápida como **"Editar no Documento A4"** para carregar a resposta diretamente no editor lateral.

### 3. Componentes Especiais
* **Indicador de Loading**: Exibe o logo giratório (`animate-spin` utilizando `Vector 5.svg`) seguido de 3 pontos piscantes (`animate-bounce`), implementado em `MessageList.jsx` e `TccAssistant.jsx`.
* **Dropdown do Usuário no Header**: Substitui as opções da sidebar por um menu suspenso elegante no [Header.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/components/layout/Header.jsx) contendo Perfil, Fale Conosco, Sobre Nós, Reportar Bug e Logout.

---

## 💾 Banco de Dados & RAG (Pinecone)

* **Embeddings**: O modelo padrão é `gemini-embedding-001` (3072 dimensões). Não utilize modelos de 768 dimensões para evitar conflitos com o banco Pinecone.
* **Biblioteca Jurídica**: Os livros e materiais de consulta estão indexados no Pinecone Serverless. O script de sincronização local é o [migrate_library.js](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/backend/scripts/migrate_library.js).

---

## 🎬 Remotion (Ajustes de Vídeo)

* **Cena 2 (IA Jurídica)**: O texto destaque é **"IA TREINADA NO DIREITO BRASILEIRO"** (remover termo "IA 100% Brasileira").
* **Cena 3 (Simulador OAB)**: 
  * Dividida em duas etapas: Digitação e clique em "Entrar e Corrigir" (Frames 315-405), e transição automática para a aba "Resultado" com a nota subindo até **`9.25`** e exibindo card de feedback dourado (Frames 405-495).
  * A petição inserida no simulador OAB é uma peça real de **Ação Indenizatória** baseada no CDC/CC.
  * O TypeText da Cena 3 inicia no frame local `10` (frame 325 global).

---

## 🗺️ Mapa de Arquivos Principais

* **Roteamento Principal**: [App.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/App.jsx)
* **Design da Landing Page**: [Landing.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/landing/Landing.jsx), [Hero.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/landing/Hero.jsx), [FAQ.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/landing/FAQ.jsx)
* **Rotas de Calculadoras Públicas**: [PublicCalculatorPage.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/public/PublicCalculatorPage.jsx)
* **Chat e Input**: [Chat.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/dashboard/Chat.jsx), [ChatInput.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/dashboard/chat/ChatInput.jsx), [MessageList.jsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/frontend/src/pages/dashboard/chat/MessageList.jsx)
* **Serviços Backend**: [pineconeService.js](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/backend/services/pineconeService.js), [geminiService.js](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/backend/services/geminiService.js)
* **Composição de Vídeo**: [JuscoreIntro.tsx](file:///c:/juri_AI/v1.6.5_anty%20-%20Copia/remotion/src/JuscoreIntro.tsx)
