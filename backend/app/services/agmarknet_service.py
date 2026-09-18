import os
import pandas as pd
import numpy as np
from typing import List, Dict, Any

class AgMarkNetService:
    @classmethod
    def get_data_dir(cls) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base_dir, "data")

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
