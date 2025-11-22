# backend/schemas/board.py
from pydantic import BaseModel
from typing import Optional, Dict, Any

class BoardStateUpdate(BaseModel):
    board_data: Dict[str, Any]