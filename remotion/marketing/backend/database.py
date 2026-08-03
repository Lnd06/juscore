from sqlmodel import create_engine, SQLModel, Session
from backend.config import settings

# Adiciona argumentos de conexão extras caso seja SQLite para evitar problemas de threads no FastAPI
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL, 
    echo=True,
    connect_args=connect_args
)

def init_db():
    # Cria todas as tabelas se não existirem
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
