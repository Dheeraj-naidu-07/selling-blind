import httpx
import logging

logger = logging.getLogger(__name__)

class WeatherService:
    OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

    @classmethod
    async def get_weather_context(cls, latitude: float, longitude: float) -> dict:
        try:
            params = {
                "latitude": latitude,
                "longitude": longitude,
                "current_weather": "true"
            }
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(cls.OPEN_METEO_URL, params=params)
                if res.status_code == 200:
                    data = res.json()
                    curr = data.get("current_weather", {})
                    temp = curr.get("temperature", 29.0)
                    weather_code = curr.get("weathercode", 0)
                    
                    condition = "Clear"
                    if weather_code in [1, 2, 3]:
                        condition = "Partly cloudy"
                    elif weather_code in [51, 53, 55, 61, 63, 65, 80, 81]:
                        condition = "Rain showers expected"
                    
                    return {
                        "available": True,
                        "temperature": float(temp),
                        "precipitation": 0.0 if weather_code == 0 else 0.2,
                        "condition": condition,
                        "message": f"Weather context: {condition} in region."
                    }
        except Exception as e:
            logger.warning(f"Open-Meteo weather service unavailable: {e}")
        
        return {
            "available": False,
            "message": "Weather data temporarily unavailable"
        }
