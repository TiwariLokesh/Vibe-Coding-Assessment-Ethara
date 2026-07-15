from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.employees import router as employees_router
from app.api.routes.projects import router as projects_router
from app.api.routes.seats import router as seats_router
from app.api.routes.allocations import router as allocations_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.search import router as search_router
from app.api.routes.ai import router as ai_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(employees_router)
api_router.include_router(projects_router)
api_router.include_router(seats_router)
api_router.include_router(allocations_router)
api_router.include_router(dashboard_router)
api_router.include_router(search_router)
api_router.include_router(ai_router)
