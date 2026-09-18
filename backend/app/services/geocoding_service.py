import httpx
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

class GeocodingService:
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
    FORWARD_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

    @classmethod
    async def reverse_geocode(cls, latitude: float, longitude: float) -> str:
        try:
            headers = {"User-Agent": "SellingBlindMandiSaathi/1.0"}
            params = {
                "lat": latitude,
                "lon": longitude,
                "format": "json"
            }
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(cls.NOMINATIM_URL, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    address = data.get("address", {})
                    city = address.get("city") or address.get("town") or address.get("village") or address.get("county") or "Hyderabad"
                    state = address.get("state", "Telangana")
                    country = address.get("country", "India")
                    return f"{city}, {state}, {country}"
        except Exception as e:
            logger.warning(f"Nominatim reverse geocoding unavailable: {e}")
        
        # Fallback to coordinate label
        return f"Location ({latitude:.4f}, {longitude:.4f})"

    @classmethod
    async def forward_geocode(cls, location_name: str) -> Optional[Tuple[float, float]]:
        if not location_name or not str(location_name).strip():
            return None
        try:
            headers = {"User-Agent": "SellingBlindMandiSaathi/1.0"}
            params = {
                "q": str(location_name).strip(),
                "format": "json",
                "limit": 1
            }
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(cls.FORWARD_NOMINATIM_URL, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    if data and len(data) > 0:
                        lat = float(data[0]["lat"])
                        lon = float(data[0]["lon"])
                        if -90 <= lat <= 90 and -180 <= lon <= 180:
                            return (lat, lon)
        except Exception as e:
            logger.warning(f"Nominatim forward geocoding unavailable for '{location_name}': {e}")
        return None

