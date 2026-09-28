from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.routes import (
    auth_router,
    customers_router,
    cases_router,
    chat_router,
    memories_router,
    demo_router,
    analytics_router
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("recalldesk")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RECALLDESK database and seeding baseline memories...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("RECALLDESK baseline customer and memories initialized successfully.")
    except Exception as e:
        logger.error(f"Error during database startup seed: {e}")
    finally:
        db.close()
    yield
    logger.info("Shutting down RECALLDESK...")

app = FastAPI(
    title="RECALLDESK API",
    description="Support that remembers what happened. Outcome-driven AI Customer Support with Hindsight Memory.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for easy local dev across Vite ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Include Routers
app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(cases_router)
app.include_router(chat_router)
app.include_router(memories_router)
app.include_router(demo_router)
app.include_router(analytics_router)

# Mount frontend dist if present for single-port convenience
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "app": "RECALLDESK",
            "tagline": "Support that remembers what happened.",
            "version": settings.VERSION,
            "docs_url": "/docs",
            "health_url": "/api/health"
        }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected server error occurred: {str(exc)}"}
    )
