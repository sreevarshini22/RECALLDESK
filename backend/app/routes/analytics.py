from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.api_models import AnalyticsMetric
from app.services.analytics_service import AnalyticsService
from app.config import settings

router = APIRouter(tags=["analytics"])

@router.get("/api/analytics", response_model=AnalyticsMetric)
def get_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.get_analytics(db)

@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    llm_status = "Online (API Key configured)" if (settings.OPENAI_API_KEY or settings.GEMINI_API_KEY) else "Demo Mode (Native Hindsight Engine)"
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "llm_engine": llm_status,
        "hindsight_memory_engine": "active"
    }
