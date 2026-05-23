"""
FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI

from app.api.routes.loop import router as loop_router
from app.core.logging_config import configure_logging

configure_logging()

app = FastAPI(
    title="Loop Track Extension API",
    description=(
        "Extends a base meditation / ambient track to a desired duration by "
        "intelligently looping and crossfading musical phrases."
    ),
    version="1.0.0",
)

app.include_router(loop_router, prefix="/api")


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok"}
