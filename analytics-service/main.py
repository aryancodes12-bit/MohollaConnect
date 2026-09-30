import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from sentiment import analyze_and_store_sentiments, get_product_sentiment
from segmentation import cluster_and_store_customer_segments, get_customer_segments_summary
import seller_analytics

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("analytics_service")

# Background scheduler to refresh sentiment and segments every 5 minutes
scheduler = BackgroundScheduler()

def run_analytics_jobs():
    logger.info("Executing scheduled analytics batch jobs...")
    try:
        analyze_and_store_sentiments()
    except Exception as e:
        logger.error("Sentiment job failed: %s", str(e))
    try:
        cluster_and_store_customer_segments()
    except Exception as e:
        logger.error("Segmentation job failed: %s", str(e))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initial batch computation on startup
    logger.info("Starting up Analytics Service — running initial computation...")
    run_analytics_jobs()
    scheduler.add_job(run_analytics_jobs, "interval", minutes=5, id="batch_analytics")
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="LocalConnect Analytics Service",
    description="Python Analytics Microservice for Sentiment Analysis, Customer Segmentation & Seller BI",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "LocalConnect Analytics Engine"}

@app.post("/api/analytics/refresh")
def refresh_analytics():
    """Manual trigger to re-run sentiment & customer segmentation clustering."""
    s_res = analyze_and_store_sentiments()
    c_res = cluster_and_store_customer_segments()
    return {"message": "Analytics refreshed successfully", "sentiment": s_res, "segmentation": c_res}

@app.get("/api/analytics/sentiment")
def sentiment_endpoint(productId: int = Query(..., description="Target product ID")):
    """Product-level sentiment analysis."""
    try:
        return get_product_sentiment(productId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/segments")
def segments_endpoint():
    """Customer segments clustered by K-Means."""
    try:
        return get_customer_segments_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/seller/{store_id}/sales-trend")
def seller_sales_trend_endpoint(store_id: int, days: int = 45):
    """Daily revenue & order volume trend for a seller over the last 45 days."""
    try:
        return seller_analytics.get_seller_sales_trend(store_id, days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/seller/{store_id}/top-products")
def seller_top_products_endpoint(store_id: int, limit: int = 5):
    """Top products ranked by total revenue and units sold."""
    try:
        return seller_analytics.get_seller_top_products(store_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/seller/{store_id}/sentiment")
def seller_sentiment_endpoint(store_id: int):
    """Aggregated sentiment breakdown for a seller's catalog."""
    try:
        return seller_analytics.get_seller_sentiment(store_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/overview")
def marketplace_overview_endpoint(days: int = 45):
    """Marketplace-wide business overview for BI dashboard."""
    try:
        return seller_analytics.get_marketplace_overview(days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=False)
