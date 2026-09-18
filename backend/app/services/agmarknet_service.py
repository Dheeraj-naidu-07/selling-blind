import os
import logging
import httpx
import pandas as pd
import numpy as np
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class AgMarkNetService:
    DATA_GOV_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

    @classmethod
    def get_data_dir(cls) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base_dir, "data")

    @classmethod
    async def fetch_live_agmarknet_prices(cls, commodity: str = "Onion", state: str = "Telangana", limit: int = 50) -> List[Dict[str, Any]]:
        api_key = os.getenv("AGMARKNET_API_KEY") or os.getenv("DATA_GOV_API_KEY") or "579b464db66ec23bdd000001cdd394632b774f197bd7677b3d7e8d76"
        params = {
            "api-key": api_key,
            "format": "json",
            "limit": limit,
            "filters[commodity]": commodity
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(cls.DATA_GOV_URL, params=params)
                if res.status_code == 200:
                    data = res.json()
                    records = data.get("records", [])
                    if records:
                        logger.info(f"Successfully fetched {len(records)} live AgMarkNet records for {commodity}.")
                        return records
        except Exception as e:
            logger.warning(f"Live AgMarkNet API fetch notice: {e}")
        return []

    @classmethod
    def load_prices_df(cls) -> pd.DataFrame:
        data_dir = cls.get_data_dir()
        prices_file = os.path.join(data_dir, "demo_prices.csv")
        if os.path.exists(prices_file):
            df = pd.read_csv(prices_file)
            df['date'] = pd.to_datetime(df['date'])
            return df
        return pd.DataFrame(columns=['id', 'mandi_id', 'crop_id', 'date', 'min_price', 'max_price', 'modal_price', 'arrival_quantity', 'source'])

    @classmethod
    def load_mandis_df(cls) -> pd.DataFrame:
        data_dir = cls.get_data_dir()
        mandis_file = os.path.join(data_dir, "demo_mandis.csv")
        if os.path.exists(mandis_file):
            return pd.read_csv(mandis_file)
        return pd.DataFrame(columns=['id', 'name', 'state', 'district', 'latitude', 'longitude'])

    @classmethod
    def load_crops_df(cls) -> pd.DataFrame:
        data_dir = cls.get_data_dir()
        crops_file = os.path.join(data_dir, "demo_crops.csv")
        if os.path.exists(crops_file):
            return pd.read_csv(crops_file)
        return pd.DataFrame(columns=['id', 'name', 'category', 'aliases'])
