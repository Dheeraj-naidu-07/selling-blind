from pydantic import BaseModel
from typing import Optional

class MandiBase(BaseModel):
    name: str
    state: str
    district: str
    latitude: float
    longitude: float

class MandiResponse(MandiBase):
    id: int

    class Config:
        from_attributes = True
