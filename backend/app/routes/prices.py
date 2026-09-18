from fastapi import APIRouter
from app.services.agmarknet_service import AgMarkNetService

router = APIRouter()

@router.get("/prices")
def get_prices(crop_id: int = 1):
    df = AgMarkNetService.load_prices_df()
    crop_prices = df[df['crop_id'] == crop_id]
    return {
        "status": "success",
        "prices": crop_prices.to_dict(orient="records")
    }
