import json
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    SYSTEM_PROMPT = (
        "You are the explanation layer for a mandi price intelligence system.\n\n"
        "Use ONLY the supplied structured facts.\n\n"
        "Do not invent or modify:\n"
        "- prices\n"
        "- percentages\n"
        "- distances\n"
        "- historical statistics\n"
        "- confidence values\n"
        "- mandi information\n\n"
        "Do not make guaranteed future-price predictions.\n\n"
        "Explain the supplied result in simple language suitable for a farmer.\n\n"
        "Keep the response below 40 words.\n\n"
        "Historical prices are not guarantees of future prices."
    )

    @classmethod
    async def generate_explanation(cls, structured_facts: dict, language: str = "en") -> dict:
        # Check mock mode first
        if settings.AI_MOCK_MODE:
            logger.info("AI_MOCK_MODE is enabled. Returning mock explanation.")
            if language == "te":
                msg = f"ఆఫర్ చేసిన ధర ₹{structured_facts.get('current_price')}/కేజీ సాధారణ సీజనల్ సగటు కంటే తక్కువగా ఉంది."
            elif language == "hi":
                msg = f"पेश की गई कीमत ₹{structured_facts.get('current_price')}/किग्रा सामान्य मौसमी औसत से कम है।"
            else:
                msg = f"The offered price of ₹{structured_facts.get('current_price')}/kg is lower than the typical historical seasonal median."
            return {
                "text": msg,
                "source": "mock"
            }

        lang_instr = "Respond ONLY in English."
        if language == "te":
            lang_instr = "Respond ONLY in simple Telugu language suitable for an Indian farmer."
        elif language == "hi":
            lang_instr = "Respond ONLY in simple Hindi language suitable for an Indian farmer."

        system_prompt = f"{cls.SYSTEM_PROMPT}\n\n{lang_instr}"

        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(structured_facts)}
            ],
            "stream": False
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    message = data.get("message", {})
                    # Explicitly extract content ONLY, ignoring any internal reasoning/thinking fields
                    explanation_text = message.get("content", "").strip()
                    if explanation_text:
                        return {
                            "text": explanation_text,
                            "source": "ollama"
                        }
        except Exception as e:
            logger.warning(f"Ollama AI request to {url} failed: {e}. Falling back to deterministic explanation.")

        # Deterministic fallback when remote Ollama is unreachable
        dev_pct = structured_facts.get('deviation_percent', 0.0)
        abs_pct = abs(round(dev_pct, 1))
        
        fallback_text = f"The offered price is about {abs_pct}% below the historical seasonal median based on available public mandi data."
        if language == "te":
            fallback_text = f"లభ్యమైన మండి డేటా ప్రకారం ఆఫర్ చేసిన ధర చారిత్రక సగటు కంటే దాదాపు {abs_pct}% తక్కువగా ఉంది."
        elif language == "hi":
            fallback_text = f"उपलब्ध मंडी आंकड़ों के अनुसार पेश की गई कीमत ऐतिहासिक औसत से लगभग {abs_pct}% कम है।"

        return {
            "text": fallback_text,
            "source": "fallback"
        }

    @classmethod
    async def check_health(cls) -> dict:
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags"
        reachable = False
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    reachable = True
        except Exception:
            reachable = False

        return {
            "provider": "ollama",
            "model": settings.OLLAMA_MODEL,
            "reachable": reachable
        }
