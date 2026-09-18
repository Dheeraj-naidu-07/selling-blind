from fastapi import APIRouter, HTTPException, Query
from app.schemas.analysis import AnalysisRequest, AnalyzePriceResponse
from app.services.crop_service import CropService
from app.services.geocoding_service import GeocodingService
from app.services.weather_service import WeatherService
from app.services.historical_analysis import HistoricalPriceAnalyzer
from app.services.anomaly_detection import AnomalyDetector
from app.services.mandi_recommendation import MandiRecommendationEngine
from app.services.decision_engine import DecisionEngine
from app.services.ai_service import AIService
from app.services.agmarknet_service import AgMarkNetService

router = APIRouter()

@router.post("/analyze-price", response_model=AnalyzePriceResponse)
@router.post("/analyze", response_model=AnalyzePriceResponse)
async def analyze_price(req: AnalysisRequest):
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    if req.current_offered_price <= 0:
        raise HTTPException(status_code=400, detail="Current offered price must be greater than 0")

    # 1. Normalize crop name
    norm_crop = CropService.normalize_crop_name(req.crop)

    # Convert current offered price to per-kg if provided per quintal
    price_per_kg = req.current_offered_price
    if req.price_unit == "qtl" or req.current_offered_price > 500:
        price_per_kg = req.current_offered_price / 100.0

    HYDERABAD_LAT, HYDERABAD_LON = 17.3850, 78.4867
    lat = req.location.latitude if req.location and req.location.latitude is not None else None
    lon = req.location.longitude if req.location and req.location.longitude is not None else None
    location_name = req.location.name if req.location and req.location.name else None

    is_default_coords = (lat is None or lon is None or (abs(lat - HYDERABAD_LAT) < 0.0001 and abs(lon - HYDERABAD_LON) < 0.0001))
    
    if location_name and location_name.strip():
        if is_default_coords and "hyderabad" not in location_name.lower():
            coords = await GeocodingService.forward_geocode(location_name)
            if coords:
                lat, lon = coords
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unable to resolve location coordinates for '{location_name}'. Please enter a valid location."
                )

    if lat is None or lon is None:
        lat, lon = HYDERABAD_LAT, HYDERABAD_LON

    # 2. Statistical Engine Calculation
    hist_results = HistoricalPriceAnalyzer.analyze(norm_crop, price_per_kg)
    anomaly_info = AnomalyDetector.detect(hist_results)

    # 3. Nearby Mandis (Haversine)
    raw_nearby = MandiRecommendationEngine.find_nearby_alternatives(norm_crop, lat, lon, price_per_kg)

    nearby_mandis_formatted = []
    for m in raw_nearby:
        diff_pct = round(((m['historical_median_price'] - price_per_kg) / price_per_kg) * 100, 1)
        sig = "HISTORICALLY_HIGHER" if diff_pct > 0 else "HISTORICALLY_LOWER"
        nearby_mandis_formatted.append({
            "name": m['mandi_name'],
            "distance_km": m['distance_km'],
            "historical_median": m['historical_median_price'],
            "difference_percent": diff_pct,
            "signal": sig
        })

    # 4. Price Signal formatting
    dev_pct = hist_results["difference_percentage"]
    if dev_pct <= -15.0:
        sig_label = "UNUSUALLY_LOW"
        sig_display = "Price looks unusually low"
    elif dev_pct <= -5.0:
        sig_label = "LOWER_THAN_USUAL"
        sig_display = "Price looks lower than usual"
    else:
        sig_label = "NORMAL"
        sig_display = "Price is within normal range"

    # 5. Confidence Score
    sample_size = hist_results["sample_size"]
    conf_level = "HIGH" if sample_size >= 10 else "MEDIUM"
    conf_score = 0.86 if sample_size >= 10 else 0.65

    # 6. Structured Facts for Qwen Explanation Layer
    structured_facts = {
        "crop": norm_crop,
        "current_price": round(price_per_kg, 2),
        "historical_median": hist_results["median"],
        "deviation_percent": dev_pct,
        "percentile": hist_results["percentile"],
        "observation_count": sample_size,
        "signal": sig_label,
        "confidence": conf_score,
        "nearby_mandis": nearby_mandis_formatted[:2]
    }

    # 7. AI Explanation Generation via AIService (Calls Ollama on remote Mac 10.10.14.157:11434)
    ai_explanation = await AIService.generate_explanation(structured_facts, req.language or "en")

    return {
        "status": "success",
        "price_signal": {
            "label": sig_label,
            "display": sig_display,
            "current_price": round(price_per_kg, 2),
            "historical_median": hist_results["median"],
            "deviation_percent": dev_pct,
            "unit": "₹/kg"
        },
        "historical": {
            "typical_low": hist_results["historical_lower_range"],
            "typical_high": hist_results["historical_upper_range"],
            "percentile": hist_results["percentile"],
            "observation_count": sample_size,
            "season": "Sep-Oct"
        },
        "nearby_mandis": nearby_mandis_formatted,
        "confidence": {
            "level": conf_level,
            "score": conf_score
        },
        "explanation": ai_explanation,
        "data_info": {
            "source": "AgMarkNet (Demo Data)",
            "historical_period": "2020-2026"
        }
    }

@router.get("/mandi-history")
def get_mandi_history(crop: str = "Onion", mandi_id: int = 101):
    norm_crop = CropService.normalize_crop_name(crop)
    prices_df = AgMarkNetService.load_prices_df()
    crop_info = CropService.get_crop_info(norm_crop)
    filtered = prices_df[prices_df['crop_id'] == crop_info['id']]
    return {
        "status": "success",
        "crop": norm_crop,
        "mandi_id": mandi_id,
        "total_records": len(filtered),
        "history": filtered.to_dict(orient="records")
    }

@router.get("/analyze/summary")
async def analyze_summary(crop: str = "Onion", price: float = 18.0, lat: float = 17.3850, lon: float = 78.4867):
    norm_crop = CropService.normalize_crop_name(crop)
    price_per_kg = price / 100.0 if price > 500 else price
    hist = HistoricalPriceAnalyzer.analyze(norm_crop, price_per_kg)
    nearby = MandiRecommendationEngine.find_nearby_alternatives(norm_crop, lat, lon, price_per_kg)
    
    alt_text = f" A mandi {nearby[0]['distance_km']} km away has historically recorded better prices." if nearby else ""
    summary_text = f"{norm_crop.upper()}: ₹{price_per_kg}/kg is {hist['difference_percentage']}% relative to typical seasonal range (median ₹{hist['median']}/kg).{alt_text} Historical public data; no guarantee."
    
    return {
        "status": "success",
        "summary": summary_text
    }

@router.get("/fpo/summary")
async def fpo_summary(crop: str = "Onion", farmer_count: int = 25, total_quantity: float = 50000):
    norm_crop = CropService.normalize_crop_name(crop)
    return {
        "status": "success",
        "fpo_aggregation": {
            "crop": norm_crop,
            "farmer_count": farmer_count,
            "total_quantity_kg": total_quantity,
            "unusually_low_price_rate": "72%",
            "common_signal": "CONSIDER_ALTERNATIVE_MANDI",
            "recommended_aggregation_mandi": "Bowenpally Wholesale Market",
            "potential_group_benefit": "Bulk transport pooling can reduce per-unit haulage cost by up to 35%."
        }
    }
