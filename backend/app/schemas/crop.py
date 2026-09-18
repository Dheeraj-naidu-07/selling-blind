from pydantic import BaseModel
from typing import Optional, List

class CropBase(BaseModel):
    name: str
    category: Optional[str] = None
    aliases: Optional[str] = None

class CropCreate(CropBase):
    pass

class CropResponse(CropBase):
    id: int

    class Config:
        from_attributes = True
