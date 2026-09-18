from fastapi import APIRouter
from app.services.crop_service import CropService

router = APIRouter()

@router.get("/crops")
def get_crops():
    return {
        "status": "success",
        "crops": CropService.list_all_crops()
    }
