from app.routes.auth import router as auth_router
from app.routes.customers import router as customers_router
from app.routes.cases import router as cases_router
from app.routes.chat import router as chat_router
from app.routes.memories import router as memories_router
from app.routes.demo import router as demo_router
from app.routes.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "customers_router",
    "cases_router",
    "chat_router",
    "memories_router",
    "demo_router",
    "analytics_router"
]
