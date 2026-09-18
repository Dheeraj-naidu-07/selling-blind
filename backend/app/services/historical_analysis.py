import numpy as np
import pandas as pd
from app.services.agmarknet_service import AgMarkNetService
from app.services.crop_service import CropService

class HistoricalPriceAnalyzer:
    @classmethod
    def analyze(cls, crop_name: str, current_offered_price_per_kg: float, mandi_id: int = 101) -> dict:
        crop_info = CropService.get_crop_info(crop_name)
        crop_id = crop_info["id"]
        
        prices_df = AgMarkNetService.load_prices_df()
        
        # Filter by crop
        crop_prices = prices_df[prices_df['crop_id'] == crop_id]
        
        if crop_prices.empty:
            # Fallback values if crop data isn't present
            modal_prices_kg = np.array([20.0, 21.0, 22.5, 24.0, 25.0, 26.0])
        else:
            # Convert modal_price (which is in Rs/Quintal) to Rs/kg by dividing by 100
            modal_prices_kg = crop_prices['modal_price'].values / 100.0

        median_kg = float(np.median(modal_prices_kg))
        mean_kg = float(np.mean(modal_prices_kg))
        std_kg = float(np.std(modal_prices_kg)) if len(modal_prices_kg) > 1 else 1.0
        
        p25_kg = float(np.percentile(modal_prices_kg, 25))
        p75_kg = float(np.percentile(modal_prices_kg, 75))
        
        # Percentile rank of current price
        less_count = np.sum(modal_prices_kg <= current_offered_price_per_kg)
        percentile = float((less_count / len(modal_prices_kg)) * 100)
        
        diff_kg = current_offered_price_per_kg - median_kg
        diff_pct = float((diff_kg / median_kg) * 100) if median_kg > 0 else 0.0

        return {
            "median": round(median_kg, 2), # Rs/kg
            "mean": round(mean_kg, 2), # Rs/kg
            "difference": round(diff_kg, 2),
            "difference_percentage": round(diff_pct, 1),
            "percentile": round(percentile, 1),
            "sample_size": len(modal_prices_kg),
            "historical_lower_range": round(p25_kg, 1),
            "historical_upper_range": round(p75_kg, 1),
            "std_dev": round(std_kg, 2)
        }
