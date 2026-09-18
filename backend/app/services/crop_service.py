import re

class CropService:
    KNOWN_CROPS = {
        "onion": {"id": 1, "name": "Onion", "category": "Vegetables", "aliases": ["pyaz", "kanda", "ullipaya"]},
        "potato": {"id": 2, "name": "Potato", "category": "Vegetables", "aliases": ["aloo", "alugadda"]},
        "tomato": {"id": 3, "name": "Tomato", "category": "Vegetables", "aliases": ["tamatar", "thakkali"]},
        "wheat": {"id": 4, "name": "Wheat", "category": "Grains", "aliases": ["gehun", "godhuma"]},
        "paddy": {"id": 5, "name": "Paddy", "category": "Grains", "aliases": ["rice", "chawal", "dhan"]},
        "cotton": {"id": 6, "name": "Cotton", "category": "Fiber", "aliases": ["kapas", "patti"]},
        "red chilli": {"id": 7, "name": "Red Chilli", "category": "Spices", "aliases": ["chilli", "mirchi", "lal mirch"]},
        "maize": {"id": 8, "name": "Maize", "category": "Grains", "aliases": ["corn", "makka", "jonnalu"]}
    }

    @classmethod
    def normalize_crop_name(cls, raw_name: str) -> str:
        if not raw_name:
            return "Onion"
        cleaned = raw_name.strip().lower()
        cleaned = re.sub(r'[^a-z0-9\s]', '', cleaned)
        
        for key, data in cls.KNOWN_CROPS.items():
            if cleaned == key:
                return data["name"]
            for alias in data["aliases"]:
                if cleaned == alias:
                    return data["name"]
                    
        return raw_name.strip().capitalize()

    @classmethod
    def get_crop_info(cls, crop_name: str) -> dict:
        normalized = cls.normalize_crop_name(crop_name)
        for key, data in cls.KNOWN_CROPS.items():
            if data["name"].lower() == normalized.lower():
                return data
        return {"id": 1, "name": normalized, "category": "General", "aliases": []}

    @classmethod
    def list_all_crops(cls) -> list:
        return list(cls.KNOWN_CROPS.values())
