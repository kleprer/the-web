from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class Position(BaseModel):
    x: float
    y: float

class Card(BaseModel):
    id: str
    title: str
    articleUrl: str
    date: str
    trustLevel: str
    position: Position

class Text(BaseModel):
    id: str
    content: str
    position: Position

class Image(BaseModel):
    id: str
    url: str
    position: Position

class Connection(BaseModel):
    id: str
    start: Dict[str, str]
    end: Dict[str, str]

class BoardState(BaseModel):
    cards: List[Card] = []
    texts: List[Text] = []
    images: List[Image] = []
    connections: List[Connection] = []

class BoardStateUpdate(BaseModel):
    board_data: Dict[str, Any]