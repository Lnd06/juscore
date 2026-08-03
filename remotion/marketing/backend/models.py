import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from enum import Enum

class PostStatus(str, Enum):
    PENDENTE = "PENDENTE"
    APROVADO = "APROVADO"
    REJEITADO = "REJEITADO"
    PUBLICADO = "PUBLICADO"

class PostBase(SQLModel):
    pilar: str
    caption: str
    image_prompt: str
    image_url: Optional[str] = None
    video_path: Optional[str] = None
    status: PostStatus = Field(default=PostStatus.PENDENTE)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Post(PostBase, table=True):
    __tablename__ = "posts"
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )

class PostCreate(SQLModel):
    pilar: str
    caption: str
    image_prompt: str

class PostUpdate(SQLModel):
    caption: Optional[str] = None
    status: Optional[PostStatus] = None
    video_path: Optional[str] = None
    image_url: Optional[str] = None
