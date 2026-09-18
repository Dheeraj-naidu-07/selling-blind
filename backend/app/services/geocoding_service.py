import httpx
import logging

logger = logging.getLogger(__name__)

class GeocodingService:
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"

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
