# Diretivas do Projeto de IA de Marketing

## Tecnologias e Versões
- **Backend:** Python 3.12, FastAPI, LangGraph, SQLModel.
- **LLM Local:** Hermes 3 (Llama 3.1 8B/70B) via Ollama.
- **Renderização:** Remotion v4, React, TypeScript.
- **Tunneling:** ngrok.

## Regras Críticas de Código (Remotion)
- **NUNCA** use animações ou transições CSS puras (elas quebram na renderização por frames do Remotion).
- Sempre anime propriedades utilizando a função `interpolate()` combinada com `useCurrentFrame()` e `spring()` / `Easing`.
- **SEMPRE** use `{ extrapolateRight: "clamp", extrapolateLeft: "clamp" }` em todas as funções de interpolação para evitar estouro de valores de frames.
- Carregue todos os assets locais (áudios, imagens estáticas) na pasta `/public` e use `staticFile()` para referenciá-los.

## Segurança de Rede
- **NUNCA** exponha credenciais, chaves de API ou tokens do ngrok no código-fonte. Utilize variáveis de ambiente ou arquivos `.env`.
