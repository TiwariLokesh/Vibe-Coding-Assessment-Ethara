from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.common import ErrorResponse


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        payload = ErrorResponse(detail=str(exc.detail), status_code=exc.status_code)
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(_: Request, exc: ValidationError) -> JSONResponse:
        payload = ErrorResponse(detail="Validation error", errors=exc.errors(), status_code=422)
        return JSONResponse(status_code=422, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def unexpected_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        payload = ErrorResponse(detail="Internal server error", status_code=500)
        return JSONResponse(status_code=500, content=payload.model_dump())
