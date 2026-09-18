from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, crops, mandis, prices, analysis

app = FastAPI(
    title=settings.APP_NAME,
    description="Agritech Decision-Support System helping farmers detect price anomalies and compare nearby mandi prices responsibly.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under both /api and /api/v1 prefixes
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(crops.router, prefix="/api", tags=["Crops"])
app.include_router(mandis.router, prefix="/api", tags=["Mandis"])
app.include_router(prices.router, prefix="/api", tags=["Prices"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])

app.include_router(health.router, prefix="/api/v1", tags=["Health v1"])
app.include_router(crops.router, prefix="/api/v1", tags=["Crops v1"])
app.include_router(mandis.router, prefix="/api/v1", tags=["Mandis v1"])
app.include_router(prices.router, prefix="/api/v1", tags=["Prices v1"])
app.include_router(analysis.router, prefix="/api/v1", tags=["Analysis v1"])

@app.get("/")
def root():
    return {
        "message": "Welcome to Selling Blind - Mandi Saathi API",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "ai_health": "/api/ai/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
