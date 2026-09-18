from fastapi import APIRouter
from app.services.agmarknet_service import AgMarkNetService

router = APIRouter()

@router.get("/mandis")
def get_mandis():
    df = AgMarkNetService.load_mandis_df()
    return {
        "status": "success",
        "mandis": df.to_dict(orient="records")
    }
