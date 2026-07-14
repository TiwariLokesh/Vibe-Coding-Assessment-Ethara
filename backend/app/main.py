from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.core.startup import startup_application
from app.middleware.cors import configure_cors

settings = get_settings()
configure_logging()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

configure_cors(app)
register_exception_handlers(app)
app.include_router(health_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def on_startup() -> None:
    startup_application()
