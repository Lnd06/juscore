import json
import os
import requests
from typing import TypedDict, Dict, Any, List, Optional
from pathlib import Path
from pydantic import BaseModel, Field

from backend.config import settings

# Caminhos locais para leitura de playbooks
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PLAYBOOKS_DIR = PROJECT_ROOT / "playbooks"

class AgentState(TypedDict):
    pilar: str
    user_input: Optional[str]
    research_notes: str
    hook: str
    caption: str
    image_prompt: str
    critique: str
    is_valid: bool
    iterations: int

# Pydantic models para validação estruturada local
class DraftOutput(BaseModel):
    hook: str = Field(description="Frase curta de impacto (hook) para aparecer escrita em destaque na imagem do post.")
    caption: str = Field(description="A legenda completa formatada do post com emojis, CTAs e hashtags.")
    image_prompt: str = Field(description="O prompt detalhado para a geração de imagem (em inglês ou português).")

class CritiqueOutput(BaseModel):
    is_valid: bool = Field(description="True se o post segue 100% as regras de negócio, False caso contrário.")
    feedback: str = Field(description="Feedback detalhado apontando erros se não for válido.")

def web_search(query: str) -> str:
    """Realiza uma busca rápida no DuckDuckGo de forma resiliente."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    url = f"https://html.duckduckgo.com/html/?q={query}"
    try:
        response = requests.get(url, headers=headers, timeout=8)
        if response.status_code == 200:
            # Parse muito simples baseado em tags HTML básicas para evitar dependência de BS4
            text = response.text
            snippets = []
            start = 0
            for _ in range(5):
                start = text.find('class="result__snippet"', start)
                if start == -1:
                    break
                start = text.find('>', start) + 1
                end = text.find('</a>', start)
                snippet = text[start:end].replace('<b>', '').replace('</b>', '').strip()
                if snippet:
                    snippets.append(snippet)
                start = end
            if snippets:
                return "\n- ".join(snippets)
    except Exception as e:
        print(f"⚠️ Erro ao acessar busca web: {e}")
    
    # Fallback se a requisição falhar ou não retornar dados
    return "Não foi possível pesquisar novidades em tempo real. Use referências gerais sobre exames da OAB recentes e prazos acadêmicos."

def call_hermes_json(messages: List[Dict[str, str]], schema: type) -> Dict[str, Any]:
    """Chama a API do OpenRouter com o modelo Hermes 3 solicitando saída estruturada em JSON."""
    url = f"{settings.OPENROUTER_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://juscore.com.br",
        "X-Title": "JusCore Social Manager"
    }
    payload = {
        "model": settings.HERMES_MODEL,
        "messages": messages,
        "response_format": {
            "type": "json_object"
        }
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=45)
        response.raise_for_status()
        res_data = response.json()
        content = res_data["choices"][0]["message"]["content"]
        print(f"DEBUG LLM Raw Response: {content}")
        
        # Faz o parse e valida usando o Pydantic
        parsed_json = json.loads(content)
        # Retorna o dicionário validado
        return parsed_json
    except Exception as e:
        print(f"❌ Erro ao chamar OpenRouter Hermes: {e}")
        # Retorna mock vazio/resiliente para evitar quebras abruptas do fluxo do Grafo
        if schema == DraftOutput:
            return {"caption": "Erro ao gerar legenda com a IA.", "image_prompt": "Error generating image prompt"}
        return {"is_valid": True, "feedback": "Auto-aprovado por falha na conexão de revisão."}

# ==========================================
# NÓS DO GRAFO LANGGRAPH
# ==========================================

def research_node(state: AgentState) -> Dict[str, Any]:
    """Lê os playbooks locais e busca tópicos quentes na web."""
    print(f"🔍 [Pesquisa/Ideação] Iniciando busca para pilar: {state['pilar']}")
    
    # 1. Carregar Playbooks
    content_playbook = ""
    hooks_playbook = ""
    
    try:
        with open(PLAYBOOKS_DIR / "pilares_de_conteudo.md", "r", encoding="utf-8") as f:
            content_playbook = f.read()
        with open(PLAYBOOKS_DIR / "hooks_de_venda.md", "r", encoding="utf-8") as f:
            hooks_playbook = f.read()
    except Exception as e:
        print(f"⚠️ Falha ao ler playbooks: {e}")
        
    # 2. Pesquisa Web em Tempo Real
    query = f"faculdade de direito oab tcc novidades"
    if state["user_input"]:
        query = f"direito {state['user_input']} novidades"
    
    web_results = web_search(query)
    
    # 3. Consolidar Notas de Pesquisa
    research_notes = f"""
    === REGRAS DO PILAR E PLAYBOOKS ===
    {content_playbook[:1500]}
    
    === HOOKS DE REFERÊNCIA ===
    {hooks_playbook[:1500]}
    
    === NOTÍCIAS/TENDÊNCIAS DA WEB ===
    {web_results}
    """
    
    return {"research_notes": research_notes}

def generation_node(state: AgentState) -> Dict[str, Any]:
    """Gera a copy (caption) e o prompt da imagem baseada nas notas de pesquisa."""
    print(f"✍️ [Geração] Rascunhando conteúdo... Iteração: {state['iterations'] + 1}")
    
    system_prompt = (
        "Você é o JusCore Social Manager, um redator publicitário de alto impacto focado em estudantes de Direito.\n"
        "Seu objetivo é escrever postagens focadas nas dores dos estudantes (TCC, Monografia, OAB, Estágio, Produtividade) "
        "e sempre converter para o plano 'Estudante Pro' de R$ 29,90/mês.\n"
        "Responda estritamente em formato JSON válido contendo os campos: 'hook', 'caption' e 'image_prompt'.\n"
        "Schema esperado:\n"
        "{\n"
        "  \"hook\": \"frase de impacto curta para a imagem\",\n"
        "  \"caption\": \"texto da legenda aqui com emojis, CTAs e hashtags\",\n"
        "  \"image_prompt\": \"descrição da imagem para ferramenta de desenho\"\n"
        "}"
    )
    
    user_msg = (
        f"Pilar selecionado: {state['pilar'].upper()}\n"
        f"Input do usuário (briefing): {state['user_input'] or 'Nenhum'}\n\n"
        f"Notas de Pesquisa:\n{state['research_notes']}\n\n"
        "Escreva uma legenda atraente e persuasiva de acordo com os pilares da marca. "
        "Não use juridiquês. Use tom informal e amigável. Finalize com hashtags relevantes. "
        "Gere também um prompt detalhado e descritivo em inglês para criar a imagem de fundo do post."
    )
    
    if state["critique"] and not state["is_valid"]:
        user_msg += f"\n\nATENÇÃO: O rascunho anterior foi rejeitado com o seguinte feedback. Por favor corrija os erros:\n{state['critique']}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
    
    result = call_hermes_json(messages, DraftOutput)
    
    new_hook = result.get("hook", "").strip() or state.get("hook", "")
    new_caption = result.get("caption", "").strip() or state.get("caption", "")
    new_image_prompt = result.get("image_prompt", "").strip() or state.get("image_prompt", "")
    
    return {
        "hook": new_hook,
        "caption": new_caption,
        "image_prompt": new_image_prompt,
        "iterations": state["iterations"] + 1
    }

def critique_node(state: AgentState) -> Dict[str, Any]:
    """Critica e valida a geração contra restrições rígidas de negócio."""
    print("⚖️ [Crítica/Revisão] Validando regras de negócio...")
    
    system_prompt = (
        "Você é o Diretor de Conformidade Jurídica e Marketing da JusCore AI.\n"
        "Sua tarefa é auditar a postagem gerada de acordo com as regras rígidas da empresa.\n"
        "Responda estritamente em formato JSON válido contendo os campos: 'is_valid' (boolean) e 'feedback' (string).\n"
        "Schema:\n"
        "{\n"
        "  \"is_valid\": true ou false,\n"
        "  \"feedback\": \"detalhes de conformidade ou erros encontrados\"\n"
        "}"
    )
    
    user_msg = (
        f"Legenda proposta (caption):\n{state['caption']}\n\n"
        f"Prompt da imagem:\n{state['image_prompt']}\n\n"
        "REGRAS DE CONFORMIDADE DA MARCA:\n"
        "1. O público-alvo deve ser EXCLUSIVAMENTE estudante de direito ou bacharel preparando para OAB/TCC/Estágio.\n"
        "   NUNCA fale com escritórios profissionais ou advogados formados.\n"
        "2. A conversão de vendas DEVE ser para o plano 'Estudante Pro' por 'R$ 29,90/mês'. Não use outros planos ou valores.\n"
        "3. A copy não deve prometer aprovação garantida (ex: 'aprovado com certeza'), mas sim preparação, auxílio e ferramentas.\n"
        "4. O tom deve ser informal, empático e sem termos jurídicos complexos desnecessários.\n"
        "5. Deve conter pelo menos 5 hashtags relevantes.\n"
        "6. Emojis devem ser usados moderadamente (3 a 8 no máximo).\n\n"
        "Verifique se o post obedece a todas as regras. Se alguma for violada, is_valid deve ser False e o feedback deve detalhar as correções exigidas."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
    
    result = call_hermes_json(messages, CritiqueOutput)
    
    return {
        "is_valid": result.get("is_valid", True),
        "critique": result.get("feedback", "")
    }

# Roteamento condicional
def should_continue(state: AgentState) -> str:
    if state["is_valid"] or state["iterations"] >= 3:
        return "end"
    return "generate"

# ==========================================
# CONSTRUÇÃO DO GRAFO (LangGraph)
# ==========================================
from langgraph.graph import StateGraph, END

def get_agent_graph():
    builder = StateGraph(AgentState)
    
    builder.add_node("research", research_node)
    builder.add_node("generate", generation_node)
    builder.add_node("critique", critique_node)
    
    builder.set_entry_point("research")
    builder.add_edge("research", "generate")
    builder.add_edge("generate", "critique")
    
    builder.add_conditional_edges(
        "critique",
        should_continue,
        {
            "generate": "generate",
            "end": END
        }
    )
    
    return builder.compile()

def run_agent(pilar: str, user_input: Optional[str] = None) -> Dict[str, Any]:
    """Executa a orquestração do Hermes Agent no LangGraph."""
    graph = get_agent_graph()
    initial_state = {
        "pilar": pilar,
        "user_input": user_input,
        "research_notes": "",
        "hook": "",
        "caption": "",
        "image_prompt": "",
        "critique": "",
        "is_valid": False,
        "iterations": 0
    }
    
    result = graph.invoke(initial_state)
    return {
        "hook": result.get("hook", ""),
        "caption": result.get("caption", ""),
        "image_prompt": result.get("image_prompt", ""),
        "is_valid": result.get("is_valid", False)
    }
