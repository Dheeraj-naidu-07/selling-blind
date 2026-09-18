# SELLING BLIND — Mandi Saathi Agri Decision Engine

> **Track**: AGRITECH & RURAL INNOVATION  
> **Problem Statement**: PS-A02 — Selling Blind  
> **Objective**: Decision-support prototype helping farmers determine whether their current offered mandi price is unusually low for their crop, season, and region, and identifying reachable nearby mandis with historically better prices.

---

## 📐 Architecture & Remote AI Integration

```text
FRONTEND
    │
    ▼
FASTAPI / NODE BACKEND (Backend PC)
    │
    ▼
DATABASE + AGMARKNET DATA PIPELINE
    │
    ▼
STATISTICAL ANOMALY ENGINE & HAVERSINE RANKER
    │
    ▼
STRUCTURED FACTS (Crop, Price, Median, Deviation, Mandis, Confidence)
    │
    ▼ HTTP POST (http://10.10.14.157:11434/api/chat)
REMOTE MAC: OLLAMA SERVER (10.10.14.157:11434)
    │
    ▼ QWEN3:8B (Explanation Layer Only, < 40 words)
MESSAGE.CONTENT EXTRACTION (Never message.thinking)
    │
    ▼
FASTAPI COMPACT RESPONSE
    │
    ▼
FRONTEND (MANDI SAATHI UI)
```

---

## 🚀 Optimized API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Backend service health check |
| `GET` | `/api/ai/health` | Verifies reachability of remote Ollama server (`http://10.10.14.157:11434/api/tags`) |
| `POST` | `/api/analyze-price` | Primary compact price analysis endpoint returning `price_signal`, `historical`, `nearby_mandis`, `confidence`, `explanation`, `data_info` |
| `GET` | `/api/mandi-history` | Separate endpoint for detailed raw historical timeseries chart data |
| `GET` | `/api/crops` | Normalized crop directory |
| `GET` | `/api/mandis` | Reachable mandi directory |

---

## 🛠️ Environment Configuration (`.env`)

```env
APP_NAME="Selling Blind - Mandi Saathi"
APP_ENV=development
PORT=8000
DATABASE_URL="sqlite:///./selling_blind.db"
OPEN_METEO_BASE_URL="https://api.open-meteo.com/v1"
NOMINATIM_BASE_URL="https://nominatim.openstreetmap.org"

# Remote Ollama AI Inference Server (Teammate's Mac)
OLLAMA_BASE_URL=http://10.10.14.157:11434
OLLAMA_MODEL=qwen3:8b
AI_MOCK_MODE=false
```

---

## 🏃 Commands to Run

### 1. Start Backend Server
```bash
node backend/server.js
# Or FastAPI:
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Run Verification Suite
```bash
node tests/verify_all.js
```
