from fastapi import APIRouter
from app.services.ai_service import AIService

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Selling Blind - Mandi Saathi API",
        "version": "1.0.0"
    }

@router.get("/ai/health")
async def ai_health():
    return await AIService.check_health()
