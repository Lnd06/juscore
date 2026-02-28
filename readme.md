⚖️ Juri_AI v1.6.5

Assistente Jurídico Inteligente com MongoDB, autenticação, gestão de documentos e painel administrativo.

## 🚀 Funcionalidades

- **🤖 Chat Inteligente**: Integração com Groq (Llama 3.1) para respostas jurídicas precisas
- **📚 Biblioteca de Documentos**: Upload de PDFs como modelos para geração de documentos
- **👤 Sistema de Usuários**: 
  - Login/Registro com JWT
  - Perfis: Comum, Especial e Admin
  - Apelido personalizado para a IA usar
  - Histórico das últimas 10 conversas
- **📊 Painel Administrativo** (usuários especiais):
  - Estatísticas de uso em tempo real
  - Upload de modelos de documentos
  - Cadastro de novos usuários especiais
  - Gráficos de atividade
- **🎨 Interface Moderna**:
  - Offcanvas lateral com histórico
  - Tema claro/escuro
  - Design responsivo com Tailwind CSS
  - Animações suaves

## 📁 Estrutura do Projeto

```
JURI_AI_v1.6.5/
├── backend/
│   ├── server.js              # Servidor Express principal
│   ├── package.json           # Dependências Node.js
│   ├── .env                   # Variáveis de ambiente
│   ├── models/                # Schemas MongoDB
│   │   ├── User.js           # Usuários (nome, email, senha, apelido, tipo)
│   │   ├── Conversation.js   # Histórico de conversas
│   │   ├── Document.js       # Modelos de documentos PDF
│   │   └── Stats.js          # Estatísticas de uso
│   ├── routes/               # Rotas da API
│   │   ├── auth.js          # Autenticação (login/registro)
│   │   ├── chat.js          # Chat com IA
│   │   ├── documents.js     # Gestão de documentos
│   │   ├── admin.js         # Painel administrativo
│   │   └── user.js          # Perfil e histórico
│   ├── middleware/
│   │   └── auth.js          # Verificação JWT
│   ├── services/
│   │   ├── dou.js           # Busca no Diário Oficial
│   │   └── planalto.js      # Scraping do Planalto
│   └── uploads/documents/   # PDFs armazenados
│
└── frontend/
    ├── index.html            # Chat principal (com offcanvas)
    ├── login.html            # Tela de login
    ├── register.html         # Criar conta
    ├── admin.html            # Painel especial/admin
    └── app.js                # JavaScript principal
```

## 🛠️ Instalação

### 1. Requisitos
- Node.js 18+
- MongoDB (local ou Atlas)
- Chave de API do Groq

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/juri_ai
JWT_SECRET=sua_chave_secreta_aqui_muito_segura_2024
GROQ_API_KEY=gsk_sua_chave_groq_aqui
MAX_TEXTO_PLANALTO=8000
```

### 3. Iniciar MongoDB

**Local:**
```bash
mongod --dbpath /caminho/para/dados
```

**Ou use MongoDB Atlas:**
- Crie cluster gratuito em mongodb.com
- Substitua `MONGODB_URI` pela string de conexão

### 4. Iniciar Servidor

```bash
npm start
# ou para desenvolvimento:
npm run dev
```

Servidor estará rodando em `http://localhost:3000`

### 5. Acessar Aplicação

Abra no navegador: `http://localhost:3000`

## 👥 Fluxo de Uso

### Usuário Comum
1. Acesse `/register` para criar conta (nome, email, senha, apelido)
2. Faça login em `/login`
3. Use o chat com o Juri_AI
4. Veja histórico no offcanvas lateral
5. Acesse modelos de documentos

### Usuário Especial/Admin
1. Faça login com conta especial
2. Acesse `/admin` para:
   - Ver estatísticas de uso
   - Upload de PDFs para biblioteca
   - Criar novos usuários especiais
   - Visualizar todos os usuários

## 📚 Sistema de Documentos

### Upload de Modelos (apenas especial)
1. Vá em `/admin`
2. Preencha título e categoria
3. Selecione PDF com variáveis no formato `{{nome_variavel}}`
4. O sistema detecta automaticamente as variáveis

### Uso no Chat
- Usuários podem solicitar: *"Quero usar o modelo de petição inicial"*
- A IA ajuda a preencher as variáveis
- Gera documento personalizado

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- JWT para autenticação
- Middleware de proteção por nível de acesso
- Rate limiting implícito

## 🎨 Personalização

### Cores
Editar em `frontend/index.html`:
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { 600: '#2563eb' },
        juri: { 600: '#0284c7' }
      }
    }
  }
}
```

## 🐛 Troubleshooting

**Erro de conexão MongoDB:**
```bash
# Verifique se o MongoDB está rodando
sudo systemctl status mongod
# ou
mongosh --eval "db.adminCommand('ping')"
```

**Erro Groq API:**
- Verifique sua chave em `https://console.groq.com`
- Verifique limites de rate

**PDF não processa:**
- Verifique se é PDF válido
- Tamanho máximo: 10MB
- Deve conter texto (não imagem escaneada)

## 📈 Próximas Versões

- [ ] Exportar conversas em PDF
- [ ] Busca vetorial nos documentos
- [ ] Integração com mais APIs jurídicas
- [ ] Notificações de atualizações DOU
- [ ] App mobile

## 📄 Licença

MIT - Sistema desenvolvido para facilitar o acesso ao Direito Brasileiro.

---
**Versão 1.6.5** | ⚖️ Juri_AI - Justiça Inteligente