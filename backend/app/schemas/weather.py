from pydantic import BaseModel
from typing import Optional

class WeatherResponse(BaseModel):
    available: bool
    temperature: Optional[float] = None
    precipitation: Optional[float] = None
    condition: Optional[str] = None
    message: Optional[str] = None
