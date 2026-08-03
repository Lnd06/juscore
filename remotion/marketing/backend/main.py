import datetime
import json
import os
import subprocess
import sys
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from backend.config import settings
from backend.database import init_db, get_session
from backend.models import Post, PostStatus, PostCreate, PostUpdate
from backend.agent import run_agent
from backend.audio import generate_narration_audio

# Adicionar raiz do projeto ao path para importar scripts locais
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))
from scripts.generate_post import generate_post as run_post_generator

# Gerenciador de ciclo de vida (Lifespan)
ngrok_process = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ngrok_process
    
    # 1. Inicializar Banco de Dados
    print("🗄️ Inicializando banco de dados...")
    init_db()
    
    # 2. Inicializar ngrok automaticamente se o authtoken estiver definido
    if settings.NGROK_AUTHTOKEN and settings.NGROK_AUTHTOKEN != "SEU_NGROK_AUTHTOKEN_AQUI":
        try:
            print("🔑 Configurando authtoken do ngrok...")
            subprocess.run(["ngrok", "config", "add-authtoken", settings.NGROK_AUTHTOKEN], check=True)
            
            ngrok_cmd = ["ngrok", "start", "api-marketing", "--config", "ngrok.yml"]
            print(f"🚀 Iniciando túnel ngrok: {' '.join(ngrok_cmd)}")
            ngrok_process = subprocess.Popen(
                ngrok_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        except Exception as e:
            print(f"⚠️ Falha ao inicializar ngrok automaticamente: {e}")
            
    yield
    
    # 3. Encerrar ngrok ao desligar
    if ngrok_process:
        print("🛑 Finalizando túnel ngrok...")
        ngrok_process.terminate()
        ngrok_process.wait()

app = FastAPI(
    title="JusCore Social Manager API",
    description="API para orquestração de marketing autônomo, geração de posts e renderização de vídeo.",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS para permitir acessos locais do app ou dashboard web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Garantir existência da pasta de artes
ARTES_DIR = PROJECT_ROOT / "artes"
ARTES_DIR.mkdir(parents=True, exist_ok=True)

# Servir arquivos estáticos (fotos e vídeos gerados) para o app poder baixar/ver
app.mount("/artes", StaticFiles(directory=str(ARTES_DIR)), name="artes")

# Servir assets da marca (logo, etc.)
app.mount("/assets", StaticFiles(directory=str(PROJECT_ROOT / "assets")), name="assets")

# Servir arquivos estáticos do frontend (styles.css, app.js)
app.mount("/static", StaticFiles(directory=str(PROJECT_ROOT / "frontend")), name="static")

@app.get("/")
def serve_dashboard():
    """Retorna a interface do painel web de gestão social."""
    return FileResponse(PROJECT_ROOT / "frontend" / "index.html")

# Segurança básica opcional (além do Basic Auth do ngrok)
security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    is_correct_username = credentials.username == settings.API_USERNAME
    is_correct_password = credentials.password == settings.API_PASSWORD
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas para o app de aprovação",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Rotas auxiliares
def get_pilar_of_the_day() -> str:
    day = datetime.datetime.now().weekday()
    mapping = {
        0: "tcc",
        1: "oab",
        2: "produtividade",
        3: "estagio",
        4: "chat",  # Sexta-feira: IA do Direito/Chat
        5: "oab",
        6: "tcc"
    }
    return mapping.get(day, "tcc")

class GenerateRequest(BaseModel):
    pilar: Optional[str] = None
    user_input: Optional[str] = None

# ==========================================
# ENDPOINTS DA API REST
# ==========================================

@app.post("/posts/generate", response_model=Post, status_code=201)
def generate_new_post(payload: GenerateRequest, db: Session = Depends(get_session)):
    """
    Aciona o Hermes Agent via LangGraph para gerar copy e prompt,
    e depois executa o script local para criar a arte inicial.
    """
    pilar = payload.pilar or get_pilar_of_the_day()
    user_input = payload.user_input
    
    print(f"🤖 Acionando Hermes Agent para pilar: {pilar.upper()} com input: {user_input}")
    
    # 1. Rodar orquestração do Agente
    agent_res = run_agent(pilar=pilar, user_input=user_input)
    
    # 2. Gerar a imagem base e o texto do post localmente usando o script generate_post.py
    # Usamos o ID do post para garantir nomes de arquivo únicos
    post_uuid = uuid.uuid4()
    
    try:
        final_img_path, final_txt_path = run_post_generator(
            pilar_name=pilar,
            format_name="feed_portrait",
            layout_style="classic",  # Pode ser aleatório ou customizado
            index=str(post_uuid)[:8],
            custom_hook=agent_res["hook"],
            custom_copy=agent_res["caption"]
        )
        
        # Obter caminho relativo para servir estaticamente
        image_relative_url = f"/artes/{Path(final_img_path).name}"
    except Exception as e:
        print(f"❌ Erro ao executar scripts/generate_post.py: {e}")
        image_relative_url = None
        
    # 3. Salvar no PostgreSQL
    new_post = Post(
        id=post_uuid,
        pilar=pilar,
        caption=agent_res["caption"],
        image_prompt=agent_res["image_prompt"],
        image_url=image_relative_url,
        status=PostStatus.PENDENTE,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return new_post

@app.get("/posts/pending", response_model=List[Post])
def get_pending_posts(db: Session = Depends(get_session)):
    """Retorna os posts em estado PENDENTE para aprovação no App."""
    statement = select(Post).where(Post.status == PostStatus.PENDENTE).order_by(Post.created_at.desc())
    results = db.exec(statement).all()
    return results

@app.get("/posts/history", response_model=List[Post])
def get_history_posts(db: Session = Depends(get_session)):
    """Retorna os posts aprovados ou rejeitados (histórico)."""
    statement = select(Post).where(Post.status != PostStatus.PENDENTE).order_by(Post.created_at.desc())
    results = db.exec(statement).all()
    return results

@app.get("/posts/{id}", response_model=Post)
def get_post_by_id(id: uuid.UUID, db: Session = Depends(get_session)):
    """Retorna o post pelo ID para verificar o progresso de renderização do vídeo."""
    post = db.get(Post, id)
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    return post

def render_remotion_video_background(post_id: uuid.UUID, db_session_factory):
    """Função executada em background para renderizar o vídeo do Remotion."""
    video_dir = PROJECT_ROOT / "video"
    if not video_dir.exists():
        print("⚠️ Diretório de vídeo '/video' não encontrado. Abortando render do Remotion.")
        return
        
    # Busca o post
    with Session(db_session_factory) as db:
        post = db.get(Post, post_id)
        if not post:
            return
            
        print(f"🎬 Iniciando render do Remotion para o post {post_id}...")
        
        # Gera o áudio de narração (TTS) usando Gemini 2.0 Flash
        audio_filename = f"narration_{post_id}.wav"
        output_audio_path = ARTES_DIR / audio_filename
        
        audio_generated = generate_narration_audio(post.caption, str(output_audio_path))
        
        # Executa o script render.js passando as propriedades
        # Salva o arquivo final de vídeo na pasta de artes
        output_video_name = f"video_{post_id}.mp4"
        output_video_path = ARTES_DIR / output_video_name
        
        # Constrói props em formato JSON
        props_data = {
            "caption": post.caption,
            "imageUrl": f"http://localhost:{settings.PORT}{post.image_url}" if post.image_url else "",
            "audioUrl": f"http://localhost:{settings.PORT}/artes/{audio_filename}" if audio_generated else ""
        }
        
        props_file = video_dir / f"props_{post_id}.json"
        with open(props_file, "w", encoding="utf-8") as pf:
            pf.write(json.dumps(props_data, ensure_ascii=False))
            
        try:
            # Chama o render.js usando node
            # node render.js <props_path> <output_path>
            cmd = ["node", "render.js", str(props_file), str(output_video_path)]
            print(f"Running command: {' '.join(cmd)}")
            res = subprocess.run(cmd, cwd=str(video_dir), capture_output=True, text=True, check=True)
            
            print(f"🎉 Remotion Renderizado com Sucesso!\n{res.stdout}")
            
            # Limpa arquivo temporário de props
            if props_file.exists():
                os.remove(props_file)
                
            # Atualiza o banco de dados
            post.video_path = f"/artes/{output_video_name}"
            db.add(post)
            db.commit()
        except Exception as e:
            print(f"❌ Erro ao renderizar vídeo com Remotion: {e}")

@app.post("/posts/{id}/approve", response_model=Post)
def approve_post(id: uuid.UUID, payload: PostUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    """Aprova o post e inicia a renderização do vídeo em background."""
    post = db.get(Post, id)
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
        
    post.status = PostStatus.APROVADO
    if payload.caption:
        post.caption = payload.caption # Permite salvar a legenda modificada pelo usuário
        
    db.add(post)
    db.commit()
    db.refresh(post)
    
    # Agenda a renderização do vídeo em background
    background_tasks.add_task(render_remotion_video_background, post.id, db.bind)
    
    return post

@app.post("/posts/{id}/reject", response_model=Post)
def reject_post(id: uuid.UUID, db: Session = Depends(get_session)):
    """Rejeita o post e impede sua publicação."""
    post = db.get(Post, id)
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
        
    post.status = PostStatus.REJEITADO
    db.add(post)
    db.commit()
    db.refresh(post)
    
    return post

if __name__ == "__main__":
    import uvicorn
    import json
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
