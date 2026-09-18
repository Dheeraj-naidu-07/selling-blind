class DecisionEngine:
    DISCLAIMER = "Based on historical public mandi data. Historical performance does not guarantee future prices or outcomes."

    @classmethod
    def evaluate(cls, current_price_per_kg: float, historical: dict, anomaly: dict, nearby_alternatives: list) -> dict:
        status = anomaly.get("status", "NORMAL")
        median_kg = historical.get("median", current_price_per_kg)
        
        # Check if any nearby alternative mandi offers historically better prices
        better_mandi = None
        for alt in nearby_alternatives:
            if alt["historical_median_price"] > current_price_per_kg * 1.1 and alt["distance_km"] <= 100:
                better_mandi = alt
                break

        if status == "INSUFFICIENT_DATA":
            signal = "INSUFFICIENT_DATA"
            msg = "Historical data for this crop/mandi is currently limited. Verify prices locally before proceeding."
        elif status in ["UNUSUALLY_LOW", "BELOW_TYPICAL"] and better_mandi:
            signal = "CONSIDER_ALTERNATIVE_MANDI"
            msg = f"The offered price (₹{current_price_per_kg}/kg) is below the typical historical seasonal range (median ₹{median_kg}/kg). {better_mandi['mandi_name']} ({better_mandi['distance_km']} km away) has historically recorded better prices (~₹{better_mandi['historical_median_price']}/kg) during comparable periods."
        elif status == "UNUSUALLY_LOW":
            signal = "CONSIDER_HOLDING"
            msg = f"The offered price (₹{current_price_per_kg}/kg) is about {abs(historical['difference_percentage'])}% below the historical seasonal median (₹{median_kg}/kg). Consider checking storage options or negotiating if practical."
        else:
            signal = "SELL_NOW"
            msg = f"The current offered price (₹{current_price_per_kg}/kg) is within or above the typical historical seasonal range (median ₹{median_kg}/kg)."

        return {
            "signal": signal,
            "simple_message": msg,
            "disclaimer": cls.DISCLAIMER
        }
