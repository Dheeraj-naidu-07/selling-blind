from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None

class AnalysisRequest(BaseModel):
    crop: str
    quantity: float = Field(..., gt=0)
    current_offered_price: float = Field(..., gt=0) # per kg or per qtl
    price_unit: Optional[str] = "kg" # "kg" or "qtl"
    location: Optional[LocationInput] = None
    language: Optional[str] = "en"

class PriceSignal(BaseModel):
    label: str
    display: str
    current_price: float
    historical_median: float
    deviation_percent: float
    unit: str = "₹/kg"

class HistoricalSummary(BaseModel):
    typical_low: float
    typical_high: float
    percentile: float
    observation_count: int
    season: str

class NearbyMandi(BaseModel):
    name: str
    distance_km: float
    historical_median: float
    difference_percent: float
    signal: str

class Confidence(BaseModel):
    level: str
    score: float

class Explanation(BaseModel):
    text: str
    source: str

class AnalyzePriceResponse(BaseModel):
    status: str
    price_signal: PriceSignal
    historical: HistoricalSummary
    nearby_mandis: List[NearbyMandi]
    confidence: Confidence
    explanation: Explanation
    data_info: Dict[str, Any]

class AiHealthResponse(BaseModel):
    provider: str
    model: str
    reachable: bool
